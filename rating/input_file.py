from input import Input


class InputFile(Input):
    def getUrls(self, url):
        self.urls = [url]
        # self.urls = file.read().split('\n')

