from datasource import Datasource
from log_file import Log
from score_license import ScoreLicense
from score_responsiveness import ScoreResponsiveness
from score_busfactor import ScoreBusFactor
from score_correctness import ScoreCorrectness
from score_rampup import ScoreRampUp
from search_repository import SearchRepository


class Repo:
    def __init__(self):
        self.url = None
        self.id = None
        self.scores = [
            ScoreRampUp(),
            ScoreCorrectness(),
            ScoreBusFactor(),
            ScoreResponsiveness(),
            ScoreLicense(),
        ]

    def getTotalScore(self):
        totalScore = 0
        totalWeight = 0
        for score in self.scores:
            totalWeight += score.weight
        for score in self.scores:
            totalScore += score.weight / totalWeight * score.score
        return totalScore

    def parseUrl(self, url, datasource: Datasource):
        if (str.startswith(url, 'https://github.com/')):
            self.id = url[19:]
            self.url = url
        elif (str.startswith(url, 'https://www.npmjs.com/package/')):
            Log.warning(
                f'npmjs URL detected ({url}). Use github URLs for better performance.')
            name = url.split('/')[-1]
            result = datasource.searchRepos(f'{name}in:name')
            self.id = SearchRepository(result[0].full_name).name
            self.url = url
        else:
            Log.error(f'URL domain not supported ({url})')
