from django.db import models
from products.models import Product
from .cart import Cart



class CartItem(models.Model):
    
    cart = models.ForeignKey(Cart,
                             on_delete=models.CASCADE,
                             related_name="items")
    
    product = models.ForeignKey(Product,
                                on_delete=models.CASCADE ,
                                related_name= "cart_items")
    
    quantity = models.PositiveIntegerField(default=1,)
    
    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)
    
    
    class Meta:
        verbose_name="Cart Item" # readable 
        verbose_name_plural = "Cart Items"
        
        constraints =[         # invalid data not allowed to store in db
            models.UniqueConstraint(
                fields=["cart","product"],
                name="unique_cart_product",
            )
        ]
        
    def __str__(self):
        return f"{self.product.name} ({self.quantity})"