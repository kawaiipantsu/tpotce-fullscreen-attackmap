const morgan = require("morgan");
const logger = require("../utils/logger");

const stream = {
  write: (message) => logger.http(message.substring(0,message.lastIndexOf('\n'))),
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);

module.exports = morganMiddleware;
