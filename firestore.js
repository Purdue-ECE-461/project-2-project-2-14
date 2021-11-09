const config = require("./config");
const Firestore = require("@google-cloud/firestore");
const path = require("path");

const USERCOLL = config.USER_KEY;
const PACKAGECOLL = config.PACKAGE_KEY;
const LOGCOLL = config.LOG_KEY;
const AUTHCOLL = config.AUTH_KEY;

const DELETE_COLLECTION_BATCH = config.DELETE_COLLECTION_BATCH;

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

    async save(path, data) {
        const docRef = this.firestore.doc(path);
        await docRef.set(data);
    }

    async get(path) {
        const docRef = this.firestore.doc(path);
        return await docRef.get();
    }

    async remove(path) {
        return await this.firestore.doc(path).delete();
    }

    async increment(path, field) {
        const docRef = this.firestore.doc(path);
        const updateArg = {};
        updateArg[field] = Firestore.FieldValue.increment(1);
        docRef.update(updateArg);
    }

    async deleteCollection(collectionPath, batchSize) {
        const collectionRef = this.firestore.collection(collectionPath);
        const query = collectionRef.orderBy("__name__").limit(batchSize);

        return new Promise((resolve, reject) => {
            this.deleteQueryBatch(query, resolve).catch(reject);
        });
    }

    async deleteQueryBatch(query, resolve) {
        const snapshot = await query.get();

        const batchSize = snapshot.size;
        if (batchSize === 0) {
            // When there are no documents left, we are done
            resolve();
            return;
        }

        // Delete documents in a batch
        const batch = this.firestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Recurse on the next process tick, to avoid
        // exploding the stack.
        process.nextTick(() => {
            this.deleteQueryBatch(query, resolve);
        });
    }
}

class Database {
    constructor() {
        this.fs = new FirestoreClient();
    }

    async deleteCollection(collectionPath) {
        this.fs.deleteCollection(collectionPath, DELETE_COLLECTION_BATCH);
    }

    async saveUser(name, password, isAdmin) {
        const userData = {
            name: name,
            passwordHash: password,
            isAdmin: isAdmin,
            authToken: null,
        };
        this.fs.save(`${USERCOLL}/${name}`, userData);
    }

    async updateUser(name, userData) {
        await this.fs.save(`${USERCOLL}/${name}`, userData);
    }

    async getUser(name) {
        const response = await this.fs.get(`${USERCOLL}/${name}`);
        return response.data();
    }

    async saveAuth(token, username, isAdmin) {
        const auth = {
            token: token,
            timestamp: Date.now(),
            numRequests: 0,
            username: username,
            isAdmin: isAdmin,
        };
        await this.fs.save(`${AUTHCOLL}/${token}`, auth);
    }

    async getAuth(token) {
        const auth = await this.fs.get(`${AUTHCOLL}/${token}`);
        if (auth !== undefined) {
            this.fs.increment(`${AUTHCOLL}/${token}`, "numRequests");
        }
        return auth.data();
    }

    async removeAuth(token) {
        await this.fs.remove(`${AUTHCOLL}/${token}`);
    }
}

module.exports = new Database();
