from rest_framework import serializers
from .models import Video, VideoAccess

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'

class VideoAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoAccess
        fields = '__all__'