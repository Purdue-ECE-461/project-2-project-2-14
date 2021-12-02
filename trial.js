const fs = require("fs");

fs.readFile("./trial.txt", "utf8", (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
});
