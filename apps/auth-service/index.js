require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./config/db");
const authenticateToken = require("./middleware/authenticateToken");
const crypto = require("crypto");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// =======================================================
// == REGISTER (dengan phone_number)
// =======================================================
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, phone } = req.body;

    if (!username || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    if (role === "ADMIN" || !["ORGANIZER", "PARTICIPANT"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (username, email, password, role, phone_number) VALUES (?, ?, ?, ?, ?)";
    await db.execute(query, [username, email, hashedPassword, role, phone]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username or email already exists." });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == LOGIN
// =======================================================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = users[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful!", token: token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == PROFILE (GET)
// =======================================================
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const query = "SELECT id, username, email, role, full_name, address, bio, phone_number FROM users WHERE id = ?";
    const [users] = await db.execute(query, [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(users[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == PROFILE (UPDATE)
// =======================================================
app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { full_name, address, bio } = req.body;
    const userId = req.user.id;
    const query = "UPDATE users SET full_name = ?, address = ?, bio = ? WHERE id = ?";
    await db.execute(query, [full_name, address, bio, userId]);
    res.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == GET USERS (ADMIN ONLY, include phone_number)
// =======================================================
app.get("/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied." });
  }
  try {
    const query = "SELECT id, username, email, role, phone_number FROM users WHERE role != 'ADMIN'";
    const [users] = await db.execute(query);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == FORGOT PASSWORD (RabbitMQ)
// =======================================================
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.json({
        message: "If this email is registered, a reset link will be sent.",
      });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 3600000); // 1 jam

    await db.execute("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?", [hashedToken, expires, user.id]);

    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "password_reset_queue";
    await channel.assertQueue(queue, { durable: true });

    const message = {
      email: user.email,
      token: token,
    };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(`[x] Sent password reset request for ${user.email}`);

    setTimeout(() => {
      connection.close();
    }, 500);

    res.json({
      message: "If this email is registered, a reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == RESET PASSWORD
// =======================================================
app.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    const [users] = await db.execute("SELECT * FROM users WHERE reset_token_expires > NOW()");
    if (users.length === 0) {
      return res.status(400).json({ message: "Token invalid or expired." });
    }

    let user = null;
    let validToken = false;
    for (const u of users) {
      if (u.reset_token) {
        const isMatch = await bcrypt.compare(token, u.reset_token);
        if (isMatch) {
          user = u;
          validToken = true;
          break;
        }
      }
    }

    if (!validToken || !user) {
      return res.status(400).json({ message: "Token invalid or expired." });
    }

    const newHashedPassword = await bcrypt.hash(password, 10);
    await db.execute("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?", [newHashedPassword, user.id]);

    res.json({ message: "Password has been reset successfully. Please login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// =======================================================
// == START SERVER
// =======================================================
app.listen(PORT, () => {
  console.log(`Auth service is running on http://localhost:${PORT}`);
});
