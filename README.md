📅 Sistem Manajemen Jadwal Berbasis Microservice

Aplikasi manajemen jadwal full-stack yang modern, dirancang dengan arsitektur Microservice untuk skalabilitas dan fleksibilitas tinggi. Aplikasi ini memungkinkan Admin untuk membuat jadwal, mengundang peserta, dan mengirim notifikasi otomatis melalui Email dan WhatsApp.

✨ Fitur Utama

🔐 Otentikasi & Otorisasi Aman: Sistem login/register dengan JWT, hashing password (Bcrypt), dan manajemen peran (Role-Based Access Control) untuk Admin, Organizer, dan Participant.

📅 Manajemen Jadwal: Admin dapat membuat, mengedit, dan menghapus jadwal acara lengkap dengan lokasi dan waktu.

📩 Sistem Undangan Cerdas:

Undang pengguna secara global, berdasarkan peran, atau spesifik per individu.

Notifikasi Real-time: Undangan dikirim otomatis via Email (Gmail SMTP) dan WhatsApp (Meta Cloud API) menggunakan Message Queue (RabbitMQ).

✅ Pelacakan Kehadiran: Peserta dapat konfirmasi kehadiran (Hadir/Tidak Hadir). Admin dapat menandai status acara (Selesai/Terlewat).

📊 Laporan & Ekspor: Admin dapat mengekspor laporan kehadiran setiap jadwal ke dalam format CSV.

🔑 Reset Password: Alur "Lupa Password" lengkap dengan token aman dan link reset via email.

👤 Profil Pengguna: Pengguna dapat melengkapi data diri (Bio, Alamat, No. Telepon).

🛠️ Teknologi yang Digunakan (Tech Stack)

Aplikasi ini dibangun dengan pendekatan Monorepo.

Frontend (Client)

Framework: Next.js 14 (App Router)

Bahasa: TypeScript

Styling: Tailwind CSS

State Management: React Context API

HTTP Client: Axios

UI Components: React Modal, React Select, React Toastify, Lucide React

Backend (Microservices)

Runtime: Node.js & Express.js

Database: MySQL (menggunakan mysql2)

Message Broker: RabbitMQ (untuk komunikasi asinkron antar service)

API Gateway: Express HTTP Proxy

Email Service: Nodemailer (Gmail SMTP)

WhatsApp Service: Axios (Meta Cloud API)

Tools & DevOps

Package Manager: NPM Workspaces (Monorepo)

Containerization: Docker (untuk RabbitMQ & Database)

⚙️ Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

Node.js (v18 atau lebih baru)

Git

[tautan mencurigakan telah dihapus]

Docker Desktop (untuk menjalankan RabbitMQ dengan mudah)

🚀 Cara Instalasi & Menjalankan (Development)

Ikuti langkah-langkah ini untuk menjalankan proyek di komputer lokal Anda.

1. Clone Repository

git clone [https://github.com/USERNAME_ANDA/manajemen-jadwal.git](https://github.com/USERNAME_ANDA/manajemen-jadwal.git)
cd manajemen-jadwal


2. Install Dependencies

Karena menggunakan monorepo, cukup jalankan satu perintah di root folder:

npm install


3. Setup Database

Buat database kosong bernama schedule_db di MySQL Anda.

Import file database.sql yang ada di root folder ke dalam database tersebut untuk membuat tabel dan data awal.

4. Setup Environment Variables (.env)

Anda perlu membuat file .env di setiap folder service (apps/*).

apps/auth-service/.env:

PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672


apps/schedule-service/.env:

PORT=3002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672


apps/attendance-service/.env:

PORT=3003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=schedule_db
JWT_SECRET=rahasia_super_aman_anda
RABBITMQ_URL=amqp://guest:guest@localhost:5672


apps/notification-service/.env:

RABBITMQ_URL=amqp://guest:guest@localhost:5672
# Email Config
EMAIL_USER=email_anda@gmail.com
EMAIL_PASS=app_password_google_anda
# WhatsApp Config
WHATSAPP_TOKEN=token_meta_anda
WHATSAPP_PHONE_ID=phone_id_meta_anda


apps/api-gateway/.env:

PORT=4000


5. Jalankan RabbitMQ (via Docker)

Buka terminal baru dan jalankan:

docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management


6. Jalankan Semua Service

Anda perlu membuka 5 terminal terpisah dan menjalankan perintah berikut di masing-masing terminal:

Auth Service:

cd apps/auth-service && npm run dev


Schedule Service:

cd apps/schedule-service && npm run dev


Attendance Service:

cd apps/attendance-service && npm run dev


Notification Service:

cd apps/notification-service && npm run dev


API Gateway:

cd apps/api-gateway && npm run dev


Frontend Client:

cd apps/client && npm run dev


Buka browser dan akses aplikasi di: http://localhost:3000

📂 Struktur Proyek

manajemen-jadwal/
├── apps/
│   ├── api-gateway/          # Pintu masuk utama API (Port 4000)
│   ├── auth-service/         # Login, Register, User, Reset Password (Port 3001)
│   ├── schedule-service/     # CRUD Jadwal (Port 3002)
│   ├── attendance-service/   # Undangan & Laporan Kehadiran (Port 3003)
│   ├── notification-service/ # Worker Email & WhatsApp (Consumer RabbitMQ)
│   └── client/               # Frontend Next.js (Port 3000)
├── database.sql              # Skema Database
└── package.json              # Konfigurasi Monorepo
