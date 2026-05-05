<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpToken extends Model
{
    protected $table = 'otp_tokens';

    protected $fillable = [
        'phone_number', 'token', 'type', 'expires_at', 'is_used',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at);
    }

    public function isValid(string $token): bool
    {
        return !$this->is_used && !$this->isExpired() && $this->token === $token;
    }
}
