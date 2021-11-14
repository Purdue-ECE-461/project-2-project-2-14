// TODO: make a func takes in url 
// TODO: delete temp
// TODO: delete make new file



async function rate(moduleURL){
    const fs = require('fs');
    const exec = require("child_process").execSync;
    exec('touch ./rating/url.txt');
    exec(`echo ${moduleURL} >> ./rating/url.txt`);
    exec('rating/venv/bin/python rating/main.py rating/url.txt >> rating/result.txt');
    var content = fs.readFileSync('rating/result.txt', 'utf8');
    exec('rm rating/url.txt')
    exec('rm rating/result.txt')
    content = content.split(" ")
    content[6] = content[6].slice(0, -1)
    
    return content
};

module.exports = rate

/* *******************************************
                HOW TO USE:
const rate = require("./APIpackages");
let ans = rate("https://github.com/alfateam/a")
console.log(ans);
console.log(typeof ans);
******************************************* */


// data = rate("https://github.com/alfateam/a")
// console.log(data);


