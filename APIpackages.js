// this file contains all the callback functions for endpoints
// that are related to packages

const config = require("./config");
const { decodeVersion, encodeVersion } = require("./helper");
const db = require("./firestore");
const checkAuth = require("./checkAuth");
const spawn = require("child_process").spawn;
const {
    getGithubDefaultBranchName,
} = require("get-github-default-branch-name");

// gets all the packages that match the queries
// paginated with a page size of OFFSET_SIZE in config.js
async function getPackages(req, res) {
    // check authorization
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    //input validation
    let offset = req.query?.offset;
    if (offset === undefined) {
        offset = 0;
    }
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

    // get and send the response to the user
    res.setHeader("offset", offset);
    const packages = await db.searchPackagesMetadata(queryArr, offset);
    res.status(200).json(packages);
}

// gets the history of the package in the request parameters
async function getHistoryByName(req, res) {
    // check authorization
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    // input validation
    const name = req.params?.name;
    if (name === undefined) {
        res.status(400).send("name not defined");
        return;
    }

    // get and send the response to the user
    const logs = await db.getHistoryByName(name);
    res.status(200).json(logs);
}

// deletes all the packages with the name given in request parameters
async function deletePackageByName(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    // input validation
    const name = req.params?.name;
    if (name === undefined) {
        res.status(400).send("name not defined");
        return;
    }

    // delete the packages, confirm, and respond to the user
    const deleted = await db.deletePackageByName(name);
    if (!deleted) {
        res.status(400).send("Could not complete request");
        return;
    }
    res.status(200).send();
}

// deletes the package with the id given in request parameters
async function deletePackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    // input validation
    const id = req.params?.id;
    if (id === undefined) {
        res.status(400).send("ID not defined");
        return;
    }

    // delete the package, confirm, and respond to the user
    const deleted = await db.deletePackage(id);
    if (!deleted) {
        res.status(404).send("Package not found");
        return;
    }
    res.status(200).send();
}

// responds with the zip file of the package with the ID
// given in the request parameter
async function getPackage(req, res) {
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    // input validation
    const id = req.params?.id;
    if (id === undefined) {
        res.status(400).send("ID not defined");
        return;
    }

    // get the read stream of the zip file, set the response headers,
    // and pipe the stream to the user
    const readStream = await db.downloadPackage(id);
    if (readStream === null) {
        res.status(404).send("Package not found");
        return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=" + id + ".zip");
    res.status(200);
    readStream.pipe(res);

    // save a log of the action
    db.getPackageMetadata(id).then((metadata) => {
        db.saveHistoryLog(req.headers["x-authorization"], metadata, "DOWNLOAD");
    });
}

// adds the package and the metadata to the database
async function addPackage(req, res) {
    // check authorization
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    //input validation
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
    // define sensitvity of the package to the default of false, if not defined
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

    // upload the data based on the data object in the body
    metadata = await upload(packageUrl, content, metadata);
    if (!metadata) {
        res.status(400).send();
        return;
    }
    res.status(200).json(metadata);

    // encode the version string to a format that is easier to compare
    // for database queries, before saving it
    metadata.Version = encodeVersion(metadata.Version);
    db.savePackageMetadata(metadata);

    // save the log of the action
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "CREATE");
}

// updates the package that matches the metadata object of the request body,
// using the content of the data object of the request body
async function updatePackage(req, res) {
    // check authorization
    if (!(await checkAuth(req.headers, false))) {
        res.status(401).send();
        return;
    }

    // input validation
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

    // get the current metadata from the ID in the url parameter
    let metadata = await db.getPackageMetadata(id);
    if (!metadata) {
        res.status(404).send("Package does not exist");
        return;
    }

    // compare if the metadata matches
    if (!checkMetadata(metadata, newMetadata)) {
        res.status(400).send("Metadata does not match");
        return;
    }

    // upload the data based on the data object in the body
    let success = upload(packageUrl, content, metadata);
    if (!success) {
        res.status(400).send();
        return;
    }

    // save the log of the action and respond with the metadata
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "UPDATE");
    // decode the version string back to the original form before sending it
    // back to the user
    metadata.Version = decodeVersion(metadata.Version);
    res.status(200).json(metadata);
}

// checks if the 3 fields in the two metadata are equal
// ID, Version, and Name
function checkMetadata(oldData, newData) {
    if (!oldData || !newData) {
        return false;
    }
    return (
        oldData.ID === newData.ID &&
        // encode the Version string of the new data before comparing
        oldData.Version === encodeVersion(newData.Version) &&
        oldData.Name === newData.Name
    );
}

// uploads a zip to the database based on the packageUrl and content parameters
async function upload(packageUrl, content, metadata) {
    let success = false;

    // if the packageUrl is provided get the package zip from the url
    if (packageUrl) {
        // const canIngest = await checkIngestibility(await rate(packageUrl));
        // if (!canIngest) {
        //     res.status(200).send("Could not ingest because bad package");
        //     return;
        // }
        metadata.URL = packageUrl;
        success = await saveRepo(packageUrl, metadata);
    }
    // if the package url is not provided get the zip from the content
    // which is a base64 encoded string of the zip data
    else if (content) {
        //TODO: get github link out of zip
        const zippedBuf = Buffer.from(content, "base64");

        // if (!(await db.uploadToTemp(unzippedBuf))) {
        //     return null;
        // }

        success = await saveZip(zippedBuf, metadata);
    }

    if (!success) {
        return null;
    }
    // return the metadata with the url of the package saved
    return metadata;
}

// save the contents of the content buffer in the database
async function saveZip(contentBuf, metadata) {
    metadata = await db.uploadPackageLocal(contentBuf, metadata);
    return metadata;
}

// get the zip of the default branch and save it in the database
async function saveRepo(url, metadata) {
    // remove the host name from the url
    try {
        var packageInfo = url.split("github.com/")[1];
    } catch {
        return null;
    }

    // get the default branch name
    let [owner, name] = packageInfo.split("/");
    try {
        var defaultBranch = await getGithubDefaultBranchName({
            owner: owner,
            repo: name,
        });
    } catch {
        return null;
    }

    // create the download url and save it in the database
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
