const Firestore = require("@google-cloud/firestore");
const path = require("path");

const USERCOL = "users";

class FirestoreClient {
    constructor() {
        this.firestore = new Firestore({
            projectId: "ece461project2-331506",
            keyFilename: path.join(
                __dirname,
                "ece461project2-331506-8fb56b9423ea.json"
            ),
        });
    }

    async save(col, doc, data) {
        const docRef = this.firestore.collection(col).doc(doc);
        await docRef.set(data);
    }

    async saveSubCol(rootCol, rootDoc, col, doc, data) {
        const docRef = this.firestore
            .collection(rootCol)
            .doc(rootDoc)
            .collection(col)
            .doc(doc);
        await docRef.set(data);
    }

    async saveByPath(path, data) {
        const docRef = this.firestore.doc(path);
        await docRef.set(data);
    }

    async getByPath(path) {
        const docRef = this.firestore.doc(path);
        return await docRef.get();
    }
}

class Database {
    constructor() {
        this.fs = new FirestoreClient();
    }

    async saveUser(name, password, isAdmin) {
        this.fs.save(USERCOL, name, {
            name: name,
            passwordHash: password,
            isAdmin: isAdmin,
            auth: {
                token: null,
                timestamp: -1,
                numRequests: -1,
            },
        });
    }

    async updateUser(name, userData) {
        await this.fs.saveByPath(`${USERCOL}/${name}`, userData);
    }

    async getUser(name) {
        const response = await this.fs.getByPath(`${USERCOL}/${name}`);
        return response.data();
    }
}

module.exports = new Database();
