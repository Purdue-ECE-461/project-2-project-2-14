class OutputStdOut:
    def __init__(self):
        pass

    def display(self, repo):
        string = f'{repo.url} {round(repo.getTotalScore(), 2)}'
        for score in repo.scores:
            string += f' {round(score.score, 1)}'
        print(string)
