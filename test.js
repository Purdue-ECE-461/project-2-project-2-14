async function start(){
    const {rate, checkIngestibility, cloneRepo} = require("./APIpackages");
    let ans = await rate("https://github.com/alfateam/a")
    console.log(ans);
    // only to force cloneRepo
    ans[0] = 0.6
    ans[1] = 0.6
    ans[5] = 0.6
    ////
    if (await checkIngestibility(ans)){
        let repo = await cloneRepo("https://github.com/alfateam/a");
        console.log(repo);    
    }
}

start();