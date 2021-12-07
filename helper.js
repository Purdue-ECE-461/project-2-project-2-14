const config = require("./config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

const TOKEN_BYTES = config.TOKEN_BYTES;

function generateHash(string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

function generateKey(len) {
    return crypto.randomBytes(len).toString("hex");
}

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

function decodeVersion(versionNum) {
    const major = Math.floor(versionNum / 1000000000);
    versionNum = versionNum % 1000000000;
    const minor = Math.floor(versionNum / 100000);
    versionNum = versionNum % 100000;
    const patch = Math.floor(versionNum);

    return `${major}.${minor}.${patch}`;
}

function encodeVersion(versionStr) {
    let vArr = versionStr.split(".");
    let out = 0;
    out += 1000000000 * vArr[0];
    out += 100000 * vArr[1];
    out += 1 * vArr[2];

    return out;
}

async function emptyTmp() {
    const directory = config.TMP_FOLDER;

    return new Promise((resolve, reject) => {
        fs.rm(directory, { recursive: true }, (err) => {
            if (err) {
                resolve(false);
                return;
            }
            fs.mkdir(directory, () => {
                resolve(true);
            });
        });
    });
}

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

async function unzipTmp() {
    if (!(await checkZip(`${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`))) {
        return null;
    }
    const success = await new Promise((resolve, reject) => {
        spawn("unzip", [
            "-o",
            `${config.TMP_FOLDER}/${config.TMP_FOLDER}.zip`,
            "-d",
            `${config.TMP_FOLDER}/`,
        ])
            .on("exit", function (code) {
                resolve(true);
            })
            .on("error", () => {
                resolve(false);
            });
    });
    if (!success) {
        return null;
    }

    const packageDir = await getTmpPackageDir();
    if (packageDir === null) {
        return null;
    }

    return `${config.TMP_FOLDER}/${packageDir}`;
}

async function getTmpPackageDir() {
    return new Promise((resolve, reject) => {
        fs.readdir(`${config.TMP_FOLDER}/`, (err, files) => {
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

function getUrlFromPackageFiles(packagePath) {
    const packageJsonFile = `${packagePath}/package.json`;
    let packageJSON = null;
    if (fs.existsSync(packageJsonFile)) {
        try {
            packageJSON = JSON.parse(fs.readFileSync(packageJsonFile));
            return `https://github.com/${packageJSON.repository}`;
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
    getTmpPackageDir,
    getUrlFromPackageFiles,
    checkMetadata,
};
