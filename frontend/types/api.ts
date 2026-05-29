export interface User {
  id: number;
  email: string;
  role: "patient" | "doctor" | "admin";
  is_email_verified: boolean;
  date_joined: string;
}

export interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "";
  height_cm: number | null;
  weight_kg: string | null;
  blood_group: string;
  phone: string;
  alt_phone: string;
  country: string;
  state: string;
  city: string;
  address_line: string;
  postal_code: string;
  timezone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  existing_conditions: string;
  allergies: string;
  current_medications: string;
  profile_image: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialization {
  id: number;
  name: string;
  slug: string;
}

export interface DoctorEducation {
  id: number;
  degree: string;
  institution: string;
  year_completed: number;
}

export interface DoctorProfile {
  id: number;
  first_name: string;
  last_name: string;
  slug: string;
  phone: string;
  profile_image: string | null;
  signature_image: string | null;
  bio: string;
  medical_council_reg_no: string | null;
  years_of_experience: number | null;
  consultation_fee_usd: string | null;
  consultation_duration_min: number;
  languages: string;
  hospital_affiliation: string;
  timezone: string;
  specializations: Specialization[];
  education: DoctorEducation[];
  is_verified: boolean;
  is_available: boolean;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface SymptomIntake {
  id: number;
  chief_complaint: string;
  symptoms: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
  existing_conditions_note: string;
  preferred_doctor: number | null;
  status: "pending" | "matched" | "cancelled";
  matched_doctor_detail: {
    id: number;
    first_name: string;
    last_name: string;
    slug: string;
    specializations: Specialization[];
  } | null;
  matched_at: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSymptomIntake extends Omit<SymptomIntake, "preferred_doctor"> {
  patient_name: string;
  patient_email: string;
  preferred_doctor_detail: {
    id: number;
    first_name: string;
    last_name: string;
    slug: string;
    specializations: Specialization[];
  } | null;
  matched_by_email: string | null;
}

export interface Appointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_slug: string;
  doctor_fee: string | null;
  intake: number | null;
  parent_appointment: number | null;
  fee_waived: boolean;
  scheduled_start: string;
  scheduled_end: string;
  status: "proposed" | "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  payment_ref: string;
  meeting_link: string;
  notes: string;
  has_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorAppointment {
  id: number;
  patient_name: string;
  patient_email: string;
  intake: number | null;
  parent_appointment: number | null;
  fee_waived: boolean;
  scheduled_start: string;
  scheduled_end: string;
  status: "proposed" | "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  meeting_link: string;
  notes: string;
  has_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailabilitySlot {
  id: number;
  slot_type: "recurring_weekly" | "specific_date";
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface AvailableSlot {
  start: string;
  end: string;
  duration_min: number;
}

export interface PrescriptionMedicine {
  id: number;
  medicine_name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: "before_meal" | "after_meal" | "with_meal" | "any";
  duration_days: number;
  instructions: string;
}

export interface PrescribedTest {
  id: number;
  test_name: string;
  urgency: "routine" | "urgent";
  instructions: string;
}

export interface Prescription {
  id: number;
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  doctor_reg_no: string;
  patient_name: string;
  patient_email: string;
  diagnosis: string;
  general_notes: string;
  follow_up_required: boolean;
  follow_up_after_days: number | null;
  medicines: PrescriptionMedicine[];
  tests: PrescribedTest[];
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  description: string;
  image: string | null;
  accreditations: string;
  website: string;
  is_partner: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurgeryPackage {
  id: number;
  hospital: number;
  hospital_name: string;
  hospital_city: string;
  name: string;
  slug: string;
  surgery_type: string;
  description: string;
  total_duration_days: number;
  hospital_stay_days: number;
  recovery_stay_days: number;
  price_usd: string;
  includes_flight: boolean;
  flight_class: "economy" | "business";
  includes_visa_assistance: boolean;
  includes_accommodation: boolean;
  accommodation_type: "hotel_3star" | "hotel_4star" | "serviced_apt";
  includes_transport: boolean;
  includes_meals: boolean;
  inclusions_text: string;
  exclusions_text: string;
  image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurgeryPackageDetail extends SurgeryPackage {
  related_packages: SurgeryPackage[];
}

export interface TravelDocument {
  id: number;
  doc_type: "passport" | "visa" | "govt_id" | "other";
  doc_number: string;
  issue_date: string | null;
  expiry_date: string | null;
  uploaded_at: string;
  is_verified: boolean;
}

export interface PatientTravelInfo {
  passport_number: string;
  passport_country: string;
  passport_expiry: string;
  visa_required: boolean;
  visa_status: "not_applied" | "applied" | "granted" | "not_required";
  current_occupation: string;
  employer: string;
  annual_income_usd: string | null;
  companion_count: number;
  companion_details: string;
  dietary_requirements: string;
  special_needs: string;
}

export interface SurgeryCoupon {
  code: string;
  issued_at: string;
  valid_from: string;
  valid_until: string;
}

export interface SurgeryBookingList {
  id: number;
  package: number;
  package_name: string;
  hospital_name: string;
  surgery_type: string;
  status: "info_pending" | "payment_pending" | "confirmed" | "completed" | "cancelled";
  tentative_date: string;
  total_amount_usd: string;
  created_at: string;
}

export interface SurgeryBookingDetail {
  id: number;
  package: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  hospital_city: string;
  surgery_type: string;
  status: "info_pending" | "payment_pending" | "confirmed" | "completed" | "cancelled";
  tentative_date: string;
  total_amount_usd: string;
  payment_ref: string;
  travel_info: PatientTravelInfo | null;
  documents: TravelDocument[];
  coupon: SurgeryCoupon | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalReport {
  id: number;
  title: string;
  file: string;
  uploaded_at: string;
}

export interface PatientMedicalProfile {
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  height_cm: number | null;
  weight_kg: string | null;
  blood_group: string;
  existing_conditions: string;
  allergies: string;
  current_medications: string;
  medical_reports: MedicalReport[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
