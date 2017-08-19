var fs = require('fs');


function getRandomCharCode(min, max) {
    return Math.random() * (max - min) + min;
}


function generateString() {
    var line = "";
    var date = new Date();
    line += (date.getDate() + 1) + "-" + (date.getMonth() + 1) + "-" + (date.getFullYear()) + " [" + (date.getHours() + 1) + ":" + (date.getMinutes() + 1) + ":" + (date.getSeconds() + 1) + "]";
    line += " Log Data : ";
    for (var i = 0; i < 10; i++) {
        charCode = Math.round(getRandomCharCode(97, 122));
        line += String.fromCharCode(charCode);
    }

    fs.appendFile("file.txt", line + "\n", function (err) {
        if (err) {
            console.log(err);
        }
    });
}

setInterval(generateString, 1000);
