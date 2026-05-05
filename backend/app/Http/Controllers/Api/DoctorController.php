<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    /**
     * GET /api/doctors — Public doctor listing with search & filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Doctor::with(['user', 'schedules'])
            ->where('is_active', true);

        if ($request->filled('search')) {
            $query->whereHas('user', fn($q) =>
                $q->where('full_name', 'ilike', "%{$request->search}%")
            );
        }

        if ($request->filled('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        if ($request->filled('branch')) {
            $query->where('hospital_branch', $request->branch);
        }

        $doctors = $query->paginate(12);

        // Transform response to include computed fields
        $doctors->getCollection()->transform(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => 'dr. ' . $doctor->user->full_name,
                'specialization' => $doctor->specialization,
                'hospital_branch' => $doctor->hospital_branch,
                'experience_years' => $doctor->experience_years,
                'rating' => $doctor->rating,
                'total_patients' => $doctor->total_patients,
                'consultation_fee' => $doctor->consultation_fee,
                'bio' => $doctor->bio,
                'avatar' => $doctor->user->avatar,
                'available_slots' => $doctor->schedules->where('is_active', true)->values(),
            ];
        });

        return response()->json($doctors);
    }

    /**
     * GET /api/doctors/{id} — Single doctor details.
     */
    public function show(Doctor $doctor): JsonResponse
    {
        $doctor->load(['user', 'schedules']);

        // Real patient count from unique bookings
        $totalPatients = \App\Models\Booking::where('doctor_id', $doctor->id)
            ->distinct('patient_id')
            ->count('patient_id');

        // Real average rating from reviews
        $avgRating = \App\Models\Review::where('doctor_id', $doctor->id)->avg('rating');
        $reviewCount = \App\Models\Review::where('doctor_id', $doctor->id)->count();

        // Recent reviews
        $reviews = \App\Models\Review::where('doctor_id', $doctor->id)
            ->with('patient:id,full_name')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'patient_name' => $r->patient->full_name ?? 'Pasien',
                'rating' => $r->rating,
                'comment' => $r->comment,
                'date' => $r->created_at->format('d M Y'),
            ]);

        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => 'dr. ' . $doctor->user->full_name,
                'specialization' => $doctor->specialization,
                'hospital_branch' => $doctor->hospital_branch,
                'experience_years' => $doctor->experience_years,
                'rating' => $avgRating ? round($avgRating, 1) : $doctor->rating,
                'review_count' => $reviewCount,
                'total_patients' => $totalPatients ?: $doctor->total_patients,
                'consultation_fee' => $doctor->consultation_fee,
                'bio' => $doctor->bio,
                'education' => $doctor->education,
                'schedules' => $doctor->schedules->where('is_active', true)->values(),
                'reviews' => $reviews,
            ],
        ]);
    }

    /**
     * GET /api/doctors/specializations — Distinct list of specializations.
     */
    public function specializations(): JsonResponse
    {
        $specs = Doctor::where('is_active', true)
            ->distinct()
            ->pluck('specialization');

        return response()->json(['specializations' => $specs]);
    }

    /**
     * GET /api/doctors/branches — Distinct list of hospital branches.
     */
    public function branches(): JsonResponse
    {
        $branches = Doctor::where('is_active', true)
            ->distinct()
            ->pluck('hospital_branch');

        return response()->json(['branches' => $branches]);
    }

    // ---- DOCTOR-ONLY endpoints ----

    /**
     * GET /api/doctor/queue — Get today's booking queue for authenticated doctor.
     */
    public function myQueue(Request $request): JsonResponse
    {
        $doctor = $request->user()->doctorProfile;

        if (!$doctor) {
            return response()->json(['message' => 'Doctor profile not found'], 404);
        }

        $queue = \App\Models\Booking::with(['patient'])
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_time', today())
            ->orderBy('appointment_time')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'booking_code' => $b->booking_code,
                'patient_name' => $b->patient->full_name,
                'complaint' => $b->complaint,
                'appointment_time' => $b->appointment_time->format('H:i'),
                'booking_status' => $b->booking_status,
            ]);

        return response()->json(['queue' => $queue]);
    }

    /**
     * PUT /api/doctor/queue/{booking}/status — Update patient status.
     */
    public function updateQueueStatus(Request $request, \App\Models\Booking $booking): JsonResponse
    {
        if ($booking->doctor_id !== $request->user()->doctorProfile->id) abort(403, 'Unauthorized access.');

        $request->validate(['status' => 'required|in:confirmed,in_progress,completed,cancelled']);
        $booking->update(['booking_status' => $request->status]);

        return response()->json(['message' => 'Status updated', 'booking' => $booking]);
    }

    /**
     * GET /api/doctor/schedule — Doctor's own schedule.
     */
    public function mySchedule(Request $request): JsonResponse
    {
        $doctor = $request->user()->doctorProfile;

        if (!$doctor) {
            return response()->json(['message' => 'Doctor profile not found'], 404);
        }

        return response()->json(['schedules' => $doctor->schedules]);
    }

    /**
     * POST /api/doctor/schedule — Add schedule slot.
     */
    public function addSchedule(Request $request): JsonResponse
    {
        $doctor = $request->user()->doctorProfile;

        $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'hospital_branch' => 'required|string',
        ]);

        $schedule = DoctorSchedule::create([
            'doctor_id' => $doctor->id,
            ...$request->only(['day_of_week', 'start_time', 'end_time', 'hospital_branch']),
        ]);

        return response()->json(['schedule' => $schedule], 201);
    }

    /**
     * DELETE /api/doctor/schedule/{id} — Remove schedule slot.
     */
    public function deleteSchedule(Request $request, DoctorSchedule $schedule): JsonResponse
    {
        if ($schedule->doctor_id !== $request->user()->doctorProfile->id) abort(403, 'Unauthorized access.');
        $schedule->delete();
        return response()->json(['message' => 'Schedule deleted']);
    }

    // ---- PATIENT RECORDS (Catatan Medis) ----

    /**
     * GET /api/doctor/patients — List unique patients this doctor has consulted.
     */
    public function patients(Request $request): JsonResponse
    {
        $doctorId = $request->user()->doctorProfile->id;

        $patients = \App\Models\User::whereHas('bookings', function ($q) use ($doctorId) {
            $q->where('doctor_id', $doctorId);
        })->with('patientProfile')->get()->map(function ($user) use ($doctorId) {
            $latestBooking = \App\Models\Booking::where('patient_id', $user->id)
                ->where('doctor_id', $doctorId)
                ->latest('appointment_time')
                ->first();

            return [
                'id' => $user->id,
                'name' => $user->full_name,
                'age' => ($user->patientProfile && $user->patientProfile->date_of_birth) 
                    ? (int) floor(now()->floatDiffInYears(\Carbon\Carbon::parse($user->patientProfile->date_of_birth)))
                    : '-',
                'gender' => $user->patientProfile?->gender === 'male' ? 'M' : 'F',
                'bloodType' => $user->patientProfile?->blood_type ?? '-',
                'lastVisit' => $latestBooking ? $latestBooking->appointment_time->format('d M Y') : '-',
                'diagnosis' => $latestBooking?->consultation?->medical_notes ?? '-',
            ];
        });

        return response()->json(['patients' => $patients]);
    }

    /**
     * GET /api/doctor/patients/{user} — Patient profile + consultation history.
     */
    public function patientDetails(Request $request, \App\Models\User $user): JsonResponse
    {
        $doctorId = $request->user()->doctorProfile->id;

        // Verify doctor has seen this patient
        $hasSeen = \App\Models\Booking::where('doctor_id', $doctorId)->where('patient_id', $user->id)->exists();
        if (!$hasSeen) abort(403, 'Unauthorized access to patient records.');

        $user->load('patientProfile');
        $bookings = \App\Models\Booking::with('consultation')
            ->where('doctor_id', $doctorId)
            ->where('patient_id', $user->id)
            ->orderByDesc('appointment_time')
            ->get();

        $healthLogs = \App\Models\HealthLog::where('user_id', $user->id)->orderByDesc('recorded_at')->take(10)->get();

        return response()->json([
            'patient' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone_number,
                'age' => ($user->patientProfile && $user->patientProfile->date_of_birth) 
                    ? (int) floor(now()->floatDiffInYears(\Carbon\Carbon::parse($user->patientProfile->date_of_birth)))
                    : '-',
                'gender' => $user->patientProfile?->gender === 'male' ? 'M' : 'F',
                'bloodType' => $user->patientProfile?->blood_type ?? '-',
            ],
            'bookings' => $bookings,
            'healthLogs' => $healthLogs,
        ]);
    }

    /**
     * POST /api/doctor/patients/{user}/health-logs — Add health log for patient
     */
    public function storeHealthLog(Request $request, \App\Models\User $user): JsonResponse
    {
        $doctorId = $request->user()->doctorProfile->id;

        // Verify doctor has seen this patient
        $hasSeen = \App\Models\Booking::where('doctor_id', $doctorId)->where('patient_id', $user->id)->exists();
        if (!$hasSeen) abort(403, 'Unauthorized access to patient records.');

        $request->validate([
            'metric_type' => 'required|in:bloodPressure,bloodSugar,heartRate,weight,cholesterol,temperature',
            'value' => 'required|string|max:20',
            'unit' => 'required|string|max:10',
            'recorded_at' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        // Determine trend from previous entry
        $prev = \App\Models\HealthLog::where('user_id', $user->id)
            ->where('metric_type', $request->metric_type)
            ->latest('recorded_at')
            ->first();

        $trend = 'stable';
        if ($prev && is_numeric($prev->value) && is_numeric($request->value)) {
            if ($request->value > $prev->value) $trend = 'up';
            elseif ($request->value < $prev->value) $trend = 'down';
        }

        $log = \App\Models\HealthLog::create([
            'user_id' => $user->id,
            'trend' => $trend,
            ...$request->only(['metric_type', 'value', 'unit', 'recorded_at', 'notes']),
        ]);

        return response()->json(['log' => $log], 201);
    }

    /**
     * POST /api/doctor/bookings/{booking}/consultation — Save evaluation/notes.
     */
    public function saveConsultation(Request $request, \App\Models\Booking $booking): JsonResponse
    {
        if ($booking->doctor_id !== $request->user()->doctorProfile->id) abort(403, 'Unauthorized access.');

        $request->validate([
            'medical_notes' => 'required|string',
            'e_prescription' => 'nullable|string',
        ]);

        $consultation = \App\Models\Consultation::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'patient_id' => $booking->patient_id,
                'doctor_id' => $booking->doctor_id,
                'status' => 'completed',
                'medical_notes' => $request->medical_notes,
                'e_prescription' => $request->e_prescription,
                'ended_at' => now(),
            ]
        );

        $booking->update(['booking_status' => 'completed']);

        return response()->json(['message' => 'Consultation notes saved', 'consultation' => $consultation]);
    }
}
