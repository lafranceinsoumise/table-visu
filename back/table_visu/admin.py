from django.contrib import admin

from table_visu.models import Question, Table, Reponse


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    pass


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    pass


@admin.register(Reponse)
class ReponseAdmin(admin.ModelAdmin):
    pass
