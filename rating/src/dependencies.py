import requests
from src.config import *
import os
import json
import re


def checkDependency(string):
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

def dependencies(path):
    pJSON = path + "/package.json"
    with open(pJSON) as file:
        data = json.load(file)
    
    i = 1
    dependencyList = []
    try:
        for key in data["dependencies"].values():
            dependencyList.append(key)
            #print(key, type(key),i)
            i += 1
    except KeyError:
        dependencyList = []

    if len(dependencyList) == 0:
            return 1
        
    num = 0

    for dependency in dependencyList:
        if(checkDependency(dependency)):
            num += 1

    return float(num/len(dependencyList))
    