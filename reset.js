const config = require("./config");
const db = require("./firestore");
const helper = require("./helper");

const COLL_LIST = [
    config.USER_KEY,
    config.PACKAGE_KEY,
    config.LOG_KEY,
    config.AUTH_KEY,
];

async function empty() {
    for (const COLL of COLL_LIST) {
        await db.deleteCollection(COLL);
    }
}

async function init() {
    await empty();
    await db.deletePackages();

    await helper.__waitFor(1000);

    await db.saveUser(
        config.ADMIN_USERNAME,
        helper.generateHash("string"),
        true
    );
    await helper.__waitFor(1000);
    // await db.uploadPackage(".", "express-master.zip", "express", "2.3.4");
}

module.exports = init;
