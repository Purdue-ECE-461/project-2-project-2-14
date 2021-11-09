const config = require("./config");
const db = require("./firestore");

async function checkAuth(headers, isAdmin) {
    const token = headers["x-authorization"];
    if (token === undefined) {
        return false;
    }

    const auth = await db.getAuth(token);

    if (auth === undefined) {
        return false;
    }

    if (isAdmin && !auth.isAdmin) {
        return false;
    }

    return true;
}

module.exports = checkAuth;
