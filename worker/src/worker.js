require("dotenv").config();

const amqp = require("amqplib");
const { Pool } = require("pg");
const { redisClient, connectRedis } = require("./redis");
const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://localhost:5672";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "devops_app",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres"
});

async function startWorker() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue("job_queue", {
    durable: true
  });
  await connectRedis();
  channel.prefetch(1);

  console.log("Worker connected to RabbitMQ");
  console.log("Waiting for jobs...");

  channel.consume("job_queue", async (message) => {
    if (!message) {
      return;
    }

    try {
      const { jobId } = JSON.parse(message.content.toString());

      console.log(`Processing job ${jobId}`);

      await pool.query(
        `UPDATE jobs
         SET status = 'processing',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [jobId]
      );
      

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 3000));

      await pool.query(
        `UPDATE jobs
         SET status = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [jobId]
      );
      await redisClient.del("jobs:all");
      console.log(`Job ${jobId} completed`);

      channel.ack(message);

    } catch (error) {
      console.error("Job processing failed:", error.message);

      channel.nack(message, false, false);
    }
  });
}

startWorker().catch((error) => {
  console.error("Worker failed to start:", error.message);
  process.exit(1);
});