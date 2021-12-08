const { __waitFor } = require("../helper");
const { spawn } = require("child_process");
const fetch = require("node-fetch");
const fs = require("fs");

let adminAuthKey = null;
let server = null;

describe("API users test", () => {
    beforeAll(async () => {
        await new Promise((resolve, reject) => {
            server = spawn("npm", ["start"]);
            server.stdout.on("data", (data) => {
                const str = data.toString();
                if (str === "Server is running on port 3000\n") {
                    resolve();
                }
            });
        });
        const data = {
            User: {
                name: "admin",
                isAdmin: true,
            },
            Secret: {
                password: "ece461",
            },
        };
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(
            "http://localhost:3000/authenticate",
            options
        );
        adminAuthKey = await response.text();
        await __waitFor(1000);
    }, 10000);

    afterAll(() => {
        server.kill();
    });

    beforeEach(async () => {});

    afterEach(async () => {});

    test("upload package using url", async () => {
        const data = {
            metadata: {
                Name: "express",
                Version: "4.17.1",
                ID: "93u09wcdsfdv",
            },
            data: {
                URL: "https://github.com/expressjs/express",
            },
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch("http://localhost:3000/package", options);
        const responseData = await response.json();
        expect(responseData.ID).toBe(data.metadata.ID);
    }, 10000);

    test("uploading package with the same id", async () => {
        const data = {
            metadata: {
                Name: "express",
                Version: "4.17.1",
                ID: "93u09wcdsfdv",
            },
            data: {
                URL: "https://github.com/expressjs/express",
            },
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch("http://localhost:3000/package", options);
        expect(response.status).toBe(400);
    });

    test("upload package using content", async () => {
        let str = fs.readFileSync("tests/tmp.zip", "base64");
        const data = {
            metadata: {
                Name: "express",
                Version: "4.6.1",
                ID: "93u09wfdv",
            },
            data: {
                Content: str,
            },
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch("http://localhost:3000/package", options);
        const responseData = await response.json();
        expect(responseData.ID).toBe(data.metadata.ID);
    }, 10000);
});
