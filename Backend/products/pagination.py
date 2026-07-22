# from rest_framework.pagination import PageNumberPagination
# from rest_framework.response import Response

# class ProductPagination(PageNumberPagination):
#     """
#     Custom pagination for product listing.
#     """

#     page_size = 5
#     page_size_query_param = "page_size"
#     max_page_size = 50
    
    
    
#     def get_paginated_response(self, data):
#         return Response({
#             "message": "Products retrieved successfully.",
#             "count": self.page.paginator.count,
#             "next": self.get_next_link(),
#             "previous": self.get_previous_link(),
#             "data": data,
#         })