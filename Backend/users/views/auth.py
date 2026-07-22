from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers.public.auth import LoginSerializer
from users.serializers.public.user import UserRegistrationSerializer,UserProfileSerializer

from drf_spectacular.utils import (extend_schema  , OpenApiResponse,OpenApiExample)
from users.services.public import login_user , register_user
from core.response import success_response
from rest_framework.response import Response
from core.swagger import (
    SuccessSerializer,
    ErrorSerializer,
    ValidationErrorSerializer,
)

@extend_schema(
    summary="User Registration",
    description="Create a new user account.",
    request=UserRegistrationSerializer,
    responses={
        201: SuccessSerializer,
        400: ValidationErrorSerializer,
    },
    examples=[
        OpenApiExample(
            "Registration Example",
            value={
                "username": "john",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@gmail.com",
                "password": "Password@123",
                "confirm_password": "Password@123",
            },
            request_only=True,
        )
    ],

    tags=["Authentication"],
)
class RegistrationAPIView(APIView):
    
    def post(self,request):
        
        serializer=UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
            
        user = register_user(
          serializer.validated_data,
    )   
                
        return success_response(
                    message="User registered successfully.",
                     data=UserProfileSerializer(user).data,
                    status_code=status.HTTP_201_CREATED,)

        
@extend_schema(
    summary="User Login",
    description="Authenticate user and return JWT access and refresh tokens.",
    request=LoginSerializer,
    responses={
    200: SuccessSerializer,
    400: ValidationErrorSerializer,
    401: ErrorSerializer,
    },
    examples=[
        OpenApiExample(
            "Login Example",
            value={
                "email": "john@gmail.com",
                "password": "Password@123",
            },
            request_only=True,
        )
    ],
    tags=["Authentication"],
)       
class LoginAPIView(APIView):
    def post(self,request):
        print("RAW DATA:", request.data)
        serializer =LoginSerializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        print(serializer.validated_data)
        result = login_user(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
        )

        
        
        print(result)  
        response= success_response(
                message="Login successful.",
                data={
                    # "access": result["access"],
                    # "refresh": result["refresh"],
                    "user": UserProfileSerializer(result["user"]).data,
                },
                status_code=status.HTTP_200_OK,
            )
        response.set_cookie(
            key="access_token",
            value=result["access"],
            httponly=True,
            secure=False,      # True in production (HTTPS)
            samesite="Lax",
            max_age=60 * 15,   
        )
        
        response.set_cookie(
            key="refresh_token",
            value=result["refresh"],
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,
        )

        return response
    

@extend_schema(
    summary="Refresh Access Token",

    description="""
Generate a new access token using the refresh token stored
inside the HTTP-only cookie.
""",

    request=None,

    responses={
        # 200: SuccessResponseSerializer,
        401: OpenApiResponse(description="Refresh token missing or invalid"),
    },

    tags=["Authentication"],
)   
    
    
class CookieTokenRefreshAPIView(APIView):

    def post(self, request):

        refresh = request.COOKIES.get("refresh_token")

        if not refresh:
            return Response(
                {"detail":"No refresh token"},
                status=401
            )

        token = RefreshToken(refresh)

        access = str(token.access_token)

        response = Response({"success":True})

        response.set_cookie(
            key="access_token",
            value=access,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 15,
                )

        return response
    
