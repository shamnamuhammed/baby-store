from rest_framework.views import APIView
from rest_framework import status
from users.serializers.public.auth import (
    LoginSerializer,
    GoogleLoginSerializer,
)
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError
from users.serializers.public.user import UserRegistrationSerializer,UserProfileSerializer
from users.services.google_auth import GoogleAuthService
from drf_spectacular.utils import (extend_schema  , OpenApiResponse,OpenApiExample)
from users.services.public import login_user , register_user
from core.response import success_response
from rest_framework.response import Response
from core.swagger import (
    SuccessSerializer,
    ErrorSerializer,
    ValidationErrorSerializer,
)
from core.throttles import LoginRateThrottle
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt



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
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self,request):
        serializer =LoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        result = login_user(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
        )

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
            httponly=settings.AUTH_COOKIE_HTTPONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,

            max_age=60 * 15,
        )

        response.set_cookie(
            key="refresh_token",
            value=result["refresh"],
            httponly=settings.AUTH_COOKIE_HTTPONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
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



@method_decorator(csrf_exempt, name="dispatch")
class CookieTokenRefreshAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        refresh = request.COOKIES.get("refresh_token")

        if not refresh:
            return Response(
                {
                    "success": False,
                    "message": "Refresh token is missing.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
                data={
                    "refresh": refresh,
                }
            )

        try:
            serializer.is_valid(raise_exception=True)

        except TokenError:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired refresh token.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access_token = serializer.validated_data["access"]

        response = Response(
            {
                "success": True,
                "message": "Access token refreshed successfully.",
            },
            status=status.HTTP_200_OK,
        )
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=settings.AUTH_COOKIE_HTTPONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            max_age=60 * 15,
        )

         # When refresh-token rotation is enabled,
        # SimpleJWT returns a new refresh token.
        new_refresh_token = serializer.validated_data.get("refresh")

        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=str(new_refresh_token),
                httponly=settings.AUTH_COOKIE_HTTPONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                max_age=60 * 60 * 24 * 7,
            )

        return response

class GoogleLoginAPIView(APIView):
    authentication_classes = []

    def post(self, request):

        serializer = GoogleLoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        result = GoogleAuthService.authenticate(
            token=serializer.validated_data["token"]
        )

        response = success_response(
            message="Google login successful.",
            data={
                "user": UserProfileSerializer(
                    result["user"]
                ).data,
            },
            status_code=status.HTTP_200_OK,
        )

        response.set_cookie(
            key="access_token",
            value=result["access"],
            httponly=settings.AUTH_COOKIE_HTTPONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            max_age=60 * 15,
        )

        response.set_cookie(
            key="refresh_token",
            value=result["refresh"],
            httponly=settings.AUTH_COOKIE_HTTPONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            max_age=60 * 60 * 24 * 7,
        )

        return response