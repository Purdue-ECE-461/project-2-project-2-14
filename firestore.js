const config = require("./config");
const path = require("path");
const { generateKey, encodeVersion, decodeVersion } = require("./helper");
const https = require("https");
const { createReadStream } = require("fs");

const USERCOLL = config.USER_KEY;
const PACKAGECOLL = config.PACKAGE_KEY;
const LOGCOLL = config.LOG_KEY;
const AUTHCOLL = config.AUTH_KEY;

const DELETE_COLLECTION_BATCH = config.DELETE_COLLECTION_BATCH;

class FirestoreClient {
    constructor() {
        this.admin = require("firebase-admin");

        var serviceAccount = require("./ece461project2-adminkey.json");
        this.admin.initializeApp({
            credential: this.admin.credential.cert(serviceAccount),
            storageBucket: config.BUCKET_NAME,
        });
        this.firestore = this.admin.firestore();
        this.bucket = this.admin.storage().bucket();
    }

    async fileExists(path) {
        return await this.bucket.file(path).exists();
    }

    async getWriteStream(destination) {
        return this.bucket.file(destination).createWriteStream();
    }

    async getReadStream(path) {
        const [exists] = await this.fileExists(path);
        if (exists) {
            return this.bucket.file(path).createReadStream();
        }
        return null;
    }

    async deletePackage(path) {
        const [exists] = await this.fileExists(path);
        if (exists) {
            await this.bucket.file(path).delete();
            return true;
        }
        return false;
    }

    async emptyBucket() {
        let files;
        try {
            files = await this.bucket.getFiles();
            if (files.length === 0) {
                return;
            }
            files = files[0];
        } catch {
            console.log("error getting files");
            return;
        }
        // console.log(files);
        const packageFiles = files.filter((f) =>
            f.metadata.id.includes(`/${config.PACKAGE_KEY}/`)
        );
        packageFiles.forEach(async (f) => {
            await f.delete();
        });
    }

    async exists(path) {
        const doc = await this.firestore.doc(path).get();
        return doc.exists ? true : false;
    }

    async save(path, data) {
        const docRef = this.firestore.doc(path);
        await docRef.set(data);
    }

    async get(path) {
        const docRef = this.firestore.doc(path);
        const doc = await docRef.get();
        return doc.exists ? doc : null;
    }

    async getAllFromCollection(colPath, offset) {
        const colRef = this.firestore.collection(colPath);
        return await colRef
            .orderBy("Name")
            .limit(config.OFFSET_SIZE)
            .offset(config.OFFSET_SIZE * offset)
            .get();
    }

    async runQuery(colPath, conditions) {
        const colRef = this.firestore.collection(colPath);
        const out = [];

        let ref = colRef;
        conditions.forEach((c) => {
            ref = ref.where(c.key, c.oper, c.value);
        });

        const snapshot = await ref.get();

        snapshot.forEach((p) => {
            out.push(p.data());
        });

        return out;
    }

    async runBatchQuery(colPath, queryArr, pageOffset) {
        const colRef = this.firestore.collection(colPath);
        const out = [];

        let index = 0;
        const offset = pageOffset * config.OFFSET_SIZE;

        for (const conditions of queryArr) {
            let ref = colRef;
            conditions.forEach((c) => {
                ref = ref.where(c.key, c.oper, c.value);
            });

            const snapshot = await ref.get();

            try {
                snapshot.forEach((p) => {
                    if (index < offset) {
                        index++;
                        return;
                    }
                    if (index >= offset + config.OFFSET_SIZE) {
                        throw "break";
                    }
                    out.push(p.data());
                    index++;
                });
            } catch (e) {}
        }
        return out;
    }

    async remove(path) {
        return await this.firestore.doc(path).delete();
    }

    async increment(path, field) {
        const docRef = this.firestore.doc(path);
        const updateArg = {};
        updateArg[field] = this.admin.firestore.FieldValue.increment(1);
        docRef.update(updateArg);
    }

    async deleteCollection(collectionPath) {
        const collectionRef = this.firestore.collection(collectionPath);
        const query = collectionRef.limit(DELETE_COLLECTION_BATCH);

        return new Promise((resolve, reject) => {
            this.deleteQueryBatch(query, resolve).catch(reject);
        });
    }

    async getPackagesByName(name) {
        const collectionRef = this.firestore.collection(PACKAGECOLL);
        const query = collectionRef
            .limit(DELETE_COLLECTION_BATCH)
            .where("Name", "==", name);

        return await query.get();
    }

