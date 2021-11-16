const config = require("./config");

const reset = require("./reset");
reset();

const express = require("express");
const db = require("./firestore");

const APIusers = require("./APIusers");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const spawn = require("child_process").spawn;

app.get("/", async function (req, res) {
    try {
        const out = await new Promise((resolve, reject) => {
            const pythonTrial = spawn("rating/env/bin/python3", ["trial.py"]);
            pythonTrial.stdout.on("data", (data) => {
                resolve(data);
            });
            pythonTrial.stdin.write("help\n");
            setTimeout(() => {
                resolve("Did not output anything");
            }, 5000);
        });
        res.send(`<h1>ECE416 Project 2 Team 14 ${out}</h1>`);
    } catch {
        res.send(`<h1>Error</h1>`);
    }
});

const USER_END = config.USER_KEY;
const PACKAGE_END = config.PACKAGE_KEY;
const LOG_END = config.LOG_KEY;

app.put(`/${USER_END}/authenticate`, APIusers.authenticate);

app.post(`/${USER_END}/create`, APIusers.createNewUser);

// app.post();

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
