from django.urls import path
from .views import front_html,submit_contact
urlpatterns = [
    path('text_chat',front_html.as_view(),name="front_html"),
    path('contact/submit/', submit_contact, name='contact_submit'),
]