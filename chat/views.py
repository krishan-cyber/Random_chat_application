from django.shortcuts import render
from django.views import View
from .models import contacted
from django.http import HttpResponse

# Create your views here.
class front_html(View):
    def get(self,request):
        return render(request, 'front.html') 
    


def submit_contact(request):
    if request.method == 'POST':
        contacted.objects.create(
            name=request.POST['name'],
            person_email=request.POST['person_email'],
            message=request.POST['message']
        )
        return HttpResponse("OK") 



