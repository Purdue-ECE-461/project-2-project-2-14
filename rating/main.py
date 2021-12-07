import os
import sys
from parser import Parser

# from dotenv import load_dotenv

from datasource_github import DatasourceGithub
from input_file import InputFile
from log_file import Log
from output_stdout import OutputStdOut
from repo import Repo


def main():
    # Set up logger
    Log.init()
    Log.info('logger created')

    # Parse command
    invalid = False
    if (len(sys.argv) < 2):
        invalid = True
    elif (sys.argv[1] == 'install'):  # mode 1
        os.system('mkdir temp')
        os.system('touch temp/dependencies.log')
        os.system('pip3 install PyGithub > temp/dependencies.log')
        os.system('pip3 install python-dotenv > temp/dependencies.log')
        os.system('pip3 install pyinstaller > temp/dependencies.log')
        os.system('pip3 install flask > temp/dependencies.log')
        os.system('pip3 install locust > temp/dependencies.log')
        os.system('pip3 install GitPython > temp/dependencies.log')
        os.system('pip3 install pytest > temp/dependencies.log')
        os.system('pip3 install pytest-cov > temp/dependencies.log')
        print('8 dependencies installed...')
    elif (sys.argv[1] == 'test'):  # mode 2
        Log.info('Testing started')
        os.system('rm tests.log')
        os.system('pytest --cov=./ > tests.log')
        parser = Parser()
        parser.parse('tests.log')
        print(f'Total: {parser.passed + parser.failed}')
        print(f'Passed: {parser.passed}')
        print(f'Coverage: {parser.coverage}%')
        print(
            f'{parser.passed}/{parser.passed + parser.failed} test cases passed. {parser.coverage}%% line coverage achieved.')
    elif (sys.argv[1] == 'load'):
        # load_dotenv()
        Log.info('.env file loaded')
        print('.env loaded')
    elif (sys.argv[1] == 'build'):
        os.system(
            f'pyinstaller -F --distpath ./ -n run --hidden-import _cffi_backend main.py')
        Log.info('System built for execution')
    elif (sys.argv[1] == 'clean'):
        os.system(f'pyinstaller --clean run')
        os.system(f'rm -rf build/')
        os.system(f'rm -rf dist/')
        os.system(f'rm -rf temp/')
        os.system(f'rm -rf __pycache__/')
        os.system(f'rm -rf run')
        Log.info('Clean succesful')
    # elif (os.path.exists(sys.argv[1])):  # mode 3 -------------------
    elif (sys.argv[1] != None):
        # initlialize modules
        input = InputFile()
        datasource = DatasourceGithub()
        output = OutputStdOut()
        Log.info('Modules intialized')
        # get inputs
        # input.getUrls(sys.argv[1])
        input.urls = sys.argv[1]
        # print(type(input.urls))
        Log.info('URLs retrieved')
        # create repo listings
        repos = []
        # for url in input.urls:
        repo = Repo()
        repo.parseUrl(input.urls, datasource)
        if (repo.id != None):
            repos.append(repo)
        # get scores
        # print(repo)
        for repo in repos:
            Log.info(f'Calculating scores for \'{repo.id}\'...')
            for score in repo.scores:
                score.getScore(repo.id, datasource)
            Log.info(f'Scores calculated for repo \'{repo.id}\'')
        Log.info('All repo scores calculated')
        # sort output
        Log.info('Sorting repos...')
        repos = sorted(
            repos, key=lambda repo: repo.getTotalScore(), reverse=True)
        Log.info('Sorted repos')
        # display output
        #print('URL NET_SCORE RAMP_UP_SCORE CORRECTNESS_SCORE BUS_FACTOR_SCORE RESPONSIVE_MAINTAINER_SCORE LICENSE_SCORE DEPENDENCIES_SCORE')
        for repo in repos:
            output.display(repo)
    else:
        invalid = True

    if (invalid):
        string = r"""usage: ./run <command>
Commands:   install - install dependencies
            test - run unit tests
            url_file - calculate scores for ASCII-encoded, newline-delimited set of URLs."""
        print(string)


if __name__ == "__main__":
    main()
