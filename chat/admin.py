from django.contrib import admin
from .models import Report,BlockedUser,contacted

admin.site.register(Report)
admin.site.register(BlockedUser)
admin.site.register(contacted)
