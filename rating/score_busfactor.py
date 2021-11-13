from score import Score
from log_file import Log


class ScoreBusFactor(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        # Get list of contributors
        Log.info('Contributors aquired')
        contributors = datasource.getContributors(id)
        if (len(contributors) > 0):
            # Get total number of contributions
            totalContr = sum(
                [contributor.contributions for contributor in contributors])
            # Determine relative contributions from other contributors
            relContrs = [contributor.contributions /
                         totalContr for contributor in contributors]
            # Determine how many contributors make at least 10% of maxContr
            numActiveContr = len([
                relContr for relContr in relContrs if relContr >= 0.1])
            Log.info(
                'Score cache aquired, with contributions and relative frequencies')
            score = numActiveContr / 4
            self.score = score if score <= 1.0 else 1.0
            Log.info('Subscore Complete - Busfactor')
