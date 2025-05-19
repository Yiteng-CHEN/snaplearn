from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from enum import Enum


class EducationChoices(Enum):
    PRIMARY = 'primary'
    MIDDLE = 'middle'
    HIGH = 'high'
    BACHELOR = 'bachelor'
    MASTER = 'master'
    PHD = 'phd'

    @classmethod
    def choices(cls):
        return [(tag.value, tag.name) for tag in cls]


def validate_certificate_file(value):
    max_size = 5 * 1024 * 1024  # 5 MB
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
    if value.size > max_size:
        raise ValidationError("文件大小不能超过 5MB。")
    if value.content_type not in allowed_types:
        raise ValidationError("仅支持 PDF、JPEG 和 PNG 格式的文件。")


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('用户名是必填项')
        if not email:
            raise ValueError('邮箱是必填项')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)  # 确保加密密码
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')  # 保证超级管理员role为admin

        if extra_fields.get('is_staff') is not True:
            raise ValueError('超级用户必须设置 is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('超级用户必须设置 is_superuser=True')

        return self.create_user(username, email, password, **extra_fields)


class CustomUser(AbstractUser):
    education_level = models.CharField(
        max_length=10,
        choices=EducationChoices.choices(),
        default=EducationChoices.PRIMARY.value,
        help_text="用户的学历等级"
    )
    certificate = models.FileField(
        upload_to='certificates/',
        blank=True,
        null=True,
        validators=[validate_certificate_file],
        help_text="上传的教师资格证或学历证明"
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text="用户头像"
    )
    is_verified_teacher = models.BooleanField(default=False, help_text="是否通过认证")
    verified_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_teachers',
        help_text="审核此用户的管理员"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="认证通过的时间"
    )
    following_teachers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='followers',
        blank=True,
        limit_choices_to={'is_verified_teacher': True},
        help_text="当前用户关注的教师"
    )
    role = models.CharField(
        max_length=20,
        default='user',
        help_text="user, admin"
    )
    review_comment = models.TextField(
        blank=True,
        null=True,
        help_text="认证审核意见（仅审核不通过时填写）"
    )
    favorite_videos = models.ManyToManyField(
        'videos.Video',
        related_name='favorited_by',
        blank=True,
        help_text="用户收藏的视频"
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'  # 明确指定用户名为登录字段
    REQUIRED_FIELDS = ['email']  # 创建超级用户时需要邮箱
    EMAIL_FIELD = 'email'

    def __str__(self):
        return f"{self.username} ({self.education_level})"

    def clean(self):
        super().clean()
        if self.is_verified_teacher and not self.certificate:
            raise ValidationError("认证需要上传教师资格证或硕士及以上学历证明。")

    def save(self, *args, **kwargs):
        # 检查 verified_by 是否指向有效用户
        if self.verified_by_id is not None and not CustomUser.objects.filter(id=self.verified_by_id).exists():
            self.verified_by = None
        super().save(*args, **kwargs)

    @property
    def can_upload_content(self):
        """
        判断用户是否有上传内容的权限：
        - 用户必须通过认证
        """
        return self.is_verified_teacher

