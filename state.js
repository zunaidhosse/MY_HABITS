export const state = {
    habits: [],
    completed: {}, // { 'YYYY-MM-DD': ['habitId1', 'habitId2'] }
    onboarded: false,
    currentDate: dayjs().format('YYYY-MM-DD'),
    points: 0,
    level: 1,
    achievements: [], // Stores IDs of unlocked achievements
    theme: {
        mode: 'light', // 'light' or 'dark'
        accentColor: '#4CAF50' // hex color
    }
};

export const POINTS_PER_HABIT = 10;
export const POINTS_TO_LEVEL_UP_BASE = 100;
export const ACHIEVEMENTS = {
    '5_HABITS': { id: '5_HABITS', name: 'Habit Starter', description: 'Create 5 habits', icon: 'badge_5_habits.png' },
    '7_DAY_STREAK': { id: '7_DAY_STREAK', name: 'Consistent', description: '7-day streak', icon: 'badge_7_day_streak.png' },
    'PERFECT_MONTH': { id: 'PERFECT_MONTH', name: 'Iron Will', description: '30 days perfect', icon: 'badge_perfect_month.png' },
};

export const HABIT_TEMPLATES = [
    "Drink water in the morning",
    "15 minutes meditation",
    "Read 10 pages",
    "Go for a walk",
    "Plan your day",
    "No junk food"
];

export const saveState = () => {
    localStorage.setItem('habitFlowState', JSON.stringify(state));
};

export const loadState = () => {
    const savedState = localStorage.getItem('habitFlowState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Ensure habits have unique IDs if old data is present
        parsedState.habits = parsedState.habits.map(h => typeof h === 'string' ? { id: `habit-${Date.now()}-${Math.random()}`, name: h } : h);
        
        // Deep merge for state to preserve new top-level keys like 'theme'
        Object.keys(state).forEach(key => {
            if (parsedState[key] !== undefined) {
                if (typeof state[key] === 'object' && state[key] !== null && !Array.isArray(state[key])) {
                     // Merge objects like 'theme' without overwriting completely
                    state[key] = { ...state[key], ...parsedState[key] };
                } else {
                    state[key] = parsedState[key];
                }
            }
        });

    } else {
        // Default habits for new users
         state.habits = [
            { id: `habit-${Date.now()}-1`, name: "Drink water" },
            { id: `habit-${Date.now()}-2`, name: "Workout" },
            { id: `habit-${Date.now()}-3`, name: "Read for 15 minutes" },
        ];
    }
};

export const getHabitById = (id) => state.habits.find(h => h.id === id);