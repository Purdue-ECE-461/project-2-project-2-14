from datasource import Datasource
from log_file import Log

class Score:
    def __init__(self):
        self.weight = 1
        self.score = 0

    def getScore(self, id, datasource):
        self.score = 1
        Log.info('Score Complete - Overall Score')