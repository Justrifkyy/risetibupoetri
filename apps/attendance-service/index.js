// apps/attendance-service/index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const db = require("./config/db");
const authenticateToken = require("./middleware/authenticateToken");
const checkAdmin = require("./middleware/checkAdmin");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

/* ============================================================
   ✅ 1. Endpoint: Update Status Kehadiran
   ============================================================ */
app.post("/attendances", authenticateToken, async (req, res) => {
  try {
    const { schedule_id, status } = req.body;
    const user_id = req.user.id;
    const validStatuses = ["ATTENDING", "NOT_ATTENDING", "COMPLETED", "MISSED"];

    if (!schedule_id || !status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "schedule_id and a valid status are required." });
    }

    const [schedules] = await db.execute("SELECT schedule_time FROM schedules WHERE id = ?", [schedule_id]);
    if (schedules.length === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const scheduleTime = new Date(schedules[0].schedule_time);
    const now = new Date();

    // Validasi waktu untuk status tertentu
    if (["ATTENDING", "NOT_ATTENDING"].includes(status) && scheduleTime < now) {
      return res.status(400).json({ message: "Cannot change attendance for a past event." });
    }
    if (["COMPLETED", "MISSED"].includes(status) && scheduleTime > now) {
      return res.status(400).json({ message: "Cannot mark a future event as completed or missed." });
    }

    // Update atau insert status
    const query = `
      INSERT INTO attendances (schedule_id, user_id, status)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE status = ?
    `;
    await db.execute(query, [schedule_id, user_id, status, status]);
    res.status(200).json({ message: `Attendance status updated to ${status}` });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

/* ============================================================
   ✅ 2. Endpoint: Laporan Kehadiran (Admin)
   ============================================================ */
app.get("/attendances/report/:scheduleId", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const query = `
        SELECT 
          s.title AS schedule_title, 
          u.username, 
          u.email, 
          a.status, 
          a.updated_at
        FROM attendances a
        JOIN users u ON a.user_id = u.id
        JOIN schedules s ON a.schedule_id = s.id
        WHERE a.schedule_id = ?
      `;
    const [reportData] = await db.execute(query, [scheduleId]);
    if (reportData.length === 0) {
      return res.status(404).json({ message: "No attendance data found for this schedule." });
    }
    res.json(reportData);
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

/* ============================================================
   ✅ 3. Endpoint: Jadwal Saya (User)
   ============================================================ */
app.get("/attendances/my-schedules", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT s.id, s.title, s.description, s.schedule_time, a.status
      FROM schedules s
      LEFT JOIN attendances a ON s.id = a.schedule_id AND a.user_id = ?
      ORDER BY s.schedule_time DESC
    `;
    const [schedules] = await db.execute(query, [userId]);
    res.json(schedules);
  } catch (error) {
    console.error("Get my schedules error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

/* ============================================================
   ✅ 4. Endpoint: Undang Massal (Batch Invite) — Versi Terbaru
   ============================================================ */
app.post("/attendances/invite-batch", authenticateToken, checkAdmin, async (req, res) => {
  const { schedule_id, user_ids } = req.body;

  if (!schedule_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      message: "schedule_id and a non-empty array of user_ids are required.",
    });
  }

  try {
    // Koneksi ke RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "schedule_notifications";
    await channel.assertQueue(queue, { durable: true });

    // Ambil detail jadwal termasuk lokasi
    const [schedules] = await db.execute("SELECT title, schedule_time, location FROM schedules WHERE id = ?", [schedule_id]);
    if (schedules.length === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }
    const scheduleDetails = schedules[0];

    // Simpan kehadiran default = PENDING
    const insertPlaceholders = user_ids.map(() => "(?, ?, 'PENDING')").join(", ");
    const insertData = user_ids.flatMap((userId) => [schedule_id, userId]);
    const query = `
        INSERT INTO attendances (schedule_id, user_id, status)
        VALUES ${insertPlaceholders}
        ON DUPLICATE KEY UPDATE status = 'PENDING'
      `;
    await db.execute(query, insertData);

    // Ambil info user (email & no.telp)
    const [users] = await db.execute(`SELECT id, email, phone_number FROM users WHERE id IN (${user_ids.join(",")})`);

    // Kirim notifikasi ke RabbitMQ
    for (const user of users) {
      const message = {
        recipientEmail: user.email,
        recipientPhone: user.phone_number,
        scheduleTitle: scheduleDetails.title,
        scheduleTime: scheduleDetails.schedule_time,
        scheduleLocation: scheduleDetails.location,
      };
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    }

    console.log(`[x] Sent ${users.length} notification invites for schedule ${scheduleDetails.title}`);
    setTimeout(() => {
      connection.close();
    }, 500);

    res.status(200).json({ message: `${users.length} users invited successfully.` });
  } catch (error) {
    console.error("Invite batch error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Attendance service is running on http://localhost:${PORT}`);
});
