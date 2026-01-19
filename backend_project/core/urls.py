from django.contrib import admin
from django.urls import path, include  # <--- Make sure 'include' is imported!

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # This line connects your main project to the dashboard app
    path('api/v1/', include('dashboard.urls')), 
]