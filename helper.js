const config = require("./config");
const crypto = require("crypto");

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

module.exports = {
    generateHash,
    generateKey,
    __waitFor,
    decodeVersion,
    encodeVersion,
};
