import mimetypes
import secrets

from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsDoctor, IsPatient

from .models import PatientTravelInfo, SurgeryPackageBooking, SurgeryRecommendation, TravelDocument
from .serializers import (
    SurgeryBookingCreateSerializer,
    SurgeryBookingDetailSerializer,
    SurgeryBookingListSerializer,
    SurgeryRecommendationCreateSerializer,
    SurgeryRecommendationSerializer,
    TravelDocumentSerializer,
    TravelInfoWriteSerializer,
)
from .services import generate_voucher, send_voucher_email

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "application/pdf"}


def _err(code, msg, http=400):
    return Response({"error": {"code": code, "message": msg}}, status=http)


_STATUS_PRIORITY = {"info_pending": 1, "payment_pending": 2, "confirmed": 3, "completed": 4}


def _best_booking_map(bookings_qs, key_fn):
    """Return a dict keyed by key_fn(booking), keeping the highest-priority status per key."""
    result = {}
    for b in bookings_qs:
        k = key_fn(b)
        existing = result.get(k)
        if existing is None or _STATUS_PRIORITY.get(b.status, 0) > _STATUS_PRIORITY.get(existing.status, 0):
            result[k] = b
    return result


def _get_booking(request, pk):
    try:
        return SurgeryPackageBooking.objects.select_related(
            "package__hospital", "patient__user", "travel_info", "coupon"
        ).prefetch_related("documents").get(pk=pk, patient=request.user.patient_profile)
    except SurgeryPackageBooking.DoesNotExist:
        return None


# ── List / Create ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsPatient])
def booking_list(request):
    profile = request.user.patient_profile

    if request.method == "GET":
        qs = SurgeryPackageBooking.objects.select_related(
            "package__hospital", "patient"
        ).filter(patient=profile)
        return Response(SurgeryBookingListSerializer(qs, many=True).data)

    ser = SurgeryBookingCreateSerializer(data=request.data, context={})
    ser.is_valid(raise_exception=True)
    pkg = ser.context["package"]

    booking = SurgeryPackageBooking.objects.create(
        patient=profile,
        package=pkg,
        tentative_date=ser.validated_data["tentative_date"],
        total_amount_usd=pkg.price_usd,
        status="info_pending",
    )
    return Response(SurgeryBookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)


# ── Detail ────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsPatient])
def booking_detail(request, pk):
    booking = _get_booking(request, pk)
    if not booking:
        return _err("not_found", "Booking not found.", 404)
    return Response(SurgeryBookingDetailSerializer(booking).data)


# ── Travel Info ───────────────────────────────────────────────────────────────

@api_view(["PUT"])
@permission_classes([IsPatient])
def booking_travel_info(request, pk):
    booking = _get_booking(request, pk)
    if not booking:
        return _err("not_found", "Booking not found.", 404)
    if booking.status not in ("info_pending", "payment_pending"):
        return _err("invalid_status", "Cannot update travel info at this stage.")

    instance = getattr(booking, "travel_info", None)
    ser = TravelInfoWriteSerializer(instance, data=request.data)
    ser.is_valid(raise_exception=True)
    travel_info = ser.save(booking=booking)

    if booking.status == "info_pending":
        booking.status = "payment_pending"
        booking.save(update_fields=["status", "updated_at"])

    return Response(TravelInfoWriteSerializer(travel_info).data)


# ── Documents ─────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsPatient])
@parser_classes([MultiPartParser, FormParser])
def booking_documents(request, pk):
    booking = _get_booking(request, pk)
    if not booking:
        return _err("not_found", "Booking not found.", 404)

    f = request.FILES.get("file")
    if not f:
        return _err("missing_file", "No file provided.")

    if f.size > MAX_UPLOAD_BYTES:
        return _err("file_too_large", "File exceeds 10 MB limit.")

    mime, _ = mimetypes.guess_type(f.name)
    if mime not in ALLOWED_MIME:
        return _err("invalid_file_type", "Only PDF, JPEG, and PNG are accepted.")

    doc_type = request.data.get("doc_type", "other")
    if doc_type not in dict(TravelDocument.DOC_TYPE_CHOICES):
        return _err("invalid_doc_type", "Invalid document type.")

    doc = TravelDocument.objects.create(
        booking=booking,
        doc_type=doc_type,
        file=f,
        doc_number=request.data.get("doc_number", ""),
        issue_date=request.data.get("issue_date") or None,
        expiry_date=request.data.get("expiry_date") or None,
    )
    return Response(TravelDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsPatient])
