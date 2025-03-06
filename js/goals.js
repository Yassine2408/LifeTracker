// goals.js - Handles goals and projects functionality

document.addEventListener('DOMContentLoaded', function() {
    // If we're on the goals view, initialize it
    document.addEventListener('viewLoaded', function(e) {
        if (e.detail.view === 'goals') {
            initGoalsTracker();
        }
    });
});

async function initGoalsTracker() {
    // Set up event listeners for the goals tracker
    setupGoalsListeners();
    
    // Load saved goals
    await loadGoals();
}

function setupGoalsListeners() {
    // Goal tabs (active/completed/projects)
    document.querySelectorAll('.goal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.goal-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const tabType = this.getAttribute('data-tab');
            changeGoalsTab(tabType);
        });
    });
    
    // Add goal button
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', showAddGoalForm);
    }
    
    // Goal filter
    const goalFilter = document.getElementById('goal-filter');
    if (goalFilter) {
        goalFilter.addEventListener('change', function() {
            filterGoals(this.value);
        });
    }
    
    // Milestone checkboxes
    document.querySelectorAll('.milestone input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const goalItem = this.closest('.goal-item');
            updateGoalProgress(goalItem);
            saveGoals();
        });
    });
    
    // Edit and delete buttons
    document.querySelectorAll('.edit-goal').forEach(btn => {
        btn.addEventListener('click', function() {
            const goalItem = this.closest('.goal-item');
            const goalTitle = goalItem.querySelector('.goal-title').textContent;
            editGoal(goalItem, goalTitle);
        });
    });
    
    document.querySelectorAll('.delete-goal').forEach(btn => {
        btn.addEventListener('click', function() {
            const goalItem = this.closest('.goal-item');
            const goalTitle = goalItem.querySelector('.goal-title').textContent;
            deleteGoal(goalItem, goalTitle);
        });
    });
}

function showAddGoalForm() {
    // In a real app, this would show a modal with a form
    // For simplicity, we'll use prompts
    
    const goalTitle = prompt('Enter goal title:');
    if (!goalTitle || goalTitle.trim() === '') return;
    
    const categories = ['Personal', 'Professional', 'Health', 'Financial'];
    let categoryPrompt = 'Select category number:\n';
    categories.forEach((cat, index) => {
        categoryPrompt += `${index + 1}. ${cat}\n`;
    });
    
    const categoryIndex = parseInt(prompt(categoryPrompt, '1')) - 1;
    if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
        alert('Invalid category selection');
        return;
    }
    
    const category = categories[categoryIndex].toLowerCase();
    
    const description = prompt('Enter goal description (optional):');
    
    const deadline = prompt('Enter deadline (YYYY-MM-DD):', getFormattedDate(30));
    
    // Create milestones
    const milestones = [];
    let addMoreMilestones = true;
    
    while (addMoreMilestones) {
        const milestone = prompt('Enter a milestone for this goal:');
        if (milestone && milestone.trim() !== '') {
            milestones.push({
                text: milestone.trim(),
                completed: false
            });
            
            addMoreMilestones = confirm('Add another milestone?');
        } else {
            addMoreMilestones = false;
        }
    }
    
    // Add the goal
    addGoal(goalTitle, category, description, deadline, milestones);
}

