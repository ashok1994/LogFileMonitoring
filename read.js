var fs = require('fs');
var async = require('async');

//  Rewrite
function readFromPosition(fd, position, callback) {
    fs.read(fd, new Buffer(1), 0, 1, position, function (err, bytesRead, buffer) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        callback(null, buffer.toString('utf-8'));
    });
}

function tailFile(fd, fileSize, callback) {
    var lastPosition = fileSize;
    var lines = '';
    var linesArray = [];
    var lineCount = 0;
    var startPos = lastPosition - 1;

    readFromPosition(fd, startPos, append);

    function append(err, char) {
        if (err) {
            throw err;
        }
        if (char == '\n') {
            linesArray.unshift(lines);
            lines = '';
            lineCount++;
        } else {
            lines = char + lines;
        }

        if (startPos < 0 || lineCount == 10) {
            if (lines.length > 0) {
                linesArray.unshift(lines);
                lines = '';
            }
            return callback(null, linesArray);
        }


        startPos--;
        readFromPosition(fd, startPos, append);
    }

}





exports.tailFile = tailFile;
exports.readFromPosition = readFromPosition;