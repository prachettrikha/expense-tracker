var http = require('http');
var fs = require('fs');
var path = require('path');

// Load .env.local
var envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
    var match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

var categorizeHandler = require('./api/categorize');

var MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

var PORT = 3000;

var server = http.createServer(function (req, res) {
  // API route
  if (req.url === '/api/categorize' && req.method === 'POST') {
    var body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      req.body = JSON.parse(body);
      var fakeRes = {
        statusCode: 200,
        headers: {},
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) {
          res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        }
      };
      categorizeHandler(req, fakeRes);
    });
    return;
  }

  // Static files from public/
  var urlPath = req.url === '/' ? '/expense-tracker.html' : req.url;
  var filePath = path.join(__dirname, 'public', urlPath);
  var ext = path.extname(filePath);

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('Expense Tracker running at http://localhost:' + PORT);
});
