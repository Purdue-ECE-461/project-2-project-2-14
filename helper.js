import { TOKEN_BYTES as _TOKEN_BYTES } from "./config";
import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = _TOKEN_BYTES;

function generateHash(string) {
    return createHash("md5").update(string).digest("hex");
}

function generateKey(len) {
    return randomBytes(len).toString("hex");
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

export default {
    generateHash,
    generateKey,
    __waitFor,
    decodeVersion,
    encodeVersion,
};
