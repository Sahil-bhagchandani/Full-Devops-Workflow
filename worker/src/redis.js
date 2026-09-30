const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (error) => {
  console.error("Redis Error:", error.message);
});

async function connectRedis() {
  await redisClient.connect();

  console.log("Worker connected to Redis");
}

module.exports = {
  redisClient,
  connectRedis
};