def booking_document_delete(request, pk, did):
    booking = _get_booking(request, pk)
    if not booking:
        return _err("not_found", "Booking not found.", 404)

    try:
        doc = TravelDocument.objects.get(pk=did, booking=booking)
    except TravelDocument.DoesNotExist:
        return _err("not_found", "Document not found.", 404)

    if doc.is_verified:
        return _err("already_verified", "Verified documents cannot be deleted.")

    try:
        doc.file.delete(save=False)
    except OSError:
        # Windows can briefly keep uploaded test/dev files locked. The document row
        # should still be removed so the user-facing delete succeeds.
        pass
    doc.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Authenticated document file serving ───────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsPatient | IsAdmin])
def booking_document_file(request, pk, did):
    try:
        if request.user.role == "admin":
            booking = SurgeryPackageBooking.objects.get(pk=pk)
        else:
            booking = SurgeryPackageBooking.objects.get(pk=pk, patient=request.user.patient_profile)
    except SurgeryPackageBooking.DoesNotExist:
        raise Http404

    try:
        doc = TravelDocument.objects.get(pk=did, booking=booking)
    except TravelDocument.DoesNotExist:
        raise Http404

    try:
        return FileResponse(doc.file.open("rb"), as_attachment=True, filename=doc.file.name.split("/")[-1])
    except FileNotFoundError:
        raise Http404


# ── Confirm & Voucher ─────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsPatient])
def booking_confirm(request, pk):
    booking = _get_booking(request, pk)
    if not booking:
        return _err("not_found", "Booking not found.", 404)
    if booking.status != "payment_pending":
        return _err("invalid_status", "Booking must be in payment_pending state to confirm.")

    payment_ref = f"DUMMY-{secrets.token_hex(6).upper()}"
    booking.status = "confirmed"
    booking.payment_ref = payment_ref
    booking.save(update_fields=["status", "payment_ref", "updated_at"])

    from apps.core.models import AuditLog
    AuditLog.objects.create(
        actor=request.user,
        action="surgery.booking.confirmed",
        target_type="SurgeryPackageBooking",
        target_id=booking.id,
        metadata={"package_id": booking.package_id, "patient_email": booking.patient.user.email, "payment_ref": payment_ref},
        ip_address=request.META.get("REMOTE_ADDR"),
    )

    try:
        coupon = generate_voucher(booking)
        send_voucher_email(booking, coupon)
    except Exception:
        pass  # voucher failure shouldn't break the confirmation

    return Response(SurgeryBookingDetailSerializer(booking).data)


@api_view(["GET"])
@permission_classes([IsPatient | IsAdmin])
def booking_voucher(request, pk):
    try:
        if request.user.role == "admin":
            booking = SurgeryPackageBooking.objects.select_related("coupon").get(pk=pk)
        else:
            booking = SurgeryPackageBooking.objects.select_related("coupon").get(
                pk=pk, patient=request.user.patient_profile
            )
    except SurgeryPackageBooking.DoesNotExist:
        raise Http404

    if booking.status != "confirmed" or not hasattr(booking, "coupon"):
        return _err("not_ready", "Voucher not available yet.", 404)

    try:
        coupon = booking.coupon
        if not coupon.voucher_pdf:
            raise FileNotFoundError
        return FileResponse(coupon.voucher_pdf.open("rb"), as_attachment=True,
                            filename=f"MediBridge_Voucher_{booking.id}.pdf",
                            content_type="application/pdf")
    except (FileNotFoundError, ValueError):
        return _err("file_missing", "Voucher PDF not found.", 404)


# ── Admin: Surgery Bookings ───────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_surgery_booking_list(request):
    status_filter = request.query_params.get("status")
    qs = SurgeryPackageBooking.objects.select_related(
        "patient__user", "package__hospital"
    ).order_by("-created_at")
    if status_filter:
        qs = qs.filter(status=status_filter)
    data = []
    for b in qs:
        data.append({
            "id": b.id,
            "patient_name": f"{b.patient.first_name} {b.patient.last_name}".strip() or b.patient.user.email,
            "patient_email": b.patient.user.email,
            "package_name": b.package.name,
            "hospital_name": b.package.hospital.name,
            "status": b.status,
            "tentative_date": b.tentative_date.isoformat(),
            "total_amount_usd": str(b.total_amount_usd),
            "payment_ref": b.payment_ref,
            "created_at": b.created_at.isoformat(),
        })
    return Response(data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAdmin])
