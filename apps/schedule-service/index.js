require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authenticateToken = require("./middleware/authenticateToken");
const checkAdmin = require("./middleware/checkAdmin");
// const amqp = require("amqplib"); // disiapkan jika nanti butuh integrasi RabbitMQ

const app = express();
const PORT = process.env.PORT || 3002;

// ## MIDDLEWARE ##
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ## ROUTES ##

// Endpoint dasar untuk cek status service
app.get("/", (req, res) => {
  res.json({ message: "Schedule Service is active!" });
});

// ========================= CREATE =========================
app.post("/schedules", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { title, description, schedule_time, location } = req.body;
    const userId = req.user.id;

    if (!title || !schedule_time) {
      return res.status(400).json({ message: "Title and schedule_time are required." });
    }

    const query = `
      INSERT INTO schedules (title, description, schedule_time, location, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [title, description, schedule_time, location, userId]);

    res.status(201).json({
      message: "Schedule created successfully!",
      scheduleId: result.insertId,
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ========================= READ ALL =========================
app.get("/schedules", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, title, description, schedule_time, location
      FROM schedules
      ORDER BY schedule_time DESC
    `;
    const [schedules] = await db.execute(query);
    res.json(schedules);
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ========================= READ ONE =========================
app.get("/schedules/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, title, description, schedule_time, location
      FROM schedules
      WHERE id = ?
    `;
    const [schedules] = await db.execute(query, [id]);

    if (schedules.length === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }
    res.json(schedules[0]);
  } catch (error) {
    console.error("Get single schedule error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ========================= UPDATE =========================
app.put("/schedules/:id", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, schedule_time, location } = req.body;

    if (!title || !schedule_time) {
      return res.status(400).json({ message: "Title and schedule_time are required." });
    }

    const query = `
      UPDATE schedules
      SET title = ?, description = ?, schedule_time = ?, location = ?
      WHERE id = ? AND created_by = ?
    `;
    const [result] = await db.execute(query, [title, description, schedule_time, location, id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Schedule not found or no permission." });
    }

    res.json({ message: "Schedule updated successfully." });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ========================= DELETE =========================
app.delete("/schedules/:id", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = "DELETE FROM schedules WHERE id = ? AND created_by = ?";
    const [result] = await db.execute(query, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Schedule not found or you do not have permission to delete it.",
      });
    }

    res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ## SERVER START ##
app.listen(PORT, () => {
  console.log(`✅ Schedule service is running on http://localhost:${PORT}`);
});
