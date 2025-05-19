from celery import shared_task
from .models import Video

@shared_task
def process_video(video_id):
    """
    异步处理视频压缩和多码率生成
    """
    video = Video.objects.get(id=video_id)
    video.save()  # 调用 save 方法生成多码率版本