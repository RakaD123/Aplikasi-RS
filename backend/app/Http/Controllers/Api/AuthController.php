<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpToken;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\FonnteService;

class AuthController extends Controller
{
    /**
     * Send OTP to phone number.
     * In production: integrate Twilio/Fonnte here.
     * For development: returns OTP in response.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate(['phone_number' => 'required|string|min:10|max:15']);

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // In development, if no Fonnte Token is set, use "123456" for easy testing
        if (app()->environment('local') && empty(env('FONNTE_TOKEN'))) {
            $otp = '123456';
        }

        // Store OTP (invalidate previous)
        OtpToken::where('phone_number', $request->phone_number)
            ->where('type', $request->type ?? 'login')
            ->where('is_used', false)
            ->update(['is_used' => true]);

        OtpToken::create([
            'phone_number' => $request->phone_number,
            'token' => $otp,
            'type' => $request->type ?? 'login',
            'expires_at' => now()->addMinutes(5),
        ]);

        // Send WhatsApp via Fonnte in production/if token exists
        if (!empty(env('FONNTE_TOKEN'))) {
            $message = "*RS Digital Portal*\n\nKode OTP Anda adalah: *$otp*.\nBerlaku selama 5 menit. Mohon jangan berikan kode ini kepada siapapun.";
            FonnteService::sendWhatsApp($request->phone_number, $message);
        }

        return response()->json([
            'message' => 'OTP sent successfully',
            // Only expose in development
            'otp' => app()->environment('local') ? $otp : null,
        ]);
    }

    /**
     * Register a new patient account.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string|unique:users,phone_number',
            'otp' => 'required|string|size:6',
            'full_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'gender' => 'nullable|in:male,female',
        ]);

        // Verify OTP
        $otpRecord = OtpToken::where('phone_number', $request->phone_number)
            ->where('type', 'register')
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$otpRecord || !$otpRecord->isValid($request->otp)) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        // Create user
        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => $request->password,
            'role' => 'patient',
            'phone_verified_at' => now(),
        ]);

        // Create default patient profile
        PatientProfile::create([
            'user_id' => $user->id,
            'gender' => $request->gender,
        ]);

        // Mark OTP used
        $otpRecord->update(['is_used' => true]);

        // Issue token
        $token = $user->createToken('auth_token', ['role:patient'])->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    /**
     * Login with phone + password, then OTP step.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone_number', $request->phone_number)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone_number' => ['Nomor telepon atau kata sandi tidak sesuai.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan.'], 403);
        }

        // Issue token with role ability
        $token = $user->createToken('auth_token', ["role:{$user->role}"])->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load(
                $user->isDoctor() ? 'doctorProfile' : ($user->isPatient() ? 'patientProfile' : [])
            ),
        ]);
    }

    /**
     * Verify OTP for login (2FA step).
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
            'otp' => 'required|string|size:6',
            'type' => 'required|in:login,register,reset_password',
        ]);

        $otpRecord = OtpToken::where('phone_number', $request->phone_number)
            ->where('type', $request->type)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$otpRecord || !$otpRecord->isValid($request->otp)) {
            return response()->json(['message' => 'Kode OTP tidak valid atau sudah kadaluarsa.'], 422);
        }

        // We do not mark it as used here, because the subsequent step (e.g. register) will consume it.
        return response()->json(['message' => 'OTP verified', 'verified' => true]);
    }

    /**
     * Reset password after OTP verification.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $otpRecord = OtpToken::where('phone_number', $request->phone_number)
            ->where('type', 'reset_password')
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$otpRecord || !$otpRecord->isValid($request->otp)) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $user = User::where('phone_number', $request->phone_number)->firstOrFail();
        $user->update(['password' => Hash::make($request->password)]);
        $otpRecord->update(['is_used' => true]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load($user->isDoctor() ? 'doctorProfile.schedules' : 'patientProfile');

        return response()->json(['user' => $user]);
    }

    /**
     * Logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
