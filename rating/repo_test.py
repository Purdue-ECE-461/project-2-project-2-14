from datasource_github import DatasourceGithub
from repo import Repo


def test_parseUrl_github():
    repo = Repo()
    ds = DatasourceGithub()
    repo.parseUrl('https://github.com/lodash/lodash', ds)
    assert repo.id != None


def test_parseUrl_npmjs():
    repo = Repo()
    ds = DatasourceGithub()
    repo.parseUrl('https://www.npmjs.com/package/express', ds)
    assert repo.id != None


def test_getTotalScore():
    repo = Repo()
    ds = DatasourceGithub()
    totalScore = repo.getTotalScore()
    assert totalScore == 0
