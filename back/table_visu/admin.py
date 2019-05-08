from django.contrib import admin

from table_visu.models import Question, Group, Reponse


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("code",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    pass


@admin.register(Reponse)
class ReponseAdmin(admin.ModelAdmin):
    list_display = ("group", "question", "participants", "choice")
