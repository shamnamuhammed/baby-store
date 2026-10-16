
from django.urls import path
from users.views.auth import (RegistrationAPIView,LoginAPIView,GoogleLoginAPIView)
from users.views.profile import UserProfileAPIView
from users.views.password import ChangePasswordAPIView
from users.views.logout import LogoutAPIView
from rest_framework_simplejwt.views import TokenRefreshView
from users.views.forgot_password import ForgotPasswordAPIView
from users.views.reset_password import ResetPasswordAPIView
from users.views.auth import CookieTokenRefreshAPIView
from users.views.csrf import CSRFTokenAPIView


urlpatterns =[
    path ("register/",RegistrationAPIView.as_view(),name="register",),
    path ("login/",LoginAPIView.as_view(),name="login",),
    path(
    "google-login/",
    GoogleLoginAPIView.as_view(),name="google-login",
),
    path ("me/",UserProfileAPIView.as_view(),name="profile",),
    path ("change-password/",ChangePasswordAPIView.as_view(),name="change-password",),
    path ("forgot-password/",ForgotPasswordAPIView.as_view(),name="forgot-password",),
    path ("reset-password/",ResetPasswordAPIView.as_view(),name="reset-password",),
    path ("logout/",LogoutAPIView.as_view(),name="logout",),
    path ("token/refresh/",CookieTokenRefreshAPIView.as_view(),name="token_refresh",),
    path("csrf/", CSRFTokenAPIView.as_view(), name="csrf-token"),
]