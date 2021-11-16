const db = require("./firestore");
const { saveRepo } = require("./APIpackages");

saveRepo("https://github.com/expressjs/express", {
    Name: "express",
    Version: "4.17.1",
    ID: "",
});
