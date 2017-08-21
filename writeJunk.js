var fs = require('fs');
var path = require('path');

function getRandomCharCode(min, max) {
    return Math.random() * (max - min) + min;
}
var intervalId;

function generateString() {
    var line = "";
    var date = new Date();
    line += (date.getDate() + 1) + "-" + (date.getMonth() + 1) + "-" + (date.getFullYear()) + " [" + (date.getHours() + 1) + ":" + (date.getMinutes() + 1) + ":" + (date.getSeconds() + 1) + "]";
    line += " Log Data : ";
    for (var i = 0; i < 10; i++) {
        charCode = Math.round(getRandomCharCode(97, 122));
        line += String.fromCharCode(charCode);
    }
    if (!process.argv[2]) {
        clearInterval(intervalId);
        return;
    }

    var exactPath = path.resolve(__dirname, process.argv[2]);
    fs.appendFile(process.argv[2], line + "\n", function (err) {
        if (err) {
            clearInterval(intervalId);
            console.log(err);
        }
    });
}

intervalId = setInterval(generateString, 1000);
