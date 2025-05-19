from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'username', 'email', 'education_level', 'is_verified_teacher', 'is_staff', 'is_superuser', 'certificate', 'review_comment'
    )
    search_fields = ('username', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'education_level', 'certificate')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Verification', {'fields': ('is_verified_teacher', 'verified_by', 'verified_at', 'review_comment')}),
    )

    # 移除 get_queryset 的筛选，显示所有用户
    # def get_queryset(self, request):
    #     qs = super().get_queryset(request)
    #     # 只显示未认证且已上传认证材料的用户
    #     return qs.filter(is_verified_teacher=False).exclude(certificate='')

    def delete_queryset(self, request, queryset):
        ids = list(queryset.values_list('id', flat=True))
        CustomUser.objects.filter(verified_by_id__in=ids).update(verified_by=None)
        super().delete_queryset(request, queryset)

    def delete_model(self, request, obj):
        CustomUser.objects.filter(verified_by=obj).update(verified_by=None)
        super().delete_model(request, obj)
