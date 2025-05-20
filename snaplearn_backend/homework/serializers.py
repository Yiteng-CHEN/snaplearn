from rest_framework import serializers
from .models import Homework, Question, StudentAnswer, StudentHomeworkResult

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_type', 'text', 'options', 'score']

class HomeworkSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Homework
        fields = ['id', 'title', 'description', 'questions']

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class StudentHomeworkResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentHomeworkResult
        fields = '__all__'