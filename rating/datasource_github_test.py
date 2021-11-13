from datasource_github import DatasourceGithub


def test_getStars():
    ds = DatasourceGithub()
    stars = ds.getStars('expressjs/express')
    assert stars >= 0


def test_getContributors():
    ds = DatasourceGithub()
    contributors = ds.getContributors('expressjs/express')
    assert contributors != None


def test_getClones():
    ds = DatasourceGithub()
    clones = ds.getClones('expressjs/express')
    assert clones != None


def test_getIssues():
    ds = DatasourceGithub()
    issues = ds.getIssues('expressjs/express')
    assert issues != None


def test_getPulls():
    ds = DatasourceGithub()
    pulls = ds.getPulls('expressjs/express')
    assert pulls != None


def test_getLastCommit():
    ds = DatasourceGithub()
    commit = ds.getLastCommit('expressjs/express')
    assert commit != None


def test_getLicense():
    ds = DatasourceGithub()
    license = ds.getLicense('expressjs/express')
    assert license != None


def test_searchRepos():
    ds = DatasourceGithub()
    results = ds.searchRepos('express')
    assert results != None
