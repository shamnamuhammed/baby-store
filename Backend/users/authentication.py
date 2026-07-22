from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

User=get_user_model()


class EmailBackend(ModelBackend):
    
    
    """ 
    Authenticate users using email instead of username.
    
    """
    
    def authenticate(self,request,username=None,email=None,password=None,**kwargs):
        
        
        if email is None:
            email = username

        if email is None or password is None:
           return None
        
        try:
            user =User.objects.get(email__iexact=email)
            
            if(
                user.check_password(password)
                and self.user_can_authenticate(user)
            ):
                return user
            
        except User.DoesNotExist:
            return None
        
        return None
    
    
class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticate users using the JWT stored in the HttpOnly cookie.
    """

    # def authenticate(self, request):

    #     raw_token = request.COOKIES.get("access_token")

    #     if raw_token is None:
    #         return None

    #     try:
    #         validated_token = self.get_validated_token(raw_token)
    #         return self.get_user(validated_token), validated_token
         
    #     except InvalidToken:
    #         return None
    def authenticate(self, request):

        print("=" * 50)
        print("Cookies:", request.COOKIES)
        
        refresh = request.COOKIES.get("refresh_token")
        print(refresh)


        raw_token = request.COOKIES.get("access_token")
        print("Access Token:", raw_token)

        if raw_token is None:
            print("NO TOKEN FOUND")
            return None

        try:
            validated_token = self.get_validated_token(raw_token)

            print("TOKEN VALID")

            user = self.get_user(validated_token)

            print("USER:", user.email)
            print("IS STAFF:", user.is_staff)

            return (user, validated_token)

        except Exception as e:
            print("TOKEN ERROR:", e)
            return None
       