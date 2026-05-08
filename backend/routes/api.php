<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — RS Digital Portal
|--------------------------------------------------------------------------
| Authentication: Laravel Sanctum (Bearer token)
| RBAC: 'role:patient|doctor|admin' middleware
|--------------------------------------------------------------------------
*/

// ---- PUBLIC (unauthenticated) ----
Route::prefix('public')->group(function () {
    Route::get('articles', [PublicController::class, 'articles']);
    Route::get('articles/categories', [PublicController::class, 'articleCategories']);
    Route::get('promos', [PublicController::class, 'promos']);
    Route::post('midtrans-callback', [PublicController::class, 'midtransCallback']);

    // Doctor directory (public search)
    Route::get('doctors', [DoctorController::class, 'index']);
    Route::get('doctors/specializations', [DoctorController::class, 'specializations']);
    Route::get('doctors/branches', [DoctorController::class, 'branches']);
    Route::get('doctors/{doctor}', [DoctorController::class, 'show']);
});

// ---- AUTHENTICATION ----
Route::prefix('auth')->group(function () {
    Route::post('otp/send', [AuthController::class, 'sendOtp']);
    Route::post('otp/verify', [AuthController::class, 'verifyOtp']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'sendOtp']); // reuse with type=reset_password
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Authenticated
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// ---- PATIENT (auth + role:patient) ----
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    // Bookings
    Route::get('bookings', [PatientController::class, 'myBookings']);
    Route::post('bookings', [PatientController::class, 'createBooking']);
    Route::get('bookings/{booking}', [PatientController::class, 'getBooking']);
    Route::post('bookings/{booking}/pay', [PatientController::class, 'initiatePayment']);
    Route::get('bookings/{booking}/check-status', [PatientController::class, 'checkPaymentStatus']);
    Route::delete('bookings/{booking}', [PatientController::class, 'cancelBooking']);
    Route::post('bookings/{booking}/review', [PatientController::class, 'submitReview']);

    // Health Logs
    Route::get('health-logs', [PatientController::class, 'healthLogs']);
    Route::post('health-logs', [PatientController::class, 'storeHealthLog']);
    Route::delete('health-logs/{log}', [PatientController::class, 'deleteHealthLog']);

    // Reminders
    Route::get('reminders', [PatientController::class, 'reminders']);
    Route::post('reminders', [PatientController::class, 'storeReminder']);
    Route::put('reminders/{reminder}', [PatientController::class, 'updateReminder']);
    Route::delete('reminders/{reminder}', [PatientController::class, 'deleteReminder']);

    // Profile
    Route::get('profile', [PatientController::class, 'profile']);
    Route::put('profile', [PatientController::class, 'updateProfile']);
});

// ---- DOCTOR (auth + role:doctor) ----
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('queue', [DoctorController::class, 'myQueue']);
    Route::put('queue/{booking}/status', [DoctorController::class, 'updateQueueStatus']);

    Route::get('schedule', [DoctorController::class, 'mySchedule']);
    Route::post('schedule', [DoctorController::class, 'addSchedule']);
    Route::delete('schedule/{schedule}', [DoctorController::class, 'deleteSchedule']);

    // Doctor can view unique patients they have consulted
    Route::get('patients', [DoctorController::class, 'patients']);
    Route::get('patients/{user}', [DoctorController::class, 'patientDetails']);
    Route::post('patients/{user}/health-logs', [DoctorController::class, 'storeHealthLog']);
    Route::post('bookings/{booking}/consultation', [DoctorController::class, 'saveConsultation']);

    // Doctor can view own patients' health data (from bookings)
    Route::get('patients/{user}/health-logs', function (\App\Models\User $user) {
        // Only allow if doctor has a booking with this patient
        $doctorId = request()->user()->doctorProfile->id;
        $hasRelation = \App\Models\Booking::where('doctor_id', $doctorId)
            ->where('patient_id', $user->id)
            ->exists();

        if (!$hasRelation) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json(['logs' => $user->healthLogs()->latest('recorded_at')->get()]);
    });
});

// ---- CHAT (auth, patient or doctor) ----
Route::middleware(['auth:sanctum'])->prefix('chat')->group(function () {
    Route::get('consultations', [ChatController::class, 'myConsultations']);
    Route::get('{consultation}/messages', [ChatController::class, 'getMessages']);
    Route::post('{consultation}/messages', [ChatController::class, 'sendMessage']);
});

// ---- ADMIN (auth + role:admin) ----
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('stats', [AdminController::class, 'stats']);

    // Doctors
    Route::get('doctors', [AdminController::class, 'doctors']);
    Route::post('doctors', [AdminController::class, 'storeDoctor']);
    Route::put('doctors/{doctor}', [AdminController::class, 'updateDoctor']);
    Route::put('doctors/{doctor}/toggle', [AdminController::class, 'toggleDoctor']);

    // Users
    Route::get('users', [AdminController::class, 'users']);
    Route::put('users/{user}/toggle', [AdminController::class, 'toggleUser']);

    // Transactions
    Route::get('transactions', [AdminController::class, 'transactions']);
    Route::get('doctor-revenue', [AdminController::class, 'doctorRevenue']);

    // Articles
    Route::get('articles', [AdminController::class, 'articles']);
    Route::post('articles', [AdminController::class, 'storeArticle']);
    Route::put('articles/{article}', [AdminController::class, 'updateArticle']);
    Route::delete('articles/{article}', [AdminController::class, 'deleteArticle']);

    // Promos
    Route::get('promos', [AdminController::class, 'promos']);
    Route::post('promos', [AdminController::class, 'storePromo']);
    Route::put('promos/{promo}', [AdminController::class, 'updatePromo']);
    Route::delete('promos/{promo}', [AdminController::class, 'deletePromo']);
});
