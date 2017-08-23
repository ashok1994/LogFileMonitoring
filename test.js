var fs = require('fs');


var rs = fs.createReadStream('logs/log.txt', {
    start: 4
})


rs.on('data', function (data) {
    console.log(data.toString());
})

rs.on('end', function () {
    console.log('End');
});