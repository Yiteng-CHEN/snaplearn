from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),  # 保证指向新的 profile 视图
    path('me/', views.user_me, name='user_me'),  # 新增：当前用户信息
    path('change_password/', views.change_password, name='change_password'),  # 新增：修改密码接口
    path('upload_certificate/', views.upload_certificate, name='upload_certificate'),  # 新增：上传认证材料接口
    path('teachers/following/', views.following_teachers, name='following_teachers'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/verify-teacher/', views.VerifyTeacherView.as_view(), name='verify-teacher'),
    path('', views.UserListView.as_view(), name='user-list'),  # 新增：用户列表接口，供管理员页面使用
    path('cancel_verification/', views.cancel_verification, name='cancel_verification'),  # 新增：取消认证接口
]