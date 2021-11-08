from input import Input


class InputFile(Input):
    def getUrls(self, filePath):
        file = open(filePath, 'r')
        self.urls = file.read().split('\n')
