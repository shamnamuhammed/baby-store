import logging

from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    ValidationError,
    NotAuthenticated,
    NotFound,
    AuthenticationFailed,
    PermissionDenied,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Return a consistent and safe API error response.
    Log unhandled exceptions on the server for debugging.
    """

    response = exception_handler(exc, context)

    # An unhandled Python exception usually reaches this branch.
    # Log the complete traceback on the server, not in the API response.
    if response is None:
        logger.error(
            "Unhandled API exception in %s",
            context.get("view", "Unknown view"),
            exc_info=(type(exc), exc, exc.__traceback__),
        )

        return Response(
            {
                "success": False,
                "message": "Something went wrong. Please try again later.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, Http404):
        return Response(
            {
                "success": False,
                "message": "Resource not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, ValidationError):
        return Response(
            {
                "success": False,
                "message": "Validation failed.",
                "errors": response.data,
            },
            status=response.status_code,
        )

    if isinstance(exc, NotFound):
        return Response(
            {
                "success": False,
                "message": "Resource not found.",
            },
            status=response.status_code,
        )

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response(
            {
                "success": False,
                "message": str(exc),
            },
            status=response.status_code,
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            {
                "success": False,
                "message": "You do not have permission to perform this action.",
            },
            status=response.status_code,
        )

    return Response(
        {
            "success": False,
            "message": response.data.get(
                "detail",
                "Something went wrong.",
            ),
        },
        status=response.status_code,
    )

# from django.http import Http404

# from rest_framework import status
# from rest_framework.exceptions import (
#     ValidationError,
#     NotAuthenticated,
#     NotFound,
#     AuthenticationFailed,
#     PermissionDenied,
# )
# from rest_framework.response import Response
# from rest_framework.views import exception_handler


# def custom_exception_handler(exc, context):
#     """
#     Return a consistent and safe API error response.
#     """

#     response = exception_handler(exc, context)

#     if response is None:
#         return Response(
#             {
#                 "success": False,
#                 "message": "Something went wrong. Please try again later.",
#             },
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         )

#     if isinstance(exc, Http404):
#         return Response(
#             {
#                 "success": False,
#                 "message": "Resource not found.",
#             },
#             status=status.HTTP_404_NOT_FOUND,
#         )

#     if isinstance(exc, ValidationError):
#         return Response(
#             {
#                 "success": False,
#                 "message": "Validation failed.",
#                 "errors": response.data,
#             },
#             status=response.status_code,
#         )

#     if isinstance(exc, NotFound):
#         return Response(
#             {
#                 "success": False,
#                 "message": "Resource not found.",
#             },
#             status=response.status_code,
#         )

#     if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
#         return Response(
#             {
#                 "success": False,
#                 "message": str(exc),
#             },
#             status=response.status_code,
#         )

#     if isinstance(exc, PermissionDenied):
#         return Response(
#             {
#                 "success": False,
#                 "message": "You do not have permission to perform this action.",
#             },
#             status=response.status_code,
#         )

#     return Response(
#         {
#             "success": False,
#             "message": response.data.get(
#                 "detail",
#                 "Something went wrong."
#             ),
#         },
#         status=response.status_code,
#     )
