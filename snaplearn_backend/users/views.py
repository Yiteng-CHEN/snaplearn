from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.utils.timezone import now
from .models import CustomUser, EducationChoices
from django.core.exceptions import ValidationError
import json
import re
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from .serializers import CustomUserSerializer, VerifyTeacherSerializer
from rest_framework.authtoken.models import Token
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            email = data.get('email')
            education_level = data.get('education_level')

            # 验证必填字段
            if not all([username, password, email, education_level]):
                return JsonResponse({'error': '用户名、密码、邮箱和学历是必填项'}, status=400)

            # 验证邮箱格式
            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_regex, email):
                return JsonResponse({'error': '无效的邮箱格式'}, status=400)

            # 验证密码强度
            if len(password) < 8:
                return JsonResponse({'error': '密码长度至少为8位'}, status=400)

            # 验证学历等级
            if education_level not in dict(EducationChoices.choices()).keys():
                return JsonResponse({'error': '无效的学历等级'}, status=400)

            # 检查用户名和邮箱是否已存在
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'error': '用户名已存在'}, status=400)
            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'error': '邮箱已存在'}, status=400)

            # 创建用户
            user = CustomUser.objects.create_user(
                username=username,
                password=password,
                email=email,
                education_level=education_level
            )

            return JsonResponse({'message': '注册成功'}, status=201)
        except Exception as e:
            # 返回详细的服务器错误信息
            return JsonResponse({'error': f'服务器内部错误: {str(e)}'}, status=500)

    return JsonResponse({'error': '仅支持 POST 请求'}, status=405)

@csrf_exempt
def login_view(request):
    """
    用户登录视图
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({'message': 'CORS preflight check successful'})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                token, _ = Token.objects.get_or_create(user=user)
                return JsonResponse({
                    'message': '登录成功',
                    'token': token.key,
                    'role': user.role,  # 返回用户角色
                }, status=200)
            else:
                return JsonResponse({'error': '用户名或密码错误'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': '仅支持 POST 请求'}, status=405)

@login_required
def logout_view(request):
    """
    用户登出视图
    """
    logout(request)
    return JsonResponse({'message': '登出成功'}, status=200)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    用户个人资料视图（支持 GET 查询和 PUT 修改，包括头像）
    """
    user = request.user
    if request.method == 'GET':
        data = {
            'id': user.id,  # 修复：返回 id 字段
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_verified_teacher': user.is_verified_teacher,
            'education_level': user.education_level,
            'avatar': user.avatar.url if user.avatar else '',  # 返回头像URL
            'review_comment': user.review_comment or '',       # 返回审核意见
            # 其它需要返回的字段
        }
        return Response(data, status=200)
    elif request.method == 'PUT':
        # 允许用户修改邮箱、学历和头像
        email = request.data.get('email')
        education_level = request.data.get('education_level')
        avatar = request.FILES.get('avatar') or request.data.get('avatar')
        if email:
            user.email = email
        if education_level:
            user.education_level = education_level
        if avatar:
            user.avatar = avatar
        user.save()
        return Response({'message': '资料更新成功', 'avatar': user.avatar.url if user.avatar else ''}, status=200)
    return Response({'error': '仅支持 GET/PUT'}, status=405)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_certificate(request):
    """
    用户上传认证材料
    """
    user = request.user
    certificate = request.FILES.get('certificate')

    if not certificate:
        return JsonResponse({'error': '请上传认证材料（教师资格证或硕士及以上学历证明）'}, status=400)

    user.certificate = certificate
    user.save()
    return JsonResponse({'message': '认证材料上传成功，等待管理员审核'}, status=200)

@csrf_exempt
@permission_classes([IsAdminUser])
@api_view(['POST'])
def verify_user(request, user_id):
    """
    管理员审核用户认证请求
    """
    user = get_object_or_404(CustomUser, id=user_id)

    if user.is_verified_teacher:
        return JsonResponse({'error': '该用户已通过认证'}, status=400)

    user.is_verified_teacher = True
    user.verified_by = request.user
    user.verified_at = now()
    user.save()

    return JsonResponse({'message': '用户认证已通过'}, status=200)

@csrf_exempt
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def following_teachers(request):
    """
    获取、关注、取消关注教师
    GET: 获取当前用户关注的教师列表
    POST: 关注教师（需传teacher_id）
    DELETE: 取消关注教师（需传teacher_id）
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': '未登录或登录已过期'}, status=403)
    user = request.user

    if request.method == 'GET':
        teachers = user.following_teachers.filter(is_verified_teacher=True)
        data = [
            {
                'id': int(t.id),  # 修复：确保 id 为 int
                'username': t.username,
                'education_level': t.education_level,
                'avatar_url': t.avatar.url if t.avatar else '',
            }
            for t in teachers
        ]
        return JsonResponse({'following_teachers': data}, status=200)

    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            teacher_id = body.get('teacher_id')
            teacher = CustomUser.objects.get(id=teacher_id, is_verified_teacher=True)
            user.following_teachers.add(teacher)
            return JsonResponse({'message': '关注成功'}, status=200)
        except CustomUser.DoesNotExist:
            return JsonResponse({'error': '教师不存在或未认证'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    if request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            teacher_id = body.get('teacher_id')
            teacher = CustomUser.objects.get(id=teacher_id, is_verified_teacher=True)
            user.following_teachers.remove(teacher)
            return JsonResponse({'message': '已取消关注'}, status=200)
        except CustomUser.DoesNotExist:
            return JsonResponse({'error': '教师不存在或未认证'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': '仅支持 GET/POST/DELETE 请求'}, status=405)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_me(request):
    """
    获取当前登录用户的基本信息
    """
    user = request.user
    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'is_verified_teacher': user.is_verified_teacher,
        'education_level': user.education_level,
    }
    return Response(data, status=200)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    用户修改密码
    """
    user = request.user
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': '原密码和新密码不能为空'}, status=400)
        if not user.check_password(old_password):
            return Response({'error': '原密码错误'}, status=400)
        if len(new_password) < 8:
            return Response({'error': '新密码长度至少为8位'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'message': '密码修改成功'}, status=200)
    except Exception as e:
        return Response({'error': f'修改密码失败: {str(e)}'}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_verification(request):
    """
    用户取消教师认证
    """
    user = request.user
    if not user.is_verified_teacher:
        return JsonResponse({'error': '您当前不是认证教师'}, status=400)
    user.is_verified_teacher = False
    user.review_comment = ''
    user.save()
    return JsonResponse({'message': '已取消认证'}, status=200)

class UserListView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomUser.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for user in queryset:
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'education_level': user.education_level,
                'is_verified_teacher': user.is_verified_teacher,
                'certificate': user.certificate.url if user.certificate else '',
                'review_comment': user.review_comment or '',
            })
        return Response(data, status=200)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

class VerifyTeacherView(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = VerifyTeacherSerializer
    permission_classes = [IsAdminUser]

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        approve = request.data.get('is_verified_teacher')
        review_comment = request.data.get('review_comment', '')
        if approve:
            user.is_verified_teacher = True
            user.verified_by = request.user
            user.verified_at = now()
            user.review_comment = ''
            user.save()
            return Response({"detail": "教师认证已通过。"}, status=status.HTTP_200_OK)
        else:
            user.is_verified_teacher = False
            user.review_comment = review_comment
            user.save()
            return Response({"detail": "教师认证未通过，意见已保存。"}, status=status.HTTP_200_OK)
