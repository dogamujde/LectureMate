import os
import re

import dateutil.parser
import operator
import sys
import tqdm

import ffmpy
import requests
import selenium
import logging

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException

from .utils import strip_illegal_path
from .hls_downloader import Downloader
from .naive_m3u8_parser import NaiveM3U8Parser

_LOGGER = logging.getLogger(__name__)


def update_course_retrieval_progress(current, total):
    prefix = ">> Retrieving echo360 Course Info... "
    status = "{}/{} videos".format(current, total)
    text = "\r{0} {1} ".format(prefix, status)
    sys.stdout.write(text)
    sys.stdout.flush()


class EchoVideos(object):
    def __init__(self, videos_json, driver):
        assert videos_json is not None
        self._driver = driver
        self._videos = []
        total_videos_num = len(videos_json)
        update_course_retrieval_progress(0, total_videos_num)

        for i, video_json in enumerate(videos_json):
            self._videos.append(EchoVideo(video_json, self._driver))
            update_course_retrieval_progress(i + 1, total_videos_num)

        self._videos.sort(key=operator.attrgetter("date"))

    @property
    def videos(self):
        return self._videos

    def _blow_up(self, str, e):
        print(str)
        print("Exception: {}".format(str(e)))
        sys.exit(1)


class EchoVideo(object):
    def __init__(self, video_json, driver):
        self._driver = driver

        try:
            video_url = "{0}".format(video_json["richMedia"])
            video_url = str(video_url)  # cast back to string

            self._driver.get(video_url)
            _LOGGER.debug(
                "Dumping video page at %s: %s", video_url, self._driver.page_source
            )

            m3u8_url = self._loop_find_m3u8_url(video_url, waitsecond=30)
            _LOGGER.debug("Found the following urls %s", m3u8_url)
            self._url = m3u8_url

            self._date = self.get_date(video_json["startTime"])
            self._title = video_json["title"]

        except KeyError as e:
            self._blow_up("Unable to parse video data from JSON (course_data)", e)

    def _loop_find_m3u8_url(self, video_url, waitsecond=15, max_attempts=5):
        stale_attempt = 1
        refresh_attempt = 1
        while True:
            self._driver.get(video_url)
            try:
                # wait for maximum second before timeout
                WebDriverWait(self._driver, waitsecond).until(
                    EC.presence_of_element_located((By.ID, "content-player"))
                )
                return (
                    self._driver.find_element_by_id("content-player")
                    .find_element_by_tag_name("video")
                    .get_attribute("src")
                )
            except selenium.common.exceptions.TimeoutException:
                if refresh_attempt >= max_attempts:
                    print(
                        "\r\nERROR: Connection timeouted after {} second for {} attempts... \
                          Possibly internet problem?".format(
                            waitsecond, max_attempts
                        )
                    )
                    raise
                refresh_attempt += 1
            except StaleElementReferenceException:
                if stale_attempt >= max_attempts:
                    print(
                        "\r\nERROR: Elements are not stable to retrieve after {} attempts... \
                        Possibly internet problem?".format(
                            max_attempts
                        )
                    )
                    raise
                stale_attempt += 1

    @property
    def date(self):
        return self._date

    @property
    def url(self):
        return self._url

    @property
    def title(self):
        if type(self._title) != str:
            # it's type unicode for python2
            return self._title.encode("utf-8")
        return self._title

    def get_date(self, video_json):
        try:
            # date is not important so we will just ignore it if something went wrong
            # Also, some echoCloud videos returns None for video start time... :(
            date = dateutil.parser.parse(self._extract_date(video_json)).date()
            return date.strftime("%Y-%m-%d")
        except Exception:
            return "1970-01-01"

    def _extract_date(self, video_json):
        return video_json["startTime"]

    def _blow_up(self, str, e):
        print(str)
        print("Exception: {}".format(str(e)))
        sys.exit(1)

    def download(self, output_dir, filename, pool_size=50):
        print("")
        print("-" * 60)
        print('Downloading "{}"'.format(filename))
        self._download_url_to_dir(self.url, output_dir, filename, pool_size)
        print("-" * 60)
        return True

    def _download_url_to_dir(
        self, url, output_dir, filename, pool_size, convert_to_mp4=True
    ):
        echo360_downloader = Downloader(
            pool_size, selenium_cookies=self._driver.get_cookies()
        )
        echo360_downloader.run(url, output_dir, convert_to_mp4=convert_to_mp4)

        # rename file
        ext = echo360_downloader.result_file_name.split(".")[-1]
        result_full_path = os.path.join(output_dir, "{0}.{1}".format(filename, ext))
        os.rename(os.path.join(echo360_downloader.result_file_name), result_full_path)
        return result_full_path

    def _download_url_to_dir_request(self, session, url, output_dir, filename):
        ext = url.split(".")[-1]

        r = session.get(url, stream=True)
        total_size = int(r.headers.get("content-length", 0))
        block_size = 1024  # 1 kilobyte
        result_full_path = os.path.join(output_dir, filename + ext)
        with tqdm.tqdm(total=total_size, unit="iB", unit_scale=True) as pbar:
            with open(result_full_path, "wb") as f:
                for data in r.iter_content(block_size):
                    pbar.update(len(data))
                    f.write(data)
        return result_full_path

    def get_all_parts(self):
        return [self]


