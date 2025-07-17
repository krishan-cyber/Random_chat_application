from django.core.management.base import BaseCommand
from chat.models import Report, BlockedUser

class Command(BaseCommand):
    help = 'Blocks reported users with moderator_verdict=True'

    def handle(self, *args, **kwargs):
        reports = Report.objects.filter(moderator_verdict=True)
        blocked = 0

        for report in reports:
            ip = report.reported_user
            reason=report.moderator_note 
            if not BlockedUser.objects.filter(ip=ip).exists():
                BlockedUser.objects.create(ip=ip,reason=reason)
                blocked += 1
        
        self.stdout.write(self.style.SUCCESS(f"Blocked {blocked} IP(s)."))
