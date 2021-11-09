const db = require("./firestore");
const helper = require("./helper");

async function init() {
    await db.saveUser("admin", helper.generateHash("ece461"), true);
    const user = await db.getUser("admin");
    console.log(user);
}

module.exports = init;
