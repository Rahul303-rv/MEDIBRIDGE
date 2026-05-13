from rest_framework import serializers

from .models import PatientTravelInfo, SurgeryPackageBooking, SurgeryCoupon, SurgeryRecommendation, TravelDocument


class TravelDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelDocument
        fields = ["id", "doc_type", "doc_number", "issue_date", "expiry_date",
                  "uploaded_at", "is_verified"]
        read_only_fields = ["id", "uploaded_at", "is_verified"]


class PatientTravelInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTravelInfo
        exclude = ["id", "booking"]


class SurgeryCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurgeryCoupon
        fields = ["code", "issued_at", "valid_from", "valid_until"]


class SurgeryBookingListSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    hospital_name = serializers.CharField(source="package.hospital.name", read_only=True)
    surgery_type = serializers.CharField(source="package.surgery_type", read_only=True)
    recommended_by_doctor = serializers.SerializerMethodField()

    class Meta:
        model = SurgeryPackageBooking
        fields = ["id", "package_name", "hospital_name", "surgery_type",
                  "status", "tentative_date", "total_amount_usd", "created_at",
                  "recommended_by_doctor"]

    def get_recommended_by_doctor(self, obj):
        try:
            rec = SurgeryRecommendation.objects.select_related("doctor").get(
                patient=obj.patient, package=obj.package
            )
            return f"Dr. {rec.doctor.first_name} {rec.doctor.last_name}".strip()
        except SurgeryRecommendation.DoesNotExist:
            return None


class SurgeryBookingDetailSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_slug = serializers.CharField(source="package.slug", read_only=True)
    hospital_name = serializers.CharField(source="package.hospital.name", read_only=True)
    hospital_city = serializers.CharField(source="package.hospital.city", read_only=True)
    surgery_type = serializers.CharField(source="package.surgery_type", read_only=True)
    travel_info = PatientTravelInfoSerializer(read_only=True)
    documents = TravelDocumentSerializer(many=True, read_only=True)
    coupon = SurgeryCouponSerializer(read_only=True)
    recommendation = serializers.SerializerMethodField()

    class Meta:
        model = SurgeryPackageBooking
        fields = [
            "id", "package", "package_name", "package_slug", "hospital_name",
            "hospital_city", "surgery_type", "status", "tentative_date",
            "total_amount_usd", "payment_ref", "travel_info", "documents",
            "coupon", "recommendation", "created_at", "updated_at",
        ]

    def get_recommendation(self, obj):
        try:
            rec = SurgeryRecommendation.objects.select_related(
                "doctor", "appointment"
            ).get(patient=obj.patient, package=obj.package)
        except SurgeryRecommendation.DoesNotExist:
            return None

        result = {
            "id": rec.id,
            "doctor_name": f"Dr. {rec.doctor.first_name} {rec.doctor.last_name}".strip(),
            "notes": rec.notes,
            "appointment_id": rec.appointment_id,
            "appointment_date": rec.appointment.scheduled_start.isoformat() if rec.appointment else None,
        }
        if rec.appointment:
            try:
                rx = rec.appointment.prescription
                result["prescription"] = {
                    "id": rx.id,
                    "diagnosis": rx.diagnosis,
                    "general_notes": rx.general_notes,
                    "medicines": [
                        {
                            "medicine_name": m.medicine_name,
                            "dosage": m.dosage,
                            "duration_days": m.duration_days,
                            "morning": m.morning,
                            "afternoon": m.afternoon,
                            "evening": m.evening,
                            "night": m.night,
                            "meal_timing": m.meal_timing,
                        }
                        for m in rx.medicines.all()
                    ],
                    "tests": [{"test_name": t.test_name, "urgency": t.urgency} for t in rx.tests.all()],
                }
            except Exception:
                result["prescription"] = None
        return result


class SurgeryBookingCreateSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()
    tentative_date = serializers.DateField()

    def validate_package_id(self, value):
        from apps.hospitals.models import SurgeryPackage
        try:
            pkg = SurgeryPackage.objects.get(pk=value, is_active=True)
        except SurgeryPackage.DoesNotExist:
            raise serializers.ValidationError("Package not found or inactive.")
        self.context["package"] = pkg
        return value


class TravelInfoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTravelInfo
        exclude = ["id", "booking"]


class SurgeryRecommendationSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    package_slug = serializers.CharField(source="package.slug", read_only=True)
    hospital_name = serializers.CharField(source="package.hospital.name", read_only=True)
    surgery_type = serializers.CharField(source="package.surgery_type", read_only=True)
    price_usd = serializers.CharField(source="package.price_usd", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()

    class Meta:
        model = SurgeryRecommendation
        fields = [
            "id", "package", "package_name", "package_slug", "hospital_name",
            "surgery_type", "price_usd", "doctor_name", "patient_name",
            "patient_email", "notes", "appointment", "created_at",
        ]

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.first_name} {obj.doctor.last_name}".strip()

    def get_patient_name(self, obj):
        name = f"{obj.patient.first_name} {obj.patient.last_name}".strip()
        return name or obj.patient.user.email

    def get_patient_email(self, obj):
        return obj.patient.user.email


class SurgeryRecommendationCreateSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    package_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        from apps.consultations.models import Appointment
        from apps.hospitals.models import SurgeryPackage
        doctor = self.context["doctor"]

        try:
            appt = Appointment.objects.select_related("patient__user").get(
                pk=data["appointment_id"], doctor=doctor, status="completed"
            )
        except Appointment.DoesNotExist:
            raise serializers.ValidationError(
                {"appointment_id": "Completed appointment not found for this doctor."}
            )

        try:
            pkg = SurgeryPackage.objects.get(pk=data["package_id"], is_active=True)
        except SurgeryPackage.DoesNotExist:
            raise serializers.ValidationError(
                {"package_id": "Surgery package not found or inactive."}
            )

        data["appointment"] = appt
        data["package"] = pkg
        return data

    def create(self, validated_data):
        return SurgeryRecommendation.objects.create(
            doctor=self.context["doctor"],
            patient=validated_data["appointment"].patient,
            appointment=validated_data["appointment"],
            package=validated_data["package"],
            notes=validated_data.get("notes", ""),
        )
