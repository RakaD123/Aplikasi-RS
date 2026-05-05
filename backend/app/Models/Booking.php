<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Booking extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'doctor_id', 'schedule_id', 'booking_code', 'appointment_time',
        'complaint', 'booking_status', 'payment_status', 'amount', 'payment_method',
        'payment_provider', 'midtrans_order_id', 'midtrans_transaction_id', 'paid_at', 'notes',
    ];

    protected $casts = [
        'appointment_time' => 'datetime',
        'paid_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function schedule()
    {
        return $this->belongsTo(DoctorSchedule::class);
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class);
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($booking) {
            if (!$booking->booking_code) {
                $booking->booking_code = 'BK-' . now()->format('Ymd') . strtoupper(substr(uniqid(), -4));
            }
        });
    }
}
