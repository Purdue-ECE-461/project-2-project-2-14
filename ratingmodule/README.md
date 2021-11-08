# Github API Module Evaluation

*Project 1 by Group 13*

## Description
**Files contain abstract classes for organization and colllection of GITHUB API modules. Base software tests each given module scoring against a few base subscores which include:**

    Busfactor
    Correctness
    Licensing
    Responsiveness
    Rampup

*Each score has a set algorithm for calculation that involves utilizing the GitHub API to gather data about the repository itself. The algorithm provided also gives user defined commands (provided to us by the ACME production) and also relays information and a relative speed based on combined arguments of what was presented to the team. Speed is sufficient for each URL and larger quantities may require more time and effort from delivered software. System also has a user defined log system that is stored in given Log notation. File contains useful information (Particularly on defined algorithms and subscore set) that will be important when software is run. This can either provide logical information or user deliverable information in the same file for user feedback. Sub scores also have user defined information in case each subscore needs to be tested and/or represented separately. This can help if specific modules need to be tested for separate values and/or are targeted for specific outcomes.*

## Usage
Each score is divided by different metrics that attribute to a "final" score to determine which modules are the best fit for our managing client.

## Commands
./ install:
Will open and install all necessarry modules for creation and test checking of modules on API
```python
elif (sys.argv[1] == 'install'):
    os.system('pip3 install PyGithub > temp/dependencies.log')
    os.system('pip3 install python-dotenv > temp/dependencies.log')
    os.system('pip3 install pyinstaller > temp/dependencies.log')
    os.system('pip3 install flask > temp/dependencies.log')
    os.system('pip3 install locust > temp/dependencies.log')
    os.system('pip3 install GitPython > temp/dependencies.log')
    os.system('pip3 install pytest > temp/dependencies.log')
    os.system('pip3 install pytest-cov > temp/dependencies.log')
    print('8 dependencies installed...')
```

./  test:
Local test files that can be used to test robustness of subscores and given total score for .env file provided by instructors.

./ load:
Loads .env file for testing purposes and method testing.

./ build:
Create path and temporary directory for building of command line arguments.

./ clean:
Clean all local files and any save temporary values that hold key information. Log files are also cleaned prior to each use.
```python
elif (sys.argv[1] == 'clean'):
        os.system(f'pyinstaller --clean run')
        os.system(f'rm -rf build/')
        os.system(f'rm -rf dist/')
        os.system(f'rm -rf temp/')
        os.system(f'rm -rf __pycache__/')
        os.system(f'rm -rf run')
        Log.info('Clean succesful')
```

## Log_File
*Log_File*

Log file is implemented to check and see what aspects of the program are running during module use. Log file is for description purposes and only gives information on modules run within program during "run" phase and building.

## Sub-score Implementation and Expectation
*Bus Factor Subscore:*
Bus Factor scoring checks against the amount of listed contributors, what each contributor's contributions are, relative contribution list (used for a relative frequency against each contributor) and how many of the contributors meet the given threshold set by us for the given expectancy (25%). In summary, it measures the amount of risk associated with a repository based on the number of contributors. It will be measured by comparing the relative number of contributions amongst the project’s most active contributors.

*Correctness Subscore:*
Correctness score was measured using different metrics. One of the metrics was the number of stars the repo has. It is safe to assume that users who use the repo and validate that it works how it is supposed to then they will give the repo a good rating. The second metric we used to evaluate the correctness was the number of clones the repo actually has. A working useful module should have a significant amount of clones that is why we decided to take into account the amount of clones it has.

*License Subscore:*
Licensing takes into account the key words list that is required in order to check for permission gathering. This requires checking the API for given information on values and setting for licensing. There are a few key checks that are made on permissions which are listed as:

* Commercial Use
* Modifications
* Distribution
* Private Use

These are checked and then given a score that is either [0 or 1].

*Ramp Up Subscore:*
Rampup was measured using a simple check of the actual repository. First main action that happens within the subscore is the check for whether or not the repository can be cloned. Issue checks are completed and if not a base score of zero is implemented for the respective value. Rating of one is found if the keyword list is met with a minimum amount of hits. If this occurs then value is set and stored on a given set. Keyword lists include words like {README, SOURCE, HELP, LOGS, LOGFILES, SETUP, NOTATION, INFO, etc.}

*Responsiveness Subscore:*
The responsiveness score was a little interesting as many things needed to be taken into account when using it. The first one was the number of open issues the repo has at the time when it is tested. This is an indicator as to how responsive the developers are when an issue is reported with their code. The second factor we evaluated was when their last commit was based upon the date the repo is being evaluated. If the contributors have a long time without committing to the repo it means they have either stopped working in it or have very little interest in updating and/or fixing any issues it might have.

*Overall Score:*
Takes into account all scores and retrieves a list of subscores to give a general overview score.

## Resource
[API Github REST] (https://docs.github.com/en/rest)

## Group 13 Members
* Geoff Cramer 
* Joshua Koshy 
* Luca Rivera

