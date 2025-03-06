// habits.js - Handles habit tracking functionality

document.addEventListener('DOMContentLoaded', function() {
    // If we're on the habits view, initialize it
    document.addEventListener('viewLoaded', function(e) {
        if (e.detail.view === 'habits') {
            initHabitsTracker();
        }
    });
});

async function initHabitsTracker() {
    // Set up event listeners for the habit tracker
    setupHabitsListeners();
    
    // Load saved habits
    await loadHabits();
}

function setupHabitsListeners() {
    // Add habit button
    const addHabitBtn = document.getElementById('add-habit-btn');
    if (addHabitBtn) {
        addHabitBtn.addEventListener('click', showAddHabitForm);
    }
    
    // View options (daily/weekly/monthly)
    document.querySelectorAll('.view-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.view-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            
            const viewType = this.getAttribute('data-view');
            changeHabitView(viewType);
        });
    });
    
    // Habit checkboxes
    document.querySelectorAll('.day-check input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const habitRow = this.closest('.habit-row');
            updateHabitStreak(habitRow);
            saveHabits();
        });
    });
    
    // Edit and delete buttons
    document.querySelectorAll('.edit-habit').forEach(btn => {
        btn.addEventListener('click', function() {
            const habitRow = this.closest('.habit-row');
            const habitName = habitRow.querySelector('.habit-name').textContent;
            editHabit(habitRow, habitName);
        });
    });
    
    document.querySelectorAll('.delete-habit').forEach(btn => {
        btn.addEventListener('click', function() {
            const habitRow = this.closest('.habit-row');
            const habitName = habitRow.querySelector('.habit-name').textContent;
            deleteHabit(habitRow, habitName);
        });
    });
}

function showAddHabitForm() {
    // In a real app, this would show a modal with a form
    const habitName = prompt('Enter habit name:');
    if (habitName && habitName.trim() !== '') {
        addHabit(habitName.trim());
    }
}

