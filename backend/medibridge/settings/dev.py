from .base import *
from decouple import config

DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": config("DB_NAME", default="medibridge"),
        "USER": config("DB_USER", default="root"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="127.0.0.1"),
        "PORT": config("DB_PORT", default="3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

CORS_ALLOWED_ORIGINS = [SITE_FRONTEND_URL]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [SITE_FRONTEND_URL]
