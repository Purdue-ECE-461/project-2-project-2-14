from datasource_github import DatasourceGithub
from score_license import ScoreLicense


def test_getScore_express():
    score = ScoreLicense()
    ds = DatasourceGithub()
    score.getScore('expressjs/express', ds)
    assert score.score >= 0 and score.score <= 1


def test_getScore_cloudinary():
    score = ScoreLicense()
    ds = DatasourceGithub()
    score.getScore('cloudinary/cloudinary_npm', ds)
    assert score.score >= 0 and score.score <= 1
