const config = require("./config");
const { decodeVersion, encodeVersion } = require("./helper");
const db = require("./firestore");
const checkAuth = require("./checkAuth");
const spawn = require("child_process").spawn;
const {
    getGithubDefaultBranchName,
} = require("get-github-default-branch-name");

async function getPackages(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    let offset = req.query?.offset;
    if (offset === undefined) {
        offset = 0;
    }

    res.setHeader("offset", offset);

    const queryArr = req.body;
    if (!queryArr || queryArr.length === 0) {
        const packages = await db.getAllPackagesMetadata(offset);
        res.status(200).json(packages);
        return;
    }

    for (let i = 0; i < queryArr.length; i++) {
        if (!queryArr[i].Name || !queryArr[i].Version) {
            res.status(400).send("Incorrect query array");
            return;
        }
    }

    const packages = await db.searchPackagesMetadata(queryArr, offset);
    res.status(200).json(packages);
}

async function getHistoryByName(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    const name = req.params?.name;
    if (name === undefined) {
        res.status(400).send("name not defined");
        return;
    }

    const logs = await db.getHistoryByName(name);

    res.status(200).json(logs);
}

async function deletePackageByName(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    const name = req.params?.name;
    if (name === undefined) {
        res.status(400).send("name not defined");
        return;
    }

    const deleted = await db.deletePackageByName(name);
    if (!deleted) {
        res.status(400).send("Could not complete request");
        return;
    }
    res.status(200).send();
}

async function deletePackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    const id = req.params?.id;
    if (id === undefined) {
        res.status(400).send("ID not defined");
        return;
    }
    const deleted = await db.deletePackage(id);

    if (!deleted) {
        res.status(404).send("Package not found");
        return;
    }
    res.status(200).send();
}

async function getPackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    const id = req.params?.id;
    if (id === undefined) {
        res.status(400).send("ID not defined");
        return;
    }
    const readStream = await db.downloadPackage(id);

    if (readStream === null) {
        res.status(404).send("Package not found");
        return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=" + id + ".zip");
    res.status(200);
    readStream.pipe(res);

    db.getPackageMetadata(id).then((metadata) => {
        db.saveHistoryLog(req.headers["x-authorization"], metadata, "DOWNLOAD");
    });
}

async function updatePackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    const id = req.params?.id;
    if (id === undefined) {
        res.status(400).send("no ID provided");
        return;
    }

    var newMetadata = req.body?.metadata;
    const packageUrl = req.body?.data?.URL;
    const content = req.body?.data?.Content;

    if (newMetadata === undefined) {
        res.status(400).send("no metadata provided");
        return;
    }

    if (!packageUrl && !content) {
        res.status(400).send();
        return;
    }

    let metadata = await db.getPackageMetadata(id);
    if (!metadata) {
        res.status(404).send("Package does not exist");
        return;
    }

    if (!checkMetadata(metadata, newMetadata)) {
        res.status(400).send("Metadata does not match");
        return;
    }

    let success = upload(packageUrl, content, metadata);

    if (!success) {
        res.status(400).send();
        return;
    }

    res.status(200);
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "UPDATE");
    metadata.Version = decodeVersion(metadata.Version);
    res.json(metadata);
}

function checkMetadata(oldData, newData) {
    if (!oldData || !newData) {
        return false;
    }
    return (
        oldData.ID === newData.ID &&
        oldData.Version === encodeVersion(newData.Version) &&
        oldData.Name === newData.Name
    );
}

async function addPackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    var metadata = req.body?.metadata;
    const packageUrl = req.body?.data?.URL;
    const content = req.body?.data?.Content;

    if (metadata === undefined) {
        res.status(400).send("no metadata provided");
        return;
    }
    if (!metadata.Name || !metadata.Version || !metadata.ID) {
        res.status(400).send("incorrect metadata provided");
        return;
    }

    if (metadata.isSensitive === undefined) {
        metadata.isSensitive = false;
    }

    if (await db.checkPackage(metadata.ID)) {
        res.status(400).send("package with ID already exists");
        return;
    }

    if (!packageUrl && !content) {
        res.status(400).send();
        return;
    }

    metadata = await upload(packageUrl, content, metadata);

    if (!metadata) {
        res.status(400).send();
        return;
    }

    res.status(200).json(metadata);

    metadata.Version = encodeVersion(metadata.Version);
    db.savePackageMetadata(metadata);

    db.saveHistoryLog(req.headers["x-authorization"], metadata, "CREATE");
}

async function upload(packageUrl, content, metadata) {
    let success = false;
    if (packageUrl) {
        // const canIngest = await checkIngestibility(await rate(packageUrl));
        // if (!canIngest) {
        //     res.status(200).send("Could not ingest because bad package");
        //     return;
        // }
        metadata.URL = packageUrl;
        success = await saveRepo(packageUrl, metadata);
    } else if (content) {
        //TODO: get github link out of zip
        // metadata.URL = githubUrl;
        const zippedBuf = Buffer.from(content, "base64");

        // if (!(await db.uploadToTemp(unzippedBuf))) {
        //     return null;
        // }

        success = await saveZip(zippedBuf, metadata);
    }

    if (!success) {
        return null;
    }
    return metadata;
}

async function saveZip(contentBuf, metadata) {
    metadata = await db.uploadPackageLocal(contentBuf, metadata);
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
    metadata = await db.uploadPackagePublic(downloadUrl, metadata);

    return metadata;
}

async function rate(moduleURL) {
    const fs = require("fs");
    const exec = require("child_process").execSync;
    exec("touch ./rating/url.txt");
    exec(`echo ${moduleURL} >> ./rating/url.txt`);
    console.log("rating");
    exec(
        "rating/env/bin/python3.8 rating/main.py rating/url.txt >> rating/result.txt"
    );

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

module.exports = {
    rate,
    saveRepo,
    addPackage,
    getPackage,
    deletePackage,
    getPackages,
    updatePackage,
    deletePackageByName,
    getHistoryByName,
};

/* *******************************************
                HOW TO USE:
----------------see test.js-------------------
******************************************* */
