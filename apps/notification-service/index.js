require("dotenv").config();
const amqp = require("amqplib");
const { sendScheduleNotification, sendPasswordResetEmail } = require("./services/emailService");
const { sendWhatsAppNotification } = require("./services/whatsappService");

const RABBITMQ_URL = process.env.RABBITMQ_URL;

// Listener untuk notifikasi jadwal (YANG SUDAH DIPERBAIKI)
async function startScheduleListener() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "schedule_notifications";
    await channel.assertQueue(queue, { durable: true });
    console.log(`[*] Waiting for schedule messages in ${queue}.`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        // == INI ADALAH LOGIKA YANG HILANG ==
        const messageContent = msg.content.toString();
        console.log(`[x] Received targeted schedule message: ${messageContent}`);

        const notificationData = JSON.parse(messageContent);

        const targetEmail = notificationData.recipientEmail;
        const targetPhone = notificationData.recipientPhone;
        const scheduleDetails = {
          title: notificationData.scheduleTitle,
          scheduleTime: notificationData.scheduleTime,
        };

        await sendScheduleNotification(targetEmail, scheduleDetails);
        await sendWhatsAppNotification(targetPhone, scheduleDetails);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error in schedule listener:", error);
    setTimeout(startScheduleListener, 5000);
  }
}

// ## LISTENER BARU UNTUK RESET PASSWORD ##
async function startPasswordResetListener() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "password_reset_queue"; // Nama antrian baru
    await channel.assertQueue(queue, { durable: true });
    console.log(`[*] Waiting for password reset messages in ${queue}.`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString();
        console.log(`[x] Received password reset request: ${messageContent}`);

        const data = JSON.parse(messageContent);

        // Panggil service email untuk kirim link reset
        await sendPasswordResetEmail(data.email, data.token);

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error in password reset listener:", error);
    setTimeout(startPasswordResetListener, 5000);
  }
}

// Jalankan kedua listener
startScheduleListener();
startPasswordResetListener();
