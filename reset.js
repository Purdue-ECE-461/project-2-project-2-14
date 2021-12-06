import {
    USER_KEY,
    PACKAGE_KEY,
    LOG_KEY,
    AUTH_KEY,
    SENSITIVE_KEY,
    ADMIN_USERNAME,
} from "./config";
import db from "./firestore";
import { __waitFor, generateHash } from "./helper";

const COLL_LIST = [USER_KEY, PACKAGE_KEY, LOG_KEY, AUTH_KEY, SENSITIVE_KEY];

async function empty() {
    for (const COLL of COLL_LIST) {
        await db.deleteCollection(COLL);
    }
}

async function init() {
    await empty();
    await db.deletePackages();

    await __waitFor(3000);

    await db.saveUser(ADMIN_USERNAME, generateHash("ece461"), true);
    console.log("RESET");
    // await db.uploadPackage(".", "express-master.zip", "express", "2.3.4");
}

export default init;
