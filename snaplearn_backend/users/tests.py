from django.test import TestCase
from users.models import CustomUser, RoleChoices, EducationChoices
from django.core.exceptions import ValidationError

class CustomUserModelTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create(
            username="testuser",
            role=RoleChoices.TEACHER.value,
            education_level=EducationChoices.BACHELOR.value,
        )

    def test_teacher_requires_certificate_or_higher_education(self):
        self.user.certificate = None
        with self.assertRaises(ValidationError):
            self.user.clean()

    def test_unique_identifier_validation(self):
        self.user.unique_identifier = "unique123"
        self.user.save()
        duplicate_user = CustomUser(username="duplicate", unique_identifier="unique123")
        with self.assertRaises(ValidationError):
            duplicate_user.clean()

    def test_file_validation(self):
        # 测试文件大小和类型的验证逻辑
        pass  # 这里可以模拟上传文件进行测试
