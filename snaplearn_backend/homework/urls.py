from django.urls import path
from . import views
from .views import add_question

urlpatterns = [
    path('homeworks/', views.HomeworkListStudentView.as_view()),  # 学生获取作业列表
    path('upload/', views.UploadHomeworkView.as_view()),          # 教师上传作业
    path('questions/<int:question_id>/submit/', views.SubmitAnswerView.as_view()),
    path('questions/<int:question_id>/ai_help/', views.AIHelpView.as_view()),
    path('questions/<int:question_id>/ai_feedback/', views.AIHelpFeedbackView.as_view()),
    path('mistakebook/', views.get_mistake_book),
    path('mistakebook/update/', views.update_mistake_book),
    path('myhomeworks/', views.my_homeworks),
    path('homework/<int:homework_id>/students/', views.homework_students),
    path('homework/<int:homework_id>/student/<int:student_id>/', views.homework_student_detail),
    path('submit_by_video/<int:video_id>/', views.submit_homework_by_video, name='submit_homework_by_video'),
    path('<int:homework_id>/add_question/', add_question, name='add_question'),
    path('correct_subjective/', views.correct_subjective_answer, name='correct_subjective_answer'),
]