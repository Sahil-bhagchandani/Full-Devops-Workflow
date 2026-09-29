require("dotenv").config();

const pool = require("./db");
const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let rabbitChannel;

async function connectRabbitMQ(){
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"  
  );

rabbitChannel = await connection.createChannel();

await rabbitChannel.assertQueue("job_queue",{
  durable: true
});
console.log("Connected to RabbitMQ");
}


app.get("/health", async (req, res) => {
  try{
    await pool.query("SELECT 1");
    res.json({
        status: "ok",
        database: "connected"
    });
  } catch(error)
  {
    console.error("Database Connection Failed:", error.message);

    res.status(500).json({
        status: "error",
        database: "disconnected"
    });
  }

});

app.post("/jobs", async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!type) {
      return res.status(400).json({
        error: "Job type is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs (type, payload)
       VALUES ($1, $2)
       RETURNING *`,
      [type, payload || {}]
    );

    const job = result.rows[0];

    rabbitChannel.sendToQueue(
      "job_queue",
      Buffer.from(JSON.stringify({
        jobId: job.id
      })),
      {
        persistent: true
      }
    );

    res.status(201).json(job);

  } catch (error) {
    console.error("Failed to create job:", error.message);

    res.status(500).json({
      error: "Failed to create job"
    });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM jobs ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch jobs:", error.message);

    res.status(500).json({
      error: "Failed to fetch jobs"
    });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM jobs WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch job:", error.message);

    res.status(500).json({
      error: "Failed to fetch job"
    });
  }
});


async function startServer() {
  try {
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();