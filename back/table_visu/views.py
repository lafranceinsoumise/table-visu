from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect
from django.template.response import SimpleTemplateResponse
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import FormView, UpdateView

from table_visu.forms import SelectTableForm, ReponseForm
from table_visu.models import Table, Question, Reponse


class SelectTableView(FormView):
    template_name = "select_table.html"
    form_class = SelectTableForm
    success_url = reverse_lazy("reponse")

    def form_valid(self, form):
        self.request.session["table"] = form.cleaned_data["table"].pk
        return super().form_valid(form)


class ReponseView(UpdateView):
    template_name = "reponse.html"
    form_class = ReponseForm
    success_url = reverse_lazy("reponse")

    def get_object(self):
        return Reponse(table=self.table, question=self.question)

    def get_initial(self):
        previous = Reponse.objects.filter(table=self.table).last()
        if previous is not None:
            return {"participants": previous.participants, "choice": previous.choice}

    def dispatch(self, request, *args, **kwargs):
        if "table" not in request.session:
            return redirect("select_table")

        self.question = Question.objects.last()

        if self.question is None:
            return SimpleTemplateResponse("not_open.html")

        try:
            self.table = Table.objects.get(pk=request.session.get("table"))
            return super().dispatch(request, *args, **kwargs)
        except Table.DoesNotExist:
            return redirect("select_table")

    def get_context_data(self, **kwargs):
        kwargs["table"] = self.table
        kwargs["question"] = self.question

        return super().get_context_data(**kwargs)

    def form_valid(self, form):
        messages.add_message(
            self.request,
            messages.SUCCESS,
            "Votre réponse a bien été enregistrée ! Celle-ci va s'afficher"
            " dans un instant sur l'écran de la salle. Si la réponse du groupe évolue, vous pouvez la modifier.",
        )
        form.save()
        return super().form_valid(form)


class ResultView(View):
    def get(self, request, *args, **kwargs):
        question = Question.objects.last()

        if question is None:
            return JsonResponse({"type": "number"})

        reponses = Reponse.objects.filter(question=question).order_by("created")

        if question.type == Question.TYPE_NUMBER:
            return JsonResponse(
                {
                    "type": "number",
                    **{r.table.numero: r.choice / r.participants for r in reponses},
                }
            )

        if question.type == Question.TYPE_BOOLEAN:
            return JsonResponse(
                {"type": "boolean", **{r.table.numero: r.choice for r in reponses}}
            )
