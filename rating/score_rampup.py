import os
from score import Score
import git
from git import Repo
from log_file import Log


class ScoreRampUp(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        rampup = 0

        # clone repo
        Log.info('Repository has been cloned')
        # need a temporary path.
        os.system(f'rm -rf temp/')
        repo = Repo.clone_from(
            url=f'https://github.com/{id}', to_path='temp/')
        keywords = ['README', 'readme', 'Examples', 'examples', 'EXAMPLES', 'test',
                    'make', 'makefile', 'src', 'source', 'logging', 'log_file', 'tests', 'MAKEFILE']

        if repo.bare:
            rampup = 0
            Log.error('Repo does not exist.')
            # make sure repo is not empty.
            raise git.exc.InvalidGitRepositoryError
        else:
            query = '+'.join(keywords) + '+in:readme+in:description'
            result = datasource.searchRepos(query)
            if result.totalCount > 0:
                rampup = 1

        self.score = rampup
        Log.info('Subscore Complete - Rampup')
