from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect
from django.template.response import SimpleTemplateResponse
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import UpdateView, RedirectView

from table_visu.forms import ReponseForm
from table_visu.models import Group, Question, Reponse


class SelectGroupView(RedirectView):
    url = reverse_lazy("reponse")

    def get(self, request, *args, **kwargs):
        self.request.session["group"] = kwargs["slug"]
        return super().get(request, *args, **kwargs)


def last_time(request):
    question = Question.objects.last()
    if question is not None:
        return JsonResponse({"last_question": question.created})
    else:
        return JsonResponse({})


class ReponseView(UpdateView):
    template_name = "reponse.html"
    form_class = ReponseForm
    success_url = reverse_lazy("reponse")

    def get_object(self):
        return Reponse(question=self.question)

    def get_initial(self):
        if not self.group._state.adding:
            previous = Reponse.objects.filter(
                group=self.group, question=self.question
            ).last()
            if previous is not None:
                return {
                    "participants": previous.participants,
                    "choice": previous.choice,
                }

    def dispatch(self, request, *args, **kwargs):
        if "group" not in request.session:
            return redirect("select_group")

        self.question = Question.objects.last()

        if self.question is None:
            return SimpleTemplateResponse("not_open.html")

        try:
            self.group = Group.objects.get(code=request.session.get("group"))
        except Group.DoesNotExist:
            self.group = Group(code=request.session.get("group"))

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        kwargs["group"] = self.group
        kwargs["question"] = self.question

        return super().get_context_data(**kwargs)

    def form_valid(self, form):
        messages.add_message(
            self.request,
            messages.SUCCESS,
            "Votre réponse a bien été enregistrée ! Celle-ci va s'afficher"
            " dans un instant sur l'écran de la salle. Si la réponse du groupe évolue, vous pouvez la modifier.",
        )

        if self.group._state.adding:
            self.group.save()

        form.instance.group = self.group

        return super().form_valid(form)


class ResultView(View):
    def get(self, request, *args, **kwargs):
        question = Question.objects.last()

        if question is None:
            return JsonResponse({"type": "number", "groups": []})

        reponses = Reponse.objects.filter(question=question).order_by("created")

        if question.type == Question.TYPE_NUMBER:
            return JsonResponse(
                {
                    "type": "number",
                    "groups": {
                        r.group.code: r.choice
                        / (
                            r.participants
                            if (r.participants > 0)
                            else r.choice
                            if r.choice > 0
                            else 1
                        )
                        for r in reponses
                    },
                }
            )

        if question.type == Question.TYPE_BOOLEAN:
            return JsonResponse(
                {
                    "type": "boolean",
                    "groups": {r.group.code: r.choice for r in reponses},
                }
            )
