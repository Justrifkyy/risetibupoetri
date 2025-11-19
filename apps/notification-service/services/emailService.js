const nodemailer = require("nodemailer");

// === 1. Konfigurasi transporter untuk Gmail ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === 2. Fungsi kirim email notifikasi jadwal ===
// Menerima parameter: recipientEmail (alamat tujuan), dan scheduleData (data jadwal)
const sendScheduleNotification = async (recipientEmail, scheduleData) => {
  const mailOptions = {
    from: `"Aplikasi Jadwal" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `UNDANGAN: ${scheduleData.scheduleTitle || scheduleData.title}`,
    html: `
      <h1>Undangan Acara Baru</h1>
      <p>Halo,</p>
      <p>Anda telah diundang untuk bergabung dalam acara:</p>
      <p><strong>Judul:</strong> ${scheduleData.scheduleTitle || scheduleData.title}</p>
      <p><strong>Waktu:</strong> ${new Date(scheduleData.scheduleTime).toLocaleString("id-ID")}</p>
      <p><strong>Lokasi:</strong> ${scheduleData.scheduleLocation || "Belum ditentukan"}</p>
      <p>Harap konfirmasi kehadiran Anda melalui aplikasi.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Schedule notification email sent:", info.response);
  } catch (error) {
    console.error("Error sending schedule email:", error);
  }
};

// === 3. Fungsi kirim email reset password ===
const sendPasswordResetEmail = async (recipientEmail, token) => {
  const resetLink = `http://localhost:3000/reset-password/${token}`;

  const mailOptions = {
    from: `"Aplikasi Jadwal" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Permintaan Reset Password Anda",
    html: `
      <h1>Permintaan Reset Password</h1>
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mereset password akun Anda. Klik link di bawah ini untuk melanjutkan:</p>
      <a href="${resetLink}"
         style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password Saya
      </a>
      <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
      <p>Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

// === 4. Ekspor semua fungsi ===
module.exports = {
  sendScheduleNotification,
  sendPasswordResetEmail,
};
