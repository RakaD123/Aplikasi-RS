<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('specialization');
            $table->string('hospital_branch');
            $table->string('str_number')->nullable(); // Surat Tanda Registrasi
            $table->string('education')->nullable();
            $table->integer('experience_years')->default(0);
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->integer('total_patients')->default(0);
            $table->string('consultation_fee')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('bio')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('doctor_id');
            $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('cascade');
            $table->string('day_of_week'); // Monday, Tuesday, etc.
            $table->time('start_time');
            $table->time('end_time');
            $table->string('hospital_branch');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
        Schema::dropIfExists('doctors');
    }
};
