from django.db import models

class AadharEnrolment(models.Model):
    date = models.DateField()
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    age_0_5 = models.IntegerField(default=0)
    age_5_17 = models.IntegerField(default=0)
    age_18_greater = models.IntegerField(default=0)

    @property
    def total_enrolments(self):
        return self.age_0_5 + self.age_5_17 + self.age_18_greater

class AadharBiometric(models.Model):
    date = models.DateField()
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    bio_age_5_17 = models.IntegerField(default=0)
    bio_age_17_greater = models.IntegerField(default=0)

    @property
    def total_updates(self):
        return self.bio_age_5_17 + self.bio_age_17_greater

class AadharDemographic(models.Model):
    date = models.DateField()
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    demo_age_5_17 = models.IntegerField(default=0)
    demo_age_17_greater = models.IntegerField(default=0)

    @property
    def total_updates(self):
        return self.demo_age_5_17 + self.demo_age_17_greater