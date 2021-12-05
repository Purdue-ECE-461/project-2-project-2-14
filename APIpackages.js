const config = require("./config");
const checkAuth = require("./checkAuth");
const helper = require("./helper");
const db = require("./firestore");
const spawn = require("child_process").spawn;
const {
    getGithubDefaultBranchName,
} = require("get-github-default-branch-name");

async function package(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    var metadata = req.body.metadata;
    const packageUrl = req.body?.data?.URL;
    const content = req.body?.data?.Content;

    if (!packageUrl && !content) {
        res.status(400);
    }

    const contentBuf = Buffer.from(content, "base64"); // Ta-da
    // console.log(buf);

    metadata.URL = packageUrl;
    if (packageUrl && !content) {
        // const canIngest = await checkIngestibility(await rate(packageUrl));
        // if (!canIngest) {
        //     res.status(200).send("Could not ingest because bad package");
        //     return;
        // }

        metadata = await saveRepo(packageUrl, metadata);
    }

    if (packageUrl && content) {
        metadata = await saveZip(contentBuf, metadata);
    }

    if (!metadata) {
        res.status(400).send();
        return;
    }

    res.status(200);
    res.json(metadata);
}

async function saveZip(contentBuf, metadata) {
    metadata = db.uploadPackageLocal(contentBuf, metadata);

    return metadata;
}

async function saveRepo(url, metadata) {
    try {
        var packageInfo = url.split("github.com/")[1];
    } catch {
        return null;
    }

    let [owner, name] = packageInfo.split("/");
    try {
        var defaultBranch = await getGithubDefaultBranchName({
            owner: owner,
            repo: name,
        });
    } catch {
        return null;
    }

    const downloadUrl = `https://codeload.github.com/${owner}/${name}/zip/heads/${defaultBranch}`;
    metadata = db.uploadPackagePublic(downloadUrl, metadata);

    return metadata;
}

async function rate(moduleURL) {
    const fs = require("fs");
    const exec = require("child_process").execSync;
    exec("touch ./rating/url.txt");
    exec(`echo ${moduleURL} >> ./rating/url.txt`);
    console.log("rating");
    exec("rating/env/bin/python3.8 rating/main.py rating/url.txt >> rating/result.txt");

    var content = fs.readFileSync("rating/result.txt", "utf8");
    exec("rm rating/url.txt");
    exec("rm rating/result.txt");
    console.log("rated");
    content = content.split(" ");
    content[6] = content[6].slice(0, -1);

    return content;
} // rates the module and returns the result as an array of 7 values

async function checkIngestibility(scoreArray) {
    for (let i = 0; i < 7; i++) {
        if (scoreArray[i] < 0.5) return false;
    }
    return true;
} // check if ingestion criteria is met

async function rate2(req, res){
    let id = req.params.id;
    const exec = require("child_process").execSync;
    data = exec(`python3 test.py ${id}`).toString();
    console.log(data);
    res.status(200).send(data);
}

async function rateUserRepo(req, res){
    let url = `https://github.com/${req.params.user}/${req.params.repo}`
    console.log(url);
    const exec = require("child_process").execSync;
    data = exec(`python3 rating/main.py ${url}`).toString();
    data = data.split(" ");
    data[6] = data[6].slice(0, -1);
    console.log(data);
    let json = {
        "RampUp": Number(data[1]),
        "Correctness": Number(data[2]),
        "BusFactor": Number(data[3]),
        "ResponsiveMaintainer": Number(data[4]),
        "LicenseScore": Number(data[5]),
        "GoodPinningPractice": Number(data[6])
    }
    res.status(200)
    res.end(JSON.stringify(json, null, 3));
    // res.status(200).send(data);
}

module.exports = { rate, saveRepo, package, rate2, rateUserRepo};



/* *******************************************
                HOW TO USE:
----------------see test.js-------------------
******************************************* */
