const Req = require("./testreq");
const Res = require("./testres");
const APIPackages = require("../APIpackages");
const reset = require("../reset");

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

    // test("getting admin auth key", async () => {
    //     console.log(1);
    //     const req = new Req(null, null, ADMIN_LOGIN, null);
    //     const res = new Res();

    //     await APIusers.authenticate(req, res);
    //     adminAuthKey = res._response;
    //     expect(res._status).toBe(200);
    // });
});
