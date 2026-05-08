<?php
use App\Models\Doctor;
use App\Models\Booking;

echo "--- DOCTOR BOOKING COUNTS ---\n";
foreach(Doctor::with('user')->get() as $d) {
    $count = $d->bookings()->count();
    $paidCount = $d->bookings()->where('payment_status', 'paid')->count();
    $todayCount = $d->bookings()->whereDate('appointment_time', today())->count();
    echo "dr. {$d->user->full_name} (ID: {$d->id}): Total: {$count}, Paid: {$paidCount}, Today: {$todayCount}\n";
}

echo "\n--- RECENT BOOKINGS ---\n";
foreach(Booking::with(['patient', 'doctor.user'])->latest()->take(5)->get() as $b) {
    echo "ID: {$b->id} | Patient: {$b->patient->full_name} | Doctor: dr. {$b->doctor->user->full_name} | Time: {$b->appointment_time} | Payment: {$b->payment_status} | Booking: {$b->booking_status}\n";
}
