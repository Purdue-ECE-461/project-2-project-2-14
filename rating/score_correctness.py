from score import Score
from log_file import Log

class ScoreCorrectness(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        # Scores that will be calculated for total final score
        score = 0
        pulls_score = 0
        stars_score = 0
        sum_clones = 0
        # Information about Total github Clones,Referers and pulls
        #clones_data = datasource.getClones(id)
        #clones = clones_data.uniques

        stars_data = datasource.getStars(id)
        pulls_data = datasource.getPulls(id)
        Log.info('Source pull confirmed')
        for page in range(0, 100):
            sum_clones += len(pulls_data.get_page(page))

        # metric calculations
        if(sum_clones <= 100):
            pulls_score = 0
        elif(sum_clones > 100 and sum_clones <= 500):
            pulls_score = 0.33

        elif(sum_clones > 500 and sum_clones <= 1000):
            pulls_score = 0.66
        else:
            pulls_score = 1
        Log.info('Pulls initiative completed')

        if(stars_data <= 2):
            stars_score = 0
        elif(stars_data > 2 and stars_data <= 3):
            stars_score = 0.33
        elif(stars_data > 3 and stars_data <= 4):
            stars_score = 0.66
        else:
            stars_score = 1
        Log.info('Stars initiative completed')

        score = stars_score + pulls_score
        score = score / 2

        self.score = score
        Log.info('Subscore Complete - Correctness')
