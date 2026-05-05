<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PatientProfile extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id', 'date_of_birth', 'gender', 'address', 'blood_type',
        'allergies', 'medical_history', 'emergency_contact_name', 'emergency_contact_phone',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
