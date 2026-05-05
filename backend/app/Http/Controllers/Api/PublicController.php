<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Promo;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PublicController extends Controller
{
    public function articles(Request $request): JsonResponse
    {
        $query = Article::with('author')->where('is_published', true);

        if ($request->filled('search')) {
            $query->where(fn($q) =>
                $q->where('title', 'ilike', "%{$request->search}%")
                  ->orWhere('excerpt', 'ilike', "%{$request->search}%")
            );
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->latest('published_at')->paginate(12));
    }

    public function articleCategories(): JsonResponse
    {
        return response()->json([
            'categories' => Article::where('is_published', true)->distinct()->pluck('category'),
        ]);
    }

    public function promos(): JsonResponse
    {
        $promos = Promo::where('is_active', true)
            ->whereDate('valid_until', '>=', today())
            ->orderByDesc('discount_percentage')
            ->get();

        return response()->json(['promos' => $promos]);
    }

    public function midtransCallback(Request $request): JsonResponse
    {
        $payload = $request->all();
        
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $signatureKey = $payload['signature_key'] ?? '';
        $transactionStatus = $payload['transaction_status'] ?? '';
        $paymentType = $payload['payment_type'] ?? '';

        // Verify signature
        $serverKey = config('midtrans.server_key');
        $calculatedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if ($calculatedSignature !== $signatureKey) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        // Find booking by midtrans_order_id
        $booking = Booking::where('midtrans_order_id', $orderId)->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            $booking->update([
                'payment_status' => 'paid',
                'booking_status' => 'confirmed',
                'paid_at' => now(),
                'payment_method' => $paymentType
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
        } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
            $booking->update([
                'payment_status' => 'failed',
                'booking_status' => 'cancelled'
            ]);
        }

        return response()->json(['message' => 'Webhook received']);
    }
}
