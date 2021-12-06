// base64 to string
const fs = require("fs");
let str = fs.readFileSync("./trial.txt.zip", "base64");
console.log(str);

// let buff = Buffer.from(str, "base64");
// let base64ToStringNew = buff.toString();
// console.log(base);

// string to base64
// let data = "nimeshdeuja.com";
// let buff = new Buffer(data);
// let stringToBase64 = buff.toString("base64");
