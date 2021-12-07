// this file contains all the callback functions for endpoints
// that are related to packages

const config = require("./config");
const {
    decodeVersion,
    encodeVersion,
    emptyTmp,
    unzipTmp,
    getUrlFromPackageFiles,
    checkMetadata,
} = require("./helper");
const db = require("./firestore");
const checkAuth = require("./checkAuth");
const fs = require("fs");
const {
    getGithubDefaultBranchName,
} = require("get-github-default-branch-name");
const https = require("https");

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
    if (metadata.error !== undefined) {
        res.status(400).send(metadata.error);
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
    metadata = await upload(packageUrl, content, metadata);
    if (!metadata) {
        res.status(400).send();
        return;
    }
    if (metadata.error !== undefined) {
        res.status(400).send(metadata.error);
        return;
    }

    // save the log of the action and the new metadata
    db.savePackageMetadata(metadata);
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "UPDATE");

    // decode the version string before sending it back
    metadata.Version = decodeVersion(metadata.Version);
    res.status(200).json(metadata);
}

// uploads a zip to the database based on the packageUrl and content parameters
async function upload(packageUrl, content, metadata) {
    // if the packageUrl is provided get the package zip from the url
    if (packageUrl) {
        metadata = await addRepo(packageUrl, metadata);
    }
    // if the package url is not provided get the zip from the content
    // which is a base64 encoded string of the zip data
    else if (content) {
        const zippedBuf = Buffer.from(content, "base64");
        metadata = await addZip(zippedBuf, metadata);
    }

    if (!metadata) {
        return null;
    }
    // return the metadata with the url of the package saved and empty the tmp folder
    emptyTmp();
    return metadata;
}

// save the contents of the content buffer in the database
async function addZip(contentBuf, metadata) {
    fs.writeFileSync(
        `${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`,
        contentBuf
    );

    const unzipPath = await unzipTmp();

    const url = getUrlFromPackageFiles(unzipPath);
    if (url === null) {
        return { error: "could not find or read package.json" };
    }
    metadata.url = url;

    const rating = await rate(url, unzipPath);
    metadata.rating = rating;

    let success = await db.uploadPackage(
        `${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`,
        metadata
    );
    if (!success) {
        return null;
    }
    return metadata;
}

// get the zip of the default branch and save it in the database
async function addRepo(url, metadata) {
    metadata.url = url;
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

    let success = await new Promise((resolve, reject) => {
        https.get(downloadUrl, function (response) {
            if (!response || response.statusCode !== 200) {
                return false;
            }
            const stream = response.pipe(
                fs.createWriteStream(
                    `${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`
                )
            );

            stream.on("finish", () => {
                resolve(true);
            });

            stream.on("error", () => {
                resolve(false);
            });
        });
    });
    if (!success) {
        return null;
    }

    const unzipPath = await unzipTmp();
    if (!unzipPath) {
        return null;
    }

    const rating = await rate(url, unzipPath);
    if (!checkRating(rating)) {
        return { error: "package did not have the needed score" };
    }
    metadata.rating = rating;

    success = await db.uploadPackage(
        `${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`,
        metadata
    );
    if (!success) {
        return null;
    }

    return metadata;
}

function checkRating(rating) {
    if (!rating) {
        return false;
    }
    const min = config.MIN_SCORE;
    return (
        rating[config.BUS_FACTOR_SCORE] > min &&
        rating[config.CORRECTNESS_SCORE] > min &&
        rating[config.RAMP_UP_SCORE] > min &&
        rating[config.RESPONSIVE_MAINTAINER_SCORE] > min &&
        rating[config.LICENSE_SCORE] > min &&
        rating[config.GOOD_PINNING_SCORE] > min
    );
}

async function rate(url, packagePath) {
    console.log(url);
    console.log(packagePath);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({
                BusFactor: 1,
                Correctness: 1,
                RampUp: 1,
                ResponsiveMaintainer: 1,
                LicenseScore: 1,
                GoodPinningPractice: 1,
            });
        }, 1000);
    });
}

async function rateUserRepo(req, res) {
    let url = `https://github.com/${req.params.user}/${req.params.repo}`;
    console.log(url);
    const exec = require("child_process").execSync;
    data = exec(
        `./rating/env/bin/python3.8 -B ./rating/main.py ${url}`
    ).toString();
    data = data.split(" ");
    data[6] = data[6].slice(0, -1);
    console.log(data);
    let json = {
        RampUp: Number(data[1]),
        Correctness: Number(data[2]),
        BusFactor: Number(data[3]),
        ResponsiveMaintainer: Number(data[4]),
        LicenseScore: Number(data[5]),
        GoodPinningPractice: Number(data[6]),
    };
    res.status(200);
    res.end(JSON.stringify(json, null, 3));
    // res.status(200).send(data);
}

async function checkIngestibility(scoreArray) {
    for (let i = 0; i < 7; i++) {
        if (scoreArray[i] < 0.5) return false;
    }
    return true;
} // check if ingestion criteria is met

module.exports = {
    addPackage,
    getPackage,
    deletePackage,
    getPackages,
    updatePackage,
    deletePackageByName,
    getHistoryByName,
    rateUserRepo,
};

/* *******************************************
                HOW TO USE:
----------------see test.js-------------------
******************************************* */

// async function rate(moduleURL) {
//     const fs = require("fs");
//     const exec = require("child_process").execSync;
//     exec("touch ./rating/url.txt");
//     exec(`echo ${moduleURL} >> ./rating/url.txt`);
//     console.log("rating");
//     exec(
//         "rating/env/bin/python3.8 rating/main.py rating/url.txt >> rating/result.txt"
//     );

//     var content = fs.readFileSync("rating/result.txt", "utf8");
//     exec("rm rating/url.txt");
//     exec("rm rating/result.txt");
//     console.log("rated");
//     content = content.split(" ");
//     content[6] = content[6].slice(0, -1);

//     return content;
// } // rates the module and returns the result as an array of 7 values
