from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_videos, name='list_videos'),    # /videos/
    path('upload/', views.upload_video, name='upload_video'),  # /videos/upload/
    path('<int:video_id>/', views.view_video, name='view_video'),
    path('<int:video_id>/purchase/', views.purchase_video, name='purchase_video'),
    path('manage/', views.list_uploaded_videos, name='list_uploaded_videos'),
    path('<int:video_id>/delete/', views.delete_video, name='delete_video'),
    path('<int:video_id>/update/', views.update_video, name='update_video'),
    # 新增收藏相关接口
    path('favorites/', views.favorite_videos, name='favorite_videos'),
]