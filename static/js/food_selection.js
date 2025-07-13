document.addEventListener('DOMContentLoaded', function() {
    // متغیرهای全局
    let currentDay = document.querySelector('.day-tab.active').dataset.day;
    let selectedMeals = {};

    // بارگیری اولیه غذاها برای روز فعال
    loadMealsForDay(currentDay);

    // تغییر روز
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelector('.day-tab.active').classList.remove('active');
            this.classList.add('active');
            currentDay = this.dataset.day;
            loadMealsForDay(currentDay);
        });
    });

    // ثبت نهایی
    document.getElementById('submit-reservations').addEventListener('click', function() {
        showConfirmationModal();
    });

    // تایید نهایی
    document.getElementById('confirm-reservation').addEventListener('click', submitReservations);
});

// بارگیری غذاها برای روز انتخاب شده
function loadMealsForDay(dayId) {
    // نشان دادن حالت لودینگ
    document.querySelectorAll('.food-items').forEach(container => {
        container.innerHTML = '<div class="col-12 text-center py-4 loading-text">' +
            '<i class="fas fa-spinner fa-spin"></i> در حال دریافت لیست غذاها...' +
            '</div>';
    });

    // درخواست AJAX برای دریافت غذاها
    fetch(`/api/meals/?day=${dayId}`)
        .then(response => response.json())
        .then(data => {
            // نمایش غذاها برای هر وعده
            for (const mealType in data) {
                const container = document.querySelector(`.food-items[data-meal-type="${mealType}"]`);
                container.innerHTML = '';

                if (data[mealType].length === 0) {
                    container.innerHTML = '<div class="col-12 text-center py-4">' +
                        '<i class="fas fa-utensil-slash"></i> غذایی برای این وعده تعریف نشده است' +
                        '</div>';
                    continue;
                }

                data[mealType].forEach(food => {
                    const isSelected = selectedMeals[dayId] &&
                                      selectedMeals[dayId][mealType] === food.id;

                    const foodCard = `
                        <div class="col-md-4 mb-4">
                            <div class="food-item ${isSelected ? 'selected' : ''}" 
                                 data-food-id="${food.id}" 
                                 data-meal-type="${mealType}"
                                 onclick="selectFood(this, '${dayId}', '${mealType}', '${food.id}')">
                                <div class="position-relative">
                                    <img src="${food.image}" class="food-img" alt="${food.name}">
                                    <span class="food-badge">${food.calories} کالری</span>
                                </div>
                                <div class="food-details">
                                    <h5 class="food-title">${food.name}</h5>
                                    <p class="food-desc">${food.description}</p>
                                    <small class="d-block"><i class="fas fa-tag"></i> ${food.category}</small>
                                </div>
                            </div>
                        </div>
                    `;

                    container.insertAdjacentHTML('beforeend', foodCard);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطا',
                text: 'مشکلی در دریافت لیست غذاها رخ داده است'
            });
        });
}

// انتخاب غذا
function selectFood(element, dayId, mealType, foodId) {
    // حذف انتخاب قبلی برای این وعده در این روز
    const container = element.closest('.food-items');
    container.querySelectorAll('.food-item').forEach(item => {
        item.classList.remove('selected');
    });

    // انتخاب جدید
    element.classList.add('selected');

    // ذخیره در selectedMeals
    if (!selectedMeals[dayId]) {
        selectedMeals[dayId] = {};
    }
    selectedMeals[dayId][mealType] = foodId;
}

// نمایش مدال تایید
function showConfirmationModal() {
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const summaryContainer = document.getElementById('selected-meals-summary');

    // ایجاد خلاصه انتخاب‌ها
    let summaryHTML = '<ul class="list-group list-group-flush">';

    for (const dayId in selectedMeals) {
        const dayName = document.querySelector(`.day-tab[data-day="${dayId}"] h5`).textContent;

        summaryHTML += `<li class="list-group-item glass-card mb-2">
            <h6>${dayName}</h6>`;

        for (const mealType in selectedMeals[dayId]) {
            const foodElement = document.querySelector(
                `.food-item[data-food-id="${selectedMeals[dayId][mealType]}"][data-meal-type="${mealType}"]`
            );

            if (foodElement) {
                const foodName = foodElement.querySelector('.food-title').textContent;
                const mealTypeName = document.querySelector(
                    `.meal-section .food-items[data-meal-type="${mealType}"]`
                ).closest('.meal-section').querySelector('h3').textContent;

                summaryHTML += `<div class="ms-3">
                    <small>${mealTypeName}:</small> ${foodName}
                </div>`;
            }
        }

        summaryHTML += '</li>';
    }

    summaryHTML += '</ul>';

    summaryContainer.innerHTML = summaryHTML;
    modal.show();
}

// ارسال رزرو به سرور
function submitReservations() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));

    fetch('/api/reservations/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            selections: selectedMeals
        })
    })
    .then(response => response.json())
    .then(data => {
        modal.hide();
        Swal.fire({
            icon: 'success',
            title: 'موفقیت‌آمیز',
            text: 'رزروهای شما با موفقیت ثبت شد',
            timer: 3000
        });
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطا',
            text: 'مشکلی در ثبت رزروها رخ داده است'
        });
    });
}

// تابع کمکی برای دریافت کوکی
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}