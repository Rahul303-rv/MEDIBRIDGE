from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from apps.core.permissions import IsPatient
from .models import PatientProfile
from .serializers import PatientProfileSerializer


@api_view(["GET", "PATCH"])
@permission_classes([IsPatient])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def patient_profile(request):
    profile = PatientProfile.objects.get(user=request.user)

    if request.method == "GET":
        return Response(PatientProfileSerializer(profile).data)

    serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
