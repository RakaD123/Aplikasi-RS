<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Message extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'consultation_id', 'sender_id', 'message',
    ];

    public function consultation() { return $this->belongsTo(Consultation::class); }
    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
}
