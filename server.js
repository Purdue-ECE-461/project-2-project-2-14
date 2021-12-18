require("dotenv").config();
const reset = require("./reset");
const logger = require("./gcloudlog");
const events = require("events");
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
    res.send("<h1>ECE 461 Project 2 Group 14: 5</h1>");
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

app.delete(`/user/:username`, (req, res) => {
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

app.post("/packages", (req, res) => {
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
        logger.write("Resetted server");
        res.status(200).send();
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

const serverEvents = new events.EventEmitter();
let server = null;
console.log("Starting up...");
async function startup(flag) {
    await emptyTmp();
    if (flag) {
        reset().then(() => {
            server = app.listen(process.env.PORT || 3000, () => {
                console.log(
                    `Server is running on port ${process.env.PORT || 3000}`
                );
                serverEvents.emit("STARTED");
            });
        });
    } else {
        server = app.listen(process.env.PORT || 3000, () => {
            console.log(
                `Server is running on port ${process.env.PORT || 3000}`
            );
            serverEvents.emit("STARTED");
        });
    }
    logger.write("Started server");
}
let resetFlag = process.argv.includes("--reset");
startup(resetFlag);

function killServer() {
    if (server) {
        server.close();
    }
}

module.exports = {
    killServer: killServer,
    serverEvents: serverEvents,
};
