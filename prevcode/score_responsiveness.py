from score import Score
from datetime import date
from log_file import Log


class ScoreResponsiveness(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        score = 0
        issue_score = 0
        commit_score = 0
        difference_years_in_months = 0
        issues = datasource.getIssues(id)
        commits = datasource.getLastCommit(id)
        Log.info('Data aquired **Issues and Last Commit')
        today = date.today()
        difference_years = int(today.strftime("%Y")) - \
            int(commits.strftime("%Y"))
        difference_months = abs(
            int(today.strftime("%m")) - int(commits.strftime("%m")))
        difference_years_in_months = difference_years * 12
        difference_months = difference_months + difference_years_in_months
        sum_issues = 0
        for issue in range(0, 100):
            sum_issues += len(issues.get_page(issue))

        if(sum_issues <= 30):
            issue_score = 1
        elif(sum_issues > 30 and sum_issues <= 100):
            issue_score = 0.66
        elif(sum_issues > 100 and sum_issues <= 500):
            issue_score = 0.33
        else:
            issue_score = 0
        Log.info('Issue sub-subscore acheived')

        if(difference_years == 0 and difference_months < 6):
            commit_score = 1
        elif(difference_years == 0 and difference_months >= 6):
            commit_score = 0.80
        elif(difference_years >= 1):
            if(difference_months <= 3):
                commit_score = 0.66
            elif(difference_months > 3 and difference_months < 12):
                commit_score = 0.33
            else:
                commit_score = 0
        else:
            commit_score = 0
        Log.info('Commit sub-subscore acheived')

        score = commit_score + issue_score
        score = score / 2
        self.score = score
        Log.info('Subscore Complete - Responsiveness')
