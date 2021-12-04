const config = require("./config");
const db = require("./firestore");

async function checkAuth(headers, isAdmin) {
    const token = headers["x-authorization"];
    if (token === null) {
        return false;
    }

    const auth = await db.getAuth(token);

    if (auth === null) {
        return false;
    }

    if (isAdmin && !auth.isAdmin) {
        return false;
    }

    return true;
}

module.exports = checkAuth;
