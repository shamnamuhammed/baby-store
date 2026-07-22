# core/cors.py

# Development
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [" http://127.0.0.1:3000"]

# If using cookies/authentication
CORS_ALLOW_CREDENTIALS = True

# Allowed headers
from corsheaders.defaults import default_headers

# CORS_ALLOW_HEADERS = list(default_headers) + [
#     "authorization",
#     "content-type",
# ]

CSRF_TRUSTED_ORIGINS = [
    " http://127.0.0.1:3000/",
]

# Allowed HTTP methods
from corsheaders.defaults import default_methods,default_headers

CORS_ALLOW_METHODS = list(default_methods)
CORS_ALLOW_HEADERS = list(default_headers)
# Expose response headers (optional)
CORS_EXPOSE_HEADERS = [
    "Content-Type",
]