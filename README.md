# 🏥 RS Digital Portal (Hospital Management System)

RS Digital Portal is a modern, web-based hospital management information system designed to streamline interactions between Patients, Doctors, and Administrators. This application is built with a decoupled Full-Stack architecture using **Next.js** for the user interface (Frontend) and **Laravel** for data management and APIs (Backend).

## ✨ Key Features

### 🧑‍⚕️ For Patients
*   **Easy Registration & Login:** Supports authentication using OTP (One-Time Password) delivered in real-time via WhatsApp using the Fonnte API integration.
*   **Doctor Appointment Booking:** Patients can view available doctor schedules across various hospital branches and book appointments seamlessly.
*   **Booking Payments:** Includes an independent billing payment system for consultation fees supporting Virtual Accounts, E-Wallets, and Credit Cards.
*   **Health Monitor:** Patients can independently record and track personal health metrics such as Blood Pressure, Blood Sugar, Heart Rate, and Cholesterol.
*   **Live Consultation Chat:** A real-time direct messaging feature with the doctor after a confirmed booking.
*   **Transaction History:** Easy access to all payment histories complete with status *(Paid/Pending/Failed)*.

### 🩺 For Doctors
*   **Schedule Management:** Doctors can independently add and remove their available practice slots across different hospital branches.
*   **Queue Management:** View the list of patients scheduled for consultation on the current day in real-time.
*   **Patient Medical Records:** Doctors can access the medical records of unique patients they have previously treated.

### ⚙️ For Administrators
*   **Doctor Management:** Add, edit, or deactivate doctor accounts and profiles. Includes generating specific passwords and IDs for instant doctor login.
*   **User Management:** Monitor the list of patients registered within the hospital portal.

## 🛠️ Technologies Used

**Frontend:**
*   [Next.js 14](https://nextjs.org/) (App Router)
*   React 18 & TypeScript
*   Vanilla CSS Modules (For styling with a modern design system)
*   SWR (For Data Fetching and Real-time UI updates)
*   Lucide React (Iconography)

**Backend:**
*   [Laravel 11](https://laravel.com/) & PHP 8
*   MySQL Database
*   Laravel Sanctum (Token-based API Authentication & Role Protection)
*   Fonnte API Integration (WhatsApp OTP Gateway)

## 🚀 How to Run the Application Locally

Ensure you have PHP, Composer, Node.js, and MySQL installed on your computer.

### 1. Running the Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure your Database (MySQL) connection inside the .env file
# Create an empty database named 'rs_digital_db'

php artisan migrate:fresh --seed
php artisan serve