async function addHabit(habitName) {
    if (!currentUser) return;
    
    const habitsContainer = document.querySelector('.habits-container');
    
    const habitRow = document.createElement('div');
    habitRow.className = 'habit-row';
    
    // Create habit row HTML
    habitRow.innerHTML = `
        <div class="habit-name">${habitName}</div>
        <div class="habit-days">
            <div class="day-check" data-day="1"><input type="checkbox"></div>
            <div class="day-check" data-day="2"><input type="checkbox"></div>
            <div class="day-check" data-day="3"><input type="checkbox"></div>
            <div class="day-check" data-day="4"><input type="checkbox"></div>
            <div class="day-check" data-day="5"><input type="checkbox"></div>
            <div class="day-check" data-day="6"><input type="checkbox"></div>
            <div class="day-check" data-day="7"><input type="checkbox"></div>
        </div>
        <div class="habit-streak">0 days</div>
        <div class="habit-actions">
            <button class="edit-habit"><i class="fas fa-edit"></i></button>
            <button class="delete-habit"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // Add event listeners
    habitRow.querySelectorAll('.day-check input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateHabitStreak(habitRow);
            saveHabits();
        });
    });
    
    habitRow.querySelector('.edit-habit').addEventListener('click', function() {
        editHabit(habitRow, habitName);
    });
    
    habitRow.querySelector('.delete-habit').addEventListener('click', function() {
        deleteHabit(habitRow, habitName);
    });
    
    habitsContainer.appendChild(habitRow);
    
    // Save to database
    const habitData = {
        name: habitName,
        streak: 0,
        created_at: new Date().toISOString()
    };
    
    try {
        const result = await saveData('habits', habitData, currentUser.id);
        if (result.success && result.data.length > 0) {
            habitRow.setAttribute('data-id', result.data[0].id);
        }
    } catch (error) {
        console.error('Error saving habit:', error);
    }
}

async function editHabit(habitRow, currentName) {
    const newName = prompt('Edit habit name:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
        habitRow.querySelector('.habit-name').textContent = newName;
        
        // Update in database
        const habitId = habitRow.getAttribute('data-id');
        if (habitId) {
            try {
                await saveData('habits', { id: habitId, name: newName }, currentUser.id);
            } catch (error) {
                console.error('Error updating habit name:', error);
            }
        }
    }
}

async function deleteHabit(habitRow, habitName) {
    if (confirm(`Are you sure you want to delete the habit: ${habitName}?`)) {
        // Delete from database
        const habitId = habitRow.getAttribute('data-id');
        if (habitId) {
            try {
                await deleteData('habits', habitId, currentUser.id);
            } catch (error) {
                console.error('Error deleting habit:', error);
            }
        }
        
        habitRow.remove();
    }
}

function updateHabitStreak(habitRow) {
    // Calculate streak based on consecutive checked days
    const checkboxes = habitRow.querySelectorAll('.day-check input');
    let streak = 0;
    
    // Count consecutive checked days from the end
    for (let i = checkboxes.length - 1; i >= 0; i--) {
        if (checkboxes[i].checked) {
            streak++;
        } else {
            break;
        }
    }
    
    habitRow.querySelector('.habit-streak').textContent = `${streak} days`;
    
    // Update streak in database
    const habitId = habitRow.getAttribute('data-id');
    if (habitId) {
        updateHabitStreakInDb(habitId, streak);
    }
}

async function updateHabitStreakInDb(habitId, streak) {
    if (!currentUser) return;
    
    try {
        await saveData('habits', { id: habitId, streak: streak }, currentUser.id);
    } catch (error) {
        console.error('Error updating habit streak:', error);
    }
}

function changeHabitView(viewType) {
    // This would update the habit view based on the selected option
    console.log(`Changing to ${viewType} habit view`);
    
    // In a real app, this would:
    // 1. Change the display of the habit tracker
    // 2. Update the day labels
    // 3. Load appropriate habit data
    
    alert(`Changing to ${viewType} view will be implemented here`);
}

async function saveHabits() {
    // This is handled by individual habit updates now
    console.log('Habits saved individually');
}

async function loadHabits() {
    if (!currentUser) return;
    
    try {
        // Load habits from database
        const result = await loadData('habits', currentUser.id);
        
        if (result.success) {
            // Clear existing habits except header
            const habitsContainer = document.querySelector('.habits-container');
            const headerRow = document.querySelector('.habit-row.header-row');
            
            if (!habitsContainer || !headerRow) return;
            
            habitsContainer.innerHTML = '';
            habitsContainer.appendChild(headerRow);
            
            // Add saved habits
            result.data.forEach(habit => {
                const habitRow = document.createElement('div');
                habitRow.className = 'habit-row';
                habitRow.setAttribute('data-id', habit.id);
                
                // Create habit days HTML
                let daysHTML = '';
                for (let i = 1; i <= 7; i++) {
                    daysHTML += `
                        <div class="day-check" data-day="${i}">
                            <input type="checkbox">
                        </div>
                    `;
                }
                
                habitRow.innerHTML = `
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-days">${daysHTML}</div>
                    <div class="habit-streak">${habit.streak || 0} days</div>
                    <div class="habit-actions">
                        <button class="edit-habit"><i class="fas fa-edit"></i></button>
                        <button class="delete-habit"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                // Add event listeners
                habitRow.querySelectorAll('.day-check input').forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        updateHabitStreak(habitRow);
                        saveHabits();
                    });
                });
                
                habitRow.querySelector('.edit-habit').addEventListener('click', function() {
                    editHabit(habitRow, habit.name);
                });
                
                habitRow.querySelector('.delete-habit').addEventListener('click', function() {
                    deleteHabit(habitRow, habit.name);
                });
                
                habitsContainer.appendChild(habitRow);
                
                // Load habit checks
                loadHabitChecks(habit.id, habitRow);
            });
        }
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

async function loadHabitChecks(habitId, habitRow) {
    if (!currentUser) return;
    
    try {
        // Load habit checks from database
        const result = await loadData('habit_checks', currentUser.id);
        
        if (result.success) {
            // Filter checks for this habit
            const habitChecks = result.data.filter(check => check.habit_id === habitId);
            
            // Get current week's start date
            const startOfWeek = getStartOfWeek(new Date());
            
            // Check boxes for days that have been checked this week
            habitChecks.forEach(check => {
                const checkDate = new Date(check.date);
                const dayOfWeek = checkDate.getDay();
                const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
                
                // Check if this check is from the current week
                const checkDateStart = new Date(checkDate);
                checkDateStart.setHours(0, 0, 0, 0);
                
                const startOfWeekDate = new Date(startOfWeek);
                startOfWeekDate.setHours(0, 0, 0, 0);
                
                const diffTime = checkDateStart - startOfWeekDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays < 7) {
                    const checkbox = habitRow.querySelector(`.day-check[data-day="${dayIndex}"] input`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                }
            });
            
            // Update streak display
            updateHabitStreak(habitRow);
        }
    } catch (error) {
        console.error('Error loading habit checks:', error);
    }
}

// Utility functions
function getStartOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    result.setDate(diff);
    return result;
} 