<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Doctor extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id', 'specialization', 'hospital_branch', 'str_number',
        'education', 'experience_years', 'rating', 'total_patients',
        'consultation_fee', 'is_active', 'bio',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    // Accessor: return full doctor data including user info
    public function getNameAttribute(): string
    {
        return 'dr. ' . $this->user->full_name;
    }
}
