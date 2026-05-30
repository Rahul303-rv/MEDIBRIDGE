import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import connection
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailNotification


def send_email_async(**kwargs):
    """Send an email in a background thread so the HTTP request returns
    immediately. Prevents slow SMTP connections (e.g. Gmail on a free-tier
    host) from blocking the response and causing 502 gateway errors.
    """
    def _worker():
        try:
            send_email(**kwargs)
        finally:
            # Each thread gets its own DB connection — close it to avoid leaks.
            connection.close()

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def send_email(
    to_email: str,
    subject: str,
    template_name: str,
    context: dict,
    context_type: str = "",
    context_id: int | None = None,
) -> EmailNotification:
    context.setdefault("platform_name", settings.PLATFORM_NAME)
    context.setdefault("site_url", settings.SITE_FRONTEND_URL)

    body_html = render_to_string(f"emails/{template_name}.html", context)
    body_text = render_to_string(f"emails/{template_name}.txt", context)

    notification = EmailNotification.objects.create(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        context_type=context_type,
        context_id=context_id,
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(body_html, "text/html")
        msg.send()
        notification.status = "sent"
        notification.sent_at = timezone.now()
    except Exception as exc:
        notification.status = "failed"
        notification.error = str(exc)

    notification.save()
    return notification


def send_email_with_attachment(
    to_email: str,
    subject: str,
    template_name: str,
    context: dict,
    attachment_filename: str,
    attachment_content: bytes,
    attachment_mimetype: str = "application/pdf",
    context_type: str = "",
    context_id: int | None = None,
) -> EmailNotification:
    context.setdefault("platform_name", settings.PLATFORM_NAME)
    context.setdefault("site_url", settings.SITE_FRONTEND_URL)

    body_html = render_to_string(f"emails/{template_name}.html", context)
    body_text = render_to_string(f"emails/{template_name}.txt", context)

    notification = EmailNotification.objects.create(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        context_type=context_type,
        context_id=context_id,
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(body_html, "text/html")
        msg.attach(attachment_filename, attachment_content, attachment_mimetype)
        msg.send()
        notification.status = "sent"
        notification.sent_at = timezone.now()
    except Exception as exc:
        notification.status = "failed"
        notification.error = str(exc)

    notification.save()
    return notification
