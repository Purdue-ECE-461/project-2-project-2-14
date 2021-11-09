require("./init")();

const helper = require("./helper");
const express = require("express");
const db = require("./firestore");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(express.static("public"));

app.get("/", function (req, res) {
    res.send("<h1>ECE416 Project 2 Team 14</h1>");
});

app.put("/authenticate", async function (req, res) {
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
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
