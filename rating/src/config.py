import os

# LOG_LEVEL = int(os.environ["LOG_LEVEL"])
# LOG_FILE = open(os.environ["LOG_FILE"], "w")
try:
    GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
except:
    with open(".env", "r") as envf:
        line = envf.readline()
        GITHUB_TOKEN = line.split("=")[1]

