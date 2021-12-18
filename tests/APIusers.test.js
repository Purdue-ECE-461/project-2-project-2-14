const { __waitFor } = require("../helper");
const { killServer, serverEvents } = require("../server");
const fetch = require("node-fetch");
const config = require("./../config");

let adminAuthKey = null;

const ADMIN_LOGIN = {
    User: {
        name: config.ADMIN_USERNAME,
        isAdmin: true,
    },
    Secret: {
        password: "string",
    },
};

describe("API users test", () => {
    beforeAll(async () => {
        await new Promise((resolve, reject) => {
            serverEvents.on("STARTED", () => {
                resolve();
            });
        });
    }, 10000);

    afterAll(() => {
        killServer();
    });

    beforeEach(async () => {});

    afterEach(async () => {
        await __waitFor(1000);
    });

    test("getting admin auth key", async () => {
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(ADMIN_LOGIN),
        };

        const response = await fetch(
            "http://localhost:3000/authenticate",
            options
        );
        expect(response.status).toBe(200);
        adminAuthKey = await response.text();
    });

    test("getting admin auth key with wrong credentials", async () => {
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...ADMIN_LOGIN,
                Secret: { password: "Wrong" },
            }),
        };

        const response = await fetch(
            "http://localhost:3000/authenticate",
            options
        );
        expect(response.status).toBe(401);
    });

    test("create new user", async () => {
        const data = {
            username: "devansh",
            isAdmin: false,
            password: "wowowowow",
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };
        const response = await fetch("http://localhost:3000/user", options);
        expect(response.status).toBe(200);
    });

    test("create new user. incorrect inputs", async () => {
        const data = {
            username: "sidd",
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };
        const response = await fetch("http://localhost:3000/user", options);
        expect(response.status).toBe(400);
    });

    test("create new user with the same username", async () => {
        const data = {
            username: "devansh",
            isAdmin: false,
            password: "wowowowow",
        };
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
            body: JSON.stringify(data),
        };
        const response = await fetch("http://localhost:3000/user", options);
        expect(response.status).toBe(400);
    });

    test("delete user", async () => {
        const options = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };
        const response = await fetch(
            "http://localhost:3000/user/devansh",
            options
        );
        expect(response.status).toBe(200);
    });

    test("trying to delete admin", async () => {
        const options = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `bearer ${adminAuthKey}`,
            },
        };
        const response = await fetch(
            `http://localhost:3000/user/${config.ADMIN_USERNAME}`,
            options
        );
        expect(response.status).toBe(400);
    });
});
