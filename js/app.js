let currentUser = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const user = await checkUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Display user name
    document.getElementById('user-name').textContent = user.user_metadata.full_name || 'User';
    
    // Initialize the application
    initApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadData();
    
    // Update the date display
    updateDateDisplay();
    
    // Initialize mini calendar
    initMiniCalendar();
    
    // Load daily quote
    loadDailyQuote();
});

function initApp() {
    // Create time blocks for daily view
    createTimeBlocks();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.getElementById('theme-select').value = savedTheme;
    applyTheme(savedTheme);
}

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            changeView(view);
        });
    });
    
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', function() {
        document.getElementById('settings-modal').style.display = 'block';
    });
    
    // Close modal
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('settings-modal').style.display = 'none';
    });
    
    // Save settings
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Add task functionality
    document.getElementById('new-task').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== '') {
            addTask(this.value.trim());
            this.value = '';
        }
    });
    
    // Quick add buttons
    document.getElementById('add-task').addEventListener('click', function() {
        document.getElementById('new-task').focus();
    });
    
    document.getElementById('add-event').addEventListener('click', function() {
        // Show event creation modal or form
        const hour = new Date().getHours();
        const eventSpace = document.querySelector(`.event-space[data-hour="${hour}"]`);
        if (eventSpace) {
            createEvent(hour, eventSpace);
        } else {
            alert('Please select a time slot to add an event');
        }
    });
    
    document.getElementById('add-note').addEventListener('click', function() {
        document.getElementById('daily-notes').focus();
    });
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportToPDF);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Window click to close modal
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('settings-modal')) {
            document.getElementById('settings-modal').style.display = 'none';
        }
    });
    
    // Calendar navigation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('prev-month')) {
            navigateMonth(-1);
        } else if (e.target.classList.contains('next-month')) {
            navigateMonth(1);
        }
    });
}

async function handleLogout() {
    const result = await signOut();
    if (result.success) {
        window.location.href = 'login.html';
    } else {
        alert('Error signing out. Please try again.');
    }
}

function changeView(view) {
    // Remove active class from all links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to selected link
    document.querySelector(`.nav-links a[data-view="${view}"]`).classList.add('active');
    
    // Hide all views
    document.querySelectorAll('.planner-view').forEach(viewElement => {
        viewElement.classList.remove('active');
    });
    
    // Show selected view
    const viewElement = document.getElementById(`${view}-view`);
    
    if (viewElement) {
        viewElement.classList.add('active');
    } else {
        // If view doesn't exist yet, load it
        loadView(view);
    }
}

function loadView(view) {
    // This would typically fetch the HTML for the view from the server
    // For now, we'll create it dynamically
    
    const viewContainer = document.getElementById('view-container');
    const viewElement = document.createElement('div');
    viewElement.id = `${view}-view`;
    viewElement.className = 'planner-view active';
    
    switch(view) {
        case 'weekly':
            viewElement.innerHTML = createWeeklyView();
            break;
        case 'monthly':
            viewElement.innerHTML = createMonthlyView();
            break;
        case 'habits':
            viewElement.innerHTML = createHabitsView();
            break;
        case 'goals':
            viewElement.innerHTML = createGoalsView();
            break;
        default:
            viewElement.innerHTML = '<h2>View not found</h2>';
    }
    
    viewContainer.appendChild(viewElement);
    
    // Initialize the new view
    if (view === 'weekly') {
        initWeeklyPlanner();
    } else if (view === 'monthly') {
        initMonthlyPlanner();
    } else if (view === 'habits') {
        initHabitsTracker();
    } else if (view === 'goals') {
        initGoalsTracker();
    }
    
    // Trigger viewLoaded event
    document.dispatchEvent(new CustomEvent('viewLoaded', { detail: { view } }));
}

function createTimeBlocks() {
    const timeBlocksContainer = document.querySelector('.time-blocks');
    if (!timeBlocksContainer) return;
    
    timeBlocksContainer.innerHTML = ''; // Clear existing blocks
    
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
        const timeBlock = document.createElement('div');
        timeBlock.className = 'time-block';
        
        const timeFormat = localStorage.getItem('timeFormat') || '12';
        const timeDisplay = formatHour(hour, timeFormat);
        
        timeBlock.innerHTML = `
            <div class="time">${timeDisplay}</div>
            <div class="event-space" data-hour="${hour}"></div>
        `;
        
        timeBlocksContainer.appendChild(timeBlock);
    }
    
    // Add event listeners to event spaces
    document.querySelectorAll('.event-space').forEach(space => {
        space.addEventListener('click', function() {
            const hour = this.getAttribute('data-hour');
            createEvent(hour, this);
        });
    });
}

