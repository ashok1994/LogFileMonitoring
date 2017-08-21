var app = require('express')();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var tailFile = require('./read.js').tailFile;
var readFromPosition = require('./read.js').readFromPosition;


var fs = require('fs');
var path = require('path');


app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    fs.readdir(path.resolve(__dirname, 'logs'), function (err, files) {
        if (err) {
            return res.send('Error ');
        }
        var filesToShow = [];
        files.forEach(function (file) {
            filesToShow.push(file);
        });


        res.render(__dirname + '/index.ejs', {
            files: filesToShow
        })


    });

});



io.on('connection', function (socket) {
    console.log('user connected');
    socket.on('filename', function (filename) {
        attachEmitLogs(socket, filename);
    });


    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

function attachEmitLogs(socket, filename) {
    var stats, fd;
    var currentState = [];
    var exactPath = path.resolve(__dirname, 'logs', filename);
    try {
        stats = fs.statSync(exactPath);
        fd = fs.openSync(exactPath, 'r');
    } catch (e) {
        return socket.emit('fileerror', 'File does not exist');
    }

    tailFile(fd, stats.size, function (err, lastLinesList) {
        currentState = lastLinesList;
        socket.emit('log', { logs: lastLinesList, date: new Date() });
        attachWatcher(socket, exactPath, fd, stats.size, currentState);
    });
}


function attachWatcher(socket, filename, fd, size, currentState) {

    fs.watchFile(filename, function (currStats, prevState) {
        if (currStats.size !== size) {
            readNextNLines(fd, size, currStats.size, function (err, linesArray) {
                socket.emit('loglines', linesArray);
            });
        }


        size = currStats.size;
    });
}


function readNextNLines(fd, start, currSize, callback) {



    (function (fd, start, currSize, callback) {
        var line = '';
        var linesArray = [];
        function append(err, char) {
            if (err) {
                return callback(err);
            }

            if (start == currSize) {
                line.length > 0 ? linesArray.push(line) : '';
                line = '';
                return callback(null, linesArray);
            }

            if (char == '\n' || char == '\r') {
                // if (char == '\r') {
                //     console.log('Carriage Return and Lines are:' + line.length);
                // }

                // if (char == '\n') {
                //     console.log('New Line and line are:' + line.length);
                // }


                if (linesArray.length == 0 && line.length == 0) {
                    // do  nothing
                } else {
                    if (line.length > 0) linesArray.push(line);
                    line = '';
                }
            } else {
                line = line + char;
            }

            start++;
            readFromPosition(fd, start, append);
        }

        readFromPosition(fd, start, append);
    })(fd, start, currSize, callback);


}



function tailFileWatch(filename) {
    var fd = fs.openSync(filename, 'r');
    var stats = fs.statSync(filename);
    tailFile(fd, stats.size, function (err, lastLines) {
        currentLogState = lastLines;
        io.emit('log', { log: lastLines, date: new Date() });
    });

    var fsWatcher = fs.watchFile(filename, function (curr, prev) {
        tailFile(fd, curr.size, function (err, lastLines) {
            currentLogState = lastLines;
            io.emit('log', { logs: lastLines, date: new Date() });
        });
    });
}


tailFileWatch("file.txt");




http.listen(3000, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("Listening at 3000");
})