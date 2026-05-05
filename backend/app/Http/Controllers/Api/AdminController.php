<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Promo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // ---- DASHBOARD ----

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users' => User::where('role', 'patient')->count(),
            'total_doctors' => Doctor::where('is_active', true)->count(),
            'total_revenue' => Booking::where('payment_status', 'paid')->sum('amount'),
            'active_bookings' => Booking::whereIn('booking_status', ['pending', 'confirmed', 'in_progress'])->count(),
            'recent_bookings' => Booking::with(['patient', 'doctor.user'])
                ->latest()->take(5)->get(),
            'recent_users' => User::where('role', 'patient')->latest()->take(5)->get(),
        ]);
    }

    // ---- DOCTORS ----

    public function doctors(Request $request): JsonResponse
    {
        $query = Doctor::with('user');
        if ($request->filled('search')) {
            $query->whereHas('user', fn($q) => $q->where('full_name', 'ilike', "%{$request->search}%"));
        }
        return response()->json($query->paginate(15));
    }

    public function storeDoctor(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:users,email',
            'phone_number' => 'required|string|unique:users,phone_number',
            'password' => 'required|string|min:8',
            'specialization' => 'required|string',
            'hospital_branch' => 'required|string',
            'experience_years' => 'nullable|integer',
            'consultation_fee' => 'nullable|string',
            'bio' => 'nullable|string',
        ]);

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => $request->password,
            'role' => 'doctor',
        ]);

        $doctor = Doctor::create([
            'user_id' => $user->id,
            'specialization' => $request->specialization,
            'hospital_branch' => $request->hospital_branch,
            'experience_years' => $request->experience_years ?? 0,
            'consultation_fee' => $request->consultation_fee,
            'bio' => $request->bio,
        ]);

        return response()->json([
            'message' => 'Doctor created successfully',
            'doctor' => $doctor->load('user'),
        ], 201);
    }

    public function updateDoctor(Request $request, Doctor $doctor): JsonResponse
    {
        $doctor->update($request->only([
            'specialization', 'hospital_branch', 'experience_years',
            'consultation_fee', 'bio', 'is_active', 'rating',
        ]));

        if ($request->has('full_name')) {
            $doctor->user->update(['full_name' => $request->full_name]);
        }

        return response()->json(['doctor' => $doctor->fresh()->load('user')]);
    }

    public function deleteDoctor(Doctor $doctor): JsonResponse
    {
        $doctor->user->update(['is_active' => false]);
        $doctor->update(['is_active' => false]);
        return response()->json(['message' => 'Doctor deactivated']);
    }

    // ---- USERS ----

    public function users(Request $request): JsonResponse
    {
        $query = User::query();
        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('search')) {
            $query->where(fn($q) =>
                $q->where('full_name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%")
                  ->orWhere('phone_number', 'like', "%{$request->search}%")
            );
        }
        return response()->json($query->paginate(15));
    }

    public function toggleUser(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['message' => 'User status updated', 'is_active' => $user->is_active]);
    }

    // ---- TRANSACTIONS ----

    public function transactions(Request $request): JsonResponse
    {
        $query = Booking::with(['patient', 'doctor.user']);
        if ($request->filled('status')) $query->where('payment_status', $request->status);
        if ($request->filled('search')) {
            $query->whereHas('patient', fn($q) => $q->where('full_name', 'ilike', "%{$request->search}%"))
                  ->orWhere('booking_code', 'like', "%{$request->search}%");
        }
        return response()->json($query->latest()->paginate(15));
    }

    // ---- ARTICLES ----

    public function articles(Request $request): JsonResponse
    {
        return response()->json(Article::with('author')->latest()->paginate(15));
    }

    public function storeArticle(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string',
            'excerpt' => 'nullable|string',
            'read_time' => 'nullable|integer',
        ]);

        $article = Article::create([
            'author_id' => $request->user()->id,
            'slug' => Str::slug($request->title) . '-' . Str::random(5),
            'published_at' => now(),
            ...$request->only(['title', 'content', 'category', 'excerpt', 'read_time']),
        ]);

        return response()->json(['article' => $article], 201);
    }

    public function updateArticle(Request $request, Article $article): JsonResponse
    {
        $article->update($request->only(['title', 'content', 'category', 'excerpt', 'read_time', 'is_published']));
        return response()->json(['article' => $article]);
    }

    public function deleteArticle(Article $article): JsonResponse
    {
        $article->delete();
        return response()->json(['message' => 'Article deleted']);
    }

    // ---- PROMOS ----

    public function promos(): JsonResponse
    {
        return response()->json(Promo::latest()->get());
    }

    public function storePromo(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'required|string|unique:promos,code',
            'discount_percentage' => 'required|integer|min:1|max:100',
            'valid_from' => 'required|date',
            'valid_until' => 'required|date|after:valid_from',
        ]);

        $promo = Promo::create([
            'created_by' => $request->user()->id,
            ...$request->only(['title', 'description', 'code', 'discount_percentage', 'max_discount_amount', 'valid_from', 'valid_until', 'max_usage']),
        ]);

        return response()->json(['promo' => $promo], 201);
    }

    public function deletePromo(Promo $promo): JsonResponse
    {
        $promo->delete();
        return response()->json(['message' => 'Promo deleted']);
    }
}
