# Sistem Verifikasi Dokumen Akademik

Aplikasi web production-ready untuk sistem verifikasi dokumen akademik dan sertifikasi dengan QR Code.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: MariaDB (via Prisma ORM)
- **Auth**: NextAuth.js (JWT strategy)
- **QR Code**: qrcode package
- **Excel**: SheetJS/xlsx
- **Deployment**: PM2 + Nginx

## Features

- **Dynamic Document System** - Admin dapat membuat jenis dokumen dan field secara dinamis
- **QR Verification** - Setiap dokumen memiliki QR code untuk verifikasi cepat
- **Bulk Upload** - Upload massal via Excel/CSV dengan column mapping
- **Admin Dashboard** - Panel admin modern dengan statistik
- **Activity Logging** - Riwayat semua aktivitas admin
- **Dark Mode** - Tema gelap/terang
- **Export Excel** - Export data dokumen ke Excel
- **Rate Limiting** - Proteksi endpoint verifikasi
- **Responsive** - Mobile-friendly design

## Prerequisites

- Node.js 20+ (LTS recommended)
- MariaDB 10.6+
- PM2 (untuk production)
- Nginx (reverse proxy)

## Quick Start (Development)

```bash
# 1. Clone repository
git clone <repository-url>
cd verifikasi-dokumen

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi database Anda

# 4. Setup database
npx prisma db push
npm run db:seed

# 5. Run development server
npm run dev
```

Buka http://localhost:3000

**Default Admin:**
- Username: `admin`
- Password: `admin123`

## Production Deployment (Debian + Nginx + PM2 + MariaDB)

### 1. Persiapan Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx
```

### 2. Setup Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE verifikasi_dokumen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'verifikasi_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON verifikasi_dokumen.* TO 'verifikasi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Deploy Aplikasi

```bash
# Create app directory
sudo mkdir -p /var/www/verifikasi-dokumen
sudo chown $USER:$USER /var/www/verifikasi-dokumen

# Clone/copy source code
cd /var/www/verifikasi-dokumen
git clone <repository-url> .

# Install dependencies
npm ci --production=false

# Setup environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DATABASE_URL="mysql://verifikasi_user:your_strong_password@localhost:3306/verifikasi_dokumen"
NEXTAUTH_URL="https://verify.yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
JWT_SECRET="generate-with-openssl-rand-base64-32"
NEXT_PUBLIC_APP_URL="https://verify.yourdomain.com"
NEXT_PUBLIC_APP_NAME="Verifikasi Dokumen"
NEXT_PUBLIC_INSTITUTION_NAME="Universitas Anda"
```

Generate secret:
```bash
openssl rand -base64 32
```

### 4. Database Migration & Seed

```bash
npx prisma migrate deploy
# atau jika pertama kali:
npx prisma db push

# Seed data awal
npm run db:seed
```

### 5. Build & Start

```bash
# Build production
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 6. Setup Nginx

```bash
# Copy nginx config
sudo cp nginx.conf.example /etc/nginx/sites-available/verifikasi-dokumen.conf

# Edit domain dan paths
sudo nano /etc/nginx/sites-available/verifikasi-dokumen.conf

# Enable site
sudo ln -s /etc/nginx/sites-available/verifikasi-dokumen.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d verify.yourdomain.com
```

### 8. PM2 Log Management

```bash
# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

## Update Deployment

```bash
cd /var/www/verifikasi-dokumen
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload verifikasi-dokumen
```

## API Endpoints

### Public
- `GET /api/verify/[token]` - Verifikasi dokumen

### Admin (Protected)
- `GET/POST /api/document-types` - CRUD jenis dokumen
- `GET/PUT/DELETE /api/document-types/[id]` - Detail jenis dokumen
- `GET/POST /api/documents` - CRUD dokumen
- `GET/PUT/DELETE /api/documents/[id]` - Detail dokumen
- `POST /api/documents/upload` - Bulk upload
- `GET /api/documents/export` - Export Excel
- `GET /api/stats` - Dashboard statistics
- `GET /api/activity-logs` - Activity logs

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeder
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── admin/           # Admin pages
│   │   ├── verify/[token]/  # Verification page
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── admin/           # Admin components
│   └── lib/
│       ├── prisma.ts        # Database client
│       ├── auth.ts          # Auth configuration
│       ├── qr.ts            # QR code generation
│       ├── rate-limit.ts    # Rate limiting
│       ├── activity-logger.ts # Activity logging
│       └── utils.ts         # Utility functions
├── ecosystem.config.js      # PM2 configuration
├── nginx.conf.example       # Nginx config
└── .env.example             # Environment template
```

## Security

- Password hashing dengan bcrypt (12 rounds)
- JWT session management (8-hour expiry)
- Rate limiting pada endpoint verifikasi
- SQL injection prevention (Prisma ORM)
- Server-side validation
- CSRF protection (Next.js built-in)
- Hidden admin route
- Security headers via Nginx
- HTTPS enforcement

## License

MIT
