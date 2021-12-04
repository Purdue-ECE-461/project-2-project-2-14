const config = require("./config");
const path = require("path");
const { generateKey } = require("./helper");
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
            console.log();
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

    async save(path, data) {
        const docRef = this.firestore.doc(path);
        await docRef.set(data);
    }

    async get(path) {
        const docRef = this.firestore.doc(path);
        const doc = await docRef.get();
        return doc.exists ? doc : null;
    }

    async getFromCollection(colPath, offset) {
        const colRef = this.firestore.collection(colPath);
        return await colRef
            .orderBy("Name")
            .limit(config.OFFSET_SIZE)
            .offset(config.OFFSET_SIZE * offset)
            .get();
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

    async deletePackages() {
        await this.fs.emptyBucket();
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
        const packageID =
            metadata.Name + "-" + generateKey(config.PACKAGE_ID_BYTES);
        const writeStream = await this.fs.getWriteStream(
            `${config.PACKAGE_KEY}/${packageID}`
        );

        const response = https.get(downloadUrl, function (response) {
            if (!response || response.statusCode !== 200) {
                return null;
            }
            response.pipe(writeStream);
        });

        metadata.ID = packageID;

        await this.fs.save(`${PACKAGECOLL}/${packageID}`, metadata);
        return metadata;
    }

    async uploadPackageLocal(contentBuf, metadata) {
        const packageID =
            metadata.Name + "-" + generateKey(config.PACKAGE_ID_BYTES);
        const writeStream = await this.fs.getWriteStream(
            `${config.PACKAGE_KEY}/${packageID}`
        );

        writeStream.write(contentBuf);
        writeStream.end();

        metadata.ID = packageID;

        await this.fs.save(`${PACKAGECOLL}/${packageID}`, metadata);
        return metadata;
    }

    async getPackagesMetadata(offset) {
        const packages = await this.fs.getFromCollection(
            `${config.PACKAGE_KEY}`,
            offset
        );
        const out = [];
        packages.forEach((p) => {
            out.push(p.data());
        });
        return out;
    }

    async downloadPackage(id) {
        return await this.fs.getReadStream(`${config.PACKAGE_KEY}/${id}`);
    }

    async deletePackage(id) {
        await this.fs.remove(`${config.PACKAGE_KEY}/${id}`);
        return await this.fs.deletePackage(`${config.PACKAGE_KEY}/${id}`);
    }
}

module.exports = new Database();