class EchoCloudVideos(EchoVideos):
    def __init__(
        self,
        course_json,
        driver,
        hostname,
        alternative_feeds,
        subtitles,
        course_name=None,
        skip_video_on_error=True,
    ):
        assert course_json is not None
        self._driver = driver
        self._videos = []
        self._course_name = course_name or "Unknown_Course"

        # Create course directory structure first
        course_name = strip_illegal_path(self._course_name)
        course_dir = os.path.join("default_out_path", course_name)
        dirty_dir = os.path.join(course_dir, "dirty")
        clean_dir = os.path.join(course_dir, "clean")
        
        # Create directories if they don't exist
        os.makedirs(dirty_dir, exist_ok=True)
        os.makedirs(clean_dir, exist_ok=True)

        # Traverse groups/folders
        queue = [(course_json, "")]  # Start with root items
        videos_json = []
        
        while len(queue) > 0:
            items, path = queue.pop(0)  # Use pop(0) for FIFO queue
            for item in items:
                if type(item) is dict:
                    if "lesson" in item["type"].lower():
                        # First add the current item
                        item["path_prefix"] = path
                        videos_json.append(item)
                        
                        # Get video URL and check content
                        video_url = "{}/lesson/{}/classroom".format(
                            hostname, 
                            item["lesson"]["lesson"]["id"]
                        )
                        
                        # Check if this class has no content
                        self._driver.get(video_url)
                        if "Looks like no content has been added to this class yet" in self._driver.page_source:
                            print("\nFound 'no content' page - stopping here")
                            break
                            
                        # Try to download transcription immediately
                        if subtitles:
                            try:
                                video = EchoCloudVideo(
                                    item,
                                    self._driver,
                                    hostname,
                                    alternative_feeds,
                                    subtitles=True,
                                    course_name=self._course_name
                                )
                                filename = strip_illegal_path(item["lesson"]["lesson"]["name"])
                                video.download_single(
                                    requests.Session(),
                                    None,
                                    dirty_dir,
                                    filename,
                                    pool_size=50
                                )
                            except Exception as e:
                                print(f"Failed to download transcription: {str(e)}")
                                if not skip_video_on_error:
                                    raise
                    else:
                        # Add group/folder to queue
                        folder_name = strip_illegal_path(item["groupInfo"]["name"])
                        # Skip adding redundant folder names
                        if folder_name.lower() not in ['home', 'echo360', self._course_name.lower()]:
                            new_path = os.path.join(path, folder_name) if path else folder_name
                        else:
                            new_path = path
                        queue.append((item["lessons"], new_path))

        total_videos_num = len(videos_json)
        update_course_retrieval_progress(0, total_videos_num)

        for i, video_json in enumerate(videos_json):
            try:
                self._videos.append(
                    EchoCloudVideo(
                        video_json,
                        self._driver,
                        hostname,
                        alternative_feeds,
                        subtitles,
                        course_name=self._course_name
                    )
                )
            except Exception:
                if not skip_video_on_error:
                    raise
            update_course_retrieval_progress(i + 1, total_videos_num)

        self._videos.sort(key=operator.attrgetter("date"))

    @property
    def videos(self):
        return self._videos


