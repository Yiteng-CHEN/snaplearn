from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Homework(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='homeworks')
    created_at = models.DateTimeField(auto_now_add=True)
    video = models.OneToOneField('videos.Video', on_delete=models.CASCADE, related_name='homework', null=True, blank=True)

class Question(models.Model):
    QUESTION_TYPES = (
        ('single', '单选题'),
        ('multiple', '多选题'),
        ('subjective', '主观题'),
    )
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=16, choices=QUESTION_TYPES)
    text = models.TextField()
    options = models.JSONField(blank=True, null=True, help_text="仅客观题用")
    answer = models.JSONField(help_text="单选/多选为选项列表，主观题为字符串")
    score = models.FloatField(default=5)

class StudentAnswer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    answer = models.JSONField()
    score = models.FloatField(null=True, blank=True)
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded = models.BooleanField(default=False)

class ScoreCorrectionLog(models.Model):
    answer = models.ForeignKey('StudentAnswer', on_delete=models.CASCADE)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    old_score = models.FloatField()
    new_score = models.FloatField()
    old_comment = models.TextField(blank=True)
    new_comment = models.TextField(blank=True)
    corrected_at = models.DateTimeField(auto_now_add=True)

class StudentHomeworkResult(models.Model):
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    total_score = models.FloatField(null=True, blank=True)  # 允许为null
    explanations = models.JSONField(default=list, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='graded')  # graded/pending

    class Meta:
        unique_together = ('homework', 'student')

class StudentAIHelpRecord(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    times = models.IntegerField(default=0)
    solved = models.BooleanField(default=False)
    last_help_time = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'question')

class MistakeBook(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mistake_book')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    wrong_times = models.IntegerField(default=0)  # 累计答错次数
    last_wrong_answer = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('student', 'question')

class SubjectiveCorrectionLog(models.Model):
    answer = models.ForeignKey('StudentAnswer', on_delete=models.CASCADE, related_name='correction_logs')
    question = models.ForeignKey('Question', on_delete=models.CASCADE)
    ai_score = models.FloatField()
    teacher_score = models.FloatField()
    ai_comment = models.TextField(blank=True, null=True)
    teacher_comment = models.TextField(blank=True, null=True)
    corrected_at = models.DateTimeField(auto_now_add=True)
    teacher = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"修正: 答案{self.answer_id} 题目{self.question_id} by {self.teacher_id}"
