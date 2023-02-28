require('dotenv').config();
const path = require('path')
const fs = require('fs');
const redis = require('redis');
var express = require('express')
var https = require('https')
var http = require('http')
var ws = require('ws');
var app = express()

const morganMiddleware = require("./middlewares/morgan.middleware");
const logger = require("./utils/logger");

// SSL Certificate
//==================================================
// The Certbot way!!
//
// apt install certbot python3-certbot-dns-route53
// Make your ~/.aws/credentials
// # certbot certonly --dns-route53 -d yourdomain.tld
const options = {
  key:  fs.readFileSync(process.env.WEB_KEY),
  ca:   fs.readFileSync(process.env.WEB_CA),
  cert: fs.readFileSync(process.env.WEB_CERT),
};

// Prepare WebServer and WebSocket
const server = https.createServer(options, app)
logger.info("WebSocket initialized, with zlib compression, concurrency limit = 10");
const wss = new ws.Server({
	server,
	perMessageDeflate: {
          zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
          },
          zlibInflateOptions: {
            chunkSize: 10 * 1024
          },
          clientNoContextTakeover: true,
          serverNoContextTakeover: true,
          serverMaxWindowBits: 10,
          concurrencyLimit: 10,
          threshold: 1024
        }
})

// Prepare Redis client for "sub"
// Point to map_redis host and add following to tpot.yml for map_redis
//    ports:
//     - "64379:6379"
logger.info("Redis client initialized");
const redisClient = redis.createClient({ url: process.env.MAP_REDIS_URL, password: process.env.MAP_REDIS_PASSWORD } );

redisClient.on('error', err => { logger.error(err) });
redisClient.on('connect', () => { logger.info('Redis connected') });
redisClient.on('reconnecting', () => { logger.warn('Redis reconnecting') });
redisClient.on('ready', () => { logger.info('Redis ready!') });

// Overall error handler
// Will reach Simple 500 handler etc and use status code
function error(status, msg) {
	var err = new Error(msg);
	err.status = status;
	return err;
}

// Heartbeat function for websocket clients
function heartbeat() {
  this.isAlive = true;
}

// Websocket handler for "connections"
wss.on('connection', (ws,req) => {
   const ip = req.socket.remoteAddress;
   logger.info(ip+" WEBSOCKET client connection established");
   ws.isAlive = true;
   ws.on('pong', heartbeat); // On PONG confirm alive :)
   ws.on('error', (error) => { logger.error(error) });

   // Setup Ping / Pong heartbeat every 30sec to make sure we
   // have no dead connections hannging
   const intervalHeartbeat = setInterval(function ping() {
    if (ws.isAlive === false) {
      logger.info(ip+" WEBSOCKET client connection terminated");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
   }, 30000);

   // On propper disconnect, dont forget to stop the heartbeat :)
   ws.on('close', () => {
     logger.info(ip+" WEBSOCKET client disconnected");
     clearInterval(intervalHeartbeat);
   });
});

// Redis Subscriber handler
// When ever this is triggered (ie. something was published!)
// We make sure to send it to all connected websockets!!
(async () => {
  const subscriber = await redisClient.duplicate();
  await subscriber.connect();
  await subscriber.subscribe('attack-map-production', (message) => {
    wss.clients.forEach( (client) => {
       if (client !== ws && client.readyState === ws.OPEN) client.send(message);
    });
  });
})();

// Websocket Timed messages
// Send server date every 1 sec
(async () => {
setInterval(() => {
    const data = JSON.stringify({'type': 'Keepalive', 'keepalive': new Date().valueOf() });
    wss.clients.forEach( (client) => {
       if (client !== ws && client.readyState === ws.OPEN) client.send(data);
    });
}, 1000);
})();


var dateOptions = {
 hourCycle: 'h24',
 hour: '2-digit',
 minute: '2-digit',
 second: '2-digit',
 year: 'numeric', month: 'numeric', day: 'numeric'

};

(async () => {
setInterval(() => {
    const data = JSON.stringify({'type': 'Time', 'time': new Date().toLocaleDateString("en-US", dateOptions)});
    wss.clients.forEach( (client) => {
       if (client !== ws && client.readyState === ws.OPEN) client.send(data);
    });
}, 30000);
})();


// Web server setup, serve web page under static folder
app.use(morganMiddleware);
app.use(express.static(path.join(__dirname, 'static')))

// Simple 500 handler
app.use(function(err, req, res, next){
	res.status(err.status || 500);
	res.send({ error: err.message });
});

// Simple 404
app.use(function(req, res){
	res.status(404);
	res.send({ error: "Not found" })
});

//start our server
logger.warn("Web Attack Map - Web Server (https) & Websocket (wss) starting up")
server.listen(process.env.WEB_PORT, () => {
  logger.warn("Web Attack Map - Now listing for connections on port "+server.address().port)
});
