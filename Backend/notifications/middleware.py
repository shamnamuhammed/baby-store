from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User


@database_sync_to_async
def get_user_from_token(token):

    try:
        access_token = AccessToken(token)

        user_id = access_token["user_id"]

        return User.objects.get(
            id=user_id,
            is_active=True,
        )

    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):

        headers = dict(scope.get("headers", []))

        cookie_header = headers.get(
            b"cookie",
            b"",
        ).decode()

        cookies = {}

        for cookie in cookie_header.split(";"):

            if "=" in cookie:

                key, value = cookie.strip().split(
                    "=",
                    1,
                )

                cookies[key] = value

        token = cookies.get("access_token")
        print("========== WS JWT DEBUG ==========")
        print("COOKIE KEYS:", list(cookies.keys()))
        print("ACCESS TOKEN EXISTS:", bool(token))

        if token:

            scope["user"] = await get_user_from_token(
                token
            )
            print("WS USER:", scope["user"])

        else:

            scope["user"] = AnonymousUser()

        return await super().__call__(
            scope,
            receive,
            send,
        )