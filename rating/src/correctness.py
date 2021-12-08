import os
import subprocess
import random
import requests
from src.config import *
import github

def getjs(packagePath):
    outlist = []
    dirlist = os.listdir(packagePath)
    for f in dirlist:
        if f == "node_modules" or f == "packages":
            continue
        if os.path.isdir(f"{packagePath}/{f}"):
            outlist += getjs(f"{packagePath}/{f}")
        elif len(f) >= 3 and f[-3:] == ".js":
            outlist.append(f"{packagePath}/{f}")

    return outlist

# def correctness(packagePath, issues):
#     numJs = getjs(packagePath)
#     index = []
#     nosyntaxProblems = 1

#     random.seed(2)

#     if len(numJs) < 10:
#         index = random.sample(range(0, len(numJs)), len(numJs))
#     else:
#         index = random.sample(range(0, len(numJs)), 10)

#     # if LOG_LEVEL == 1 or LOG_LEVEL == 2: # pragma: no cover
#         # LOG_FILE.write("JS files  \n")

#     for x in range(len(index)):
#         command = "cd node-v14.18.0-linux-x64/bin/;"
#         command += "eslint ../../" + numJs[index[x]] + " -c .eslintrc.json --no-eslintrc --quiet"

        
#         my_subprocess = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
#         subprocess_return = my_subprocess.stdout.read()
#         subprocess_return = str(subprocess_return)

#         # if LOG_LEVEL == 1 or LOG_LEVEL == 2: # pragma: no cover
#             # LOG_FILE.write("Runned linter\n")

#         if "problem" in subprocess_return:
#             nosyntaxProblems = 0
#             break

#     issues_Score = 1 - issues/(133 + (2*227))

#     if issues_Score > 1:
#         issues_Score = 1

#     if issues_Score < 0:
#         issues_Score = 0

#     return (issues_Score * nosyntaxProblems)


# if __name__ == "__main__":
#     correctness("tmp/browserify/master", 20)


def correctness(stars, basePackageLink):
    score = 0
    pulls_score = 0
    stars_score = 0
    sum_clones = 100
    # Information about Total github Clones,Referers and pulls
    #clones_data = datasource.getClones(id)
    #clones = clones_data.uniques

    # stars_data = datasource.getStars(id)
    stars_data = stars
    response = requests.get(f"{basePackageLink}/pulls?state=all", headers={'Authorization': f"token {GITHUB_TOKEN}"})
    pulls_data = response.json()
    # Log.info('Source pull confirmed')
    # for page in range(0, 100):
        # sum_clones += len(pulls_data.get_page(page))
    sum_clones += len(pulls_data)

    # metric calculations
    if(sum_clones <= 100):
        pulls_score = 0
    elif(sum_clones > 100 and sum_clones <= 500):
        pulls_score = 0.5

    elif(sum_clones > 500 and sum_clones <= 1000):
        pulls_score = 0.66
    else:
        pulls_score = 1
    # Log.info('Pulls initiative completed')

    if(stars_data <= 2):
        stars_score = 0
    elif(stars_data > 2 and stars_data <= 3):
        stars_score = 0.33
    elif(stars_data > 3 and stars_data <= 4):
        stars_score = 0.66
    else:
        stars_score = 1
    # Log.info('Stars initiative completed')

    score = stars_score + pulls_score
    score = score / 2

    # self.score = score
    return score
    # Log.info('Subscore Complete - Correctness')
