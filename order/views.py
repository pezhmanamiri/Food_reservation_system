from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta


@login_required
def food_selection(request):
    # محاسبه روزهای هفته جاری
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())  # شروع هفته از شنبه
    days = []

    for i in range(7):
        day_date = week_start + timedelta(days=i)
        days.append({
            'id': i,
            'name': ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'][i],
            'date': day_date
        })

    # انواع وعده‌های غذایی
    meal_types = [
        {'id': 'breakfast', 'name': 'صبحانه', 'icon': 'sun'},
        {'id': 'lunch', 'name': 'ناهار', 'icon': 'utensils'},
        {'id': 'dinner', 'name': 'شام', 'icon': 'moon'}
    ]

    # اطلاعات کاربر
    last_reservation = request.user.reservations.order_by('-date').first()
    reserved_meals = request.user.reservations.count()
    remaining_days = 7 - today.weekday()  # روزهای باقیمانده تا پایان هفته

    context = {
        'days': days,
        'meal_types': meal_types,
        'last_reservation': last_reservation.date if last_reservation else None,
        'reserved_meals': reserved_meals,
        'remaining_days': remaining_days,
    }

    return render(request, 'food_selection.html', context)