class EchoCloudVideo(EchoVideo):
    @property
    def video_url(self):
        return "{}/lesson/{}/classroom".format(self.hostname, self.video_id)

    def __init__(self, video_json, driver, hostname, alternative_feeds, subtitles, course_name=None):
        self.hostname = hostname
        self._driver = driver
        self._path_prefix = video_json["path_prefix"]
        self.video_json = video_json
        self.is_multipart_video = False
        self.sub_videos = [self]
        self.download_alternative_feeds = alternative_feeds
        self.download_subtitles = subtitles
        self._course_name = course_name or "Unknown_Course"
        
        if "lessons" in video_json:
            # IS a multi-part lesson.
            self.sub_videos = [
                EchoCloudSubVideo(
                    sub_video_json,
                    driver,
                    hostname,
                    group_name=video_json["groupInfo"]["name"],
                    alternative_feeds=alternative_feeds,
                    course_name=self._course_name
                )
                for sub_video_json in video_json["lessons"]
            ]
            self.is_multipart_video = True
            # THIS OBJECT SHOULD NOT BE USED ANYMORE as no further
            # processing will be proceeded.
            self._date = self.get_date(video_json)
            return

        video_id = "{0}".format(video_json["lesson"]["lesson"]["id"])
        self.video_id = str(video_id)  # cast back to string

        self._driver.get(self.video_url)
        _LOGGER.debug(
            "Dumping video page at %s: %s", self.video_url, self._driver.page_source
        )

        # Only get m3u8 URL if we're not just downloading subtitles
        if not self.download_subtitles:
            m3u8_url = self._loop_find_m3u8_url(self.video_url, waitsecond=30)
            _LOGGER.debug("Found the following urls %s", m3u8_url)
            self._url = m3u8_url
        else:
            self._url = None

        self._date = self.get_date(video_json)
        self._title = video_json["lesson"]["lesson"]["name"]

    def download(self, output_dir, filename, pool_size=50):
        # Use the course name from the course details
        course_name = strip_illegal_path(self._course_name)
        
        # Create course directory first
        course_dir = os.path.join(output_dir, course_name)
        if not os.path.exists(course_dir):
            os.makedirs(course_dir)
            
        # Create dirty and clean directories inside course directory
        dirty_dir = os.path.join(course_dir, "dirty")
        clean_dir = os.path.join(course_dir, "clean")
        
        # Create directories if they don't exist
        if not os.path.exists(dirty_dir):
            os.makedirs(dirty_dir)
        if not os.path.exists(clean_dir):
            os.makedirs(clean_dir)
        
        print("")
        print("-" * 60)
        print('Downloading "{}" to {}'.format(filename, dirty_dir))

        session = requests.Session()
        # load cookies
        for cookie in self._driver.get_cookies():
            session.cookies.set(cookie["name"], cookie["value"])

        # If we're only downloading subtitles, skip video download
        if not self.download_subtitles:
            urls = self.url
            if not isinstance(urls, list):
                urls = [urls]

            if not self.download_alternative_feeds:
                # download_alternative_feeds defaults to False, slice to include only the first one
                urls = urls[:1]

            # Download attached media (Example: mediaType: Presentation can contain PDF slides)
            cookies = {
                cookie["name"]: cookie["value"] for cookie in self._driver.get_cookies()
            }
            for media in self.video_json["lesson"]["medias"]:
                if media["mediaType"] != "Video":
                    media_filename = media["title"]
                    media_filepath = os.path.join(dirty_dir, media_filename)
                    media_url = (
                        f"{self.hostname}/media/download/{media['id']}/{media_filename}"
                    )
                    if os.path.exists(media_filepath):
                        print(
                            "> Media {} already downloaded, skipped.".format(media_filename)
                        )
                    else:
                        response = requests.get(media_url, cookies=cookies)
                        if response.status_code == 200:
                            print("> Downloading media {}...".format(media_filename))
                            with open(media_filepath, "wb") as file:
                                file.write(response.content)

            final_result = True
            for counter, single_url in enumerate(urls):
                if self.download_alternative_feeds:
                    print("- Downloading video feed {}...".format(counter + 1))
                new_filename = (
                    (filename + str(counter + 1))
                    if self.download_alternative_feeds
                    else filename
                )
                result = self.download_single(
                    session, single_url, dirty_dir, new_filename, pool_size
                )
                final_result = final_result and result
        else:
            # Only download subtitles
            final_result = self.download_single(
                session, None, dirty_dir, filename, pool_size
            )

        return final_result

    def download_single(self, session, single_url, output_dir, filename, pool_size):
        filename = strip_illegal_path(filename)
        if self.download_subtitles:
            # Get the media ID from the video JSON
            try:
                media_id = None
                for media in self.video_json["lesson"]["medias"]:
                    if media["mediaType"] == "Video":
                        media_id = media["id"]
                        break
                
                if media_id is None:
                    print("  > No subtitles found - no video media ID found.")
                    return False
            except (KeyError, IndexError):
                print("  > No subtitles found - could not find media information.")
                return False

            # Define paths for both dirty and clean files
            dirty_path = os.path.join(output_dir, f"{filename}.vtt")
            clean_dir = os.path.join(os.path.dirname(output_dir), "clean")
            
            if not os.path.exists(clean_dir):
                os.makedirs(clean_dir)
            
            if os.path.exists(dirty_path):
                print(" > Skipping downloaded subtitle")
            else:
                print("  > Downloading subtitles:")
                vtt_url = f"{self.hostname}/api/ui/echoplayer/lessons/{self.video_id}/medias/{media_id}/transcript-file?format=vtt"
                cookies = {
                    cookie["name"]: cookie["value"]
                    for cookie in self._driver.get_cookies()
                }
                response = requests.get(vtt_url, cookies=cookies)
                if response.status_code == 200:
                    head = requests.head(vtt_url, cookies=cookies)
                    if head.status_code == 200:
                        print(
                            f"Original subtitle name: {head.headers.get('Content-Disposition', 'Unknown')}"
                        )
                    # Save VTT file to dirty directory
                    with open(dirty_path, "wb") as file:
                        file.write(response.content)
                    print(f"  > Saved subtitle to: {dirty_path}")
                    
                    # Convert VTT to clean text and save in clean directory
                    clean_path = os.path.join(clean_dir, f"{filename}.txt")
                    clean_text = self._convert_vtt_to_text(response.content.decode('utf-8'))
                    with open(clean_path, "w", encoding='utf-8') as file:
                        file.write(clean_text)
                    print(f"  > Saved clean text to: {clean_path}")
                    return True
                else:
                    print("  > No subtitles found - API returned status code:", response.status_code)
                    return False

        # If we're not downloading subtitles, proceed with video download
        if single_url is None:
            return True

        if os.path.exists(os.path.join(output_dir, filename + ".mp4")):
            print(" > Skipping downloaded video")
            print("-" * 60)
            return True
        if single_url.endswith(".m3u8"):
            r = session.get(single_url)
            if not r.ok:
                print("Error: Failed to get m3u8 info. Skipping this video")
                return False

            lines = [n for n in r.content.decode().split("\n")]
            m3u8_video = None
            m3u8_audio = None

            _LOGGER.debug("Searching for m3u8 with content {}".format(lines))

            m3u8_parser = NaiveM3U8Parser(lines)
            try:
                m3u8_parser.parse()
            except Exception as e:
                _LOGGER.debug("Exception occurred while parsing m3u8: {}".format(e))
                print("Failed to parse m3u8. Skipping...")
                return False

            m3u8_video, m3u8_audio = m3u8_parser.get_video_and_audio()

            if (
                m3u8_video is None
            ):  # even if audio is None it's okay, maybe audio is include with video
                print("ERROR: Failed to find video m3u8... skipping this one")
                return False
            # NOW we can finally start downloading!
            from .hls_downloader import urljoin

            audio_file = None
            if m3u8_audio is not None:
                print("  > Downloading audio:")
                audio_file = self._download_url_to_dir(
                    urljoin(single_url, m3u8_audio),
                    output_dir,
                    filename + "_audio",
                    pool_size,
                    convert_to_mp4=False,
                )
            print("  > Downloading video:")
            video_file = self._download_url_to_dir(
                urljoin(single_url, m3u8_video),
                output_dir,
                filename + "_video",
                pool_size,
                convert_to_mp4=False,
            )
            sys.stdout.write("  > Converting to mp4... ")
            sys.stdout.flush()

            # combine audio file with video (separate audio might not exists.)
            if self.combine_audio_video(
                audio_file=audio_file,
                video_file=video_file,
                final_file=os.path.join(output_dir, filename + ".mp4"),
            ):
                # remove left-over plain audio/video files. (if mixing was successful)
                if audio_file is not None:
                    os.remove(audio_file)
                os.remove(video_file)

        else:  # ends with mp4
            import tqdm

            r = session.get(single_url, stream=True)
            total_size = int(r.headers.get("content-length", 0))
            block_size = 1024  # 1 kilobyte
            with tqdm.tqdm(total=total_size, unit="iB", unit_scale=True) as pbar:
                with open(os.path.join(output_dir, filename + ".mp4"), "wb") as f:
                    for data in r.iter_content(block_size):
                        pbar.update(len(data))
                        f.write(data)

        print("Done!")
        print("-" * 60)
        return True

    def _convert_vtt_to_text(self, vtt_content):
        """Convert VTT content to plain text, removing timestamps and formatting."""
        lines = vtt_content.split('\n')
        text_lines = []
        is_header = True
        current_text = ""
        
        for line in lines:
            # Skip VTT header
            if is_header:
                if line.strip() == "":
                    is_header = False
                continue
            
            # Skip empty lines and lines containing timestamps
            if not line.strip() or '-->' in line or line.strip().replace('.', '').isdigit():
                if current_text:
                    text_lines.append(current_text.strip())
                    current_text = ""
                continue
            
            # Add non-empty lines that don't contain timestamps
            if line.strip():
                if current_text:
                    current_text += " "
                current_text += line.strip()
        
        # Add the last line if there's any remaining text
        if current_text:
            text_lines.append(current_text.strip())
        
        # Join all lines with double newlines for readability
        return "\n\n".join(text_lines)

    @staticmethod
    def combine_audio_video(audio_file, video_file, final_file):
        if os.path.exists(final_file):
            os.remove(final_file)
        _inputs = {}
        _inputs[video_file] = None
        if audio_file is not None:
            _inputs[audio_file] = None
        try:
            ff = ffmpy.FFmpeg(
                global_options="-loglevel panic",
                inputs=_inputs,
                outputs={final_file: ["-c:v", "copy", "-c:a", "ac3"]},
            )
            ff.run()
        except ffmpy.FFExecutableNotFoundError:
            print(
                '[WARN] Skipping mixing of audio/video because "ffmpeg" not installed.'
            )
            return False
        except ffmpy.FFRuntimeError:
            print(
                "[Error] Skipping mixing of audio/video because ffmpeg exited with non-zero status code."
            )
            return False
        return True

    def _loop_find_m3u8_url(self, video_url, waitsecond=15, max_attempts=5):
        def brute_force_get_url(suffix):
            # this is the first method I tried, which sort of works
            stale_attempt = 1
            refresh_attempt = 1
            while True:
                self._driver.get(video_url)
                try:
                    # the replace is for reversing the escape by the escapped js in the page source
                    urls = set(
                        re.findall(
                            'https://[^,"]*?[.]{}'.format(suffix),
                            self._driver.page_source.replace("\/", "/"),
                        )
                    )
                    return urls

                except selenium.common.exceptions.TimeoutException:
                    if refresh_attempt >= max_attempts:
                        print(
                            "\r\nERROR: Connection timeouted after {} second for {} attempts... \
                              Possibly internet problem?".format(
                                waitsecond, max_attempts
                            )
                        )
                        raise
                    refresh_attempt += 1
                except StaleElementReferenceException:
                    if stale_attempt >= max_attempts:
                        print(
                            "\r\nERROR: Elements are not stable to retrieve after {} attempts... \
                            Possibly internet problem?".format(
                                max_attempts
                            )
                        )
                        raise
                    stale_attempt += 1

        def brute_force_get_mp4_url():
            """Forcefully try to find all .mp4 url in the page source"""
            urls = brute_force_get_url(suffix="mp4")
            if len(urls) == 0:
                raise Exception("None were found.")
            # in many cases, there would be urls in the format of http://xxx.{hd1,hd2,sd1,sd2}
            # I'm not sure what does the 1 and 2 in hd1,hd2 stands for, but hd and sd should means
            # high or low definition.
            # Some university uses hd1 and hd2 for their alternative feeds, use flag `-a`
            # to download both feeds.
            # Let's prioritise hd over sd, and 1 over 2 (the latter is arbitary)
            # which happens to be the natual order of letter anyway, so we can simply use sorted.
            return sorted(urls)[:2]

        def from_json_m3u8():
            # seems like json would also contain that information so this method tries
            # to retrieve based on that
            if (
                not self.video_json["lesson"]["hasVideo"]
                or not self.video_json["lesson"]["hasAvailableVideo"]
            ):
                return False

            manifests = self.video_json["lesson"]["video"]["media"]["media"][
                "versions"
            ][0]["manifests"]
            m3u8urls = [m["uri"] for m in manifests]
            # somehow the hostname for these urls are from amazon (probably offloading
            # to them.) We need to set the host back to echo360.org
            try:
                # python3
                from urllib.parse import urlparse
            except ImportError:
                # python2
                from urlparse import urlparse
            new_m3u8urls = []
            new_hostname = urlparse(self.hostname).netloc
            for url in m3u8urls:
                parse_result = urlparse(url)
                new_m3u8urls.append(
                    "{}://content.{}{}".format(
                        parse_result.scheme, new_hostname, parse_result.path
                    )
                )
            return new_m3u8urls

        def from_json_mp4():
            mp4_files = self.video_json["lesson"]["video"]["media"]["media"]["current"][
                "primaryFiles"
            ]
            urls = [obj["s3Url"] for obj in mp4_files]
            if len(urls) == 0:
                raise ValueError("Cannot find mp4 urls")
            # usually hd is the last one. so we will sort in reverse order
            return next(reversed(urls))

        # try different methods in series, first the preferred ones, then the more
        # obscure ones.
        try:
            _LOGGER.debug("Trying from_json_mp4 method")
            return from_json_mp4()
        except Exception as e:
            _LOGGER.debug("Encountered exception: {}".format(e))
        try:
            _LOGGER.debug("Trying from_json_m3u8 method")
            m3u8urls = from_json_m3u8()
        except Exception as e:
            _LOGGER.debug("Encountered exception: {}".format(e))
        try:
            _LOGGER.debug("Trying brute_force_all_mp4 method")
            return brute_force_get_mp4_url()
        except Exception as e:
            _LOGGER.debug("Encountered exception: {}".format(e))
        try:
            _LOGGER.debug("Trying brute_force_all_m3u8 method")
            m3u8urls = brute_force_get_url(suffix="m3u8")
        except Exception as e:
            _LOGGER.debug("Encountered exception: {}".format(e))
            _LOGGER.debug("All methods had been exhausted.")
            print("Tried all methods to retrieve videos but all had failed!")
            raise

        # find one that has audio + video
        m3u8urls = [url for url in m3u8urls if url.endswith("av.m3u8")]
        if len(m3u8urls) == 0:
            print(
                "No audio+video m3u8 files found! Skipping...\n"
                "This can either be (i) Credential failure? (ii) Logic error "
                "in the script. (iii) This lecture only provides audio?\n"
                "This script is hard-coded to download audio+video. "
                "If this is your intended behaviour, "
                "please contact the author."
            )
            return False
        # There could exists multiple m3u8 files
        # (e.g. .../s1_av.m3u8, .../s2_av.m3u8, etc.) Probably to refer to
        # different quality?? We will set it to always prefer higher number.
        # Since (from my experiment) the prefixes are always the same, we will
        # just use text sorting to get the higher number.
        # Some university have two different video feeds, use flag `-a` to
        # download both feeds.
        m3u8urls = list(reversed(m3u8urls))
        return m3u8urls[:2]

    def _extract_date(self, video_json):
        if self.is_multipart_video:
            if video_json["groupInfo"]["createdAt"] is not None:
                return video_json["groupInfo"]["createdAt"]
            if video_json["groupInfo"]["u'updatedAt'"] is not None:
                return video_json["groupInfo"]["u'updatedAt'"]

        if "startTimeUTC" in video_json["lesson"]:
            if video_json["lesson"]["startTimeUTC"] is not None:
                return video_json["lesson"]["startTimeUTC"]
        if "createdAt" in video_json["lesson"]["lesson"]:
            return video_json["lesson"]["lesson"]["createdAt"]

    def get_all_parts(self):
        return self.sub_videos


class EchoCloudSubVideo(EchoCloudVideo):
    """Some video in echo360 cloud is multi-part and this represents it."""

    def __init__(self, video_json, driver, hostname, group_name, alternative_feeds, course_name=None):
        super(EchoCloudSubVideo, self).__init__(
            video_json, driver, hostname, alternative_feeds, course_name=course_name
        )
        self.group_name = group_name

    @property
    def title(self):
        if type(self._title) != str:
            # it's type unicode for python2
            self._title = self._title.encode("utf-8")
        return "{} - {}".format(self.group_name, self._title)
