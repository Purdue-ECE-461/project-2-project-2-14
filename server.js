const config = require("./config");

const reset = require("./reset");
reset();

const express = require("express");
const db = require("./firestore");

const APIusers = require("./APIusers");
const APIpackages = require("./APIpackages");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const spawn = require("child_process").spawn;

app.get("/", async function (req, res) {
    let json = { hi: 134, hnqod: 1234 };
    res.send(JSON.stringify(json, null, "\t"));
});

const USER_END = config.USER_KEY;
const PACKAGE_END = config.PACKAGE_KEY;
const LOG_END = config.LOG_KEY;

app.put(`/authenticate`, APIusers.authenticate);

app.post(`/${USER_END}/create`, APIusers.createNewUser);

app.post(`/package`, APIpackages.package);

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
