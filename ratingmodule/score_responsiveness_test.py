from datasource_github import DatasourceGithub
from score_responsiveness import ScoreResponsiveness


def test_getScore_express():
    score = ScoreResponsiveness()
    ds = DatasourceGithub()
    score.getScore('expressjs/express', ds)
    assert score.score >= 0 and score.score <= 1


def test_getScore_lodash():
    score = ScoreResponsiveness()
    ds = DatasourceGithub()
    score.getScore('lodash/lodash', ds)
    assert score.score >= 0 and score.score <= 1
