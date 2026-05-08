<?php
$bookings = \App\Models\Booking::where('payment_status', 'unpaid')->whereNotNull('midtrans_order_id')->get();
$count = 0;
foreach($bookings as $b) {
    $b->update([
        'payment_status' => 'paid',
        'booking_status' => 'confirmed',
        'paid_at' => now(),
        'payment_method' => 'virtual_account'
    ]);
    \App\Models\Consultation::firstOrCreate(
        ['booking_id' => $b->id],
        ['patient_id' => $b->patient_id, 'doctor_id' => $b->doctor_id, 'status' => 'waiting']
    );
    $count++;
}
echo "Berhasil memperbarui $count transaksi!\n";
