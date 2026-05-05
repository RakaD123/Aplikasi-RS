<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('patient_id');
            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('doctor_id');
            $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('cascade');
            $table->uuid('schedule_id')->nullable();
            $table->foreign('schedule_id')->references('id')->on('doctor_schedules')->onDelete('set null');
            $table->string('booking_code')->unique(); // BK-2026042801
            $table->timestamp('appointment_time');
            $table->string('complaint')->nullable();
            $table->enum('booking_status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded', 'failed'])->default('unpaid');
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('payment_method')->nullable(); // virtual_account, ewallet, credit_card
            $table->string('payment_provider')->nullable(); // midtrans, manual
            $table->string('midtrans_order_id')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('consultations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('booking_id')->unique();
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            $table->uuid('patient_id');
            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('doctor_id');
            $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('cascade');
            $table->string('room_id')->nullable();
            $table->enum('status', ['waiting', 'active', 'completed', 'cancelled'])->default('waiting');
            $table->text('medical_notes')->nullable();
            $table->text('e_prescription')->nullable();
            $table->string('e_prescription_url')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('bookings');
    }
};
