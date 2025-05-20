from django.urls import path
from .views import GradeView, AskView

urlpatterns = [
    path('grade/', GradeView.as_view()),
    path('ask/', AskView.as_view()),
]