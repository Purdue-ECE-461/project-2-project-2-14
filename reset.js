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

    await helper.__waitFor(3000);

    await db.saveUser(
        config.ADMIN_USERNAME,
        helper.generateHash("ece461"),
        true
    );
    console.log("INIT DONE");
    // await db.uploadPackage(".", "express-master.zip", "express", "2.3.4");
}

module.exports = init;
