from django.contrib.auth import authenticate
from rest_framework import serializers
from users.models.user import User

class LoginSerializer(serializers.Serializer):
    
    
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)
    
    
    def validate(self,attrs):
        email=attrs.get("email")
        password=attrs.get("password")
        

        user=authenticate(
            email=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid email or password."
            )
            
        attrs["user"]=user
        return attrs
    
class GoogleLoginSerializer(serializers.Serializer):
    token = serializers.CharField(
        required=True,
        trim_whitespace=True,
    )
    
   