from django.contrib.auth import authenticate
from rest_framework import serializers
from users.models.user import User

class LoginSerializer(serializers.Serializer):
    
    
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)
    
    
    def validate(self,attrs):
        email=attrs.get("email")
        password=attrs.get("password")
        
        print("=" * 50)
        print("EMAIL:", repr(email))
        print("PASSWORD:", repr(password))

        user=authenticate(
            email=email,
            password=password
        )
        print("AUTH USER:", user)
        if not user:
            raise serializers.ValidationError(
                "Invalid email or password."
            )
            
        attrs["user"]=user
        return attrs
    
    
    
   