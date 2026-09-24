require("dotenv").config();

const pool = require("./db");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});