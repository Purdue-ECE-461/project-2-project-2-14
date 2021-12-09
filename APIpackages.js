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
    generateKey,
    createTmpFolder,
    removeTmpFolder,
} = require("./helper");
const db = require("./firestore");
const checkAuth = require("./checkAuth");
const fs = require("fs");
const {
    getGithubDefaultBranchName,
} = require("get-github-default-branch-name");
const https = require("https");
const logger = require("./gcloudlog");
const exec = require("child_process").execSync;

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
    logger.write(
        `Responded to query with ${packages.length} results with offset: ${offset}`
    );
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

    logger.write(
        `Responded with history of package ${name} with ${logs.length} number of items`
    );
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
    logger.write(`Deleted all packages with name: ${name}`);
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
    logger.write(`Deleted package with id: ${id}`);
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
    logger.write(`Sent package zip with id: ${id}`);
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
    const versionStr = metadata.Version;
    metadata.Version = encodeVersion(metadata.Version);
    db.savePackageMetadata(metadata);

    // save the log of the action
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "CREATE");
    logger.write(
        `Added package: ${JSON.stringify({
            ID: metadata.ID,
            Name: metadata.Name,
            Version: versionStr,
        })}`
    );
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
    metadata = { ...metadata };
    metadata.Version = decodeVersion(metadata.Version);
    res.status(200).json(metadata);
    logger.write(
        `Updated package: ${JSON.stringify({
            ID: metadata.ID,
            Name: metadata.Name,
            Version: metadata.Version,
        })}`
    );
}

// uploads a zip to the database based on the packageUrl and content parameters
async function upload(packageUrl, content, metadata) {
    const uploadID = generateKey(4);
    await createTmpFolder(uploadID);
    logger.write(`Creating a folder in tmp with upload id: ${uploadID}`);
    // if the packageUrl is provided get the package zip from the url
    if (packageUrl) {
        metadata = await addRepo(packageUrl, metadata, uploadID);
    }
    // if the package url is not provided get the zip from the content
    // which is a base64 encoded string of the zip data
    else if (content) {
        const zippedBuf = Buffer.from(content, "base64");
        metadata = await addZip(zippedBuf, metadata, uploadID);
    }

    if (!metadata) {
        removeTmpFolder(uploadID);
        return null;
    }
    // return the metadata with the url of the package saved and delete the folder in tmp
    removeTmpFolder(uploadID);
    logger.write(`Removing the folder in tmp with upload id: ${uploadID}`);
    return metadata;
}

// save the contents of the content buffer in the database
async function addZip(contentBuf, metadata, uploadID) {
    // write to temp folder
    fs.writeFileSync(
        `${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip`,
        contentBuf
    );
    logger.write(
        `Wrote package files to tmp for package with id: ${metadata.ID}`
    );

    // unzip in tmp folder
    const unzipPath = await unzipTmp(uploadID);
    if (!unzipPath) {
        return { error: "incorrect zip data" };
    }
    logger.write(
        `Unzipped package files at tmp for package with id: ${metadata.ID}`
    );

    // get repo url out of package.json file
    const url = getUrlFromPackageFiles(unzipPath);
    if (url === null) {
        return { error: "could not find or read package.json" };
    }
    metadata.url = url;

    // rate and check if required score was met
    const rating = rate(url, unzipPath);
    logger.write(
        `Rating package at: ${url} for package with id: ${metadata.ID}`
    );
    if (!rating) {
        return { error: "Could not rate module" };
    }
    if (!checkRating(rating)) {
        return {
            error:
                "package did not have the needed score: " +
                JSON.stringify(rating),
        };
    }
    metadata.rating = rating;

    // upload to cloud storage
    let success = await db.uploadPackage(
        `${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip`,
        metadata
    );
    if (!success) {
        return null;
    }
    logger.write(
        `Uploaded package zip to cloud bucket for package with id: ${metadata.ID}`
    );
    return metadata;
}

// get the zip of the default branch and save it in the database
async function addRepo(url, metadata, uploadID) {
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
        // download zip of package and store it in tmp
        https.get(downloadUrl, function (response) {
            if (!response || response.statusCode !== 200) {
                return false;
            }
            response
                .pipe(
                    fs.createWriteStream(
                        `${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip`
                    )
                )
                .on("finish", () => {
                    resolve(true);
                })
                .on("error", () => {
                    resolve(false);
                });
        });
    });
    if (!success) {
        return { error: "Could not download module from github" };
    }
    logger.write(
        `Downloaded and stored package from: ${downloadUrl} to tmp for package with id: ${metadata.ID}`
    );

    // unzip the package in tmp folder
    const unzipPath = await unzipTmp(uploadID);
    if (!unzipPath) {
        return null;
    }
    logger.write(
        `Unzipped package files at tmp for package with id: ${metadata.ID}`
    );

    const rating = rate(url, unzipPath);
    if (!rating) {
        return { error: "Could not rate module" };
    }
    if (!checkRating(rating)) {
        return {
            error:
                "package did not have the needed score: " +
                JSON.stringify(rating),
        };
    }
    logger.write(
        `Rating package at: ${url} for package with id: ${metadata.ID}`
    );
    metadata.rating = rating;

    //upload to google cloud storage
    success = await db.uploadPackage(
        `${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip`,
        metadata
    );
    if (!success) {
        return null;
    }
    logger.write(
        `Uploaded package zip to cloud bucket for package with id: ${metadata.ID}`
    );

    return metadata;
}

// check if the score matches the requirement
function checkRating(rating) {
    if (!rating) {
        return false;
    }
    const min = config.MIN_SCORE;
    try {
        return (
            rating[config.BUS_FACTOR_SCORE] >= min &&
            rating[config.CORRECTNESS_SCORE] >= min &&
            rating[config.RAMP_UP_SCORE] >= min &&
            rating[config.RESPONSIVE_MAINTAINER_SCORE] >= min &&
            rating[config.LICENSE_SCORE] >= min &&
            rating[config.GOOD_PINNING_SCORE] >= min
        );
    } catch {
        return false;
    }
}

function rate(url, packagePath) {
    let data;
    try {
        data = exec(
            `rating/run ${url} ${packagePath} ${process.env.GITHUB_TOKEN}`
        ).toString();
        data = data.split(" ");
        data[5] = data[5].slice(0, -1);
    } catch {
        return null;
    }

    const rating = {};
    rating[config.BUS_FACTOR_SCORE] = parseFloat(data[2]);
    rating[config.CORRECTNESS_SCORE] = parseFloat(data[4]);
    rating[config.RAMP_UP_SCORE] = parseFloat(data[1]);
    rating[config.RESPONSIVE_MAINTAINER_SCORE] = parseFloat(data[3]);
    rating[config.LICENSE_SCORE] = parseFloat(data[0]);
    rating[config.GOOD_PINNING_SCORE] = parseFloat(data[5]);
    return rating;
}

// endpoint that returns the package score
async function packageRate(req, res) {
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

    // get the metadata from firestore and validate
    const metadata = await db.getPackageMetadata(id);
    if (metadata === null) {
        res.status(404).send("Package does not exist");
        return;
    }
    if (metadata.rating === undefined) {
        res.status(500).send("package cannot be rated");
        return;
    }

    // send the rating back to the user
    res.status(200).json(metadata.rating);
    db.saveHistoryLog(req.headers["x-authorization"], metadata, "RATE");
    logger.write(`Returned the rating of the package with id: ${id}`);
}

module.exports = {
    addPackage,
    getPackage,
    deletePackage,
    getPackages,
    updatePackage,
    deletePackageByName,
    getHistoryByName,
    packageRate,
};
