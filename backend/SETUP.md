# RS Digital Portal — Backend Setup Guide

## Prerequisites
- PHP 8.2+ with `pdo_pgsql` extension (✅ already enabled)
- PostgreSQL 18 (✅ already installed)
- Composer (✅ already installed)

---

## Step 1: Configure Database Password

Edit `backend/.env` and set your PostgreSQL password:

```
DB_PASSWORD=your_postgres_password_here
```

## Step 2: Create the Database

Open **pgAdmin** or run from terminal (with your password):

```powershell
$env:PGPASSWORD='your_password'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE rs_digital;"
```

Or just open **pgAdmin 4** → right-click Databases → Create → Database → name it `rs_digital`.

## Step 3: Run Migrations & Seed

```powershell
cd RS/backend
php artisan migrate:fresh --seed
```

This creates all tables and seeds:
| Role | Login | Password |
|------|-------|----------|
| Admin | `081100000001` | `Admin@12345` |
| Doctor | `081100000011` | `Doctor@12345` |
| Patient | `081200000001` | `Patient@12345` |

## Step 4: Start the Backend Server

```powershell
php artisan serve --port=8000
```

## Step 5: Start the Frontend

```powershell
cd RS/frontend
npm run dev
```

---

## API Base URL

```
http://localhost:8000/api
```

## Authentication Flow

1. `POST /api/auth/otp/send` → `{ phone_number, type: "register" }`
2. `POST /api/auth/register` → `{ phone_number, otp, full_name, password, password_confirmation }`
3. `POST /api/auth/login` → `{ phone_number, password }` → returns `access_token`
4. Use token in `Authorization: Bearer <token>` header

> **Dev shortcut:** OTP is always `123456` in local environment.
