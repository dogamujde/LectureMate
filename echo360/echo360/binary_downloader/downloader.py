import sys
import os
import platform
import stat
import wget
import shutil
import logging
import zipfile

_LOGGER = logging.getLogger(__name__)


class BinaryDownloader(object):
    def __init__(self):
        pass

    def get_os_suffix(self):
        os_platform = platform.system().lower()
        arch = platform.architecture()[0]
        if os_platform == "linux":
            if arch == "64bit":
                os_suffix = self._os_linux_64
            else:
                os_suffix = self._os_linux_32
        elif os_platform == "windows":
            if arch == "64bit":
                os_suffix = self._os_windows_64
            else:
                os_suffix = self._os_windows_32
        elif os_platform == "darwin":
            if platform.processor() == "arm":
                os_suffix = self._os_darwin_arm
            elif arch == "64bit":
                os_suffix = self._os_darwin_64
            else:
                os_suffix = self._os_darwin_32
        else:
            print("Operating System not supported")
            sys.exit(1)
        return os_suffix

    def get_download_link(self):
        raise NotImplementedError

    def get_bin_root_path(self):
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "bin"))

    def get_bin(self):
        raise NotImplementedError

    def download(self):
        bin_path = self.get_bin()
        bin_root_path = self.get_bin_root_path()
        if not os.path.exists(bin_root_path):
            os.makedirs(bin_root_path)
        if not os.path.exists(bin_path):
            print("=================================================================")
            print(
                'Binary file of {0} not found, will initiate a download process now...'.format(
                    self._name
                )
            )
            download_link, filename = self.get_download_link()
            _LOGGER.debug("binary_downloader link: %s, bin path: %s", (download_link, filename), bin_path)
            print('>> Downloading {0} binary file for "{1}"'.format(self._name, self.get_os_suffix()))
            wget.download(download_link, filename)
            print("\n>> Extracting archive file", '"{0}"'.format(filename))
            if filename.endswith(".zip"):
                with zipfile.ZipFile(filename, "r") as zip_ref:
                    # Extract all files to a temporary directory
                    temp_dir = os.path.join(bin_root_path, "temp")
                    if os.path.exists(temp_dir):
                        shutil.rmtree(temp_dir)
                    os.makedirs(temp_dir)
                    zip_ref.extractall(temp_dir)
                    
                    # Find the chromedriver executable in the extracted files
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            if file.startswith("chromedriver"):
                                src_file = os.path.join(root, file)
                                shutil.copy2(src_file, bin_path)
                                break
                    
                    # Clean up
                    shutil.rmtree(temp_dir)
            else:
                print("Error: Unsupported archive format")
                sys.exit(1)
            print("Done!")
            print("=================================================================")
            os.remove(filename)
            os.chmod(bin_path, 0o755)  # make binary executable
