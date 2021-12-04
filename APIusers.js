const config = require("./config");
const checkAuth = require("./checkAuth");
const helper = require("./helper");
const db = require("./firestore");

async function authenticate(req, res) {
    const user = req.body.User;
    const secret = req.body.Secret;

    if (!user || !user.name || !secret || !secret.password) {
        res.status(400).send("Incorrect inputs");
        return;
    }

    const password = secret.password;
    const passwordHash = helper.generateHash(password); // TODO: add salt to hash

    const userData = await db.getUser(user.name);
    if (userData === undefined || passwordHash !== userData.passwordHash) {
        res.status(401).send("No such user or invalid password");
        return;
    }

    if (userData.authToken !== null) {
        db.removeAuth(userData.authToken);
    }

    const token = helper.generateKey(config.TOKEN_BYTES);
    userData.authToken = token;
    db.updateUser(user.name, userData);

    db.saveAuth(token, user.name, user.isAdmin);

    res.status(200).send(token);
}

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
    }
    // TODO: check is username is not taken
    await db.saveUser(username, helper.generateHash(password), isAdmin);

    res.status(200).send();
}

async function deleteUser(req, res) {
    if (!(await checkAuth(req.headers, true))) {
        res.status(401).send();
        return;
    }

    const username = req.body?.username;

    if (!username) {
        res.status(400).send("Incorrect inputs");
        return;
    }

    if (username === config.ADMIN_USERNAME) {
        res.status(400).send("Cannot delete the username");
    }

    await db.deleteUser(username);

    res.status(200).send();
}

module.exports = {
    authenticate,
    createNewUser,
    deleteUser,
};
