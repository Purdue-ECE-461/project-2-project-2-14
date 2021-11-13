from datasource_github import DatasourceGithub
from score_rampup import ScoreRampUp


def test_getScore():
    score = ScoreRampUp()
    ds = DatasourceGithub()
    score.getScore('expressjs/express', ds)
    assert score.score >= 0 and score.score <= 1
