from rest_framework.exceptions import NotFound
from django.contrib.auth import get_user_model
from ..models import User


User = get_user_model()

def get_user_by_id(user_id,message="User not found."):
    """
    Retrieve a user by ID.

    Raises:
        NotFound: If the user does not exist.
    """
    
    
    try:
        return User.objects.get(id=user_id)
    
    except User.DoesNotExist:
        raise NotFound(message)
    
    
def get_user_by_email(email):
    """
    Retrieve a user using email.
    """

    try:
        return User.objects.get(email__iexact=email)

    except User.DoesNotExist:
        raise NotFound("No account found with this email.")
    
    
def email_exists(email):
    """
    Check whether email already exists.
    """
    return User.objects.filter(email=email).exists()


def phone_number_exists(phone_number):
    """
    Check whether phone number already exists.
    """
    return User.objects.filter(
        phone_number=phone_number
    ).exists()
    
    
