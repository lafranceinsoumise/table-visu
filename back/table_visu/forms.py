from django import forms
from django.forms import ChoiceField, RadioSelect

from table_visu.models import Reponse, Question


class GroupCodeField(forms.ModelChoiceField):
    def to_python(self, value):
        return super().to_python(str(value).upper())


class ReponseForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.question.type == Question.TYPE_NUMBER:
            self.fields[
                "choice"
            ].label = "Nombre de personnes d'accord avec la proposition."
            del self.fields["comment"]

        if self.instance.question.type == Question.TYPE_BOOLEAN:
            self.fields["choice"] = ChoiceField(
                choices=((1, "Oui"), (0, "Non")), widget=RadioSelect
            )
            self.fields["choice"].label = "Avez-vous trouvé un consensus ?"

    def clean(self):
        if int(self.cleaned_data["choice"]) > self.cleaned_data["participants"]:
            raise forms.ValidationError(
                "Il ne peut pas y avoir plus de personnes que de membres dans le groupe."
            )

        return self.cleaned_data

    class Meta:
        model = Reponse
        fields = ["participants", "choice", "comment"]
