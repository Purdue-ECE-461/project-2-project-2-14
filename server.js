import reset from "./reset";
reset();

import express, { json, static } from "express";

import checkAuth from "./checkAuth";
import { authenticate, createNewUser, deleteUser } from "./APIusers";
import {
    addPackage,
    getPackage,
    updatePackage,
    deletePackage,
    getHistoryByName,
    deletePackageByName,
    getPackages,
    getSensitivePackageHistory,
} from "./APIpackages";

const app = express();
app.use(json({ limit: "1mb" }));
app.use(static("public"));

app.get(`/`, (req, res) => {
    res.send("<h1>ECE 461 Project 2 Group 14</h1>");
});

app.put(`/authenticate`, (req, res) => {
    try {
        authenticate(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.post(`/user`, (req, res) => {
    try {
        createNewUser(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete(`/user`, (req, res) => {
    try {
        deleteUser(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.post(`/package`, (req, res) => {
    try {
        addPackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/package/:id", (req, res) => {
    try {
        getPackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.put("/package/:id", (req, res) => {
    try {
        updatePackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete("/package/:id", (req, res) => {
    try {
        deletePackage(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/package/byName/:name", (req, res) => {
    try {
        getHistoryByName(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.delete("/package/byName/:name", (req, res) => {
    try {
        deletePackageByName(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/packages", (req, res) => {
    try {
        getPackages(req, res);
    } catch (e) {
        res.status(500).send();
        console.log(e);
    }
});

app.get("/packages/sensitive", (req, res) => {
    try {
        getSensitivePackageHistory(req, res);
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

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
);
