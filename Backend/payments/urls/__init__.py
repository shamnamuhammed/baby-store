from django.urls import include, path

urlpatterns = [

    path(
        "",
        include("payments.urls.public"),
    ),

    path(
        "admin/",
        include("payments.urls.admin"),
    ),

]