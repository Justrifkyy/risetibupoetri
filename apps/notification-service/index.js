require("dotenv").config();
const amqp = require("amqplib");
const db = require("./config/db"); // Pastikan Anda sudah copy file config/db.js ke folder service ini
const { sendScheduleNotification, sendPasswordResetEmail } = require("./services/emailService");
const { sendWhatsAppNotification } = require("./services/whatsappService");

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const CHUNK_SIZE = 10; // Jumlah pesan yang diambil sekaligus dari antrian

// Fungsi helper untuk menunda eksekusi (Delay) agar tidak spamming
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Listener untuk Notifikasi Jadwal (Dengan Logging & Optimasi)
async function startBatchListener() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "schedule_notifications";

    await channel.assertQueue(queue, { durable: true });

    // Optimasi: Ambil 10 pesan sekaligus untuk dikerjakan (prefetch)
    channel.prefetch(CHUNK_SIZE);

    console.log(`[*] MENUNGGU PESAN DI ${queue} (Batch Size: ${CHUNK_SIZE}).`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        // == 1. MULAI PENGUKURAN ==
        const startTime = new Date();
        const startHrTime = process.hrtime(); // High-resolution time untuk durasi presisi

        const messageContent = msg.content.toString();
        let notificationData = {};

        try {
          notificationData = JSON.parse(messageContent);

          const targetEmail = notificationData.recipientEmail;
          const targetPhone = notificationData.recipientPhone;

          // Setup data untuk dikirim ke fungsi notifikasi
          const scheduleDetails = {
            title: notificationData.scheduleTitle,
            scheduleTime: notificationData.scheduleTime,
            scheduleLocation: notificationData.scheduleLocation,
          };

          console.log(`[x] Memproses untuk: ${targetEmail || targetPhone}`);

          // == 2. KIRIM PARALEL (Email & WA) ==
          const promises = [];

          if (targetEmail) {
            promises.push(sendScheduleNotification(targetEmail, scheduleDetails));
          }

          if (targetPhone) {
            promises.push(sendWhatsAppNotification(targetPhone, scheduleDetails));
          } else {
            // Log internal jika tidak ada nomor WA (bukan error)
            // console.log("[-] Skip WhatsApp (No Phone)");
          }

          // Tunggu semua pengiriman selesai
          await Promise.all(promises);

          // == 3. SELESAI PENGUKURAN & LOGGING ==
          const endHrTime = process.hrtime(startHrTime);
          // Hitung durasi dalam milidetik (ms)
          const durationMs = (endHrTime[0] * 1000 + endHrTime[1] / 1e6).toFixed(2);
          const endTime = new Date();

          // Tentukan channel type untuk log
          let channelType = "BOTH";
          if (!targetPhone) channelType = "EMAIL";
          if (!targetEmail) channelType = "WHATSAPP";

          const scheduleId = notificationData.scheduleId || 0;

          // Query simpan log SUKSES
          const logQuery = `
            INSERT INTO notification_logs 
            (schedule_id, schedule_title, recipient_count, channel_type, status, start_time, end_time, duration_ms)
            VALUES (?, ?, 1, ?, 'SUCCESS', ?, ?, ?)
          `;

          // Eksekusi simpan log (async, tidak perlu await agar tidak memblokir proses utama)
          db.execute(logQuery, [scheduleId, scheduleDetails.title, channelType, startTime, endTime, durationMs]).catch((err) => console.error("Gagal menyimpan log DB:", err));

          console.log(`[Stats] Sukses. Durasi: ${durationMs}ms`);

          // == 4. SELESAIKAN TUGAS ==
          channel.ack(msg); // Beritahu RabbitMQ pesan sudah beres
          await sleep(500); // Jeda keamanan 0.5 detik sebelum pesan berikutnya
        } catch (err) {
          console.error("Gagal memproses pesan:", err);

          // Query simpan log ERROR
          if (notificationData && notificationData.scheduleTitle) {
            const logQuery = `
                INSERT INTO notification_logs 
                (schedule_id, schedule_title, recipient_count, channel_type, status, start_time, error_details)
                VALUES (?, ?, 1, 'BOTH', 'FAILED', NOW(), ?)
            `;
            // Gunakan ID 0 jika scheduleId tidak ada
            const schId = notificationData.scheduleId || 0;
            db.execute(logQuery, [schId, notificationData.scheduleTitle, err.message]).catch((e) => console.error("Gagal simpan log error:", e));
          }

          // Tetap ACK pesan yang gagal agar tidak macet di antrian selamanya
          // (Opsional: Bisa gunakan Dead Letter Exchange untuk retry nanti)
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Error schedule listener:", error);
    // Coba reconnect jika koneksi putus
    setTimeout(startBatchListener, 5000);
  }
}

// Listener untuk Reset Password (Prioritas Tinggi, Tanpa Delay/Logging Berat)
async function startPasswordResetListener() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "password_reset_queue";

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    console.log(`[*] MENUNGGU PESAN RESET PASSWORD MASUK ${queue}.`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const messageContent = msg.content.toString();
          console.log(`[x] Reset Password Request`);
          const data = JSON.parse(messageContent);

          await sendPasswordResetEmail(data.email, data.token);

          channel.ack(msg);
        } catch (err) {
          console.error("Error processing reset password:", err);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Error in password reset listener:", error);
    setTimeout(startPasswordResetListener, 5000);
  }
}

// Jalankan Kedua Listener
startBatchListener();
startPasswordResetListener();
