const config = require("./config");
const db = require("./firestore");

// checks the authorization given the header of the request
// the second argument is used to check if the user needs admin priveleges
// to access certain endpoints
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

    // check if the token is expired
    if (
        auth.timestamp + config.TOKEN_TTL < Date.now() ||
        auth.numRequests > config.MAX_REQUESTS_PER_TOKEN
    ) {
        return false;
    }

    if (isAdmin && !auth.isAdmin) {
        return false;
    }

    return true;
}

module.exports = checkAuth;
