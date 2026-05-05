<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * GET /api/chat/consultations — List consultations that have active chat (for current user).
     */
    public function myConsultations(Request $request): JsonResponse
    {
        $user = $request->user();

        $consultations = Consultation::with(['booking.doctor.user', 'booking'])
            ->whereHas('booking', function ($q) use ($user) {
                if ($user->role === 'patient') {
                    $q->where('patient_id', $user->id);
                } else {
                    $q->whereHas('doctor', fn($dq) => $dq->where('user_id', $user->id));
                }
            })
            ->whereIn('status', ['waiting', 'active'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($c) use ($user) {
                $booking = $c->booking;
                $otherName = $user->role === 'patient'
                    ? 'dr. ' . ($booking->doctor->user->full_name ?? 'Dokter')
                    : ($booking->patient_name ?? 'Pasien');

                // For doctor, get patient name from users table
                if ($user->role === 'doctor') {
                    $patient = \App\Models\User::find($booking->patient_id);
                    $otherName = $patient ? $patient->full_name : 'Pasien';
                }

                return [
                    'consultation_id' => $c->id,
                    'booking_id' => $booking->id,
                    'other_name' => $otherName,
                    'status' => $c->status,
                    'complaint' => $booking->complaint,
                    'appointment_time' => $booking->appointment_time,
                    'last_message' => $c->messages()->latest()->first()?->message,
                ];
            });

        return response()->json(['consultations' => $consultations]);
    }

    /**
     * GET /api/chat/{consultation}/messages — Get all messages for a consultation.
     */
    public function getMessages(Request $request, Consultation $consultation): JsonResponse
    {
        $this->authorizeAccess($request->user(), $consultation);

        $messages = $consultation->messages()->with('sender:id,full_name,role')->get()->map(fn($m) => [
            'id' => $m->id,
            'sender_id' => $m->sender_id,
            'sender_name' => $m->sender->full_name,
            'sender_role' => $m->sender->role,
            'message' => $m->message,
            'time' => $m->created_at->format('H:i'),
            'created_at' => $m->created_at,
        ]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * POST /api/chat/{consultation}/messages — Send a message.
     */
    public function sendMessage(Request $request, Consultation $consultation): JsonResponse
    {
        $this->authorizeAccess($request->user(), $consultation);

        $request->validate(['message' => 'required|string|max:2000']);

        // Auto-activate consultation if still waiting
        if ($consultation->status === 'waiting') {
            $consultation->update(['status' => 'active', 'started_at' => now()]);
        }

        $msg = Message::create([
            'consultation_id' => $consultation->id,
            'sender_id' => $request->user()->id,
            'message' => $request->message,
        ]);

        $msg->load('sender:id,full_name,role');

        return response()->json([
            'message' => [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'sender_name' => $msg->sender->full_name,
                'sender_role' => $msg->sender->role,
                'message' => $msg->message,
                'time' => $msg->created_at->format('H:i'),
                'created_at' => $msg->created_at,
            ]
        ], 201);
    }

    /**
     * Verify the user has access to this consultation (is either the patient or the doctor).
     */
    private function authorizeAccess($user, Consultation $consultation): void
    {
        $booking = $consultation->booking;

        if ($user->role === 'patient' && $booking->patient_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        if ($user->role === 'doctor') {
            $doctor = $booking->doctor;
            if (!$doctor || $doctor->user_id !== $user->id) {
                abort(403, 'Unauthorized');
            }
        }
    }
}
