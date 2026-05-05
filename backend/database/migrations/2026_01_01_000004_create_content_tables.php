<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['medication', 'labCheck', 'appointment', 'other'])->default('medication');
            $table->enum('frequency', ['daily', 'weekly', 'once'])->default('daily');
            $table->time('scheduled_time');
            $table->date('scheduled_date')->nullable(); // for 'once' frequency
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('author_id');
            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('cover_image')->nullable();
            $table->string('category');
            $table->integer('read_time')->default(5); // minutes
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('promos', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\Illuminate\Support\Facades\DB::raw('gen_random_uuid()'));
            $table->uuid('created_by');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('code')->unique();
            $table->integer('discount_percentage')->default(0);
            $table->decimal('max_discount_amount', 15, 2)->nullable();
            $table->date('valid_from');
            $table->date('valid_until');
            $table->integer('max_usage')->default(100);
            $table->integer('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('otp_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number');
            $table->string('token', 6);
            $table->string('type')->default('login'); // login, register, reset_password
            $table->timestamp('expires_at');
            $table->boolean('is_used')->default(false);
            $table->timestamps();

            $table->index(['phone_number', 'token']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_tokens');
        Schema::dropIfExists('promos');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('reminders');
    }
};
