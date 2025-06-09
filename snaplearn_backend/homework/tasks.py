from celery import shared_task
from .models import StudentHomeworkResult, StudentAnswer
from django.utils import timezone
import requests

@shared_task
def batch_grade_pending_homeworks():
    pendings = StudentHomeworkResult.objects.filter(status='pending')
    for result in pendings:
        answers = StudentAnswer.objects.filter(student=result.student, question__homework=result.homework)
        total_score = 0
        explanations = []
        for answer in answers:
            if answer.question.question_type in ['single', 'multiple']:
                # 客观题直接判分
                correct = answer.answer == answer.question.answer
                score = answer.question.score if correct else 0
                comment = "正确" if correct else "错误"
                if not correct:
                    explanations.append(f"题目：{answer.question.text}，你的答案：{answer.answer}，正确答案：{answer.question.answer}")
            else:
                # 主观题调用AI
                ai_result = {}
                try:
                    ai_result = requests.post(
                        "http://127.0.0.1:8001/api/grade/",
                        json={
                            "question": answer.question.text,
                            "answer": answer.answer,
                            "reference_answer": answer.question.answer,
                            "max_score": answer.question.score
                        }
                    ).json()
                except Exception:
                    ai_result = {"score": 0, "comment": "AI批改失败"}
                score = ai_result.get("score", 0)
                comment = ai_result.get("comment", "")
                if score < answer.question.score:
                    explanations.append(f"题目：{answer.question.text}，AI评语：{comment}")
            answer.score = score
            answer.comment = comment
            answer.graded = True
            answer.save()
            total_score += score
        result.total_score = total_score
        result.explanations = explanations
        result.status = 'graded'
        result.save()