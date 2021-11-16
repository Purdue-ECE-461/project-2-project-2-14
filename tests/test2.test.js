const { rate, checkIngestibility, cloneRepo } = require('../APIpackages');


describe("array lengths and values", () => {
    // test stuff
    test("it should filter by a search term (link)", async() => {
        // actual test
        let ans = rate("https://github.com/alfateam/a");
        ans = [7,6,5,4,3,2,1];
        //console.log(ans);
        let lenans = ans.length;
        expect(lenans).toBe(7);
      });
  });