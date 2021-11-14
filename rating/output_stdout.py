class OutputStdOut:
    def __init__(self):
        pass

    def display(self, repo):
        # string = f'{repo.url} {round(repo.getTotalScore(), 2)}'
        string = f'{round(repo.getTotalScore(), 2)}'
        for score in repo.scores:
            string += f' {round(score.score, 2)}'
        print(string)
