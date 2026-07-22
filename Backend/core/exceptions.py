from django.http import Http404

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

from rest_framework.exceptions import (
    ValidationError,
    NotAuthenticated,
    NotFound,
    AuthenticationFailed,
    PermissionDenied,
)


def custom_exception_handler(exc, context):
    """
    Return a consistent error response format.
    """

    response = exception_handler(exc, context)

    if response is None:
            return Response(
            {
                "success": False,
                "message": "Something went wrong.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


    if isinstance(exc, Http404):
            return Response(
                {
                    "success": False,
                    "message": str(exc),
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # return Response(
        #     {
        #         "success": False,
        #         "message": "Something went wrong.",
        #     },
        #     status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        # )
# validation error

    if isinstance(exc, ValidationError):
        return Response(
            {
                "success": False,
                "message": "Validation Failed",
                "errors": response.data,
            },
            status=response.status_code,
        )

# Not Found

    if isinstance(exc, (NotFound, Http404)):
        return Response(
            {
                "success": False,
                "message": str(exc),
            },
            status=response.status_code,
        )

# Authentication

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response(
            {
                "success": False,
                "message": str(exc),
            },
            status=response.status_code,
        )
        
# Permission

    if isinstance(exc, PermissionDenied):
        return Response(
            {
                "success": False,
                "message": str(exc),
            },
            status=response.status_code,
        )

# Other DRF Error
    return Response(
        {
            "success": False,
            "message": response.data.get("detail", "Something went wrong."),
        },
        status=response.status_code,
    )