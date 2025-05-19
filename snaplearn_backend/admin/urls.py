from django.urls import path
from .views import cleanup_unused_files

urlpatterns = [
    path('cleanup/', cleanup_unused_files, name='admin-cleanup'),
]
