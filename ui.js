import { state, ACHIEVEMENTS, HABIT_TEMPLATES } from './state.js';
import * as dom from './dom.js';

let progressChart = null;

const renderWeeklyProgress = () => {
    dom.weeklyProgressList.innerHTML = '';
    const startOfWeek = dayjs().startOf('isoWeek');
    
    state.habits.forEach(habit => {
        let completedCount = 0;
        for (let i = 0; i < 7; i++) {
            const date = startOfWeek.add(i, 'day').format('YYYY-MM-DD');
            if (state.completed[date] && state.completed[date].includes(habit.id)) {
                completedCount++;
            }
        }
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-labels">
                <span>${habit.name}</span>
                <span>${completedCount}/7 days</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${(completedCount / 7) * 100}%"></div>
            </div>
        `;
        dom.weeklyProgressList.appendChild(progressItem);
    });
};

const renderDashboard = () => {
    dom.currentDateDashboard.textContent = dayjs().format('dddd, D MMMM');

    dom.todayHabitsList.innerHTML = '';
    if (state.habits.length === 0) {
        dom.todayHabitsList.innerHTML = `<p style="color: var(--text-secondary); padding: 20px 0; text-align: center;">Add a habit to get started!</p>`;
        renderWeeklyProgress();
        return;
    }
    const today = dayjs().format('YYYY-MM-DD');
    const completedToday = state.completed[today] || [];

    state.habits.forEach(habit => {
        const isCompleted = completedToday.includes(habit.id);
        const habitEl = document.createElement('div');
        habitEl.className = `habit-item ${isCompleted ? 'completed' : ''}`;
        habitEl.dataset.habitId = habit.id;
        habitEl.innerHTML = `
            <button class="complete-btn">${isCompleted ? '✓' : ''}</button>
            <span class="habit-name">${habit.name}</span>
            <button class="delete-btn">×</button>
        `;
        dom.todayHabitsList.appendChild(habitEl);
    });
    
    renderWeeklyProgress();
    renderHabitTemplates();
};

const renderHabitTemplates = () => {
    dom.habitTemplatesContainer.innerHTML = '';
    const existingHabitNames = new Set(state.habits.map(h => h.name));
    const availableTemplates = HABIT_TEMPLATES.filter(template => !existingHabitNames.has(template));
    
    if (availableTemplates.length === 0) {
        dom.habitTemplatesContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 14px; text-align: center;">You've added all suggestions!</p>`;
        return;
    }
    
    availableTemplates.forEach(templateName => {
        const templateEl = document.createElement('button');
        templateEl.className = 'habit-template';
        templateEl.dataset.habitName = templateName;
        templateEl.innerHTML = `<span>+</span> ${templateName}`;
        dom.habitTemplatesContainer.appendChild(templateEl);
    });
};

const renderCalendar = () => {
    dom.calendarDateDisplay.textContent = dayjs(state.currentDate).format('ddd, D MMMM YYYY');
    dom.calendarHabitsList.innerHTML = '';
    if (state.habits.length === 0) {
        dom.calendarHabitsList.innerHTML = `<p style="color: var(--text-secondary); padding: 20px 0; text-align: center;">No habits created yet.</p>`;
        return;
    }
    
    const completedOnDate = state.completed[state.currentDate] || [];

    state.habits.forEach(habit => {
        const isCompleted = completedOnDate.includes(habit.id);
        const habitEl = document.createElement('div');
        habitEl.className = `habit-item ${isCompleted ? 'completed' : ''}`;
        habitEl.dataset.habitId = habit.id;
        habitEl.innerHTML = `
            <button class="complete-btn">${isCompleted ? '✓' : ''}</button>
            <span class="habit-name">${habit.name}</span>
            <button class="delete-btn">×</button>
        `;
        dom.calendarHabitsList.appendChild(habitEl);
    });
};

const renderProgress = () => {
    const pointsForNextLevel = state.level * 100; 
    dom.currentLevelEl.textContent = state.level;
    dom.currentPointsEl.textContent = state.points;
    dom.pointsNextLevelEl.textContent = pointsForNextLevel;
    dom.pointsProgressBar.style.width = `${(state.points / pointsForNextLevel) * 100}%`;

    dom.achievementsGrid.innerHTML = '';
    Object.values(ACHIEVEMENTS).forEach(ach => {
        const isUnlocked = state.achievements.includes(ach.id);
        const badgeEl = document.createElement('div');
        badgeEl.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
        badgeEl.innerHTML = `
            <img src="${isUnlocked ? ach.icon : 'badge_locked.png'}" alt="${ach.name}">
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
        `;
        dom.achievementsGrid.appendChild(badgeEl);
    });

    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day');
        const dateKey = date.format('YYYY-MM-DD');
        labels.push(date.format('ddd'));
        const completedCount = state.completed[dateKey]?.length || 0;
        const totalHabits = state.habits.length;
        data.push(totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0);
    }

    if (progressChart) {
        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = data;
        progressChart.data.datasets[0].borderColor = state.theme.accentColor;
        progressChart.data.datasets[0].backgroundColor = `${state.theme.accentColor}33`;
        progressChart.update();
    } else if (dom.progressChartCanvas) {
        const ctx = dom.progressChartCanvas.getContext('2d');
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data,
                    borderColor: state.theme.accentColor,
                    backgroundColor: `${state.theme.accentColor}33`,
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }
    
    dom.habitStreaksContainer.innerHTML = '';
    state.habits.forEach(habit => {
        let currentStreak = 0;
        let date = dayjs();
        while(true) {
            const dateKey = date.format('YYYY-MM-DD');
            if(state.completed[dateKey] && state.completed[dateKey].includes(habit.id)) {
                currentStreak++;
                date = date.subtract(1, 'day');
            } else {
                break;
            }
        }
         const streakCard = document.createElement('div');
         streakCard.className = 'streak-card';
         streakCard.innerHTML = `
            <h3>${habit.name}</h3>
            <p>${currentStreak}</p>
            <span>day streak</span>
         `;
         dom.habitStreaksContainer.appendChild(streakCard);
    });
};

