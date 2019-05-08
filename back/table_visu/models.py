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

    def __repr__(self):
        return f"Question(id={self.id!r}, text={self.text!r}, type={self.type!r}, created={self.created!r})"


class Group(models.Model):
    code = models.CharField(max_length=30)

    def __str__(self):
        return self.code

    def __repr__(self):
        return f"Group(id={self.id!r}, code={self.code!r})"


class Reponse(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    question = models.ForeignKey("Question", on_delete=models.CASCADE)
    group = models.ForeignKey("Group", on_delete=models.CASCADE)
    participants = models.PositiveIntegerField("Nombre de personne dans le groupe")
    choice = models.PositiveIntegerField("Réponse")
    comment = models.TextField("Quelles sont vos propositions ?", blank=True, null=True)
