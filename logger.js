const db = require("./firestore");
const config = require("./config");

class Logger {
    constructor() {
        this.buffer = [];
        this.num = 0;
    }

    write(logtext) {
        var today = new Date();
        var date =
            today.getFullYear() +
            "-" +
            (today.getMonth() + 1) +
            "-" +
            today.getDate();
        var time =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();

        var dateTime = date + " " + time;
        this.buffer.push(`${dateTime}:\n${logtext}\n\n`);
        this.num++;
        if (this.num >= config.LOG_BUFFER_SIZE) {
            this.flush();
        }
    }

    flush() {
        // write logs to database
        const bufferCpy = [...this.buffer];
        this.buffer = [];
        this.num = 0;

        db.writeLogFile(`${Date.now().toString()}.log`, bufferCpy);
    }
}

const instance = new Logger();

module.exports = instance;
