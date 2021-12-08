const config = require("./config");
const checkAuth = require("./checkAuth");
const helper = require("./helper");
const db = require("./firestore");
const logger = require("./gcloudlog");

// handler for the authenticate endpoint
async function authenticate(req, res) {
    // input validation
    const user = req.body.User;
    const secret = req.body.Secret;
    if (!user || !user.name || !secret || !secret.password) {
        res.status(400).send("Incorrect inputs");
        return;
    }

    // create the password hash and compare it the hash stored in the database
    const password = secret.password;
    const passwordHash = helper.generateHash(password); // TODO: add salt to hash

    const userData = await db.getUser(user.name);
    if (userData === null || passwordHash !== userData.passwordHash) {
        res.status(401).send("No such user or invalid password");
        return;
    }

    if (userData.authToken !== null) {
        db.removeAuth(userData.authToken);
    }

    // generate the token and send it back to user and save it in the database
    const token = helper.generateKey(config.TOKEN_BYTES);
    userData.authToken = token;
    db.updateUser(user.name, userData);

    db.saveAuth(token, user.name, user.isAdmin);

    res.status(200).send(token);
    logger.write(`Authorized user: ${user.name}`);
}

// handler for the create new user endpoint
async function createNewUser(req, res) {
    if (!(await checkAuth(req.headers, true))) {
        res.status(401).send();
        return;
    }

    const username = req.body?.username;
    const password = req.body?.password;
    const isAdmin = req.body?.isAdmin;

    if (!username || !password || isAdmin === undefined) {
        res.status(400).send("Incorrect inputs");
        return;
    }

    if (username === config.ADMIN_USERNAME) {
        res.status(400).send("Cannot use the username provided");
        return;
    }

    if (await db.checkUser(username)) {
        res.status(400).send("Username is already taken");
        return;
    }

    await db.saveUser(username, helper.generateHash(password), isAdmin);

    res.status(200).send();
    logger.write(`Created new user: ${username}`);
}

// handler for the delete user endpoint
async function deleteUser(req, res) {
    if (!(await checkAuth(req.headers, true))) {
        res.status(401).send();
        return;
    }

    const username = req.params?.username;

    if (!username) {
        res.status(400).send("Incorrect inputs");
        return;
    }

    if (username === config.ADMIN_USERNAME) {
        res.status(400).send("Cannot delete the username");
        return;
    }

    await db.deleteUser(username);

    res.status(200).send();
    logger.write(`Deleted user: ${username}`);
}

module.exports = {
    authenticate,
    createNewUser,
    deleteUser,
};
