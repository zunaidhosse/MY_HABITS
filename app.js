import { initApp } from './ui.js';
import { loadState, state, getHabitById, saveState } from './state.js';
import { handleAddHabit, handleDeleteHabit, handleToggleComplete } from './handlers.js';
import * as dom from './dom.js';

dayjs.extend(window.dayjs_plugin_isoWeek);
dayjs.extend(window.dayjs_plugin_customParseFormat);

document.addEventListener('DOMContentLoaded', () => {

    // --- PWA Installation ---
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can install the PWA
        dom.installContainer.style.display = 'block';
    });

    dom.installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            // Hide the install button
            dom.installContainer.style.display = 'none';
        }
    });

    // --- EVENT LISTENERS ---
    dom.getStartedBtn.addEventListener('click', () => {
        state.onboarded = true;
        localStorage.setItem('habitFlowState', JSON.stringify(state)); // Direct save needed here
        initApp();
    });

    dom.addHabitBtnDashboard.addEventListener('click', () => {
        handleAddHabit(dom.newHabitInputDashboard.value);
        dom.newHabitInputDashboard.value = '';
    });
    dom.newHabitInputDashboard.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddHabit(dom.newHabitInputDashboard.value);
            dom.newHabitInputDashboard.value = '';
        }
    });
    
    dom.addHabitBtnCalendar.addEventListener('click', () => {
        handleAddHabit(dom.newHabitInputCalendar.value);
        dom.newHabitInputCalendar.value = '';
    });
    dom.newHabitInputCalendar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddHabit(dom.newHabitInputCalendar.value);
            dom.newHabitInputCalendar.value = '';
        }
    });

    dom.todayHabitsList.addEventListener('click', (e) => {
        const habitItem = e.target.closest('.habit-item');
        if (!habitItem) return;

        const habitId = habitItem.dataset.habitId;
        const today = dayjs().format('YYYY-MM-DD');

        if (e.target.classList.contains('delete-btn')) {
             if (confirm(`Are you sure you want to delete "${getHabitById(habitId).name}"? This will remove it from all days.`)) {
                handleDeleteHabit(habitId);
            }
        } else {
            handleToggleComplete(habitId, today);
        }
    });
    
    dom.calendarHabitsList.addEventListener('click', (e) => {
        const habitItem = e.target.closest('.habit-item');
        if (!habitItem) return;
        const habitId = habitItem.dataset.habitId;
        
        if (e.target.classList.contains('delete-btn')) {
             if (confirm(`Are you sure you want to delete "${getHabitById(habitId).name}"? This will remove it from all days.`)) {
                handleDeleteHabit(habitId);
            }
        } else {
            handleToggleComplete(habitId, state.currentDate);
        }
    });

    dom.calPrevDayBtn.addEventListener('click', () => {
        state.currentDate = dayjs(state.currentDate).subtract(1, 'day').format('YYYY-MM-DD');
        window.renderCalendar(); // Use global render function from ui.js
    });
    dom.calNextDayBtn.addEventListener('click', () => {
        state.currentDate = dayjs(state.currentDate).add(1, 'day').format('YYYY-MM-DD');
        window.renderCalendar(); // Use global render function from ui.js
    });

    dom.navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.dataset.screen;

            dom.screens.forEach(screen => screen.classList.remove('active'));
            document.getElementById(targetScreenId).classList.add('active');

            dom.navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            if(targetScreenId === 'progress-screen' || targetScreenId === 'dashboard-screen') {
                window.renderAll(); // Use global render function from ui.js
            }
        });
    });
    
    dom.resetDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
            localStorage.removeItem('habitFlowState');
            // Reset state in memory before reload
            Object.assign(state, { habits: [], completed: {}, onboarded: false, currentDate: dayjs().format('YYYY-MM-DD'), points: 0, level: 1, achievements: [], theme: { mode: 'light', accentColor: '#4CAF50' } });
            window.location.reload();
        }
    });

    // Theme switch listeners
    dom.themeModeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            state.theme.mode = button.dataset.theme;
            window.applyTheme();
            window.updateThemeUI();
            saveState();
        }
    });

    dom.accentColorSelector.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
            state.theme.accentColor = swatch.dataset.color;
            window.applyTheme();
            window.updateThemeUI();
            saveState();
        }
    });

    dom.habitTemplatesContainer.addEventListener('click', (e) => {
        const templateButton = e.target.closest('.habit-template');
        if (templateButton) {
            const habitName = templateButton.dataset.habitName;
            handleAddHabit(habitName);
        }
    });

    loadState();
    initApp();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});