def admin_surgery_booking_detail(request, pk):
    try:
        booking = SurgeryPackageBooking.objects.select_related(
            "patient__user", "package__hospital", "travel_info", "coupon"
        ).prefetch_related("documents").get(pk=pk)
    except SurgeryPackageBooking.DoesNotExist:
        return _err("not_found", "Booking not found.", 404)

    if request.method == "PATCH":
        allowed_statuses = ["info_pending", "payment_pending", "confirmed", "completed", "cancelled"]
        new_status = request.data.get("status")
        new_date = request.data.get("tentative_date")

        if new_status and new_status not in allowed_statuses:
            return _err("invalid_status", f"Status must be one of: {', '.join(allowed_statuses)}")

        update_fields = ["updated_at"]
        if new_status:
            booking.status = new_status
            update_fields.append("status")
        if new_date:
            from datetime import date as _date
            try:
                booking.tentative_date = _date.fromisoformat(new_date)
                update_fields.append("tentative_date")
            except ValueError:
                return _err("invalid_date", "Invalid date. Use YYYY-MM-DD.")

        booking.save(update_fields=update_fields)
        booking.refresh_from_db()

    data = SurgeryBookingDetailSerializer(booking).data
    data["patient_name"] = f"{booking.patient.first_name} {booking.patient.last_name}".strip() or booking.patient.user.email
    data["patient_email"] = booking.patient.user.email
    data["patient_user_id"] = booking.patient.user.id
    # Consultation history via linked recommendation
    try:
        rec = SurgeryRecommendation.objects.select_related(
            "doctor", "appointment"
        ).get(patient=booking.patient, package=booking.package)
        rec_data = {
            "doctor_name": f"Dr. {rec.doctor.first_name} {rec.doctor.last_name}".strip(),
            "notes": rec.notes,
            "appointment_id": rec.appointment_id,
            "appointment_date": rec.appointment.scheduled_start.isoformat() if rec.appointment else None,
        }
        if rec.appointment:
            try:
                rx = rec.appointment.prescription
                rec_data["prescription"] = {
                    "id": rx.id,
                    "diagnosis": rx.diagnosis,
                    "general_notes": rx.general_notes,
                    "medicines": [
                        {"medicine_name": m.medicine_name, "dosage": m.dosage, "duration_days": m.duration_days}
                        for m in rx.medicines.all()
                    ],
                    "tests": [{"test_name": t.test_name, "urgency": t.urgency} for t in rx.tests.all()],
                }
            except Exception:
                rec_data["prescription"] = None
        data["recommendation"] = rec_data
    except SurgeryRecommendation.DoesNotExist:
        data["recommendation"] = None
    return Response(data)


# ── Surgery Recommendations ───────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsDoctor])
def doctor_surgery_recommendations(request):
    doctor = request.user.doctor_profile
    if request.method == "GET":
        qs = list(SurgeryRecommendation.objects.filter(doctor=doctor).select_related(
            "package__hospital", "patient__user"
        ))
        # Build booking map: (patient_id, package_id) → highest-priority booking
        if qs:
            bookings_qs = SurgeryPackageBooking.objects.filter(
                patient_id__in={r.patient_id for r in qs},
                package_id__in={r.package_id for r in qs},
            ).exclude(status="cancelled")
            bookings_map = _best_booking_map(bookings_qs, lambda b: (b.patient_id, b.package_id))
        else:
            bookings_map = {}
        result = []
        for rec in qs:
            item = dict(SurgeryRecommendationSerializer(rec).data)
            booking = bookings_map.get((rec.patient_id, rec.package_id))
            item["booking_id"] = booking.id if booking else None
            item["booking_status"] = booking.status if booking else None
            result.append(item)
        return Response(result)

    ser = SurgeryRecommendationCreateSerializer(data=request.data, context={"doctor": doctor})
    ser.is_valid(raise_exception=True)
    rec = ser.save()
    return Response(SurgeryRecommendationSerializer(rec).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsPatient])
def patient_surgery_recommendations(request):
    patient = request.user.patient_profile
    qs = list(SurgeryRecommendation.objects.filter(
        patient=patient
    ).select_related("package__hospital", "doctor"))
    # Non-cancelled bookings: package_id → highest-priority booking
    bookings_qs = SurgeryPackageBooking.objects.filter(patient=patient).exclude(status="cancelled")
    bookings_map = _best_booking_map(bookings_qs, lambda b: b.package_id)
    result = []
    for rec in qs:
        item = dict(SurgeryRecommendationSerializer(rec).data)
        booking = bookings_map.get(rec.package_id)
        item["booking_id"] = booking.id if booking else None
        item["booking_status"] = booking.status if booking else None
        result.append(item)
    return Response(result)
