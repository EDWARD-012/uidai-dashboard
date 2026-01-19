from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from .models import AadharEnrolment, AadharBiometric, AadharDemographic

# Helper to filter by State AND District
def get_queryset(model, state=None, district=None):
    qs = model.objects.all()
    if state:
        qs = qs.filter(state__iexact=state)
    if district:
        qs = qs.filter(district__iexact=district)
    return qs

@api_view(['GET'])
def get_kpi_stats(request):
    state = request.GET.get('state')
    district = request.GET.get('district')
    
    # 1. Enrolments
    enrol_qs = get_queryset(AadharEnrolment, state, district)
    enrol_agg = enrol_qs.aggregate(
        total=Sum('age_0_5') + Sum('age_5_17') + Sum('age_18_greater')
    )
    total_enrolments = enrol_agg['total'] or 0

    # 2. Updates
    bio_qs = get_queryset(AadharBiometric, state, district)
    bio_agg = bio_qs.aggregate(
        total=Sum('bio_age_5_17') + Sum('bio_age_17_greater')
    )
    
    demo_qs = get_queryset(AadharDemographic, state, district)
    demo_agg = demo_qs.aggregate(
        total=Sum('demo_age_5_17') + Sum('demo_age_17_greater')
    )
    
    total_updates = (bio_agg['total'] or 0) + (demo_agg['total'] or 0)

    # 3. Ratios
    ops_ratio = (total_updates / total_enrolments) if total_enrolments > 0 else 0
    
    return Response({
        "total_enrolments": total_enrolments,
        "total_updates": total_updates,
        "operational_ratio": round(ops_ratio, 2),
        "data_quality_index": 98.5
    })

@api_view(['GET'])
def get_geo_stats(request):
    state = request.GET.get('state')
    
    # If State Selected -> Show Districts
    if state:
        data = AadharEnrolment.objects.filter(state__iexact=state).values('district').annotate(
            value=Sum('age_0_5') + Sum('age_5_17') + Sum('age_18_greater')
        ).order_by('-value')
        return Response([{"name": item['district'], "value": item['value']} for item in data])
    
    # If National View -> Show States
    else:
        data = AadharEnrolment.objects.values('state').annotate(
            value=Sum('age_0_5') + Sum('age_5_17') + Sum('age_18_greater')
        ).order_by('-value')
        return Response([{"name": item['state'], "value": item['value']} for item in data])

@api_view(['GET'])
def get_trend_stats(request):
    state = request.GET.get('state')
    district = request.GET.get('district')
    
    # 1. Group Enrolments by Date
    enrol_qs = get_queryset(AadharEnrolment, state, district).values('date').annotate(
        count=Sum('age_0_5') + Sum('age_5_17') + Sum('age_18_greater')
    ).order_by('date')
    
    bio_qs = get_queryset(AadharBiometric, state, district).values('date').annotate(
        count=Sum('bio_age_5_17') + Sum('bio_age_17_greater')
    ).order_by('date')

    demo_qs = get_queryset(AadharDemographic, state, district).values('date').annotate(
        count=Sum('demo_age_5_17') + Sum('demo_age_17_greater')
    ).order_by('date')

    # Merge Data
    timeline = {}
    for item in enrol_qs:
        d = item['date'].strftime('%Y-%m-%d')
        timeline[d] = {"date": d, "enrolments": item['count'], "biometric_updates": 0, "demographic_updates": 0}
        
    for item in bio_qs:
        d = item['date'].strftime('%Y-%m-%d')
        if d not in timeline: timeline[d] = {"date": d, "enrolments": 0, "biometric_updates": 0, "demographic_updates": 0}
        timeline[d]["biometric_updates"] = item['count']

    for item in demo_qs:
        d = item['date'].strftime('%Y-%m-%d')
        if d not in timeline: timeline[d] = {"date": d, "enrolments": 0, "biometric_updates": 0, "demographic_updates": 0}
        timeline[d]["demographic_updates"] = item['count']

    final_trends = sorted(timeline.values(), key=lambda x: x['date'])
    
    # Age Data
    age_qs = get_queryset(AadharEnrolment, state, district).aggregate(
        grp_0_5=Sum('age_0_5'),
        grp_5_17=Sum('age_5_17'),
        grp_18_plus=Sum('age_18_greater')
    )
    
    age_data = [
        {"range": "0-5", "count": age_qs['grp_0_5'] or 0},
        {"range": "5-17", "count": age_qs['grp_5_17'] or 0},
        {"range": "18+", "count": age_qs['grp_18_plus'] or 0},
    ]

    return Response({
        "trends": final_trends,
        "ageData": age_data
    })