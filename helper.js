const config = require("./config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

const TOKEN_BYTES = config.TOKEN_BYTES;

// creates and returns a md5 hash from an input string
function generateHash(string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

// generates a random key of 'bytes' bytes
function generateKey(bytes) {
    return crypto.randomBytes(bytes).toString("hex");
}

// waites for ms milliseconds before resolving
async function __waitFor(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
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

// encodes the version string in a number for easy comparison
function encodeVersion(versionStr) {
    let vArr = versionStr.split(".");
    let out = 0;
    out += 1000000000 * vArr[0];
    out += 100000 * vArr[1];
    out += 1 * vArr[2];

    return out;
}

// decodes the version number back to the version string
function decodeVersion(versionNum) {
    const major = Math.floor(versionNum / 1000000000);
    versionNum = versionNum % 1000000000;
    const minor = Math.floor(versionNum / 100000);
    versionNum = versionNum % 100000;
    const patch = Math.floor(versionNum);

    return `${major}.${minor}.${patch}`;
}

// emptys the tmp folder
async function emptyTmp() {
    const directory = config.TMP_FOLDER;

    return new Promise((resolve, reject) => {
        fs.rm(directory, { recursive: true }, (err) => {
            fs.mkdir(directory, () => {
                resolve(true);
            });
        });
    });
}

async function createTmpFolder(id) {
    const directory = config.TMP_FOLDER;
    return await new Promise((resolve, reject) => {
        fs.mkdir(`${directory}/${id}`, (err) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

async function removeTmpFolder(id) {
    const directory = config.TMP_FOLDER;

    return new Promise((resolve, reject) => {
        fs.rm(`${directory}/${id}`, { recursive: true }, (err) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}

// checks if zip file is in the right format
async function checkZip(path) {
    return new Promise((resolve, reject) => {
        spawn("zip", ["-T", path]).on("exit", (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

// unzips the tmp.zip file in the tmp folder and places it contents in the tmp/ folder
async function unzipTmp(uploadID) {
    if (
        !(await checkZip(
            `${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip`
        ))
    ) {
        return null;
    }
    try {
        let options = { stdio: "pipe" };
        execSync(
            `unzip -o ${config.TMP_FOLDER}/${uploadID}/${config.TMP_FOLDER}.zip -d ${config.TMP_FOLDER}/${uploadID}/`,
            options
        );
    } catch {}

    const packageDir = await getUnzippedPackageDir(uploadID);
    if (packageDir === null) {
        return null;
    }

    return `${config.TMP_FOLDER}/${uploadID}/${packageDir}`;
}

// gets the unzipped package directory by looking through the tmp folder
async function getUnzippedPackageDir(uploadID) {
    return new Promise((resolve, reject) => {
        fs.readdir(`${config.TMP_FOLDER}/${uploadID}/`, (err, files) => {
            if (err) {
                resolve(null);
                return;
            }

            for (const file of files) {
                if (
                    file.startsWith(".") ||
                    file === `${config.TMP_FOLDER}.zip`
                ) {
                    continue;
                }
                resolve(file);
                break;
            }
            resolve(null);
        });
    });
}

// get the url from package files by accessing the package.json file
function getUrlFromPackageFiles(packagePath) {
    const packageJsonFile = `${packagePath}/package.json`;
    let packageJSON = null;
    if (fs.existsSync(packageJsonFile)) {
        try {
            packageJSON = JSON.parse(fs.readFileSync(packageJsonFile));
            if (typeof packageJSON.repository === "object") {
                if (packageJSON.repository.url) {
                    return packageJSON.repository.url;
                } else {
                    return null;
                }
            } else if (typeof packageJSON.repository === "string") {
                return `https://github.com/${packageJSON.repository}`;
            }
            return null;
        } catch {
            return null;
        }
    } else {
        return null;
    }
}
module.exports = {
    generateHash,
    generateKey,
    __waitFor,
    decodeVersion,
    encodeVersion,
    emptyTmp,
    unzipTmp,
    getUnzippedPackageDir,
    getUrlFromPackageFiles,
    checkMetadata,
    createTmpFolder,
    removeTmpFolder,
};
