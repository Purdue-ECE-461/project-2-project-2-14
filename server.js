const express = require("express");

const app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
    res.send("<h1>ECE416 Project 2 Team 14</h1>");
});

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));
