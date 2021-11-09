const config = require("./config");

const reset = require("./reset");
reset();

const express = require("express");
const db = require("./firestore");

const APIusers = require("./APIusers");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get("/", function (req, res) {
    res.send("<h1>ECE416 Project 2 Team 14</h1>");
});

const USER_END = config.USER_KEY;
const PACKAGE_END = config.PACKAGE_KEY;
const LOG_END = config.LOG_KEY;

app.put(`/${USER_END}/authenticate`, APIusers.authenticate);

app.post(`/${USER_END}/create`, APIusers.createNewUser);

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
