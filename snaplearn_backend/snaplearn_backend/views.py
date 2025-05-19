from django.http import JsonResponse

def default_view(request):
    """
    默认视图
    """
    response = JsonResponse({'message': '欢迎访问用户模块！'}, status=200)
    # 添加CORS头，允许所有域访问
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response