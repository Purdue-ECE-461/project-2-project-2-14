
// exec('touch ./rating/url.txt');
// exec(`echo "https://github.com/alfateam/a" >> ./rating/url.txt`)
// console.log("onto");
// var result = exec("rating/venv/bin/python rating/main.py rating/url.txt >> rating/result.txt");

// convert and show the output.
// console.log(result.toString("utf8");
const fs = require('fs');
const exec = require("child_process").execSync;
const getData = async (err, data) => {
    if(err){
        console.log(`err: ${err}`);
        return;   
    }
    else{
        console.log(data);
        return data;
    }
}

///////////

// let moduleURL = "https://github.com/alfateam/a"
// exec('touch ./rating/url.txt');
// exec(`echo ${moduleURL} >> ./rating/url.txt`);
// console.log("onto");
// exec('rating/venv/bin/python rating/main.py rating/url.txt >> rating/result.txt');
// console.log("dvbwv");
// var content = fs.readFileSync('rating/result.txt', 'utf8');
// console.log(content);
// exec('rm rating/url.txt')
// exec('rm rating/result.txt')
// console.log("done");


////////////


const rate = require("./APIpackages");
let ans = rate("https://github.com/alfateam/a")
console.log(ans);
console.log(typeof ans);