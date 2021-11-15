async function rate(moduleURL){
    const fs = require('fs');
    const exec = require("child_process").execSync;
    exec('touch ./rating/url.txt');
    exec(`echo ${moduleURL} >> ./rating/url.txt`);
    exec('rating/venv/bin/python rating/main.py rating/url.txt >> rating/result.txt');
    var content = fs.readFileSync('rating/result.txt', 'utf8');
    exec('rm rating/url.txt')
    exec('rm rating/result.txt')
    content = content.split(" ")
    content[6] = content[6].slice(0, -1)
    
    return content
}// rates the module and returns the result as an array of 7 values

async function checkIngestibility(scoreArray){
    for(let i = 0; i < 7; i++){
        if(scoreArray[i] < 0.5) return false
    }
    return true
}// check if ingestion criteria is met

async function cloneRepo(repoURL){
    const exec = require("child_process").execSync;
    exec(`git clone ${repoURL} >> ./sidd.txt`) // git clone git@github.com:whatever .
    let repo = repoURL.split("/")
    repo = repo[repo.length -1]
    exec(`rm -rf ./${repo}/.git*`)
    exec(`mkdir tmp`)
    const distAddr = "./tmp/repo.zip"
    exec(`zip -r ${distAddr} ./${repo}`)
    exec(`rm -rf ./${repo}`)
    return distAddr
} //clones the repo from the URL into the main folder(proj2-...) and deletes the .git files and return address to the repo folder

module.exports = {rate, checkIngestibility, cloneRepo}

/* *******************************************
                HOW TO USE:
----------------see test.js-------------------
******************************************* */


