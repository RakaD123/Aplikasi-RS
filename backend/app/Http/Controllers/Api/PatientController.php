<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\HealthLog;
use App\Models\PatientProfile;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;

class PatientController extends Controller
{
    // ---- BOOKINGS ----

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = Booking::with(['doctor.user', 'consultation'])
            ->where('patient_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($bookings);
    }

    public function createBooking(Request $request): JsonResponse
    {
        $request->validate([
            'doctor_id' => 'required|uuid|exists:doctors,id',
            'schedule_id' => 'nullable|uuid|exists:doctor_schedules,id',
            'appointment_time' => 'required|date',
            'complaint' => 'nullable|string|max:500',
        ]);

        // Prevent duplicate: check if patient already has an unpaid booking for the same doctor
        $existingBooking = Booking::where('patient_id', $request->user()->id)
            ->where('doctor_id', $request->doctor_id)
            ->where('payment_status', 'unpaid')
            ->whereIn('booking_status', ['pending', 'confirmed'])
            ->first();

        if ($existingBooking) {
            return response()->json([
                'message' => 'Anda sudah memiliki booking yang belum dibayar untuk dokter ini. Silakan selesaikan pembayaran atau batalkan terlebih dahulu.',
                'booking' => $existingBooking->load('doctor.user'),
            ], 409);
        }

        $doctor = \App\Models\Doctor::findOrFail($request->doctor_id);

        $booking = Booking::create([
            'patient_id' => $request->user()->id,
            'doctor_id' => $request->doctor_id,
            'schedule_id' => $request->schedule_id,
            'appointment_time' => $request->appointment_time,
            'complaint' => $request->complaint,
            'amount' => $doctor->consultation_fee,
        ]);

        return response()->json([
            'message' => 'Booking created successfully',
            'booking' => $booking->load('doctor.user'),
        ], 201);
    }

