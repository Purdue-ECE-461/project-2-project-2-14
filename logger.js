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

    async flush() {
        // write logs to database
        await db.writeLogFile(`${Date.now().toString()}.log`, this.buffer);

        this.buffer = [];
        this.num = 0;
    }
}

const instance = new Logger();

module.exports = instance;
