import { state, saveState, POINTS_PER_HABIT } from './state.js';
import { checkAchievements, checkLevelUp } from './gamification.js';

export const handleAddHabit = (habitName) => {
    habitName = habitName.trim();
    if (habitName) {
        state.habits.push({ id: `habit-${Date.now()}-${Math.random()}`, name: habitName });
        checkAchievements();
        saveState();
        window.renderAll();
    }
};

export const handleDeleteHabit = (habitId) => {
    state.habits = state.habits.filter(h => h.id !== habitId);
    Object.keys(state.completed).forEach(d => {
        state.completed[d] = state.completed[d].filter(id => id !== habitId);
    });
    saveState();
    window.renderAll();
};

export const handleToggleComplete = (habitId, date) => {
    if (!state.completed[date]) {
        state.completed[date] = [];
    }

    const completedList = state.completed[date];
    const habitIndex = completedList.indexOf(habitId);

    if (habitIndex > -1) {
        completedList.splice(habitIndex, 1); // Mark as incomplete
        state.points = Math.max(0, state.points - POINTS_PER_HABIT);
    } else {
        completedList.push(habitId); // Mark as complete
        state.points += POINTS_PER_HABIT;
    }

    checkLevelUp();
    checkAchievements();
    saveState();
    window.renderAll();
};