from .downloader import BinaryDownloader


class ChromedriverDownloader(BinaryDownloader):
    def __init__(self):
        self._name = "chromedriver"
        self._download_link_root = "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing"
        self._version = "133.0.6943.127"

    def get_os_suffix(self):
        self._os_linux_32 = "linux32"
        self._os_linux_64 = "linux64"
        self._os_windows_32 = "win32"
        self._os_windows_64 = "win32"
        self._os_darwin_32 = "mac64"
        self._os_darwin_64 = "mac64"
        self._os_darwin_arm = "mac_arm64"
        return super(ChromedriverDownloader, self).get_os_suffix()

    def get_download_link(self):
        os_suffix = self.get_os_suffix()
        filename = "chromedriver-{0}.zip".format(os_suffix)
        download_link = "{0}/{1}/{2}/{3}".format(
            self._download_link_root, self._version, os_suffix, filename
        )
        return download_link, filename

    def get_bin_root_path(self):
        return super(ChromedriverDownloader, self).get_bin_root_path()

    def get_bin(self):
        extension = ".exe" if "win" in self.get_os_suffix() else ""
        return "{0}/{1}{2}".format(self.get_bin_root_path(), self._name, extension)

    def download(self):
        super(ChromedriverDownloader, self).download()