async function addGoal(title, category, description, deadline, milestones) {
    if (!currentUser) return;
    
    const goalsList = document.querySelector('.goals-list');
    
    const goalItem = document.createElement('div');
    goalItem.className = 'goal-item';
    
    // Create milestones HTML
    let milestonesHTML = '';
    milestones.forEach((milestone, index) => {
        milestonesHTML += `
            <div class="milestone" data-index="${index}">
                <input type="checkbox" ${milestone.completed ? 'checked' : ''}>
                <span>${milestone.text}</span>
            </div>
        `;
    });
    
    // Calculate initial progress (0%)
    const progress = '0%';
    
    // Create goal HTML
    goalItem.innerHTML = `
        <div class="goal-progress">
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}"></div>
            </div>
            <span class="progress-text">${progress}</span>
        </div>
        <div class="goal-details">
            <h3 class="goal-title">${title}</h3>
            <div class="goal-meta">
                <span class="goal-category ${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                <span class="goal-deadline">Due: ${deadline}</span>
            </div>
            <p class="goal-description">${description || 'No description provided.'}</p>
            <div class="goal-milestones">
                ${milestonesHTML}
            </div>
        </div>
        <div class="goal-actions">
            <button class="edit-goal"><i class="fas fa-edit"></i></button>
            <button class="delete-goal"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // Add event listeners
    goalItem.querySelectorAll('.milestone input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateGoalProgress(goalItem);
            saveGoalMilestones(goalItem);
        });
    });
    
    goalItem.querySelector('.edit-goal').addEventListener('click', function() {
        editGoal(goalItem, title);
    });
    
    goalItem.querySelector('.delete-goal').addEventListener('click', function() {
        deleteGoal(goalItem, title);
    });
    
    goalsList.appendChild(goalItem);
    
    // Save to database
    const goalData = {
        title: title,
        category: category,
        description: description || '',
        deadline: deadline,
        progress: 0,
        completed: false,
        created_at: new Date().toISOString()
    };
    
    try {
        const result = await saveData('goals', goalData, currentUser.id);
        if (result.success && result.data.length > 0) {
            const goalId = result.data[0].id;
            goalItem.setAttribute('data-id', goalId);
            
            // Save milestones
            for (const milestone of milestones) {
                const milestoneData = {
                    goal_id: goalId,
                    text: milestone.text,
                    completed: milestone.completed
                };
                
                await saveData('milestones', milestoneData, currentUser.id);
            }
        }
    } catch (error) {
        console.error('Error saving goal:', error);
    }
    
    updateGoalProgress(goalItem);
}

function updateGoalProgress(goalItem) {
    // Calculate progress based on completed milestones
    const milestones = goalItem.querySelectorAll('.milestone input');
    const completedMilestones = goalItem.querySelectorAll('.milestone input:checked');
    
    if (milestones.length === 0) return;
    
    const progressPercent = Math.round((completedMilestones.length / milestones.length) * 100);
    const progressText = `${progressPercent}%`;
    
    goalItem.querySelector('.progress').style.width = progressText;
    goalItem.querySelector('.progress-text').textContent = progressText;
    
    // Update progress in database
    const goalId = goalItem.getAttribute('data-id');
    if (goalId) {
        updateGoalProgressInDb(goalId, progressPercent);
    }
}

async function updateGoalProgressInDb(goalId, progress) {
    if (!currentUser) return;
    
    try {
        await saveData('goals', { id: goalId, progress: progress }, currentUser.id);
    } catch (error) {
        console.error('Error updating goal progress:', error);
    }
}

async function saveGoalMilestones(goalItem) {
    if (!currentUser) return;
    
    const goalId = goalItem.getAttribute('data-id');
    if (!goalId) return;
    
    try {
        // Get all milestones for this goal
        const milestones = goalItem.querySelectorAll('.milestone');
        
        for (const milestone of milestones) {
            const index = milestone.getAttribute('data-index');
            const completed = milestone.querySelector('input').checked;
            const text = milestone.querySelector('span').textContent;
            
            // Get milestone ID if it exists
            const milestoneId = milestone.getAttribute('data-id');
            
            if (milestoneId) {
                // Update existing milestone
                await saveData('milestones', {
                    id: milestoneId,
                    completed: completed
                }, currentUser.id);
            } else {
                // This is a new milestone, save it
                const result = await saveData('milestones', {
                    goal_id: goalId,
                    text: text,
                    completed: completed
                }, currentUser.id);
                
                if (result.success && result.data.length > 0) {
                    milestone.setAttribute('data-id', result.data[0].id);
                }
            }
        }
    } catch (error) {
        console.error('Error saving goal milestones:', error);
    }
}

function editGoal(goalItem, currentTitle) {
    // In a real app, this would show a modal with the current values
    alert(`Editing goal: ${currentTitle} will be implemented with a proper form`);
}

async function deleteGoal(goalItem, goalTitle) {
    if (confirm(`Are you sure you want to delete the goal: ${goalTitle}?`)) {
        const goalId = goalItem.getAttribute('data-id');
        
        if (goalId && currentUser) {
            try {
                // Delete goal from database
                await deleteData('goals', goalId, currentUser.id);
                
                // Delete associated milestones
                // In a real app, this would be handled by a database cascade delete
                const milestonesResult = await loadData('milestones', currentUser.id);
                if (milestonesResult.success) {
                    const goalMilestones = milestonesResult.data.filter(m => m.goal_id === goalId);
                    
                    for (const milestone of goalMilestones) {
                        await deleteData('milestones', milestone.id, currentUser.id);
                    }
                }
            } catch (error) {
                console.error('Error deleting goal:', error);
            }
        }
        
        goalItem.remove();
    }
}

function changeGoalsTab(tabType) {
    // This would update the goals view based on the selected tab
    console.log(`Changing goals tab to: ${tabType}`);
    
    if (!currentUser) return;
    
    // Load goals based on tab type
    loadGoals(tabType);
}

function filterGoals(category) {
    // This would filter goals based on the selected category
    console.log(`Filtering goals by category: ${category}`);
    
    const goalItems = document.querySelectorAll('.goal-item');
    
    if (category === 'all') {
        goalItems.forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        goalItems.forEach(item => {
            const goalCategory = item.querySelector('.goal-category').textContent.toLowerCase();
            
            if (goalCategory === category) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

async function loadGoals(tabType = 'active') {
    if (!currentUser) return;
    
    try {
        // Load goals from database
        const result = await loadData('goals', currentUser.id);
        
        if (result.success) {
            // Clear existing goals
            const goalsList = document.querySelector('.goals-list');
            if (!goalsList) return;
            
            goalsList.innerHTML = '';
            
            // Filter goals based on tab type
            let filteredGoals = result.data;
            
            if (tabType === 'active') {
                filteredGoals = result.data.filter(goal => !goal.completed);
            } else if (tabType === 'completed') {
                filteredGoals = result.data.filter(goal => goal.completed);
            } else if (tabType === 'projects') {
                // In a real app, you'd have a project flag or type
                filteredGoals = result.data.filter(goal => goal.category === 'professional');
            }
            
            // Add saved goals
            for (const goal of filteredGoals) {
                // Load milestones for this goal
                const milestonesResult = await loadData('milestones', currentUser.id);
                let milestones = [];
                
                if (milestonesResult.success) {
                    milestones = milestonesResult.data.filter(m => m.goal_id === goal.id);
                }
                
                // Create milestones HTML
                let milestonesHTML = '';
                milestones.forEach((milestone, index) => {
                    milestonesHTML += `
                        <div class="milestone" data-index="${index}" data-id="${milestone.id}">
                            <input type="checkbox" ${milestone.completed ? 'checked' : ''}>
                            <span>${milestone.text}</span>
                        </div>
                    `;
                });
                
                const goalItem = document.createElement('div');
                goalItem.className = 'goal-item';
                goalItem.setAttribute('data-id', goal.id);
                
                // Create goal HTML
                goalItem.innerHTML = `
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${goal.progress}%"></div>
                        </div>
                        <span class="progress-text">${goal.progress}%</span>
                    </div>
                    <div class="goal-details">
                        <h3 class="goal-title">${goal.title}</h3>
                        <div class="goal-meta">
                            <span class="goal-category ${goal.category}">${goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}</span>
                            <span class="goal-deadline">Due: ${goal.deadline}</span>
                        </div>
                        <p class="goal-description">${goal.description || 'No description provided.'}</p>
                        <div class="goal-milestones">
                            ${milestonesHTML}
                        </div>
                    </div>
                    <div class="goal-actions">
                        <button class="edit-goal"><i class="fas fa-edit"></i></button>
                        <button class="delete-goal"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                // Add event listeners
                goalItem.querySelectorAll('.milestone input').forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        updateGoalProgress(goalItem);
                        saveGoalMilestones(goalItem);
                    });
                });
                
                goalItem.querySelector('.edit-goal').addEventListener('click', function() {
                    editGoal(goalItem, goal.title);
                });
                
                goalItem.querySelector('.delete-goal').addEventListener('click', function() {
                    deleteGoal(goalItem, goal.title);
                });
                
                goalsList.appendChild(goalItem);
            }
        }
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

// Utility functions
function getFormattedDate(daysFromNow = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
} 