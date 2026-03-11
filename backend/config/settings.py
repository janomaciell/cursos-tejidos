from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# INSTALLED APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.users',
    'apps.courses',
    'apps.payments',
    'apps.videos',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# DATABASE (Supabase PostgreSQL)
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=0,           # Sin pooling (requerido para Supabase)
            conn_health_checks=True,
            ssl_require=True,
        )
    }
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,
        'sslmode': 'require',
        'options': '-c statement_timeout=30000',  # 30s timeout
    }
    # CRÍTICO: deshabilitar server-side cursors para Transaction/Session Pooler
    DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True

    if DEBUG:
        print("✓ Conectado a Supabase via DATABASE_URL")
        print(f"✓ Host: {DATABASES['default']['HOST']}")
        print(f"✓ Puerto: {DATABASES['default']['PORT']}")
else:
    # Fallback: variables individuales
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('SUPABASE_DB_NAME', default='postgres'),
            'USER': config('SUPABASE_DB_USER', default='postgres'),
            'PASSWORD': config('SUPABASE_DB_PASSWORD', default=''),
            'HOST': config('SUPABASE_DB_HOST', default=''),
            'PORT': config('SUPABASE_DB_PORT', default='5432'),
            'OPTIONS': {
                'connect_timeout': 10,
                'sslmode': 'require',
                'options': '-c statement_timeout=30000',
            },
            'CONN_MAX_AGE': 0,
            'DISABLE_SERVER_SIDE_CURSORS': True,
        }
    }

# Supabase client keys
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_SERVICE_ROLE_KEY = config('SUPABASE_SERVICE_ROLE_KEY', default='')
SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY', default='')


# AUTH
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# INTERNATIONALIZATION
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# MEDIA FILES
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# DEFAULT PRIMARY KEY
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',
}

# JWT SETTINGS
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS SETTINGS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173'
).split(',')
CORS_ALLOW_CREDENTIALS = True
# Permitir header de ngrok para evitar la página de aviso cuando la API se expone por ngrok
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + ['ngrok-skip-browser-warning']

# FRONTEND URL (para back_urls de Mercado Pago)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
# BACKEND URL pública (ngrok o dominio). MP necesita notification_url accesible desde internet.
BACKEND_URL = config('BACKEND_URL', default='').strip() or None

# MERCADO PAGO
MERCADOPAGO_ACCESS_TOKEN = config('MERCADOPAGO_ACCESS_TOKEN', default='')
MERCADOPAGO_PUBLIC_KEY = config('MERCADOPAGO_PUBLIC_KEY', default='')
MERCADOPAGO_WEBHOOK_SECRET = config('MERCADOPAGO_WEBHOOK_SECRET', default='')

# CLOUDFLARE STREAM
CLOUDFLARE_ACCOUNT_ID = config('CLOUDFLARE_ACCOUNT_ID', default='')
CLOUDFLARE_API_TOKEN = config('CLOUDFLARE_API_TOKEN', default='')
CLOUDFLARE_STREAM_URL = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream"
CLOUDFLARE_CUSTOMER_SUBDOMAIN = config('CLOUDFLARE_CUSTOMER_SUBDOMAIN', default='')

# GOOGLE OAUTH (login/registro con Google)
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='').strip()

# EMAIL (opcional para recuperación de contraseña)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@elearning.com')



# SECURITY SETTINGS (Production)
if not DEBUG:
    # ngrok ya maneja HTTPS externamente; activar SSL_REDIRECT causaría loops.
    # En cambio, confiamos en el header que ngrok/proxy envía.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # SECURE_SSL_REDIRECT = True  ← desactivado: el proxy (ngrok) ya redirige a HTTPS
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True