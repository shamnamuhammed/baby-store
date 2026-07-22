from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    
    """
        Custom User model for the Baby Store application.
    """
    
    class GenderChoices(models.TextChoices):
        MALE="male","Male"
        FEMALE ="female","Female"
        OTHER ="other","Other"
        PREFER_NOT_TO_SAY="prefer_not_to_say"," Prefer_not_to_say"
    phone_number = models.CharField(
            max_length=15,
            unique=True,
            blank=True,
            null=True,)
    
    profile_image =models.ImageField(
            upload_to="profile_images/",
            blank=True,
            default="defaults/default-avatar.png",)
    
    date_of_birth =models.DateField(
            blank=True,
            null=True,)
    
    gender =models.CharField(
            max_length=20,
            choices=GenderChoices.choices,
            blank=True,
            null=True,)
    
    is_verified =models.BooleanField(
            default=False,)
    
    created_at=models.DateTimeField(
            auto_now_add=True,) 
      
    updated_at=models.DateTimeField(
            auto_now=True,
    )
    
    def __str__(self):
        return self.username