    async getHistoryByName(name) {
        const collectionRef = this.firestore.collection(LOGCOLL);
        const query = collectionRef
            .orderBy("Date")
            .where("PackageMetadata.Name", "==", name);

        return await query.get();
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

    async deletePackages() {
        await this.fs.emptyBucket();
    }

    async deleteCollection(collectionPath) {
        await this.fs.deleteCollection(collectionPath);
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

    async deleteUser(name) {
        this.fs.remove(`${USERCOLL}/${name}`);
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
        if (auth !== null) {
            this.fs.increment(`${AUTHCOLL}/${token}`, "numRequests");
            return auth.data();
        }
        return null;
    }

    async removeAuth(token) {
        await this.fs.remove(`${AUTHCOLL}/${token}`);
    }

    async uploadPackagePublic(downloadUrl, metadata) {
        const writeStream = await this.fs.getWriteStream(
            `${config.PACKAGE_KEY}/${metadata.ID}`
        );

        const response = https.get(downloadUrl, function (response) {
            if (!response || response.statusCode !== 200) {
                return false;
            }
            response.pipe(writeStream);
        });

        return true;
    }

    async uploadToTemp(contentBuf) {
        const writeStream = await this.fs.getWriteStream(
            `${config.TMP_FOLDER}`
        );

        writeStream.write(contentBuf);
        writeStream.end();

        return true;
    }

    async uploadPackageLocal(contentBuf, metadata) {
        const writeStream = await this.fs.getWriteStream(
            `${config.PACKAGE_KEY}/${metadata.ID}`
        );

        writeStream.write(contentBuf);
        writeStream.end();

        return true;
    }

    async savePackageMetadata(metadata) {
        await this.fs.save(`${PACKAGECOLL}/${metadata.ID}`, metadata);
    }

    async getAllPackagesMetadata(offset) {
        const packages = await this.fs.getAllFromCollection(
            `${config.PACKAGE_KEY}`,
            offset
        );
        const out = [];
        packages.forEach((p) => {
            out.push(p.data());
        });
        return out;
    }

    async searchPackagesMetadata(queryArr, offset) {
        const fsQueries = this.parseQueries(queryArr);

        const result = await this.fs.runBatchQuery(
            `${config.PACKAGE_KEY}`,
            fsQueries,
            offset
        );

        const out = [];
        result.forEach((p) => {
            p.Version = decodeVersion(p.Version);
            out.push(p);
        });
        return out;
    }

    parseQueries(queryArr) {
        const fsQueries = [];

        for (let i = 0; i < queryArr.length; i++) {
            const q = queryArr[i];
            const conditions = [];
            let fsq = {
                key: "Name",
                oper: "==",
                value: q.Name,
            };
            conditions.push(fsq);

            if (q.Version) {
                try {
                    if (q.Version.includes("-")) {
                        let versions = q.Version.split("-");
                        fsq = {
                            key: "Version",
                            oper: ">=",
                            value: encodeVersion(versions[0]),
                        };
                        conditions.push(fsq);

                        fsq = {
                            key: "Version",
                            oper: "<=",
                            value: encodeVersion(versions[1]),
                        };
                        conditions.push(fsq);
                    } else if (q.Version.includes("^")) {
                        let major = parseInt(
                            q.Version.split("^")[1].split(".")[0]
                        );
                        fsq = {
                            key: "Version",
                            oper: ">=",
                            value: encodeVersion(`${major}.0.0`),
                        };
                        conditions.push(fsq);

                        fsq = {
                            key: "Version",
                            oper: "<",
                            value: encodeVersion(`${major + 1}.0.0`),
                        };
                        conditions.push(fsq);
                    } else if (q.Version.includes("~")) {
                        let major = parseInt(
                            q.Version.split("^")[1].split(".")[0]
                        );
                        let minor = parseInt(
                            q.Version.split("^")[1].split(".")[1]
                        );
                        fsq = {
                            key: "Version",
                            oper: ">=",
                            value: encodeVersion(`${major}.${minor}.0`),
                        };
                        conditions.push(fsq);

                        fsq = {
                            key: "Version",
                            oper: "<",
                            value: encodeVersion(`${major}.${minor + 1}.0`),
                        };
                        conditions.push(fsq);
                    } else {
                        fsq = {
                            key: "Version",
                            oper: "==",
                            value: encodeVersion(q.Version),
                        };
                        conditions.push(fsq);
                    }
                } catch {
                    return null;
                }
            }

            fsQueries.push(conditions);
        }
        return fsQueries;
    }

    async getPackageMetadata(id) {
        const metadata = await this.fs.get(`${PACKAGECOLL}/${id}`);
        return metadata.data();
    }

    async checkPackage(id) {
        return await this.fs.exists(`${config.PACKAGE_KEY}/${id}`);
    }

    async downloadPackage(id) {
        return await this.fs.getReadStream(`${config.PACKAGE_KEY}/${id}`);
    }

    async deletePackage(id) {
        await this.fs.remove(`${config.PACKAGE_KEY}/${id}`);
        return await this.fs.deletePackage(`${config.PACKAGE_KEY}/${id}`);
    }

    async saveHistoryLog(authKey, metadata, action) {
        const logObj = { Action: action, Date: Date.now() };

        const auth = await this.getAuth(authKey);
        logObj["User"] = { name: auth.username, isAdmin: auth.isAdmin };
        logObj["PackageMetadata"] = metadata;

        await this.fs.save(
            `${LOGCOLL}/${generateKey(config.TOKEN_BYTES)}`,
            logObj
        );
    }

    async getHistoryByName(name) {
        const response = await this.fs.getHistoryByName(name);
        const logs = [];

        response.forEach((p) => {
            logs.push(p.data());
        });

        return logs;
    }

    async deletePackageByName(name) {
        const response = await this.fs.getPackagesByName(name);
        const promiseArr = [];

        response.forEach((p) => {
            const data = p.data();
            promiseArr.push(this.deletePackage(data.ID));
        });

        if (promiseArr.length === 0) {
            return false;
        }

        return new Promise((resolve, reject) => {
            Promise.all(promiseArr).then((values) => {
                for (const val of values) {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                }
                resolve(true);
            });
        });
    }
}

module.exports = new Database();
