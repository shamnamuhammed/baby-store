from rest_framework.response import Response


def success_response(
    message,
    data=None,
    status_code=200,
):
    """
    Standard success response.
    """

    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )