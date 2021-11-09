const crypto = require("crypto");

const KEYLEN = 16;

function generateHash(string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

function generateKey() {
    return crypto.randomBytes(KEYLEN).toString("hex");
}

module.exports = {
    generateHash,
    generateKey,
};
