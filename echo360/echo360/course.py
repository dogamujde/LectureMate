import functools
import json
import sys
import time
import os
import operator
import re

import requests
import selenium
import logging

from .utils import strip_illegal_path
from .videos import EchoVideos, EchoCloudVideos

_LOGGER = logging.getLogger(__name__)


class EchoCourse(object):
    def __init__(self, uuid, hostname=None, alternative_feeds=False, subtitles=False):
        self._course_id = None
        self._course_name = None
        self._uuid = uuid
        self._videos = None
        self._driver = None
        self._alternative_feeds = alternative_feeds
        self._subtitles = subtitles
        if hostname is None:
            self._hostname = "https://view.streaming.sydney.edu.au:8443"
        else:
            self._hostname = hostname

    def get_videos(self):
        if self._driver is None:
            self._blow_up("webdriver not set yet!!!", "")
        if not self._videos:
            try:
                course_data_json = self._get_course_data()
                videos_json = course_data_json["section"]["presentations"][
                    "pageContents"
                ]
                self._videos = EchoVideos(videos_json, self._driver)
            except KeyError as e:
                self._blow_up(
                    "Unable to parse course videos from JSON (course_data)", e
                )
            except selenium.common.exceptions.NoSuchElementException as e:
                self._blow_up("selenium cannot find given elements", e)

        return self._videos

    @property
    def uuid(self):
        return self._uuid

    @property
    def hostname(self):
        return self._hostname

    @property
    def url(self):
        return "{}/ess/portal/section/{}".format(self._hostname, self._uuid)

    @property
    def video_url(self):
        return "{}/ess/client/api/sections/{}/section-data.json?pageSize=100".format(
            self._hostname, self._uuid
        )

    @property
    def course_id(self):
        if self._course_id is None:
            try:
                # driver = webdriver.PhantomJS() #TODO Redo this. Maybe use a singleton factory to request the lecho360 driver?s
                self.driver.get(
                    self.url
                )  # Initialize to establish the 'anon' cookie that Echo360 sends.
                self.driver.get(self.video_url)
                course_data_json = self._get_course_data()

                self._course_id = course_data_json["section"]["course"]["identifier"]
                self._course_name = course_data_json["section"]["course"]["name"]
            except KeyError as e:
                self._blow_up(
                    "Unable to parse course id (e.g. CS473) from JSON (course_data)", e
                )

        if type(self._course_id) != str:
            # it's type unicode for python2
            return self._course_id.encode("utf-8")
        return self._course_id

    @property
    @functools.lru_cache
    def course_name(self):
        # Get the course name directly from the browser session
        self.driver.get(f"https://echo360.org.uk/section/{self._uuid}/home")
        
        # Wait for the page to load and look for the course name
        time.sleep(5)  # Give the page time to load
        
        try:
            # Try to get the course name from the page title
            title = self.driver.title
            if title and not title.lower().startswith('echo360'):
                return title.split(' - ')[0].strip()
        except:
            pass
            
        # If we couldn't get the name from the title, return a default name
        return f"Course_{self._uuid[:8]}"

    @property
    def driver(self):
        if self._driver is None:
            self._blow_up("webdriver not set yet!!!", "")
        return self._driver

    @property
    def nice_name(self):
        return "{0} - {1}".format(self.course_id, self.course_name)

    def _get_course_data(self):
        try:
            self.driver.get(self.video_url)
            _LOGGER.debug(
                "Dumping course page at %s: %s",
                self.video_url,
                self._driver.page_source,
            )
            # use requests to retrieve data
            session = requests.Session()
            # load cookies
            for cookie in self._driver.get_cookies():
                session.cookies.set(cookie["name"], cookie["value"])

            r = session.get(self.video_url)
            if not r.ok:
                raise Exception("Error: Failed to get m3u8 info for EchoCourse!")

            json_str = r.text
            self._course_data = json.loads(json_str)
            
            # After getting course data, navigate to home page to get title
            self.driver.get(f"{self.hostname}/section/{self._uuid}/home")
            time.sleep(2)  # Give the page time to load
            
            try:
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC
                
                # Wait for the element to be present using exact XPath
                wait = WebDriverWait(self.driver, 10)
                h1_span = wait.until(EC.presence_of_element_located((By.XPATH, "/html/body/div[2]/div[2]/h1/span[2]")))
                
                course_name = h1_span.text.strip()
                if course_name:
                    print(f"\nFound course name from page: {course_name}")
                    self._course_name = strip_illegal_path(course_name)
                else:
                    print("\nCould not find course name in page, using default")
                    self._course_name = f"Course_{self._uuid[:8]}"
            except Exception as e:
                print(f"\nError getting course name: {str(e)}")
                self._course_name = f"Course_{self._uuid[:8]}"
            
            return self._course_data
        except ValueError as e:
            raise Exception("Unable to retrieve JSON (course_data) from url", e)

    def set_driver(self, driver):
        self._driver = driver

    def _blow_up(self, msg, e):
        print(msg)
        print("Exception: {}".format(str(e)))
        sys.exit(1)


