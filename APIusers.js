const config = require("./config");
const helper = require("./helper");
const db = require("./firestore");

async function authenticate(req, res) {
    const user = req.body.User;
    const password = req.body.Secret.password;
    const passwordHash = helper.generateHash(password); // TODO: add salt to hash

    const userData = await db.getUser(user.name);
    if (userData === undefined || passwordHash !== userData.passwordHash) {
        res.status(401).send("No such user or invalid password");
        return;
    }

    const token = helper.generateKey();
    userData.auth = {
        timestamp: Date.now(),
        token: token,
        numRequests: 0,
    };
    db.updateUser(user.name, userData);

    res.status(200).send(token);
}

async function createNewUser(req, res) {}

module.exports = {
    authenticate,
    createNewUser,
};
