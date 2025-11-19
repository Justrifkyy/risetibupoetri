-- Buat Database jika belum ada
CREATE DATABASE IF NOT EXISTS schedule_db;
USE schedule_db;

-- Tabel Users (dengan kolom tambahan lengkap)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'ORGANIZER', 'PARTICIPANT') NOT NULL DEFAULT 'PARTICIPANT',
    phone_number VARCHAR(20) NULL,
    full_name VARCHAR(255) NULL,
    address TEXT NULL,
    bio TEXT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Schedules (dengan lokasi)
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_time DATETIME NOT NULL,
    location VARCHAR(255) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Attendances (dengan status lengkap)
CREATE TABLE IF NOT EXISTS attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('ATTENDING', 'NOT_ATTENDING', 'PENDING', 'COMPLETED', 'MISSED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (schedule_id, user_id)
);

-- (Opsional) Akun Admin Default (Password: password123)
-- Hash ini untuk 'password123'
INSERT INTO users (username, email, password, role, phone_number) 
VALUES ('admin', 'admin@example.com', 'password', 'ADMIN', '6281234567890')
ON DUPLICATE KEY UPDATE id=id;