class EchoCloudCourse(EchoCourse):
    def __init__(self, uuid, hostname=None, alternative_feeds=False, subtitles=False):
        super(EchoCloudCourse, self).__init__(uuid, hostname, alternative_feeds, subtitles)
        self._course_name = None
        self._course_data = None
        self._lecture_count = 0
        self._processed_lectures = 0
        self._skipped_lectures = 0
        self._processed_lecture_dates = set()  # Track processed dates instead of names

    def get_videos(self):
        if self._driver is None:
            raise Exception("webdriver not set yet!!!", "")
        if not self._videos:
            try:
                # Get course data and videos only if not already cached
                if not self._course_data:
                    self._course_data = self._get_course_data()
                videos_json = self._course_data["data"]
                processed_videos = []
                
                # Get course name first before any directory creation
                self._get_course_name()
                print(f"\nUsing course name: {self._course_name}")
                
                # First count total lectures
                self._lecture_count = self._count_lectures(videos_json)
                print(f"Found {self._lecture_count} total lectures")
                
                # Process videos in a single pass
                queue = [(videos_json, "")]  # Start with root items
                found_future_lecture = False
                
                while queue and not found_future_lecture:
                    items, path = queue.pop(0)  # Use pop(0) for FIFO queue
                    
                    for item in items:
                        if not isinstance(item, dict):
                            continue
                            
                        if "lesson" in item["type"].lower():
                            # Get video URL and check content
                            video_url = "{}/lesson/{}/classroom".format(
                                self.hostname, 
                                item["lesson"]["lesson"]["id"]
                            )
                            
                            # Check if this class has no content
                            self._driver.get(video_url)
                            if "Looks like no content has been added to this class yet" in self._driver.page_source:
                                # Found first future lecture, calculate remaining ones to skip
                                remaining_to_skip = self._lecture_count - (self._processed_lectures + self._skipped_lectures)
                                self._skipped_lectures += remaining_to_skip
                                self._update_progress()
                                found_future_lecture = True
                                print(f"\nFound first future lecture - skipping remaining {remaining_to_skip} lectures")
                                break
                            
                            # Add this video to processed list
                            item["path_prefix"] = path
                            processed_videos.append(item)
                            
                            # Process transcript immediately for this lecture
                            try:
                                # Get the media ID
                                media_id = None
                                for media in item["lesson"]["medias"]:
                                    if media["mediaType"] == "Video":
                                        media_id = media["id"]
                                        break
                                
                                if media_id is not None:
                                    # Setup paths
                                    lecture_name = strip_illegal_path(item["lesson"]["lesson"]["name"])
                                    
                                    # Get lecture date
                                    lecture_date = None
                                    if "startTimeUTC" in item["lesson"]:
                                        if item["lesson"]["startTimeUTC"] is not None:
                                            lecture_date = item["lesson"]["startTimeUTC"][:10]  # Get YYYY-MM-DD part
                                    if not lecture_date and "createdAt" in item["lesson"]["lesson"]:
                                        lecture_date = item["lesson"]["lesson"]["createdAt"][:10]
                                    if not lecture_date:
                                        lecture_date = "1970-01-01"
                                    
                                    # Skip if we've already processed a lecture on this date
                                    if lecture_date in self._processed_lecture_dates:
                                        print(f"\n>> Skipping duplicate lecture on {lecture_date}: {lecture_name}")
                                        self._processed_lectures += 1
                                        self._update_progress()
                                        continue
                                        
                                    self._processed_lecture_dates.add(lecture_date)
                                        
                                    # Create filename with date
                                    filename = f"{lecture_date}_{lecture_name}"
                                    course_dir = os.path.join("default_out_path", self._course_name)
                                    dirty_dir = os.path.join(course_dir, "dirty")
                                    clean_dir = os.path.join(course_dir, "clean")
                                    
                                    # Create directories if needed
                                    os.makedirs(dirty_dir, exist_ok=True)
                                    os.makedirs(clean_dir, exist_ok=True)
                                    
                                    # Define file paths
                                    dirty_path = os.path.join(dirty_dir, f"{filename}.vtt")
                                    clean_path = os.path.join(clean_dir, f"{filename}.txt")
                                    
                                    # Skip if already processed
                                    if not os.path.exists(clean_path):
                                        # Get transcript
                                        vtt_url = f"{self.hostname}/api/ui/echoplayer/lessons/{item['lesson']['lesson']['id']}/medias/{media_id}/transcript-file?format=vtt"
                                        session = requests.Session()
                                        for cookie in self._driver.get_cookies():
                                            session.cookies.set(cookie["name"], cookie["value"])
                                            
                                        response = session.get(vtt_url)
                                        if response.status_code == 200:
                                            # Save VTT file
                                            with open(dirty_path, "wb") as f:
                                                f.write(response.content)
                                            print(f"\n>> Saved VTT transcript to: {dirty_path}")
                                            
                                            # Use external vtt_to_text script
                                            from vtt_to_text import convert_vtt_to_text
                                            output_path = convert_vtt_to_text(dirty_path, clean_dir)
                                            print(f">> Saved clean transcript to: {output_path}")
                                        else:
                                            print(f"\n>> No transcript available for: {filename}")
                                    else:
                                        print(f"\n>> Transcript already exists for: {filename}")
                            except Exception as e:
                                print(f"\n>> Error processing transcript for {filename}: {str(e)}")
                            
                            # Update progress
                            self._processed_lectures += 1
                            self._update_progress()
                            
                        elif "groupInfo" in item and not found_future_lecture:
                            # Add group/folder to queue only if we haven't found future lectures
                            folder_name = strip_illegal_path(item["groupInfo"]["name"])
                            # Skip 'home' directory and other redundant folders
                            if folder_name.lower() not in ['home', 'echo360', self._course_name.lower()]:
                                new_path = os.path.join(path, folder_name) if path else folder_name
                                queue.append((item["lessons"], new_path))
                            else:
                                # If it's a skipped directory, just add its contents with the current path
                                queue.append((item["lessons"], path))
                
                print(f"\nProcessed {self._processed_lectures} lectures, skipped {self._skipped_lectures} future lectures")
                
                # Create videos object with processed items without printing progress
                self._videos = EchoCloudVideos(
                    processed_videos,
                    self._driver,
                    self.hostname,
                    self._alternative_feeds,
                    self._subtitles,
                    course_name=self._course_name,
                    total_videos=self._processed_lectures,  # Pass the actual number of processed lectures
                    suppress_progress=True  # Add flag to suppress progress messages
                )
            except selenium.common.exceptions.NoSuchElementException as e:
                print("selenium cannot find given elements")
                raise e

        return self._videos

    def _count_lectures(self, videos_json):
        """Count total number of lectures in the course"""
        count = 0
        queue = [(videos_json, "")]
        
        while queue:
            items, _ = queue.pop(0)
            for item in items:
                if isinstance(item, dict):
                    if "lesson" in item["type"].lower():
                        count += 1
                    elif "groupInfo" in item:
                        queue.append((item["lessons"], ""))
        return count

    def _update_progress(self):
        """Update progress bar"""
        prefix = ">> Processing lectures... "
        status = f"{self._processed_lectures} processed, {self._skipped_lectures} skipped"
        text = f"\r{prefix}{status}"
        sys.stdout.write(text)
        sys.stdout.flush()

    def _process_lecture_transcript(self, video_json):
        """Process transcript for a single lecture"""
        try:
            # Get the media ID
            media_id = None
            for media in video_json["lesson"]["medias"]:
                if media["mediaType"] == "Video":
                    media_id = media["id"]
                    break
            
            if media_id is None:
                return
                
            # Setup paths
            filename = strip_illegal_path(video_json["lesson"]["lesson"]["name"])
            course_name = strip_illegal_path(self._course_name)
            course_dir = os.path.join("default_out_path", course_name)
            dirty_dir = os.path.join(course_dir, "dirty")
            clean_dir = os.path.join(course_dir, "clean")
            
            # Create directories if needed
            os.makedirs(dirty_dir, exist_ok=True)
            os.makedirs(clean_dir, exist_ok=True)
            
            # Define file paths
            dirty_path = os.path.join(dirty_dir, f"{filename}.vtt")
            clean_path = os.path.join(clean_dir, f"{filename}.txt")
            
            # Skip if already processed
            if os.path.exists(clean_path):
                return
                
            # Get transcript
            vtt_url = f"{self.hostname}/api/ui/echoplayer/lessons/{video_json['lesson']['lesson']['id']}/medias/{media_id}/transcript-file?format=vtt"
            session = requests.Session()
            for cookie in self._driver.get_cookies():
                session.cookies.set(cookie["name"], cookie["value"])
                
            response = session.get(vtt_url)
            if response.status_code == 200:
                # Save VTT file
                with open(dirty_path, "wb") as f:
                    f.write(response.content)
                
                # Use external vtt_to_text script
                from vtt_to_text import convert_vtt_to_text
                output_path = convert_vtt_to_text(dirty_path, clean_dir)
                    
        except Exception as e:
            print(f"\nError processing transcript for {filename}: {str(e)}")

    def _get_course_name(self):
        """Get and cache the course name from the section page"""
        if self._course_name:
            return
            
        # Ensure we're on the home page
        home_url = f"{self.hostname}/section/{self._uuid}/home"
        current_url = self._driver.current_url
        
        if not current_url.endswith('/home'):
            print("\nNavigating to home page...")
            self._driver.get(home_url)
        
        try:
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            # Wait for title to change from "Home"
            def title_changed(driver):
                return driver.title != "Home" and driver.title.strip() != ""
                
            wait = WebDriverWait(self._driver, 10)
            wait.until(title_changed)
            
            # Print page title for debugging
            title = self._driver.title
            print(f"\nPage title: {title}")
            
            # Extract course name from title
            if title and not title.lower().startswith('echo360'):
                # Try to extract text after parentheses first
                if '(' in title and ')' in title:
                    # Get everything after the last closing parenthesis
                    parts = title.split(')')
                    if len(parts) > 1:
                        course_name = parts[-1].strip()
                        if course_name:
                            print(f"\nFound course name after parentheses: {course_name}")
                            self._course_name = strip_illegal_path(course_name)
                            return
                
                # If no text after parentheses or it was empty, try getting text between parentheses
                if '(' in title:
                    parts = title.split('(')
                    if len(parts) > 1:
                        course_name = parts[0].strip()
                        if course_name:
                            print(f"\nUsing text before parentheses: {course_name}")
                            self._course_name = strip_illegal_path(course_name)
                            return
            
            # If we get here, no valid name was found
            print("\nCould not find valid course name in title, using default")
            self._course_name = f"Course_{self._uuid[:8]}"
            
        except Exception as e:
            print(f"\nError getting course name: {str(e)}")
            self._course_name = f"Course_{self._uuid[:8]}"

    @property
    def video_url(self):
        return "{}/section/{}/syllabus".format(self._hostname, self._uuid)

    @property
    def course_id(self):
        if self._course_id is None:
            self._course_id = ""
        return self._course_id

    @property
    def course_name(self):
        if not self._course_name:
            self._get_course_name()
        return self._course_name

    @property
    def nice_name(self):
        return self.course_name

    def _get_course_data(self):
        try:
            self.driver.get(self.video_url)
            _LOGGER.debug(
                "Dumping course page at %s: %s",
                self.video_url,
                self._driver.page_source,
            )
            # use requests to retrieve data
            session = requests.Session()
            # load cookies
            for cookie in self._driver.get_cookies():
                session.cookies.set(cookie["name"], cookie["value"])

            r = session.get(self.video_url)
            if not r.ok:
                raise Exception("Error: Failed to get m3u8 info for EchoCourse!")

            json_str = r.text
            self._course_data = json.loads(json_str)
            
            # After getting course data, navigate to home page to get title
            self.driver.get(f"{self.hostname}/section/{self._uuid}/home")
            time.sleep(2)  # Give the page time to load
            
            try:
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC
                
                # Wait for the element to be present using exact XPath
                wait = WebDriverWait(self.driver, 10)
                h1_span = wait.until(EC.presence_of_element_located((By.XPATH, "/html/body/div[2]/div[2]/h1/span[2]")))
                
                course_name = h1_span.text.strip()
                if course_name:
                    print(f"\nFound course name from page: {course_name}")
                    self._course_name = strip_illegal_path(course_name)
                else:
                    print("\nCould not find course name in page, using default")
                    self._course_name = f"Course_{self._uuid[:8]}"
            except Exception as e:
                print(f"\nError getting course name: {str(e)}")
                self._course_name = f"Course_{self._uuid[:8]}"
            
            return self._course_data
        except ValueError as e:
            raise Exception("Unable to retrieve JSON (course_data) from url", e)


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
        total_videos=None,  # Add parameter to accept total videos count
        suppress_progress=False  # Add flag to suppress progress messages
    ):
        assert course_json is not None
        self._driver = driver
        self._videos = []
        self._course_name = course_name or "Unknown_Course"
        self._total_videos = total_videos  # Store the total videos count

        # Create course directory structure first
        course_name = strip_illegal_path(self._course_name)
        course_dir = os.path.join("default_out_path", course_name)
        dirty_dir = os.path.join(course_dir, "dirty")
        clean_dir = os.path.join(course_dir, "clean")
        
        # Create directories if they don't exist
        os.makedirs(dirty_dir, exist_ok=True)
        os.makedirs(clean_dir, exist_ok=True)

        # Process videos directly from course_json
        videos_json = []
        for item in course_json:
            if type(item) is dict:
                if "lesson" in item["type"].lower():
                    videos_json.append(item)

        total_videos_num = len(videos_json)
        processed = 0

        for video_json in videos_json:
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
                processed += 1
                if not suppress_progress:
                    sys.stdout.write(f"\r>> Creating video objects... {processed}/{total_videos_num}")
                    sys.stdout.flush()
            except Exception:
                if not skip_video_on_error:
                    raise

        if not suppress_progress:
            print("")  # New line after progress
        self._videos.sort(key=operator.attrgetter("date"))

    @property
    def videos(self):
        return self._videos

    @property
    def total_videos(self):
        """Return the actual number of videos to be processed"""
        return self._total_videos if self._total_videos is not None else len(self._videos)