    public function cancelBooking(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->patient_id !== $request->user()->id) abort(403, 'Unauthorized access.');

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking yang sudah dibayar tidak bisa dibatalkan.'], 422);
        }

        $booking->update([
            'booking_status' => 'cancelled',
            'payment_status' => 'failed',
        ]);

        return response()->json(['message' => 'Booking berhasil dibatalkan']);
    }

    public function getBooking(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->patient_id !== $request->user()->id) abort(403, 'Unauthorized access.');
        return response()->json(['booking' => $booking->load(['doctor.user', 'consultation'])]);
    }

    // ---- PAYMENT ----

    public function initiatePayment(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->patient_id !== $request->user()->id) abort(403, 'Unauthorized access.');

        $request->validate(['payment_method' => 'required|in:virtual_account,ewallet,credit_card']);

        // Simulate a successful payment
        $booking->update([
            'payment_method' => $request->payment_method,
            'payment_status' => 'paid',
            'booking_status' => 'confirmed',
            'paid_at' => now(),
            'amount' => $booking->doctor->consultation_fee,
            'midtrans_order_id' => 'SIM-' . $booking->booking_code,
        ]);

        // Auto-create consultation so chat becomes available
        \App\Models\Consultation::firstOrCreate(
            ['booking_id' => $booking->id],
            [
                'patient_id' => $booking->patient_id,
                'doctor_id' => $booking->doctor_id,
                'status' => 'waiting',
            ]
        );

        return response()->json([
            'message' => 'Payment processed successfully',
            'booking' => $booking->fresh(),
        ]);
    }

    // ---- HEALTH LOGS ----

    public function healthLogs(Request $request): JsonResponse
    {
        $logs = HealthLog::where('user_id', $request->user()->id)
            ->orderByDesc('recorded_at')
            ->when($request->metric_type, fn($q) => $q->where('metric_type', $request->metric_type))
            ->get();

        return response()->json(['logs' => $logs]);
    }

    public function storeHealthLog(Request $request): JsonResponse
    {
        $request->validate([
            'metric_type' => 'required|in:bloodPressure,bloodSugar,heartRate,weight,cholesterol,temperature',
            'value' => 'required|string|max:20',
            'unit' => 'required|string|max:10',
            'recorded_at' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Determine trend from previous entry
        $prev = HealthLog::where('user_id', $request->user()->id)
            ->where('metric_type', $request->metric_type)
            ->latest('recorded_at')
            ->first();

        $trend = 'stable';
        if ($prev && is_numeric($prev->value) && is_numeric($request->value)) {
            if ($request->value > $prev->value) $trend = 'up';
            elseif ($request->value < $prev->value) $trend = 'down';
        }

        $log = HealthLog::create([
            'user_id' => $request->user()->id,
            'trend' => $trend,
            ...$request->only(['metric_type', 'value', 'unit', 'recorded_at', 'notes']),
        ]);

        return response()->json(['log' => $log], 201);
    }

    public function deleteHealthLog(Request $request, HealthLog $log): JsonResponse
    {
        if ($log->user_id !== $request->user()->id) abort(403, 'Unauthorized access.');
        $log->delete();
        return response()->json(['message' => 'Log deleted']);
    }

    // ---- REMINDERS ----

    public function reminders(Request $request): JsonResponse
    {
        $reminders = Reminder::where('user_id', $request->user()->id)->get();
        return response()->json(['reminders' => $reminders]);
    }

    public function storeReminder(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'type' => 'required|in:medication,labCheck,appointment,other',
            'frequency' => 'required|in:daily,weekly,once',
            'scheduled_time' => 'required|date_format:H:i',
            'scheduled_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $reminder = Reminder::create([
            'user_id' => $request->user()->id,
            ...$request->only(['title', 'type', 'frequency', 'scheduled_time', 'scheduled_date', 'description']),
        ]);

        return response()->json(['reminder' => $reminder], 201);
    }

    public function updateReminder(Request $request, Reminder $reminder): JsonResponse
    {
        if ($reminder->user_id !== $request->user()->id) abort(403, 'Unauthorized access.');
        $reminder->update($request->only(['title', 'type', 'frequency', 'scheduled_time', 'is_active']));
        return response()->json(['reminder' => $reminder]);
    }

    public function deleteReminder(Request $request, Reminder $reminder): JsonResponse
    {
        if ($reminder->user_id !== $request->user()->id) abort(403, 'Unauthorized access.');
        $reminder->delete();
        return response()->json(['message' => 'Reminder deleted']);
    }

    // ---- PROFILE ----

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('patientProfile');
        return response()->json(['user' => $user]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
        ]);

        $request->user()->update($request->only(['full_name', 'email']));

        if ($request->has('patient_profile')) {
            $profileData = $request->input('patient_profile');
            $request->user()->patientProfile()->updateOrCreate(
                ['user_id' => $request->user()->id],
                $profileData
            );
        }

        return response()->json(['user' => $request->user()->fresh()->load('patientProfile')]);
    }

    // ---- REVIEWS ----

    public function submitReview(Request $request, \App\Models\Booking $booking): JsonResponse
    {
        if ($booking->patient_id !== $request->user()->id) abort(403, 'Unauthorized');
        if ($booking->booking_status !== 'completed') {
            return response()->json(['message' => 'Hanya bisa memberi rating untuk konsultasi yang sudah selesai.'], 422);
        }

        // Check if already reviewed
        if (\App\Models\Review::where('booking_id', $booking->id)->exists()) {
            return response()->json(['message' => 'Anda sudah memberi rating untuk konsultasi ini.'], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $review = \App\Models\Review::create([
            'booking_id' => $booking->id,
            'patient_id' => $request->user()->id,
            'doctor_id' => $booking->doctor_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        // Update doctor's average rating
        $doctor = \App\Models\Doctor::find($booking->doctor_id);
        if ($doctor) {
            $avg = \App\Models\Review::where('doctor_id', $doctor->id)->avg('rating');
            $doctor->update(['rating' => round($avg, 2)]);
        }

        return response()->json(['message' => 'Terima kasih atas rating Anda!', 'review' => $review], 201);
    }
}
