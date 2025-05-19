import os
import subprocess
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.text import get_valid_filename
from users.models import CustomUser, EducationChoices


def validate_video_file(value):
    """
    验证视频文件的大小和格式
    """
    max_file_size = 50 * 1024 * 1024  # 50 MB
    allowed_formats = ['.mp4', '.avi', '.mov', '.mkv']

    # 检查文件大小
    if value.size > max_file_size:
        raise ValidationError(f"视频文件大小不能超过 {max_file_size / (1024 * 1024)} MB")

    # 检查文件格式
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in allowed_formats:
        raise ValidationError(f"仅支持以下视频格式: {', '.join(allowed_formats)}")


def validate_video_duration(value):
    """
    验证视频时长，确保路径安全
    """
    try:
        # 获取文件的安全路径
        file_path = value.temporary_file_path()

        # 验证路径是否在受控目录中
        if not os.path.commonpath([file_path, settings.MEDIA_ROOT]) == settings.MEDIA_ROOT:
            raise ValidationError("文件路径不安全，拒绝访问")

        # 使用 FFmpeg 获取视频时长
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        duration = float(result.stdout)

        if duration > 600:  # 10 分钟 = 600 秒
            raise ValidationError("视频时长不能超过 10 分钟")
    except Exception as e:
        raise ValidationError("无法验证视频时长，请上传有效的视频文件")


def calculate_target_size(duration, base_size_mb=5, size_per_second_mb=0.075, max_size_mb=50):
    """
    根据视频时长动态计算目标大小，确保不超过最大大小
    """
    target_size = base_size_mb + (duration * size_per_second_mb)
    return min(target_size, max_size_mb)


def generate_multi_bitrate_versions(input_file_path, output_dir, duration):
    """
    使用 FFmpeg 为视频生成多码率版本，并动态调整目标大小
    """
    resolutions = {
        "1080p": {"width": 1920, "height": 1080, "base_size_mb": 20},
        "720p": {"width": 1280, "height": 720, "base_size_mb": 10},
        "480p": {"width": 854, "height": 480, "base_size_mb": 5},
    }

    output_files = {}

    for resolution, settings in resolutions.items():
        # 动态计算目标大小
        target_size_mb = calculate_target_size(duration, base_size_mb=settings["base_size_mb"])
        target_size = target_size_mb * 1024 * 1024  # 转换为字节
        target_bitrate = (target_size * 8) / duration  # 比特率 = 文件大小（字节） * 8 / 时长（秒）

        output_file_path = os.path.join(output_dir, f"{resolution}.mp4")
        try:
            subprocess.run([
                "ffmpeg", "-i", input_file_path,
                "-vf", f"scale={settings['width']}:{settings['height']}",
                "-b:v", f"{int(target_bitrate)}k",
                "-bufsize", f"{int(target_bitrate)}k",
                "-maxrate", f"{int(target_bitrate)}k",
                "-c:v", "libx264",
                "-c:a", "aac",
                "-preset", "medium",
                output_file_path
            ], check=True)
            output_files[resolution] = output_file_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"生成 {resolution} 版本失败: {str(e)}")

    return output_files


class Video(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    teacher = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    video_file = models.FileField(upload_to='videos/')
    is_free = models.BooleanField(default=False)
    price = models.PositiveIntegerField(blank=True, null=True)  # SnapCoin 价格
    free_watch_duration = models.PositiveIntegerField(blank=True, null=True, verbose_name="免费观看时长（分钟）")
    created_at = models.DateTimeField(auto_now_add=True)
    # 新增字段
    education_level = models.CharField(
        max_length=10,
        choices=EducationChoices.choices(),
        help_text="视频适合的学历等级",
        blank=True, null=True,  # 允许为空，便于迁移
        default=''              # 或者你可以设置一个合适的默认值
    )
    subject = models.CharField(
        max_length=20,
        help_text="视频所属学科",
        blank=True, null=True,  # 允许为空，便于迁移
        default=''
    )

    def __str__(self):
        return self.title

    @property
    def thumbnail_url(self):
        # 假设缩略图与视频同名，放在thumbnails/目录下
        if self.video_file:
            import os
            from django.conf import settings
            base, ext = os.path.splitext(os.path.basename(self.video_file.name))
            thumb_path = f"thumbnails/{base}.jpg"
            full_thumb_path = os.path.join(settings.MEDIA_ROOT, thumb_path)
            if os.path.exists(full_thumb_path):
                # 确保返回以 /media/ 开头的相对路径
                return (settings.MEDIA_URL or '/media/') + thumb_path
            # 调试用：输出缩略图不存在的路径
            # print(f"缩略图不存在: {full_thumb_path}")
        return ''

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # 自动生成缩略图
        if self.video_file:
            import os
            from django.conf import settings
            base, ext = os.path.splitext(os.path.basename(self.video_file.name))
            thumb_path = os.path.join(settings.MEDIA_ROOT, "thumbnails", f"{base}.jpg")
            video_path = self.video_file.path
            if not os.path.exists(thumb_path):
                os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
                try:
                    subprocess.run([
                        "ffmpeg", "-i", video_path, "-ss", "00:00:01", "-vframes", "1", thumb_path
                    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                except subprocess.CalledProcessError as e:
                    print(f"生成缩略图失败: {e.stderr.decode('utf-8')}")
                except Exception as e:
                    print(f"生成缩略图失败: {e}")


class VideoAccess(models.Model):
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='video_access')
    video = models.ForeignKey('videos.Video', on_delete=models.CASCADE, related_name='access_records')
    purchased_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.video.title}"


class DiscountCode(models.Model):
    video = models.ForeignKey(
        'videos.Video',
        on_delete=models.CASCADE,
        related_name="discount_codes_for_videos",
    )
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True, verbose_name="描述")
    remaining_uses = models.PositiveIntegerField(default=0)
    expiration_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    is_active = models.BooleanField(default=True, verbose_name="是否启用")

    def __str__(self):
        return f"{self.code} - {self.video.title}"