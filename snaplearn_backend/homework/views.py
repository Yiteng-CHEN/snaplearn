from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Homework, Question, StudentAnswer, StudentAIHelpRecord, StudentHomeworkResult, MistakeBook, SubjectiveCorrectionLog
from .serializers import HomeworkSerializer, StudentAnswerSerializer, StudentHomeworkResultSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction
import requests
from django.db.models import Q
import random
from django.utils import timezone
from videos.models import Video

class UploadHomeworkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not getattr(user, 'is_verified_teacher', False):
            return Response({'error': '仅认证教师可上传作业'}, status=403)
        data = request.data
        with transaction.atomic():
            hw = Homework.objects.create(
                title=data.get('title', ''),
                description=data.get('description', ''),
                teacher=user
            )
            for q in data.get('questions', []):
                Question.objects.create(
                    homework=hw,
                    question_type=q['question_type'],
                    text=q['text'],
                    options=q.get('options', []),
                    answer=q['answer'],
                    score=q.get('score', 5)
                )
        return Response({'msg': '作业上传成功'})

class HomeworkListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 学生端只返回题目，不含标准答案
        homeworks = Homework.objects.all()
        serializer = HomeworkSerializer(homeworks, many=True)
        return Response(serializer.data)

class HomeworkListStudentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 只返回题目，不含标准答案
        homeworks = Homework.objects.all().order_by('-created_at')
        data = []
        for hw in homeworks:
            questions = hw.questions.all()
            qlist = []
            for q in questions:
                qlist.append({
                    'id': q.id,
                    'question_type': q.question_type,
                    'text': q.text,
                    'options': q.options,
                    'score': getattr(q, 'score', 5)
                })
            data.append({
                'id': hw.id,
                'title': hw.title,
                'description': hw.description,
                'questions': qlist
            })
        return Response(data)

class SubmitAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        answer = request.data.get('answer')
        student = request.user
        # 客观题自动判分
        if question.question_type in ['single', 'multiple']:
            is_correct = answer == question.answer
            score = 1.0 if is_correct else 0.0
            comment = "正确" if is_correct else "错误"
        else:
            # 主观题调用AI
            ans_str = answer if isinstance(answer, str) else str(answer)
            ref_str = question.answer if isinstance(question.answer, str) else str(question.answer)
            ai_result = requests.post(
                "http://127.0.0.1:8001/api/grade/",
                json={
                    "question": question.text,
                    "answer": ans_str,
                    "reference_answer": ref_str,
                    "max_score": question.score  # 传递题目分数
                }
            ).json()
            score = ai_result.get("score", 0)
            comment = ai_result.get("comment", "")
        student_answer = StudentAnswer.objects.create(
            question=question,
            student=student,
            answer=answer,
            score=score,
            comment=comment,
            graded=True,
        )
        return Response(StudentAnswerSerializer(student_answer).data)

class AIHelpView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        student = request.user
        record, _ = StudentAIHelpRecord.objects.get_or_create(student=student, question=question)
        record.times += 1
        record.save()
        # 只输出解题思路
        ai_response = requests.post(
            "http://127.0.0.1:8001/api/ask/",
            json={"question": f"请只给出解题思路，不要直接给答案。题目：{question.text}"}
        ).json()
        return Response({"hint": ai_response["answer"], "times": record.times})

class AIHelpFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        student = request.user
        record = get_object_or_404(StudentAIHelpRecord, student=student, question=question)
        record.solved = True
        record.save()
        # 可扩展：将 record.times 反馈给 AI 系统
        return Response({"msg": "反馈已记录", "times": record.times})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_mistake_book(request):
    user = request.user
    mistakes = MistakeBook.objects.filter(student=user)
    all_mistakes = list(mistakes)
    # 保证不重复且数量逻辑
    if len(all_mistakes) > 10:
        selected = random.sample(all_mistakes, 10)
    else:
        selected = all_mistakes
    data = []
    for mb in selected:
        q = mb.question
        data.append({
            "id": q.id,
            "question_type": q.question_type,
            "text": q.text,
            "options": q.options,
            # 不返回标准答案
            "score": q.score,
            "wrong_times": mb.wrong_times,
            "last_wrong_answer": mb.last_wrong_answer,
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_mistake_book(request):
    """
    用户答题后更新错题集（前端每答对一题调用，传question_id和is_correct）
    """
    user = request.user
    qid = request.data.get('question_id')
    is_correct = request.data.get('is_correct')
    try:
        mb = MistakeBook.objects.get(student=user, question_id=qid)
        if is_correct:
            # 答对一次就删除:
            mb.delete()
        else:
            mb.wrong_times += 1  # 累计答错次数
            mb.save()
        return Response({"msg": "ok"})
    except MistakeBook.DoesNotExist:
        return Response({"msg": "not found"}, status=404)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_homeworks(request):
    user = request.user
    homeworks = Homework.objects.filter(teacher=user)
    data = [{"id": hw.id, "title": hw.title, "description": hw.description} for hw in homeworks]
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def homework_students(request, homework_id):
    # 返回提交过该作业的学生列表
    results = StudentHomeworkResult.objects.filter(homework_id=homework_id)
    users = []
    for r in results:
        u = r.student
        users.append({
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar.url if u.avatar else '',
        })
    return Response(users)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def homework_student_detail(request, homework_id, student_id):
    # 返回某学生某作业的详细答题情况
    try:
        result = StudentHomeworkResult.objects.get(homework_id=homework_id, student_id=student_id)
        answers = StudentAnswer.objects.filter(question__homework_id=homework_id, student_id=student_id)
        data = {
            "total_score": result.total_score,
            "submitted_at": result.submitted_at,
            "answers": [
                {
                    "question_text": a.question.text,
                    "answer": a.answer,
                    "score": a.score,
                    "comment": a.comment,
                } for a in answers
            ]
        }
        return Response(data)
    except StudentHomeworkResult.DoesNotExist:
        return Response({"error": "未找到作业"}, status=404)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_homework_by_video(request, video_id):
    """
    支持 /videos/<video_id>/submit_homework/ 提交作业
    """
    try:
        homework = Homework.objects.get(video_id=video_id)
    except Homework.DoesNotExist:
        return Response({'error': '未找到该视频对应的作业'}, status=404)
    user = request.user
    answers = request.data.get('answers', {})
    total_score = 0
    explanations = []
    # 兼容前端传数组或dict
    if isinstance(answers, list):
        answer_map = {str(idx): ans for idx, ans in enumerate(answers)}
    else:
        answer_map = answers
    for idx, q in enumerate(homework.questions.all()):
        ans = answer_map.get(str(idx)) or answer_map.get(str(q.id)) or ''
        # 客观题
        if q.question_type in ['single', 'multiple']:
            correct = False
            if q.question_type == 'single':
                correct = (str(ans).strip().upper() == str(q.answer).strip().upper())
            else:
                ans_set = set([x.strip().upper() for x in str(ans).split(',') if x.strip()])
                std_set = set([x.strip().upper() for x in str(q.answer).split(',') if x.strip()])
                correct = ans_set == std_set and len(ans_set) == len(std_set)
            score = q.score if correct else 0
            comment = "正确" if correct else "错误"
            if not correct:
                explanations.append(f"题目：{q.text}，你的答案：{ans}，正确答案：{q.answer}")
            # 错题集逻辑
            mb, created = MistakeBook.objects.get_or_create(student=user, question=q)
            if correct:
                mb.delete()
            else:
                mb.wrong_times = 0
                mb.last_wrong_answer = str(ans)
                mb.save()
        else:
            # 主观题，调用AI
            ai_result = {}
            try:
                ai_result = requests.post(
                    "http://127.0.0.1:8001/api/grade/",
                    json={
                        "question": q.text,
                        "answer": ans,
                        "reference_answer": q.answer,
                        "max_score": q.score  # 传递题目分数
                    }
                ).json()
            except Exception:
                ai_result = {"score": 0, "comment": "AI批改失败"}
            score = ai_result.get("score", 0)
            comment = ai_result.get("comment", "")
            if score < q.score:
                explanations.append(f"题目：{q.text}，AI评语：{comment}")
            mb, created = MistakeBook.objects.get_or_create(student=user, question=q)
            if score == q.score:
                mb.delete()
            else:
                mb.wrong_times = 0
                mb.last_wrong_answer = str(ans)
                mb.save()
        StudentAnswer.objects.create(
            question=q,
            student=user,
            answer=ans,
            score=score,
            comment=comment,
            graded=True,
        )
        total_score += score
    # 保存学生作业成绩
    StudentHomeworkResult.objects.update_or_create(
        homework=homework, student=user,
        defaults={'total_score': total_score, 'explanations': explanations}
    )
    return Response({
        "total_score": total_score,
        "explanations": explanations
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_score(request):
    """
    老师修正主观题分数，记录修正日志，并自动更新总分
    """
    user = request.user
    answer_id = request.data.get('answer_id')
    new_score = request.data.get('new_score')
    comment = request.data.get('comment', '')
    try:
        ans = StudentAnswer.objects.get(id=answer_id)
        if not hasattr(user, 'is_verified_teacher') or not user.is_verified_teacher:
            return Response({'error': '无权限'}, status=403)
        old_score = ans.score
        old_comment = ans.comment
        ans.score = float(new_score)
        ans.comment = comment
        ans.graded = True
        ans.save()
        # 记录修正日志
        ScoreCorrectionLog.objects.create(
            answer=ans,
            teacher=user,
            old_score=old_score,
            new_score=ans.score,
            old_comment=old_comment,
            new_comment=comment,
        )
        # 自动更新总分
        try:
            result = StudentHomeworkResult.objects.get(homework=ans.question.homework, student=ans.student)
            total = StudentAnswer.objects.filter(
                question__homework=ans.question.homework,
                student=ans.student
            ).aggregate(s=models.Sum('score'))['s'] or 0
            result.total_score = total
            result.save()
        except StudentHomeworkResult.DoesNotExist:
            pass
        return Response({'msg': 'ok'})
    except StudentAnswer.DoesNotExist:
        return Response({'error': '答题不存在'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_question(request, homework_id):
    """
    给指定作业添加题目（支持主观题/客观题）
    """
    user = request.user
    try:
        homework = Homework.objects.get(id=homework_id)
    except Homework.DoesNotExist:
        return Response({'error': '作业不存在'}, status=404)
    if not getattr(user, 'is_verified_teacher', False):
        return Response({'error': '仅认证教师可添加题目'}, status=403)
    data = request.data
    q = Question.objects.create(
        homework=homework,
        question_type=data.get('question_type'),
        text=data.get('text'),
        options=data.get('options', []),
        answer=data.get('answer'),
        score=data.get('score', 5),
    )
    return Response({'msg': '题目添加成功', 'question_id': q.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def correct_subjective_answer(request):
    """
    老师修正主观题得分和评语，并记录修正历史
    POST参数: answer_id, ai_score, ai_comment, teacher_score, teacher_comment
    """
    user = request.user
    if not user.is_verified_teacher:
        return Response({'error': '只有认证教师可以修正'}, status=403)
    data = request.data
    answer_id = data.get('answer_id')
    ai_score = data.get('ai_score')
    ai_comment = data.get('ai_comment')
    teacher_score = data.get('teacher_score')
    teacher_comment = data.get('teacher_comment')
    if not answer_id:
        return Response({'error': '缺少参数'}, status=400)
    try:
        answer = StudentAnswer.objects.get(id=answer_id)
        # 记录修正日志
        SubjectiveCorrectionLog.objects.create(
            answer=answer,
            question=answer.question,
            ai_score=ai_score,
            teacher_score=teacher_score,
            ai_comment=ai_comment,
            teacher_comment=teacher_comment,
            teacher=user,
            corrected_at=timezone.now()
        )
        # 更新当前作业题目的得分和评语
        answer.score = teacher_score
        answer.comment = teacher_comment
        answer.graded = True
        answer.save()
        return Response({'message': '修正成功'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
