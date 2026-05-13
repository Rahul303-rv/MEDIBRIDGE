from django.utils import timezone
from rest_framework import serializers
from .models import PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    is_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            "id", "first_name", "last_name", "date_of_birth", "gender",
            "height_cm", "weight_kg", "blood_group", "phone", "alt_phone",
            "country", "state", "city", "address_line", "postal_code",
            "timezone", "emergency_contact_name", "emergency_contact_phone",
            "existing_conditions", "allergies", "current_medications",
            "profile_image", "is_complete", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_complete"]

    def validate_date_of_birth(self, value):
        if value and value >= timezone.now().date():
            raise serializers.ValidationError("Date of birth must be in the past.")
        return value
