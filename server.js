var app = require('express')();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var tailFile = require('./read.js').tailFile;
var fs = require('fs');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

var currentLogState = "";

io.on('connection', function (socket) {
    console.log('user connected');
    socket.emit('log', { logs: currentLogState, date: new Date() });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

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