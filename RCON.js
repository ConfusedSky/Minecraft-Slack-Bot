var Rcon = require('rcon');

const config = {
  host: process.env.MINECRAFT_HOST || 'localhost',
  port: +process.env.MINECRAFT_RCON_PORT || 25575,
  password: process.env.MINECRAFT_RCON_PASSWORD || 'minecraft',
}

const conn = new Rcon(config.host, config.port, config.password, {challenge: false});
module.exports.conn = conn; 

conn.on('auth', function() {
  console.log("Authed!");

}).on('response', function(str) {
  console.log("Got response: " + str);

}).on('end', function() {
  console.log("Socket closed!");
  process.exit();
});

conn.connect();
