export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at: string;
  avatar_url?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  user?: User;
  name: string;
  specialization: string;
  practice_schedule: string;
  hospital_branch: string;
  is_active: boolean;
  avatar_url?: string;
  experience_years?: number;
  total_patients?: number;
  rating?: number;
  available_slots?: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  doctor_id: string;
  doctor?: Doctor;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  booking_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  transaction_date: string;
  appointment_time: string;
  amount?: number;
}

export interface HealthLog {
  id: string;
  user_id: string;
  metric_type: 'blood_pressure' | 'blood_sugar' | 'cholesterol' | 'weight' | 'heart_rate' | 'temperature';
  value: number;
  secondary_value?: number; // for blood pressure (diastolic)
  unit: string;
  recorded_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'once';
  scheduled_time: string;
  is_active: boolean;
  type: 'medication' | 'lab_check' | 'health_log';
}

export interface Consultation {
  id: string;
  booking_id: string;
  patient_id: string;
  doctor_id: string;
  room_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  medical_notes?: string;
  e_prescription_url?: string;
  created_at: string;
  doctor?: Doctor;
  patient?: User;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  read_time: number;
  published_at: string;
  tags: string[];
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  discount_percentage?: number;
  valid_until: string;
  terms_conditions: string;
  is_active: boolean;
  code?: string;
}

export interface Transaction {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  transaction_date: string;
  invoice_url?: string;
  booking?: Booking;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface OTPRequest {
  phone_number: string;
}

export interface OTPVerify {
  phone_number: string;
  otp_code: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}
