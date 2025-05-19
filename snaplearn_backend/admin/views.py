from django.shortcuts import render
import os
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from users.models import CustomUser
from videos.models import Video
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cleanup_unused_files(request):
    """
    清理 media 目录下未被数据库引用的冗余文件，仅管理员可用
    """
    # 只允许管理员
    user = request.user
    if not (user.is_superuser or (hasattr(user, 'role') and user.role == 'admin')):
        return JsonResponse({'error': '无权限'}, status=403)

    # 1. 收集数据库中所有引用的文件路径
    used_files = set()

    # 用户头像
    for user in CustomUser.objects.all():
        if user.avatar and user.avatar.name:
            used_files.add(os.path.normpath(user.avatar.path))
        if user.certificate and user.certificate.name:
            used_files.add(os.path.normpath(user.certificate.path))

    # 视频和缩略图
    for video in Video.objects.all():
        if hasattr(video, 'video_file') and video.video_file and video.video_file.name:
            used_files.add(os.path.normpath(video.video_file.path))
        if hasattr(video, 'thumbnail') and video.thumbnail and video.thumbnail.name:
            used_files.add(os.path.normpath(video.thumbnail.path))

    # 2. 遍历 media 目录，删除未被引用的文件
    deleted_files = []
    for root, dirs, files in os.walk(settings.MEDIA_ROOT):
        for fname in files:
            fpath = os.path.normpath(os.path.join(root, fname))
            if fpath not in used_files:
                try:
                    os.remove(fpath)
                    deleted_files.append(fpath.replace(str(settings.MEDIA_ROOT), ''))
                except Exception as e:
                    pass  # 可记录日志

    return JsonResponse({
        'message': f'清理完成，删除了 {len(deleted_files)} 个冗余文件。',
        'deleted_files': deleted_files,
    })
