import re


class Parser:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.coverage = 0
        self.total = 0

    def parse(self, filePath):
        # Get contents of file
        file = open(filePath, 'r')
        contents = file.read()
        file.close()

        # Get number passed
        try:
            self.passed = int(re.search('(\d+) passed', contents).group(1))
        except:
            self.passed = 0
        # Get number failed
        try:
            self.failed = int(re.search('(\d+) failed', contents).group(1))
        except:
            self.failed = 0
        # Get coverage
        try:
            self.coverage = int(re.search(
                'TOTAL\s+\d+\s+\d+\s+(\d+)%', contents).group(1))
        except:
            self.coverage = 0
