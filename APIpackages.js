const config = require("./config");
const helper = require("./helper");
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

    const packages = await db.getPackagesMetadata(offset);
    // console.log(packages);
    res.status(200).json(packages);
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

    // if (!(await db.checkPackage(id))) {
    //     res.status(404).send("package not found");
    //     return;
    // }

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
    res.json(metadata);
}

function checkMetadata(oldData, newData) {
    if (!oldData || !newData) {
        return false;
    }
    return (
        oldData.ID === newData.ID &&
        oldData.Version === newData.Version &&
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

    if (await db.checkPackage(metadata.ID)) {
        res.status(400).send("package with ID already exists");
        return;
    }

    if (!packageUrl && !content) {
        res.status(400).send();
        return;
    }

    metadata.URL = packageUrl;

    let success = upload(packageUrl, content, metadata);

    if (!success) {
        res.status(400).send();
        return;
    }
    db.savePackageMetadata(metadata);

    res.status(200);
    res.json(metadata);
}

async function upload(packageUrl, content, metadata) {
    let success = false;
    if (packageUrl && !content) {
        //TODO: get github link out of zip
        // const canIngest = await checkIngestibility(await rate(packageUrl));
        // if (!canIngest) {
        //     res.status(200).send("Could not ingest because bad package");
        //     return;
        // }

        success = await saveRepo(packageUrl, metadata);
    }

    if (packageUrl && content) {
        const contentBuf = Buffer.from(content, "base64"); // Ta-da
        success = await saveZip(contentBuf, metadata);
    }
    return success;
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
};

/* *******************************************
                HOW TO USE:
----------------see test.js-------------------
******************************************* */
