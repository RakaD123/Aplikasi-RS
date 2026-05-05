<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Consultation extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'booking_id', 'patient_id', 'doctor_id', 'room_id', 'status',
        'medical_notes', 'e_prescription', 'e_prescription_url', 'started_at', 'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function booking() { return $this->belongsTo(Booking::class); }
    public function patient() { return $this->belongsTo(User::class, 'patient_id'); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function messages() { return $this->hasMany(Message::class)->orderBy('created_at', 'asc'); }
}
