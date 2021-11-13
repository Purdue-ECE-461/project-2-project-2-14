from score import Score
from log_file import Log


class ScoreLicense(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        requiredPermissions = [
            "commercial-use",
            "modifications",
            "distribution",
            "private-use"
        ]

        # Get the license from the repo
        license = datasource.getLicense(id)
        # Check if it has all required attributes
        self.score = 1
        for permission in requiredPermissions:
            if (permission not in license.permissions):
                self.score = 0
        Log.info('Subscore Complete - License')
