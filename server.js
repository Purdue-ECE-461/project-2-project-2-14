require("dotenv").config();
const reset = require("./reset");
const logger = require("./logger");

const express = require("express");

const checkAuth = require("./checkAuth");
const APIusers = require("./APIusers");
const APIpackages = require("./APIpackages");
const { emptyTmp } = require("./helper");

// create the express app
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get(`/`, (req, res) => {
    res.send("<h1>ECE 461 Project 2 Group 14</h1>");
});

// The detailed documentation of these endpoints can be found
// in the readme.md.
// The handler functions for every endpoint can be found it
// APIusers.js or APIpackages.js
app.put(`/authenticate`, (req, res) => {
    try {
        APIusers.authenticate(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.post(`/user`, (req, res) => {
    try {
        APIusers.createNewUser(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete(`/user`, (req, res) => {
    try {
        APIusers.deleteUser(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.post(`/package`, (req, res) => {
    try {
        APIpackages.addPackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/package/:id", (req, res) => {
    try {
        APIpackages.getPackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.put("/package/:id", (req, res) => {
    try {
        APIpackages.updatePackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete("/package/:id", (req, res) => {
    try {
        APIpackages.deletePackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/package/:id/rate", (req, res) => {
    try {
        APIpackages.packageRate(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

// TRIAL
app.get("/:repo/:user/rate", (req, res) => {
    try {
        APIpackages.rateUserRepo(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/package/byName/:name", (req, res) => {
    try {
        APIpackages.getHistoryByName(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete("/package/byName/:name", (req, res) => {
    try {
        APIpackages.deletePackageByName(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/packages", (req, res) => {
    try {
        APIpackages.getPackages(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/packages/sensitive", (req, res) => {
    try {
        APIpackages.getSensitivePackageHistory(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete("/reset", async (req, res) => {
    try {
        if (!(await checkAuth(req.headers, true))) {
            res.status(401).send();
            return;
        }
        reset();
        res.status(200).send();
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

let index = 0;
console.log("Starting up...");
async function startup(flag) {
    await emptyTmp();
    if (flag) {
        reset().then(() => {
            app.listen(process.env.PORT || 3000, () =>
                console.log(
                    `Server is running on port ${process.env.PORT || 3000}`
                )
            );
        });
    } else {
        app.listen(process.env.PORT || 3000, () =>
            console.log(`Server is running on port ${process.env.PORT || 3000}`)
        );
    }
}
startup(true);
