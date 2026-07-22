from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
    old_password=serializers.CharField(write_only=True)
    new_password=serializers.CharField(write_only=True)
    confirm_password=serializers.CharField(write_only=True)
    
    
    def validate(self,attrs):
        if attrs["new_password"] !=attrs["confirm_password"]:
            raise serializers.ValidationError(
                {
                    "confirm_passsword":"password do not match."
                }
            )
            
        return attrs