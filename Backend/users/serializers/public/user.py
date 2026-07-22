from django.contrib.auth import get_user_model
from rest_framework import serializers
from users.selectors.public import (
    email_exists,
    phone_number_exists,
)

User=get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password= serializers.CharField(write_only=True)
    
    
    class Meta:
        model=User
        fields=(
            "username","first_name",
            "last_name","email","phone_number",
            "password","confirm_password"        )
        
        
        extra_kwargs={
            "password":{
                "write_only":True
            }
        }
        
        
    
    def validate_email(self, value):

        if email_exists(value):
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value
    
    def validate_phone_number(self, value):

        if value and phone_number_exists(value):

            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )

        return value   
    
    def validate(self,attrs):
        password=attrs.get("password")
        confirm_password=attrs.get("confirm_password")
        
        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password" : "password do not match"
            })
            
        return attrs
    
        
class UserProfileSerializer(serializers.ModelSerializer):
      
      
      class Meta:
              model=User
              fields =[
                  "id",
                  "username",
                  "first_name",
                  "last_name",
                  "email",
                  "phone_number",
                  "profile_image",
                  "date_of_birth",
                  "gender",
                  "is_verified",
                  "created_at",
                  "updated_at",
              ]   
              
              
              read_only_fields=[
                  "id","email",
                  "is_verified",
                  "created_at",
                  "updated_at",
              ]