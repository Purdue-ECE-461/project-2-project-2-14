const config = require("./config");
const reset = require("./reset");
// reset();

const express = require("express");

const db = require("./firestore");

const checkAuth = require("./checkAuth");
const APIusers = require("./APIusers");
const APIpackages = require("./APIpackages");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

app.get(`/`, (req, res) => {
    res.send("<h1>ECE 461 Project 2 Group 14</h1>");
});

app.put(`/authenticate`, APIusers.authenticate);

app.post(`/user`, APIusers.createNewUser);

app.delete(`/user`, APIusers.deleteUser);

app.post(`/package`, APIpackages.addPackage);

app.get("/package/:id", APIpackages.getPackage);

app.put("/package/:id", APIpackages.updatePackage);

app.delete("/package/:id", APIpackages.deletePackage);

app.get("/packages", APIpackages.getPackages);

app.delete("/reset", async (req, res) => {
    if (!(await checkAuth(req.headers, true))) {
        res.status(401).send();
        return;
    }
    reset();
    res.status(200).send();
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
