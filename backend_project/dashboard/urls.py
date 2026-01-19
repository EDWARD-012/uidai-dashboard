from django.urls import path
from . import views

urlpatterns = [
    # KPIs (Total Enrolments, Updates, Ratios)
    path('stats/kpi/', views.get_kpi_stats, name='kpi-stats'),

    # Map & Table Data (Geographic breakdown)
    path('stats/geo/', views.get_geo_stats, name='geo-stats'),

    # Charts (Trends over time)
    path('stats/trends/', views.get_trend_stats, name='trend-stats'),
]