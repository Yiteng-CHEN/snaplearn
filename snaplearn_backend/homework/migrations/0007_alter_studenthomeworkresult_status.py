# Generated by Django 5.2 on 2025-05-29 02:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('homework', '0006_studenthomeworkresult_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='studenthomeworkresult',
            name='status',
            field=models.CharField(default='graded', max_length=20),
        ),
    ]
