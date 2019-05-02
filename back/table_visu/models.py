from django.db import models


class Question(models.Model):
    TYPE_NUMBER = "number"
    TYPE_BOOLEAN = "boolean"
    TYPE_CHOICES = (
        (TYPE_NUMBER, "Nombre de personne d'accord"),
        (TYPE_BOOLEAN, "Consensus ou non"),
    )
    text = models.TextField()
    type = models.CharField(max_length=255, choices=TYPE_CHOICES)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:400] + "..."


class Table(models.Model):
    numero = models.CharField(max_length=3)
    code = models.CharField(max_length=5)

    def __str__(self):
        return self.numero


class Reponse(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    question = models.ForeignKey("Question", on_delete=models.CASCADE)
    table = models.ForeignKey("Table", on_delete=models.CASCADE)
    participants = models.PositiveIntegerField("Nombre de personne dans le groupe")
    choice = models.PositiveIntegerField("Réponse")
    comment = models.TextField("Quelles sont vos propositions ?", blank=True, null=True)
