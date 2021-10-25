from score_busfactor import ScoreBusFactor
from datasource_github import DatasourceGithub


def test_getScore():
    score = ScoreBusFactor()
    ds = DatasourceGithub()
    score.getScore('expressjs/express', ds)
    assert score.score >= 0 and score.score <= 1
