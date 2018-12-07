from django.db import models


class Question(models.Model):
    TYPE_NUMBER = "number"
    TYPE_BOOLEAN = "boolean"
    TYPE_CHOICES = ((TYPE_NUMBER, "Nombre "), (TYPE_BOOLEAN, "Oui ou non"))
    text = models.TextField()
    type = models.CharField(max_length=255, choices=TYPE_CHOICES)


class Table(models.Model):
    numero = models.CharField(max_length=3, primary_key=True)
    code = models.CharField(max_length=5)


class Reponse(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    question = models.ForeignKey("Question", on_delete=models.CASCADE)
    table = models.ForeignKey("Table", on_delete=models.CASCADE)
    choice = models.IntegerField("Réponse")
