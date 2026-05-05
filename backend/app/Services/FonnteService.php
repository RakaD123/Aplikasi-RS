<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    /**
     * Send a WhatsApp message via Fonnte API.
     * 
     * @param string $target Phone number (e.g., 08123456789 or 628123456789)
     * @param string $message The text message
     * @return bool True if successfully sent, False otherwise
     */
    public static function sendWhatsApp($target, $message)
    {
        $token = env('FONNTE_TOKEN');
        
        if (empty($token)) {
            Log::warning('Fonnte token is missing. WhatsApp message was not sent.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62', // Default to Indonesia if leading 0
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp sent via Fonnte to {$target}");
                return true;
            } else {
                Log::error("Fonnte failed: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Fonnte exception: " . $e->getMessage());
            return false;
        }
    }
}
