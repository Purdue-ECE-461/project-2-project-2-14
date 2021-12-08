const Req = require("./testreq");
const Res = require("./testres");
const APIusers = require("../APIusers");
const reset = require("../reset");
const { __waitFor } = require("../helper");

const ADMIN_LOGIN = {
    User: {
        name: "admin",
        isAdmin: true,
    },
    Secret: {
        password: "ece461",
    },
};

let adminAuthKey = null;

describe("API users test", () => {
    beforeAll(async () => {
        await reset();
    }, 10000);

    beforeEach(async () => {});

    afterEach(async () => {});

    test("getting admin auth key", async () => {
        const req = new Req(null, null, ADMIN_LOGIN, null);
        const res = new Res();

        await APIusers.authenticate(req, res);
        adminAuthKey = res._response;
        expect(res._status).toBe(200);
    });

    test("getting admin auth key with wrong credentials", async () => {
        const req = new Req(
            null,
            null,
            { ...ADMIN_LOGIN, Secret: { password: "wrong" } },
            null
        );
        const res = new Res();

        await APIusers.authenticate(req, res);
        expect(res._status).toBe(401);
    });

    test("create new user", async () => {
        const req = new Req(
            null,
            null,
            {
                username: "devansh",
                isAdmin: false,
                password: "wowowowow",
            },
            { "x-authorization": `bearer ${adminAuthKey}` }
        );
        const res = new Res();

        await APIusers.createNewUser(req, res);
        expect(res._status).toBe(200);
    });

    test("create new user. incorrect inputs", async () => {
        const req = new Req(
            null,
            null,
            {
                username: "sidd",
            },
            { "x-authorization": `bearer ${adminAuthKey}` }
        );
        const res = new Res();

        await APIusers.createNewUser(req, res);
        expect(res._status).toBe(400);
    });

    test("delete user", async () => {
        const req = new Req(
            null,
            null,
            {
                username: "devansh",
            },
            { "x-authorization": `bearer ${adminAuthKey}` }
        );
        const res = new Res();

        await APIusers.deleteUser(req, res);
        expect(res._status).toBe(200);
    });
});
