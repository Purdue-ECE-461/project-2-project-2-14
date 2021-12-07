import os
from score import Score
import git
from git import Repo
from log_file import Log
from github import Github
import json # new
import requests # new
import re # new

class ScoreDependencies(Score):
    def __init__(self):
        Score.__init__(self)

    def getScore(self, id, datasource):
        #self.score = 1
        # print("\n\n")
        # print(os.getenv('GITHUB_TOKEN'))
        # g = Github(os.getenv('GITHUB_TOKEN'))
        # print(g.get_user(id))
        user, repo = id.split("/")
        dependencies = self.getDependencies(user, repo)
        if (len(dependencies) < 1):
            self.score = 0; # -----------------
        else:
        # //print(dependencies) 
            num = self.processDependencies(dependencies)
        # //print(num)
            self.score = float(num/len(dependencies))
        


    def checkDependency(self, string):
        if string[0] == '^':
            return False

        if ((string[0] == '<') | (string[0] == '>') | (string[:1] == '>=') | (string[0] == '<=')):
            return False

        pattern = re.compile(r'=*\d+\.\d+\.\d+')
        if pattern.match(string) != None:
            return True

        if string[0] == '~':
            pattern = re.compile(r'~\d+\.\d+') #same as ~digit.digit or ~digit.digit.digit or more
            if pattern.match(string) != None:
                return True


    def getDependencies(self, user, repo):
        base_url = f"https://raw.githubusercontent.com/{user}/{repo}/master/package.json"
        GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
        response = requests.get(base_url,  headers={'Authorization': f"token {GITHUB_TOKEN}"})

        data = response.json()

        # with open("data.json", "w") as file:
        #     json.dump(data, file, indent = 4)


        # print(data["dependencies"])
        # print(type(data["dependencies"]))
        # print(len(data["dependencies"]))

        i = 1
        dependencyList = []
        try:
            for key in data["dependencies"].values():
                dependencyList.append(key)
                #print(key, type(key),i)
                i += 1
        except KeyError:
            dependencyList = []
        
        return dependencyList

    def processDependencies(self, data):
        # print(len(data))

        if len(data) == 0:
            return 0
        
        num = 0

        for dependency in data:
            if(self.checkDependency(dependency)):
                num += 1
                # print(dependency)
        return num