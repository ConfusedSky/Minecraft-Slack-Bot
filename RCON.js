var Rcon = require('rcon');

module.exports.conn = conn = new Rcon('localhost', 25575, 'minecraft', {challenge: false});
conn.on('auth', function() {
  console.log("Authed!");

}).on('response', function(str) {
  console.log("Got response: " + str);

}).on('end', function() {
  console.log("Socket closed!");
  process.exit();
});

conn.connect();