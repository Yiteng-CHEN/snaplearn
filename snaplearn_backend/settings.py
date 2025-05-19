INSTALLED_APPS = [
    # ...existing code...
    'corsheaders',
    # ...existing code...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...existing code...
]

CORS_ALLOW_ALL_ORIGINS = True  # 开发环境可用，生产建议用 CORS_ALLOWED_ORIGINS