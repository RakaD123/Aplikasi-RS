<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\HealthLog;
use App\Models\PatientProfile;
use App\Models\Promo;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- ADMIN ----
        $admin = User::create([
            'full_name' => 'Administrator RS Digital',
            'email' => 'admin@rsdigital.id',
            'phone_number' => '081100000001',
            'password' => Hash::make('Admin@12345'),
            'role' => 'admin',
            'phone_verified_at' => now(),
        ]);

        // ---- DOCTORS ----
        $doctorUsers = [
            ['full_name' => 'Sarah Amelia', 'phone' => '081100000011', 'spec' => 'Penyakit Dalam', 'branch' => 'RS Digital Jakarta Pusat', 'exp' => 12, 'fee' => '350000'],
            ['full_name' => 'Budi Santoso', 'phone' => '081100000012', 'spec' => 'Jantung & Pembuluh Darah', 'branch' => 'RS Digital Jakarta Selatan', 'exp' => 15, 'fee' => '450000'],
            ['full_name' => 'Cindy Wijaya', 'phone' => '081100000013', 'spec' => 'Anak', 'branch' => 'RS Digital Tangerang', 'exp' => 8, 'fee' => '300000'],
            ['full_name' => 'Denny Prasetyo', 'phone' => '081100000014', 'spec' => 'Bedah Umum', 'branch' => 'RS Digital Jakarta Pusat', 'exp' => 20, 'fee' => '500000'],
            ['full_name' => 'Eka Putri', 'phone' => '081100000015', 'spec' => 'Obstetri & Ginekologi', 'branch' => 'RS Digital Jakarta Selatan', 'exp' => 10, 'fee' => '400000'],
            ['full_name' => 'Farid Maulana', 'phone' => '081100000016', 'spec' => 'Kulit & Kelamin', 'branch' => 'RS Digital Jakarta Pusat', 'exp' => 7, 'fee' => '280000'],
        ];

        $doctors = [];
        foreach ($doctorUsers as $d) {
            $user = User::create([
                'full_name' => $d['full_name'],
                'email' => strtolower(str_replace(' ', '.', $d['full_name'])) . '@rsdigital.id',
                'phone_number' => $d['phone'],
                'password' => Hash::make('Doctor@12345'),
                'role' => 'doctor',
                'phone_verified_at' => now(),
            ]);

            $doctor = Doctor::create([
                'user_id' => $user->id,
                'specialization' => $d['spec'],
                'hospital_branch' => $d['branch'],
                'experience_years' => $d['exp'],
                'consultation_fee' => $d['fee'],
                'rating' => round(rand(40, 50) / 10, 1),
                'total_patients' => rand(500, 5000),
                'bio' => "Dr. {$d['full_name']} adalah spesialis {$d['spec']} berpengalaman dengan {$d['exp']} tahun pengalaman.",
            ]);

            // Add weekly schedules
            $days = ['Monday', 'Wednesday', 'Friday'];
            foreach ($days as $day) {
                DoctorSchedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '08:00',
                    'end_time' => '12:00',
                    'hospital_branch' => $d['branch'],
                ]);
            }

            $doctors[] = $doctor;
        }

        // ---- PATIENTS ----
        $patients = [];
        $patientData = [
            ['name' => 'Ahmad Fajar', 'phone' => '081200000001'],
            ['name' => 'Siti Rahayu', 'phone' => '081200000002'],
            ['name' => 'Budi Hartono', 'phone' => '081200000003'],
            ['name' => 'Dewi Lestari', 'phone' => '081200000004'],
            ['name' => 'Eko Prasetyo', 'phone' => '081200000005'],
        ];

        foreach ($patientData as $p) {
            $user = User::create([
                'full_name' => $p['name'],
                'email' => strtolower(str_replace(' ', '.', $p['name'])) . '@mail.com',
                'phone_number' => $p['phone'],
                'password' => Hash::make('Patient@12345'),
                'role' => 'patient',
                'phone_verified_at' => now(),
            ]);

            PatientProfile::create([
                'user_id' => $user->id,
                'date_of_birth' => now()->subYears(rand(25, 65)),
                'gender' => rand(0, 1) ? 'male' : 'female',
                'blood_type' => collect(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'])->random(),
            ]);

            // Health logs
            for ($i = 0; $i < 10; $i++) {
                HealthLog::create([
                    'user_id' => $user->id,
                    'metric_type' => collect(['bloodPressure', 'bloodSugar', 'heartRate', 'weight'])->random(),
                    'value' => rand(60, 180),
                    'unit' => 'mmHg',
                    'trend' => collect(['up', 'down', 'stable'])->random(),
                    'recorded_at' => now()->subDays(rand(0, 30)),
                ]);
            }

            // Reminders
            Reminder::create([
                'user_id' => $user->id,
                'title' => 'Paracetamol 500mg',
                'type' => 'medication',
                'frequency' => 'daily',
                'scheduled_time' => '08:00',
            ]);

            $patients[] = $user;
        }

        // ---- BOOKINGS ----
        foreach ($patients as $i => $patient) {
            $doctor = $doctors[$i % count($doctors)];
            Booking::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_time' => now()->addDays(rand(1, 14)),
                'complaint' => 'Kontrol rutin',
                'booking_status' => 'confirmed',
                'payment_status' => 'paid',
                'amount' => 350000,
                'payment_method' => 'virtual_account',
                'paid_at' => now(),
            ]);
        }

        // ---- ARTICLES ----
        $articleData = [
            ['title' => 'Tips Menjaga Tekanan Darah Normal', 'category' => 'Kardiologi'],
            ['title' => 'Panduan Diet Sehat untuk Penderita Diabetes', 'category' => 'Penyakit Dalam'],
            ['title' => 'Pentingnya Vaksinasi Anak', 'category' => 'Pediatri'],
            ['title' => 'Mengenal Gejala Penyakit Jantung Koroner', 'category' => 'Kardiologi'],
            ['title' => 'Cara Mengatasi Stres dan Menjaga Kesehatan Mental', 'category' => 'Kesehatan Jiwa'],
        ];

        foreach ($articleData as $a) {
            Article::create([
                'author_id' => $admin->id,
                'title' => $a['title'],
                'slug' => Str::slug($a['title']) . '-' . Str::random(5),
                'excerpt' => 'Artikel informatif mengenai ' . $a['category'] . ' oleh tim medis RS Digital.',
                'content' => 'Konten artikel lengkap mengenai ' . $a['title'] . '...',
                'category' => $a['category'],
                'read_time' => rand(3, 10),
                'is_published' => true,
                'published_at' => now()->subDays(rand(1, 60)),
            ]);
        }

        // ---- PROMOS ----
        $promoData = [
            ['title' => 'Diskon Medical Check-Up 30%', 'code' => 'CHECKUP30', 'disc' => 30, 'days' => 30],
            ['title' => 'Konsultasi Online Hemat 20%', 'code' => 'ONLINE20', 'disc' => 20, 'days' => 45],
            ['title' => 'Promo Vaksinasi Keluarga 25%', 'code' => 'VAKSIN25', 'disc' => 25, 'days' => 60],
        ];

        foreach ($promoData as $p) {
            Promo::create([
                'created_by' => $admin->id,
                'title' => $p['title'],
                'code' => $p['code'],
                'discount_percentage' => $p['disc'],
                'valid_from' => now(),
                'valid_until' => now()->addDays($p['days']),
                'max_usage' => 100,
            ]);
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->table(
            ['Role', 'Email / Phone', 'Password'],
            [
                ['Admin', 'admin@rsdigital.id / 081100000001', 'Admin@12345'],
                ['Doctor', 'sarah.amelia@rsdigital.id / 081100000011', 'Doctor@12345'],
                ['Patient', 'ahmad.fajar@mail.com / 081200000001', 'Patient@12345'],
            ]
        );
    }
}
