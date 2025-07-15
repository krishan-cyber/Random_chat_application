from django.db import models

class Report(models.Model):
    reported_at=models.DateTimeField(auto_now_add=True)
    reporting_user=models.GenericIPAddressField()
    reported_user=models.GenericIPAddressField()
    reported_data=models.TextField()
    moderator_verdict=models.BooleanField(default=False)
    verdict_at = models.DateTimeField(null=True, blank=True)
    moderator_note = models.TextField(blank=True)
    def __str__(self):
        return f"Report from {self.reporting_user} against {self.reported_user} @ {self.reported_at.strftime('%Y-%m-%d %H:%M:%S')}"



class BlockedUser(models.Model):
    ip = models.GenericIPAddressField(unique=True)
    blocked_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    def __str__(self):
        return f"{self.ip} blocked at {self.blocked_at}"
    
class contacted(models.Model):
    name=models.TextField()
    person_email=models.EmailField()
    message=models.TextField()

    def __str__(self):
        return f"{self.name} reported contact at{self.person_email}"



