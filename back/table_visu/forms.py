from django import forms
from django.forms import TextInput, ChoiceField, RadioSelect

from table_visu.models import Reponse, Table, Question


class SelectTableForm(forms.Form):
    table = forms.ModelChoiceField(
        queryset=Table.objects.all(),
        to_field_name="code",
        widget=TextInput,
        label="Code",
    )


class ReponseForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.question.type == Question.TYPE_NUMBER:
            self.fields[
                "choice"
            ].label = "Nombre de personnes d'accord avec la proposition."

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
        fields = ["participants", "choice"]
