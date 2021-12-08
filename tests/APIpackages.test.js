const { __waitFor } = require("../helper");
const { killServer, serverEvents } = require("../server");
const fetch = require("node-fetch");
const fs = require("fs");

let adminAuthKey = null;
let randomPackageID = null;

describe("API packages test", () => {
    beforeAll(async () => {
        await new Promise((resolve, reject) => {
            serverEvents.on("STARTED", () => {
                resolve();
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
        killServer();
    });

    beforeEach(async () => {});

    afterEach(async () => {
        await __waitFor(1000);
    });

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
                Name: "local-package5",
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
        randomPackageID = responseData.ID;
    }, 10000);

    test("download package", async () => {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };

        const response = await fetch(
            `http://localhost:3000/package/${randomPackageID}`,
            options
        );
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("application/zip");
    }, 10000);

    // update
    test("update package", async () => {
        const data = {
            metadata: {
                Name: "local-package5",
                Version: "4.6.1",
                ID: "93u09wfdv",
            },
            data: {
                URL: "https://github.com/expressjs/express",
            },
        };
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(
            "http://localhost:3000/package/93u09wfdv",
            options
        );
        const responseData = await response.json();
        expect(responseData.ID).toBe(data.metadata.ID);
    }, 10000);

    // rate
    test("rate package", async () => {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };

        const response = await fetch(
            "http://localhost:3000/package/93u09wfdv/rate",
            options
        );
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.BusFactor).toBeGreaterThanOrEqual(0.5);
        expect(responseData.Correctness).toBeGreaterThanOrEqual(0.5);
        expect(responseData.RampUp).toBeGreaterThanOrEqual(0.5);
        expect(responseData.ResponsiveMaintainer).toBeGreaterThanOrEqual(0.5);
        expect(responseData.LicenseScore).toBeGreaterThanOrEqual(0.5);
        expect(responseData.GoodPinningPractice).toBeGreaterThanOrEqual(0.5);
    });

    // history
    test("get history by name", async () => {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };

        const response = await fetch(
            "http://localhost:3000/package/byName/local-package5",
            options
        );
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.length).toBe(4);
    });

    // // install multiple packages with the same name
    test("uploading three files together", async () => {
        let str = fs.readFileSync("tests/tmp.zip", "base64");
        const responseArr = [];
        const versionArr = ["4.9.1", "4.10.1", "5.1.0"];
        for (let i = 0; i < 3; i++) {
            const data = {
                metadata: {
                    Name: "local-package5",
                    Version: versionArr[i],
                    ID: i + 1,
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

            const response = fetch("http://localhost:3000/package", options);

            responseArr.push(response);
        }
        for (let i = 0; i < responseArr.length; i++) {
            const response = await responseArr[i];
            const responseData = await response.json();
            expect(responseData.ID).toBe(i + 1);
        }
    }, 20000);

    // and then query packages
    test("get package query", async () => {
        const data = [
            {
                Version: "4.6.0-4.9.2",
                Name: "local-package5",
            },
            {
                Version: "^5.1.1",
                Name: "local-package5",
            },
        ];
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(
            "http://localhost:3000/packages?offset=0",
            options
        );
        const responseData = await response.json();
        expect(responseData.length).toBe(3);
    });

    test("get package query with too big offset", async () => {
        const data = [
            {
                Version: "4.6.0-4.9.2",
                Name: "local-package5",
            },
            {
                Version: "^5.1.1",
                Name: "local-package5",
            },
        ];
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };

        const response = await fetch(
            "http://localhost:3000/packages?offset=1",
            options
        );
        const responseData = await response.json();
        expect(responseData.length).toBe(0);
    });

    test("download package without auth key", async () => {
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const response = await fetch(
            `http://localhost:3000/package/${randomPackageID}`,
            options
        );
        expect(response.status).toBe(401);
    });

    delete test("delete by id", async () => {
        const options = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };

        const response = await fetch(
            "http://localhost:3000/package/93u09wcdsfdv",
            options
        );
        expect(response.status).toBe(200);
    });

    // delete by name
    test("delete by name", async () => {
        const options = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };

        const response = await fetch(
            "http://localhost:3000/package/byName/local-package5",
            options
        );
        expect(response.status).toBe(200);
    });
});