const applyTheme = () => {
    const root = document.documentElement;
    const body = document.body;

    // Apply Mode (Light/Dark)
    body.classList.toggle('dark', state.theme.mode === 'dark');

    // Apply Accent Color
    root.style.setProperty('--accent-color', state.theme.accentColor);
    
    // Generate light version of accent color
    const hex = state.theme.accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lightColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
    root.style.setProperty('--accent-color-light', lightColor);

    // Update chart colors if it exists
    if (progressChart) {
        progressChart.data.datasets[0].borderColor = state.theme.accentColor;
        progressChart.data.datasets[0].backgroundColor = lightColor;
        progressChart.update();
    }
};

const updateThemeUI = () => {
    // Update mode toggle
    const themeButtons = dom.themeModeSelector.querySelectorAll('button');
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === state.theme.mode);
    });

    // Update color swatches
    const colorSwatches = dom.accentColorSelector.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.classList.toggle('active', swatch.dataset.color === state.theme.accentColor);
    });
};

export const renderAll = () => {
    renderDashboard();
    renderCalendar();
    renderProgress();
};

export const initApp = () => {
    applyTheme();
    updateThemeUI();
    if(state.onboarded) {
        dom.onboardingScreen.classList.add('hidden');
        dom.mainApp.classList.remove('hidden');
        dom.bottomNav.classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('active');
        renderAll();
    } else {
        dom.onboardingScreen.classList.remove('hidden');
        dom.mainApp.classList.add('hidden');
        dom.bottomNav.classList.add('hidden');
    }
};

// Make render functions globally available for event handlers
window.renderAll = renderAll;
window.renderCalendar = renderCalendar;
window.applyTheme = applyTheme;
window.updateThemeUI = updateThemeUI;