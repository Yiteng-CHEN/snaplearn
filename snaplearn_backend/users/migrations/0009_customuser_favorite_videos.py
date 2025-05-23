# Generated by Django 5.2 on 2025-05-14 17:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_customuser_review_comment'),
        ('videos', '0003_video_education_level_video_subject'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='favorite_videos',
            field=models.ManyToManyField(blank=True, help_text='用户收藏的视频', related_name='favorited_by', to='videos.video'),
        ),
    ]
