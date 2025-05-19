from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'education_level', 'certificate',
            'is_verified_teacher', 'email_verified', 'unique_identifier',
            'verified_by', 'verified_at'
        ]
        read_only_fields = ['is_verified_teacher', 'verified_by', 'verified_at']

class VerifyTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['is_verified_teacher']
        read_only_fields = ['is_verified_teacher']