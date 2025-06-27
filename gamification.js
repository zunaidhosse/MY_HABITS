import { state, saveState, ACHIEVEMENTS, POINTS_TO_LEVEL_UP_BASE } from './state.js';
import * as dom from './dom.js';
import { renderAll } from './ui.js';

export const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

export const checkLevelUp = () => {
    const pointsForNextLevel = state.level * POINTS_TO_LEVEL_UP_BASE;
    if (state.points >= pointsForNextLevel) {
        state.level++;
        state.points -= pointsForNextLevel;
        showToast(`🎉 Leveled Up to Level ${state.level}!`);
        checkLevelUp(); // In case of multiple level ups
    }
};

export const checkAchievements = () => {
    let unlockedNew = false;
    // 5 Habits Created
    if (state.habits.length >= 5 && !state.achievements.includes(ACHIEVEMENTS['5_HABITS'].id)) {
        state.achievements.push(ACHIEVEMENTS['5_HABITS'].id);
        showToast(`🏆 Achievement Unlocked: ${ACHIEVEMENTS['5_HABITS'].name}!`);
        unlockedNew = true;
    }

    // 7-day streak
    if (!state.achievements.includes(ACHIEVEMENTS['7_DAY_STREAK'].id)) {
        state.habits.forEach(habit => {
            let streak = 0;
            let date = dayjs();
            while (true) {
                const dateKey = date.format('YYYY-MM-DD');
                if (state.completed[dateKey] && state.completed[dateKey].includes(habit.id)) {
                    streak++;
                    date = date.subtract(1, 'day');
                } else {
                    break;
                }
            }
            if (streak >= 7) {
                state.achievements.push(ACHIEVEMENTS['7_DAY_STREAK'].id);
                showToast(`🏆 Achievement Unlocked: ${ACHIEVEMENTS['7_DAY_STREAK'].name}!`);
                unlockedNew = true;
                return; // exit forEach
            }
        });
    }
    
    // Perfect Month (30 consecutive days of 100% completion)
    if (!state.achievements.includes(ACHIEVEMENTS['PERFECT_MONTH'].id) && state.habits.length > 0) {
        let perfectDays = 0;
        let date = dayjs();
         for(let i=0; i<30; i++) {
            const dateKey = date.format('YYYY-MM-DD');
            const completedCount = state.completed[dateKey]?.length || 0;
            if(completedCount > 0 && completedCount === state.habits.length) {
                perfectDays++;
            }
            date = date.subtract(1, 'day');
        }
        if (perfectDays >= 30) {
            state.achievements.push(ACHIEVEMENTS['PERFECT_MONTH'].id);
            showToast(`🏆 Achievement Unlocked: ${ACHIEVEMENTS['PERFECT_MONTH'].name}!`);
            unlockedNew = true;
        }
    }
    return unlockedNew;
};