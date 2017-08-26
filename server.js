var app = require('express')();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var tailFile = require('./read.js').tailFile;
var readFromPosition = require('./read.js').readFromPosition;


var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var touch = require('touch');

app.set('view engine', 'ejs');

var fdMemo = {};

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
        if (getFd(exactPath)) {
            fd = getFd(exactPath);
            console.log('Hit');
        } else {
            fd = fs.openSync(exactPath, 'r');
            saveFd(exactPath, fd);
        }
        stats = fs.fstatSync(fd);
    } catch (e) {
        touch(exactPath, function (err) {
            stats = fs.statSync(exactPath);
            fd = fs.openSync(exactPath, 'r');
            saveFd(exactPath, fd);
            tailFile(fd, stats.size, function (err, lastLinesList) {
                currentState = lastLinesList;
                socket.emit(filename + 'log', { logs: lastLinesList, date: new Date() });
                attachWatcher(socket, exactPath, fd, stats.size, currentState);
            });
        });

        return;

    }

    tailFile(fd, stats.size, function (err, lastLinesList) {
        currentState = lastLinesList;
        socket.emit(filename + 'log', { logs: lastLinesList, date: new Date() });
        attachWatcher(socket, exactPath, fd, stats.size, currentState);
    });
}


function attachWatcher(socket, filename, fd, size, currentState) {

    function update(eventType, filename) {
        var currStats = fs.fstatSync(fd);
        if (currStats.size > 0 && currStats.size != size) {

            readNextChunk(fd, size, currStats.size, function (err, newLines) {
                socket.emit(filename + 'loglines', newLines.trim().split('\n'));
            });
            size = currStats.size;
        }

    }
    var throttled = _.throttle(update, 200);
    fs.watch(filename, throttled);

}


function readNextChunk(fd, start, currSize, callback) {

    var totalSize = currSize - start;
    var buffer = new Buffer(totalSize);
    fs.read(fd, buffer, 0, totalSize, start, function (err, bytesRead, buffer) {
        callback(null, buffer.toString('utf-8'))
    });
}

// Util Functions
function saveFd(fullPath, fd) {
    fdMemo[fullPath] = fd;
}

function getFd(fullPath) {
    return fdMemo[fullPath];
}







http.listen(3000, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("Listening at 3000");
})