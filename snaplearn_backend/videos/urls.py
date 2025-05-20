from django.urls import path
from . import views
from homework.views import submit_homework_by_video

urlpatterns = [
    path('', views.list_videos, name='list_videos'),  # 新增：支持 GET /videos/
    path('manage/', views.list_uploaded_videos),
    path('upload/', views.upload_video),
    path('<int:video_id>/homework/', views.video_homework, name='video_homework'),
    path('<int:video_id>/submit_homework/', submit_homework_by_video, name='submit_homework_by_video'),
    path('favorites/', views.favorites_videos, name='favorites_videos'),  # 新增收藏视频接口
    path('<int:video_id>/update/', views.update_video, name='update_video'),  # 新增更新视频信息接口
    path('<int:video_id>/delete/', views.delete_video, name='delete_video'),  # 修正路由，去掉前缀
    # 其它视频相关接口...
]