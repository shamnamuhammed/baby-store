from corsheaders.defaults import default_headers, default_methods

# Development
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost(:[0-9]+)?$",
    r"^http://127\.0\.0\.1(:[0-9]+)?$",
    r"^http://10\.0\.2\.2(:[0-9]+)?$",
    r"^http://192\.168\.[0-9]+\.[0-9]+(:[0-9]+)?$",
]

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

# If using cookies/authentication
CORS_ALLOW_CREDENTIALS = True

# Allowed headers
CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://localhost",
]

# Allowed HTTP methods
CORS_ALLOW_METHODS = list(default_methods)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-csrftoken",
    "accept",
    "authorization",
]

# Expose response headers (optional)
CORS_EXPOSE_HEADERS = [
    "Content-Type",
]