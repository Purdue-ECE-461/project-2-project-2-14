const config = require("./config");
const db = require("./firestore");

async function checkAuth(headers, isAdmin) {
    let token = headers["x-authorization"];
    if (token === null) {
        return false;
    }
    try {
        token = token.split("bearer ")[1];
    } catch {
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
