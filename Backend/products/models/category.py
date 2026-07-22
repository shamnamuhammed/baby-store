from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    
    
    name = models.CharField(max_length=100,unique=True)
    slug = models.SlugField(
        unique=True,
        blank=True
    )
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="categories/",
        blank=True,null=True
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    class Meta:
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        
    
    def save(self,*args,**kwargs):
        if not self.slug:
            self.slug =slugify(self.name)
        
        super().save(*args ,**kwargs)
    
    def __str__(self):
        return self.name
        