function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = currentDate.toLocaleDateString('en-US', options);
}

function initMiniCalendar() {
    const calendarElement = document.getElementById('mini-calendar');
    if (!calendarElement) return;
    
    calendarElement.innerHTML = ''; // Clear existing calendar
    
    // Create calendar header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    calendarHeader.innerHTML = `
        <button class="prev-month">&lt;</button>
        <h4>${monthNames[currentMonth]} ${currentYear}</h4>
        <button class="next-month">&gt;</button>
    `;
    
    // Create calendar grid
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // Add day headers
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        // Highlight current day
        if (day === currentDate.getDate() && 
            currentMonth === currentDate.getMonth() && 
            currentYear === currentDate.getFullYear()) {
            dayCell.classList.add('current');
        }
        
        // Make day clickable
        dayCell.addEventListener('click', function() {
            selectDate(new Date(currentYear, currentMonth, day));
        });
        
        calendarGrid.appendChild(dayCell);
    }
    
    // Append header and grid to calendar
    calendarElement.appendChild(calendarHeader);
    calendarElement.appendChild(calendarGrid);
}

function navigateMonth(direction) {
    // Update current month and year
    currentMonth += direction;
    
    // Handle year change
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    // Reinitialize mini calendar
    initMiniCalendar();
    
    // If we're in the monthly view, update that too
    const monthlyView = document.getElementById('monthly-view');
    if (monthlyView && monthlyView.classList.contains('active')) {
        initMonthlyPlanner();
    }
}

function selectDate(date) {
    currentDate = date;
    updateDateDisplay();
    
    // Load data for the selected date
    loadDailyData(formatDateForStorage(date));
    
    // Highlight the selected date in the calendar
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.textContent == date.getDate() && !day.classList.contains('empty')) {
            day.classList.add('selected');
        }
    });
}

function loadDailyQuote() {
    // In a real app, this would fetch from an API or database
    const quotes = [
        { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
    ];
    
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    // Update the quote display
    document.getElementById('quote-text').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `- ${quote.author}`;
}

function addTask(taskText) {
    const tasksList = document.getElementById('tasks');
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    
    taskItem.innerHTML = `
        <input type="checkbox" class="task-check">
        <span class="task-text">${taskText}</span>
        <button class="delete-task"><i class="fas fa-trash"></i></button>
    `;
    
    // Add event listeners
    taskItem.querySelector('.task-check').addEventListener('change', function() {
        if (this.checked) {
            taskItem.classList.add('completed');
        } else {
            taskItem.classList.remove('completed');
        }
        saveTasks();
    });
    
    taskItem.querySelector('.delete-task').addEventListener('click', function() {
        if (confirm('Delete this task?')) {
            taskItem.remove();
            saveTasks();
        }
    });
    
    tasksList.appendChild(taskItem);
    saveTasks();
}

async function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(item => {
        tasks.push({
            text: item.querySelector('.task-text').textContent,
            completed: item.querySelector('.task-check').checked,
            date: formatDateForStorage(currentDate)
        });
    });
    
    // Save to Supabase
    if (currentUser) {
        await saveData('tasks', {
            user_id: currentUser.id,
            date: formatDateForStorage(currentDate),
            tasks: tasks
        });
    }
}

function formatHour(hour, format = '12') {
    if (format === '12') {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour} ${period}`;
    } else {
        return `${hour}:00`;
    }
}

function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadData() {
    // Load data for the current date
    await loadDailyData(formatDateForStorage(currentDate));
}

