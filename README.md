# 📅 Sistem Manajemen Jadwal Berbasis Microservice

Aplikasi manajemen jadwal full-stack yang modern dengan arsitektur Microservice untuk skalabilitas dan fleksibilitas tinggi. Sistem ini memungkinkan Admin membuat jadwal, mengundang peserta, serta mengirim notifikasi otomatis melalui Email dan WhatsApp.

# ✨ Fitur Utama

## 🔐 Otentikasi & Otorisasi
- Login & Register menggunakan JWT
- Password hashing (Bcrypt)
- Role-Based Access Control: Admin, Organizer, Participant

## 📅 Manajemen Jadwal
- Membuat, mengedit, dan menghapus jadwal acara lengkap dengan lokasi & waktu

## 📩 Sistem Undangan Cerdas
- Undang pengguna secara global, berdasarkan role, atau per individu
- Notifikasi real-time via Email & WhatsApp
- Menggunakan RabbitMQ Message Queue

## ✅ Konfirmasi Kehadiran
- Peserta dapat memilih status Hadir / Tidak Hadir
- Admin dapat menandai status jadwal: Selesai / Terlewat

## 📊 Laporan & Ekspor
- Ekspor laporan kehadiran ke format CSV

## 🔑 Reset Password
- Fitur Lupa Password dengan token aman & email reset

## 👤 Profil Pengguna
- Pengguna dapat mengisi Bio, Alamat, dan Nomor Telepon

# 🛠️ Teknologi yang Digunakan

## Frontend (Next.js 14)
- TypeScript
- Tailwind CSS
- Axios
- React Context API
- React Modal
- React Select
- React Toastify
- Lucide React

## Backend (Microservices - Node.js)
- Express.js
- MySQL (mysql2)
- RabbitMQ
- Nodemailer (Gmail SMTP)
- Meta Cloud API (WhatsApp)
- API Gateway (Express HTTP Proxy)

## Tools & DevOps
- NPM Workspaces (Monorepo)
- Docker (RabbitMQ & Database)

# ⚙️ Prasyarat
Pastikan sudah menginstal:
- Node.js 18+
- Git
- MySQL Server
- Docker Desktop

# 🚀 Cara Instalasi & Menjalankan

## 1. Clone Repository
git clone https://github.com/USERNAME_ANDA/manajemen-jadwal.git
cd manajemen-jadwal

## 2. Install Dependencies
npm install

## 3. Setup Database
- Buat database bernama schedule_db
- Import file database.sql dari root folder

## 4. Konfigurasi Environment

### apps/auth-service/.env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672

### apps/schedule-service/.env
PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672

### apps/attendance-service/.env
PORT=3003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672

### apps/notification-service/.env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
EMAIL_USER=email_anda@gmail.com
EMAIL_PASS=app_password_google_anda
WHATSAPP_TOKEN=token_meta_anda
WHATSAPP_PHONE_ID=phone_id_meta_anda

### apps/api-gateway/.env
PORT=4000

# 5. Menjalankan RabbitMQ (Docker)
docker run -d --hostname my-rabbit --name some-rabbit \
  -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 6. Menjalankan Semua Service

## Auth Service
cd apps/auth-service && npm run dev

## Schedule Service
cd apps/schedule-service && npm run dev

## Attendance Service
cd apps/attendance-service && npm run dev

## Notification Service
cd apps/notification-service && npm run dev

## API Gateway
cd apps/api-gateway && npm run dev

## Frontend Client
cd apps/client && npm run dev

Akses aplikasi melalui:
http://localhost:3000

# 📂 Struktur Proyek
manajemen-jadwal/
├── apps/
│   ├── api-gateway/          
│   ├── auth-service/         
│   ├── schedule-service/     
│   ├── attendance-service/   
│   ├── notification-service/ 
│   └── client/               
├── database.sql              
└── package.json              

