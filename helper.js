const config = require("./config");
const crypto = require("crypto");

const TOKEN_BYTES = config.TOKEN_BYTES;

function generateHash(string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

function generateKey() {
    return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

async function __waitFor(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

module.exports = {
    generateHash,
    generateKey,
    __waitFor,
};