async function loadDailyData(dateString) {
    if (!currentUser) return;
    
    // Clear existing data
    document.getElementById('tasks').innerHTML = '';
    document.querySelectorAll('.event-space').forEach(space => {
        space.innerHTML = '';
    });
    document.getElementById('daily-notes').value = '';
    
    // Load tasks
    const tasksResult = await loadData('tasks', currentUser.id);
    if (tasksResult.success && tasksResult.data) {
        const todayData = tasksResult.data.find(item => item.date === dateString);
        if (todayData && todayData.tasks) {
            todayData.tasks.forEach(task => {
                const tasksList = document.getElementById('tasks');
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                if (task.completed) {
                    taskItem.classList.add('completed');
                }
                
                taskItem.innerHTML = `
                    <input type="checkbox" class="task-check" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    <button class="delete-task"><i class="fas fa-trash"></i></button>
                `;
                
                // Add event listeners
                taskItem.querySelector('.task-check').addEventListener('change', function() {
                    if (this.checked) {
                        taskItem.classList.add('completed');
                    } else {
                        taskItem.classList.remove('completed');
                    }
                    saveTasks();
                });
                
                taskItem.querySelector('.delete-task').addEventListener('click', function() {
                    if (confirm('Delete this task?')) {
                        taskItem.remove();
                        saveTasks();
                    }
                });
                
                tasksList.appendChild(taskItem);
            });
        }
    }
    
    // Load events
    const eventsResult = await loadData('events', currentUser.id);
    if (eventsResult.success && eventsResult.data) {
        const todayEvents = eventsResult.data.filter(event => event.date === dateString);
        todayEvents.forEach(event => {
            const eventSpace = document.querySelector(`.event-space[data-hour="${event.hour}"]`);
            if (eventSpace) {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.innerHTML = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${formatHour(event.hour)}</div>
                    <span class="event-delete">×</span>
                `;
                
                // Add delete functionality
                eventElement.querySelector('.event-delete').addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('Delete this event?')) {
                        deleteEvent(event.id);
                        eventElement.remove();
                    }
                });
                
                eventSpace.appendChild(eventElement);
            }
        });
    }
    
    // Load notes
    const notesResult = await loadData('notes', currentUser.id);
    if (notesResult.success && notesResult.data) {
        const todayNote = notesResult.data.find(note => note.date === dateString);
        if (todayNote) {
            document.getElementById('daily-notes').value = todayNote.content;
        }
    }
}

async function deleteEvent(eventId) {
    if (currentUser) {
        await deleteData('events', eventId, currentUser.id);
    }
}

function saveSettings() {
    const theme = document.getElementById('theme-select').value;
    const startDay = document.getElementById('start-day').value;
    const timeFormat = document.getElementById('time-format').value;
    
    // Save settings to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('startDay', startDay);
    localStorage.setItem('timeFormat', timeFormat);
    
    // Apply settings
    applyTheme(theme);
    
    // Update time format in time blocks
    createTimeBlocks();
    
    // Close modal
    document.getElementById('settings-modal').style.display = 'none';
    
    // Show confirmation
    alert('Settings saved successfully!');
}

function applyTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-nature', 'theme-minimal');
    
    // Add the selected theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Update CSS variables based on theme
    switch(theme) {
        case 'dark':
            document.documentElement.style.setProperty('--primary-color', '#4a6fa5');
            document.documentElement.style.setProperty('--secondary-color', '#166088');
            document.documentElement.style.setProperty('--accent-color', '#4fc3f7');
            document.documentElement.style.setProperty('--text-color', '#e0e0e0');
            document.documentElement.style.setProperty('--light-text', '#a0a0a0');
            document.documentElement.style.setProperty('--background-color', '#121212');
            document.documentElement.style.setProperty('--card-color', '#1e1e1e');
            document.documentElement.style.setProperty('--border-color', '#333');
            break;
        case 'nature':
            document.documentElement.style.setProperty('--primary-color', '#4caf50');
            document.documentElement.style.setProperty('--secondary-color', '#2e7d32');
            document.documentElement.style.setProperty('--accent-color', '#8bc34a');
            document.documentElement.style.setProperty('--text-color', '#333');
            document.documentElement.style.setProperty('--light-text', '#666');
            document.documentElement.style.setProperty('--background-color', '#f1f8e9');
            document.documentElement.style.setProperty('--card-color', '#fff');
            document.documentElement.style.setProperty('--border-color', '#c8e6c9');
            break;
        case 'minimal':
            document.documentElement.style.setProperty('--primary-color', '#607d8b');
            document.documentElement.style.setProperty('--secondary-color', '#455a64');
            document.documentElement.style.setProperty('--accent-color', '#90a4ae');
            document.documentElement.style.setProperty('--text-color', '#212121');
            document.documentElement.style.setProperty('--light-text', '#757575');
            document.documentElement.style.setProperty('--background-color', '#fafafa');
            document.documentElement.style.setProperty('--card-color', '#fff');
            document.documentElement.style.setProperty('--border-color', '#eceff1');
            break;
        default: // light theme
            document.documentElement.style.setProperty('--primary-color', '#4a6fa5');
            document.documentElement.style.setProperty('--secondary-color', '#166088');
            document.documentElement.style.setProperty('--accent-color', '#4fc3f7');
            document.documentElement.style.setProperty('--text-color', '#333');
            document.documentElement.style.setProperty('--light-text', '#666');
            document.documentElement.style.setProperty('--background-color', '#f9f9f9');
            document.documentElement.style.setProperty('--card-color', '#fff');
            document.documentElement.style.setProperty('--border-color', '#e0e0e0');
    }
}

function exportToPDF() {
    // In a real app, this would use a library like jsPDF or html2pdf
    alert('Your planner will be exported as a PDF. This feature will be implemented soon.');
}

// Template creation functions for different views
function createWeeklyView() {
    // Get the current week's start and end dates
    const startOfWeek = new Date(currentDate);
    const startDay = localStorage.getItem('startDay') === 'monday' ? 1 : 0;
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - (day === 0 ? 7 - startDay : day - startDay));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Format dates for display
    const startFormatted = startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endFormatted = endOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    // Get day names based on start day
    const dayNames = [];
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        dayNames.push(dayDate.toLocaleDateString('en-US', { weekday: 'long' }));
    }
    
    // Create day columns HTML
    let dayColumnsHTML = '';
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const isToday = dayDate.toDateString() === new Date().toDateString();
        
        dayColumnsHTML += `
            <div class="day-column ${isToday ? 'today' : ''}">
                <div class="day-header">
                    <div class="day-name">${dayNames[i]}</div>
                    <div class="day-date">${dayDate.getDate()}</div>
                </div>
                <div class="day-content" data-date="${formatDateForStorage(dayDate)}"></div>
            </div>
        `;
    }
    
    return `
        <h2>Weekly Planner</h2>
        <div class="week-navigation">
            <button class="prev-week">&lt; Previous Week</button>
            <h3 id="week-range">${startFormatted} - ${endFormatted}</h3>
            <button class="next-week">Next Week &gt;</button>
        </div>
        <div class="week-grid">
            ${dayColumnsHTML}
        </div>
        <div class="weekly-notes">
            <h3>Weekly Notes & Goals</h3>
            <textarea id="weekly-notes" placeholder="Write your weekly goals and notes here..."></textarea>
        </div>
    `;
}

function createMonthlyView() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `
        <h2>Monthly Planner</h2>
        <div class="month-navigation">
            <button class="prev-month">&lt; Previous Month</button>
            <h3 id="month-display">${monthNames[currentMonth]} ${currentYear}</h3>
            <button class="next-month">Next Month &gt;</button>
        </div>
        <div class="month-calendar" id="month-calendar"></div>
        <div class="monthly-goals">
            <h3>Monthly Goals</h3>
            <div class="goals-container">
                <div class="goal-category">
                    <h4>Personal</h4>
                    <ul class="goal-list" id="personal-goals"></ul>
                    <button class="add-goal" data-category="personal">+ Add Goal</button>
                </div>
                <div class="goal-category">
                    <h4>Professional</h4>
                    <ul class="goal-list" id="professional-goals"></ul>
                    <button class="add-goal" data-category="professional">+ Add Goal</button>
                </div>
                <div class="goal-category">
                    <h4>Health</h4>
                    <ul class="goal-list" id="health-goals"></ul>
                    <button class="add-goal" data-category="health">+ Add Goal</button>
                </div>
            </div>
        </div>
    `;
}

function createHabitsView() {
    return `
        <h2>Habit Tracker</h2>
        <div class="habits-controls">
            <div class="view-options">
                <button class="view-option active" data-view="daily">Daily</button>
                <button class="view-option" data-view="weekly">Weekly</button>
                <button class="view-option" data-view="monthly">Monthly</button>
            </div>
            <button id="add-habit-btn" class="add-habit-btn">+ Add New Habit</button>
        </div>
        <div class="habits-container">
            <div class="habit-row header-row">
                <div class="habit-name">Habit</div>
                <div class="habit-days">
                    <div class="day-label">Mon</div>
                    <div class="day-label">Tue</div>
                    <div class="day-label">Wed</div>
                    <div class="day-label">Thu</div>
                    <div class="day-label">Fri</div>
                    <div class="day-label">Sat</div>
                    <div class="day-label">Sun</div>
                </div>
                <div class="habit-streak">Streak</div>
                <div class="habit-actions">Actions</div>
            </div>
            <!-- Habit rows will be added here -->
        </div>
    `;
}

function createGoalsView() {
    return `
        <h2>Goals & Projects</h2>
        <div class="goals-controls">
            <div class="goal-tabs">
                <button class="goal-tab active" data-tab="active">Active Goals</button>
                <button class="goal-tab" data-tab="completed">Completed</button>
                <button class="goal-tab" data-tab="projects">Projects</button>
            </div>
            <div class="goal-filter-container">
                <label for="goal-filter">Filter by:</label>
                <select id="goal-filter">
                    <option value="all">All Categories</option>
                    <option value="personal">Personal</option>
                    <option value="professional">Professional</option>
                    <option value="health">Health</option>
                    <option value="financial">Financial</option>
                </select>
            </div>
            <button id="add-goal-btn" class="add-goal-btn">+ Add New Goal</button>
        </div>
        <div class="goals-list">
            <!-- Goal items will be added here -->
        </div>
    `;
} 