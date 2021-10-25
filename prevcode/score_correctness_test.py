from score_correctness import ScoreCorrectness
from datasource_github import DatasourceGithub


def test_getScore():
    score = ScoreCorrectness()
    ds = DatasourceGithub()
    score.getScore('expressjs/express', ds)
    assert score.score >= 0 and score.score <= 1
