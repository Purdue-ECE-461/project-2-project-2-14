from license import License
from search_repository import SearchRepository
from contributor import Contributor
from datasource import Datasource
import os

from github import Github


class DatasourceGithub(Datasource):
    def __init__(self):
        token = os.getenv('GITHUB_TOKEN')
        self.g = Github(token)

    def getDependencies(self, id):
        return id

    def getStars(self, id):
        return self.g.get_repo(id).stargazers_count

    def getContributors(self, id):
        contributors = []
        _contributors = self.g.get_repo(id).get_contributors()
        for _contributor in _contributors:
            contributors.append(Contributor(
                _contributor.name, _contributor.contributions))
        return contributors

    def getClones(self, id):
        repo = self.g.get_repo(id)
        contents = repo.get_clones_traffic(per="week")
        return contents

    def getIssues(self, id):
        repo = self.g.get_repo(id)
        Issues = repo.get_issues(state='open')
        return Issues

    def getPulls(self, id):
        repo = self.g.get_repo(id)
        pulls = repo.get_pulls(state='all')
        return pulls

    def getLastCommit(self, id):
        repo = self.g.search_commits(id)
        #commit = repo.search_commits()
        data = repo.get_page(0)
        last_commit = data[0].commit.author.date
        return last_commit

    def getLicense(self, id):
        try:
            license = self.g.get_repo(id).get_license()
            return License(license.permissions)
        except:
            return License([])

    def searchRepos(self, query):
        return self.g.search_repositories(query)
