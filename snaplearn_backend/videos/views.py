from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Video
from users.models import CustomUser
from django.conf import settings

# Create your views here.

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_video(request):
    if not request.user.is_verified_teacher:
        return JsonResponse({'error': '只有认证教师可以上传视频'}, status=403)

    title = request.POST.get('title')
    description = request.POST.get('description')
    video_file = request.FILES.get('video_file')
    subject = request.POST.get('subject')
    education_level = request.POST.get('education_level')
    thumbnail = request.FILES.get('thumbnail')

    # 新增：获取 is_free 和 price 字段
    is_free = request.POST.get('is_free', 'true').lower() == 'true'
    price = request.POST.get('price')
    if not is_free:
        try:
            price = float(price)
        except (TypeError, ValueError):
            return JsonResponse({'error': '付费视频必须提供有效的价格'}, status=400)
    else:
        price = None

    # 必填字段校验
    if not title or not video_file or not subject or not education_level:
        return JsonResponse({'error': '标题、视频文件、学科和学历等级为必填项'}, status=400)

    try:
        video = Video(
            title=title,
            description=description,
            teacher=request.user,
            video_file=video_file,
            is_free=is_free,
            price=price,
            subject=subject,
            education_level=education_level
        )
        video.full_clean()  # 调用模型层校验（如文件大小/格式等）
        video.save()
        # 保存自定义封面或自动生成
        import os
        base, ext = os.path.splitext(os.path.basename(video.video_file.name))
        thumb_dir = os.path.join(settings.MEDIA_ROOT, "thumbnails")
        os.makedirs(thumb_dir, exist_ok=True)
        thumb_path = os.path.join(thumb_dir, f"{base}.jpg")
        if thumbnail:
            with open(thumb_path, 'wb+') as f:
                for chunk in thumbnail.chunks():
                    f.write(chunk)
        else:
            # 自动用视频第一帧生成封面
            try:
                video_path = video.video_file.path
                import subprocess
                # 确保 ffmpeg 路径正确，且加上 -y 覆盖参数
                cmd = [
                    "ffmpeg",
                    "-y",
                    "-i", video_path,
                    "-ss", "00:00:01",
                    "-vframes", "1",
                    "-f", "image2",
                    thumb_path
                ]
                # 使用 check=True 让异常抛出
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            except subprocess.CalledProcessError as e:
                print(f"ffmpeg error: {e.stderr.decode('utf-8')}")
            except Exception as e:
                print(f"自动生成视频封面失败: {e}")
        return JsonResponse({'message': '视频上传成功', 'video_id': video.id}, status=201)
    except ValidationError as e:
        return JsonResponse({'error': e.message_dict if hasattr(e, 'message_dict') else str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'上传失败: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_video(request, video_id):
    # 查看视频逻辑
    return JsonResponse({'message': f'正在查看视频 {video_id}'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_video(request, video_id):
    # 购买视频逻辑
    return JsonResponse({'message': f'视频 {video_id} 购买成功'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_uploaded_videos(request):
    """
    列出当前用户上传的视频
    """
    if request.user.is_verified_teacher:
        videos = Video.objects.filter(teacher=request.user)
        video_list = [
            {
                'id': video.id,
                'title': video.title,
                'description': video.description,
                'is_free': video.is_free,
                'price': video.price,
                'created_at': video.created_at,
            }
            for video in videos
        ]
        return JsonResponse({'videos': video_list}, status=200)
    return JsonResponse({'error': '只有认证教师可以管理视频'}, status=403)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_video(request, video_id):
    """
    删除当前用户上传的视频，并删除其所有关联的题目
    """
    try:
        video = Video.objects.get(id=video_id, teacher=request.user)
        # 删除视频下的所有题目
        video.questions.all().delete()
        # 删除视频
        video.delete()
        return JsonResponse({'message': '视频及其所有题目删除成功'}, status=200)
    except Video.DoesNotExist:
        return JsonResponse({'error': '视频不存在或无权限删除'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_video(request, video_id):
    """
    更新当前用户上传的视频信息
    """
    thumbnail = request.FILES.get('thumbnail')
    try:
        video = Video.objects.get(id=video_id, teacher=request.user)
        title = request.POST.get('title', video.title)
        description = request.POST.get('description', video.description)
        is_free = request.POST.get('is_free', str(video.is_free)).lower() == 'true'
        price = request.POST.get('price', video.price)

        video.title = title
        video.description = description
        video.is_free = is_free
        video.price = price if not is_free else None
        video.subject = request.POST.get('subject', video.subject)
        video.education_level = request.POST.get('education_level', video.education_level)
        video.save()
        # 保存自定义封面或自动生成
        import os
        base, ext = os.path.splitext(os.path.basename(video.video_file.name))
        thumb_dir = os.path.join(settings.MEDIA_ROOT, "thumbnails")
        os.makedirs(thumb_dir, exist_ok=True)
        thumb_path = os.path.join(thumb_dir, f"{base}.jpg")
        if thumbnail:
            with open(thumb_path, 'wb+') as f:
                for chunk in thumbnail.chunks():
                    f.write(chunk)
        elif not os.path.exists(thumb_path):
            # 自动用视频第一帧生成封面（仅当没有封面时）
            try:
                video_path = video.video_file.path
                import subprocess
                cmd = [
                    "ffmpeg",
                    "-y",
                    "-i", video_path,
                    "-ss", "00:00:01",
                    "-vframes", "1",
                    "-f", "image2",
                    thumb_path
                ]
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            except subprocess.CalledProcessError as e:
                print(f"ffmpeg error: {e.stderr.decode('utf-8')}")
            except Exception as e:
                print(f"自动生成视频封面失败: {e}")
        return JsonResponse({'message': '视频信息更新成功'}, status=200)
    except Video.DoesNotExist:
        return JsonResponse({'error': '视频不存在或无权限更新'}, status=404)

@api_view(['GET'])
def list_videos(request):
    """
    支持 GET /videos/?education_level=xxx[,yyy,...]&subject=xxx&ordering=-created_at&teacher_id=xxx&search=xxx
    """
    print("收到 /videos/ 请求 method:", request.method, "path:", request.path, "GET:", request.GET)  # 调试用
    if request.method == 'GET':
        education_level = request.GET.get('education_level')
        subject = request.GET.get('subject')
        ordering = request.GET.get('ordering', '-created_at')
        teacher_id = request.GET.get('teacher_id')
        search = request.GET.get('search', '').strip()
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))

        qs = Video.objects.all()
        # 支持学历等级多选
        if education_level:
            levels = [x.strip() for x in education_level.split(',') if x.strip()]
            if levels:
                qs = qs.filter(education_level__in=levels)
        # 修正：学科筛选应为 subject 字段精确匹配
        if subject:
            qs = qs.filter(subject=subject)
        if teacher_id:
            if str(teacher_id).isdigit():
                qs = qs.filter(teacher__id=int(teacher_id))
        # 新增：模糊搜索
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        qs = qs.order_by(ordering)
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        results = []
        for v in page_obj:
            # 修复缩略图URL为绝对路径
            thumb_url = getattr(v, 'thumbnail_url', '') if hasattr(v, 'thumbnail_url') else ''
            if thumb_url:
                if not thumb_url.startswith('http'):
                    thumb_url = request.build_absolute_uri(thumb_url)
            results.append({
                'id': v.id,
                'title': v.title,
                'description': v.description,
                'video_url': v.video_file.url if v.video_file else '',
                'teacher_id': v.teacher.id,
                'teacher_name': v.teacher.username,
                'teacher_avatar': v.teacher.avatar.url if v.teacher.avatar else '',
                'created_at': v.created_at,
                'thumbnail_url': thumb_url,
                'subject': v.subject,  # 补充返回 subject 字段，便于前端学科分类
                'education_level': v.education_level,  # 补充返回学历等级
            })
        return JsonResponse({
            'count': paginator.count,
            'results': results,
            'page': page,
            'page_size': page_size,
        }, status=200)
    return JsonResponse({'error': '仅支持 GET'}, status=405)

@csrf_exempt
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def favorite_videos(request):
    """
    GET: 获取当前用户收藏的视频列表
    POST: 收藏视频（需传 video_id）
    DELETE: 取消收藏视频（需传 video_id）
    """
    user = request.user
    if not hasattr(user, 'favorite_videos'):
        # 动态添加 ManyToManyField（如果模型未定义，建议在 CustomUser 中添加 favorite_videos 字段）
        from django.db import models
        if not hasattr(CustomUser, 'favorite_videos'):
            CustomUser.add_to_class('favorite_videos', models.ManyToManyField(Video, related_name='favorited_by', blank=True))
    if request.method == 'GET':
        videos = user.favorite_videos.all()
        results = []
        for v in videos:
            # 修复缩略图URL为绝对路径
            thumb_url = getattr(v, 'thumbnail_url', '') if hasattr(v, 'thumbnail_url') else ''
            if thumb_url:
                if not thumb_url.startswith('http'):
                    thumb_url = request.build_absolute_uri(thumb_url)
            results.append({
                'id': int(v.id),
                'title': v.title,
                'description': v.description,
                'video_url': v.video_file.url if v.video_file else '',
                'teacher_id': int(v.teacher.id),
                'teacher_name': v.teacher.username,
                'teacher_avatar': v.teacher.avatar.url if v.teacher.avatar else '',
                'created_at': v.created_at,
                'thumbnail_url': thumb_url,
            })
        return JsonResponse({'results': results}, status=200)
    elif request.method == 'POST':
        video_id = request.data.get('video_id') or (request.data['video_id'] if 'video_id' in request.data else None)
        if not video_id:
            try:
                import json
                body = json.loads(request.body)
                video_id = body.get('video_id')
            except Exception:
                video_id = None
        if not video_id:
            return JsonResponse({'error': '缺少 video_id'}, status=400)
        try:
            video = Video.objects.get(id=video_id)
            user.favorite_videos.add(video)
            return JsonResponse({'message': '收藏成功'}, status=200)
        except Video.DoesNotExist:
            return JsonResponse({'error': '视频不存在'}, status=404)
    elif request.method == 'DELETE':
        video_id = request.data.get('video_id') or (request.data['video_id'] if 'video_id' in request.data else None)
        if not video_id:
            try:
                import json
                body = json.loads(request.body)
                video_id = body.get('video_id')
            except Exception:
                video_id = None
        if not video_id:
            return JsonResponse({'error': '缺少 video_id'}, status=400)
        try:
            video = Video.objects.get(id=video_id)
            user.favorite_videos.remove(video)
            return JsonResponse({'message': '已取消收藏'}, status=200)
        except Video.DoesNotExist:
            return JsonResponse({'error': '视频不存在'}, status=404)
    return JsonResponse({'error': '仅支持 GET/POST/DELETE'}, status=405)
