import logging
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import openai
from django.conf import settings
import requests

openai.api_key = getattr(settings, "OPENAI_API_KEY", "你的OpenAI_API_Key")

def call_gpt_api(messages):
    url = f"{getattr(settings, 'GPT_API_BASE_URL', 'https://api.openai.com/v1')}/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }
    api_key = getattr(settings, "GPT_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages
    }
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=60)
        if resp.status_code != 200:
            logging.error(f"GPT API返回非200: {resp.status_code}, 内容: {resp.text}")
            raise Exception(f"GPT API错误: {resp.status_code}, 内容: {resp.text}")
        try:
            return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logging.error(f"GPT API返回内容无法解析为JSON: {resp.text}")
            raise Exception(f"GPT API返回内容无法解析为JSON: {resp.text}")
    except Exception as e:
        logging.error(f"调用GPT API失败: {e}")
        raise

class GradeView(APIView):
    def post(self, request):
        question = request.data.get('question')
        answer = request.data.get('answer')
        reference = request.data.get('reference_answer', '')
        # 新增：支持动态分值
        max_score = request.data.get('max_score', 5)
        try:
            max_score_val = float(max_score)
        except Exception:
            max_score_val = 5

        prompt = f"""你是一名老师，请根据以下题目和参考答案，对学生的答案进行评分（满分{max_score_val}分）并给出评语。
                题目：{question}
                参考答案：{reference}
                学生答案：{answer}
                请输出如下格式：
                分数: x.x
                评语: ..."""

        try:
            content = call_gpt_api([{"role": "user", "content": prompt}])
            lines = content.split('\n')
            score = None
            comment = ""
            for line in lines:
                if "分数" in line:
                    try:
                        score = float(line.split(":")[1].strip())
                    except Exception:
                        score = 0
                elif "评语" in line:
                    comment = line.split(":", 1)[1].strip()
            if score is None:
                score = 0
            return Response({"score": score, "comment": comment})
        except Exception as e:
            return Response({"score": 0, "comment": f"AI批改失败: {str(e)}"}, status=200)

class AskView(APIView):
    def post(self, request):
        question = request.data.get('question')
        prompt = f"请用简明易懂的语言回答学生的问题：{question}"
        answer = call_gpt_api([{"role": "user", "content": prompt}])
        return Response({"answer": answer})
