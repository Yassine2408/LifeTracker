// planner.js - Handles planner-specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners for the planner
    initPlannerEvents();
    
    // Load any saved events
    loadEvents();
});

function initPlannerEvents() {
    // Event space click handler
    document.querySelectorAll('.event-space').forEach(space => {
        space.addEventListener('click', function() {
            const hour = this.getAttribute('data-hour');
            createEvent(hour, this);
        });
    });
    
    // Daily notes autosave
    const dailyNotes = document.getElementById('daily-notes');
    if (dailyNotes) {
        dailyNotes.addEventListener('input', debounce(function() {
            saveNotes(this.value);
        }, 500));
        
        // Load saved notes
        loadNotes();
    }
    
    // Weekly view navigation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('prev-week')) {
            navigateWeek(-1);
        } else if (e.target.classList.contains('next-week')) {
            navigateWeek(1);
        }
    });
    
    // Weekly notes autosave
    const weeklyNotes = document.getElementById('weekly-notes');
    if (weeklyNotes) {
        weeklyNotes.addEventListener('input', debounce(function() {
            saveWeeklyNotes(this.value);
        }, 500));
    }
    
    // Monthly view event handlers
    document.addEventListener('viewLoaded', function(e) {
        if (e.detail.view === 'monthly') {
            initMonthlyCalendar();
            
            // Add goal buttons
            document.querySelectorAll('.add-goal').forEach(btn => {
                btn.addEventListener('click', function() {
                    const category = this.getAttribute('data-category');
                    addMonthlyGoal(category);
                });
            });
        }
    });
}

async function createEvent(hour, eventSpace) {
    // Simple prompt for event creation
    // In a real app, this would be a modal with more options
    const eventName = prompt('Enter event name:');
    if (eventName && eventName.trim() !== '') {
        const event = document.createElement('div');
        event.className = 'event';
        event.innerHTML = `
            <div class="event-title">${eventName}</div>
            <div class="event-time">${formatHour(hour)}</div>
            <span class="event-delete">×</span>
        `;
        
        // Add delete functionality
        event.querySelector('.event-delete').addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Delete this event?')) {
                // Get event ID if it exists
                const eventId = event.getAttribute('data-id');
                
                // Remove from DOM
                event.remove();
                
                // Remove from database if it has an ID
                if (eventId) {
                    deleteEvent(eventId);
                }
                
                saveEvents();
            }
        });
        
        // Make events draggable in a real app
        
        eventSpace.appendChild(event);
        
        // Save to database
        const eventData = {
            title: eventName,
            hour: hour,
            date: formatDateForStorage(currentDate)
        };
        
        const result = await saveEvent(eventData);
        if (result.success && result.data.length > 0) {
            // Set the event ID from the database
            event.setAttribute('data-id', result.data[0].id);
        }
    }
}

function formatHour(hour) {
    // Format hour based on user preference (12h or 24h)
    const timeFormat = localStorage.getItem('timeFormat') || '12';
    
    if (timeFormat === '12') {
        return hour > 12 ? `${hour - 12} PM` : hour == 12 ? '12 PM' : hour == 0 ? '12 AM' : `${hour} AM`;
    } else {
        return `${hour}:00`;
    }
}

async function saveEvent(eventData) {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    
    try {
        return await saveData('events', eventData, currentUser.id);
    } catch (error) {
        console.error('Error saving event:', error);
        return { success: false, error: error.message };
    }
}

async function deleteEvent(eventId) {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    
    try {
        return await deleteData('events', eventId, currentUser.id);
    } catch (error) {
        console.error('Error deleting event:', error);
        return { success: false, error: error.message };
    }
}

async function loadEvents() {
    if (!currentUser) return;
    
    try {
        // Get today's date in storage format
        const today = formatDateForStorage(currentDate);
        
        // Load events from database
        const result = await loadData('events', currentUser.id);
        
        if (result.success) {
            // Filter events for today
            const todayEvents = result.data.filter(event => event.date === today);
            
            // Display events
            todayEvents.forEach(event => {
                const eventSpace = document.querySelector(`.event-space[data-hour="${event.hour}"]`);
                if (eventSpace) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event';
                    eventElement.setAttribute('data-id', event.id);
                    
                    eventElement.innerHTML = `
                        <div class="event-title">${event.title}</div>
                        <div class="event-time">${formatHour(event.hour)}</div>
                        <span class="event-delete">×</span>
                    `;
                    
                    // Add delete functionality
                    eventElement.querySelector('.event-delete').addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (confirm('Delete this event?')) {
                            // Remove from DOM
                            eventElement.remove();
                            
                            // Remove from database
                            deleteEvent(event.id);
                        }
                    });
                    
                    eventSpace.appendChild(eventElement);
                }
            });
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function saveNotes(notes) {
    if (!currentUser) return;
    
    try {
        const today = formatDateForStorage(currentDate);
        
        const noteData = {
            content: notes,
            date: today,
            type: 'daily'
        };
        
        await saveData('notes', noteData, currentUser.id);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

async function loadNotes() {
    if (!currentUser) return;
    
    try {
        const today = formatDateForStorage(currentDate);
        
        // Load notes from database
        const result = await loadData('notes', currentUser.id);
        
        if (result.success) {
            // Find today's daily note
            const todayNote = result.data.find(note => note.date === today && note.type === 'daily');
            
            if (todayNote) {
                document.getElementById('daily-notes').value = todayNote.content;
            }
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

async function saveWeeklyNotes(notes) {
    if (!currentUser) return;
    
    try {
        // Get the start of the week
        const startOfWeek = getStartOfWeek(currentDate);
        const weekKey = formatDateForStorage(startOfWeek);
        
        const noteData = {
            content: notes,
            date: weekKey,
            type: 'weekly'
        };
        
        await saveData('notes', noteData, currentUser.id);
    } catch (error) {
        console.error('Error saving weekly notes:', error);
    }
}

async function loadWeeklyNotes() {
    if (!currentUser) return;
    
    try {
        // Get the start of the week
        const startOfWeek = getStartOfWeek(currentDate);
        const weekKey = formatDateForStorage(startOfWeek);
        
        // Load notes from database
        const result = await loadData('notes', currentUser.id);
        
        if (result.success) {
            // Find this week's note
            const weekNote = result.data.find(note => note.date === weekKey && note.type === 'weekly');
            
            if (weekNote && document.getElementById('weekly-notes')) {
                document.getElementById('weekly-notes').value = weekNote.content;
            }
        }
    } catch (error) {
        console.error('Error loading weekly notes:', error);
    }
}

function navigateWeek(direction) {
    // Navigate to previous or next week
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    currentDate = newDate;
    
    // Update the weekly view
    const weeklyView = document.getElementById('weekly-view');
    if (weeklyView) {
        weeklyView.innerHTML = createWeeklyView();
        initWeeklyPlanner();
    }
}

function initWeeklyPlanner() {
    // Load weekly events
    loadWeeklyEvents();
    
    // Load weekly notes
    loadWeeklyNotes();
    
    // Add event listeners for day content areas
    document.querySelectorAll('.day-content').forEach(dayContent => {
        dayContent.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            createWeeklyEvent(date, this);
        });
    });
}

async function loadWeeklyEvents() {
    if (!currentUser) return;
    
    try {
        // Get the start and end of the week
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Format dates for comparison
        const startDate = formatDateForStorage(startOfWeek);
        const endDate = formatDateForStorage(endOfWeek);
        
        // Load events from database
        const result = await loadData('events', currentUser.id);
        
        if (result.success) {
            // Filter events for this week
            const weekEvents = result.data.filter(event => {
                return event.date >= startDate && event.date <= endDate;
            });
            
            // Display events
            weekEvents.forEach(event => {
                const dayContent = document.querySelector(`.day-content[data-date="${event.date}"]`);
                if (dayContent) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'week-event';
                    eventElement.setAttribute('data-id', event.id);
                    
                    eventElement.innerHTML = `
                        <span class="event-time">${formatHour(event.hour)}</span>
                        <span class="event-title">${event.title}</span>
                        <span class="event-delete">×</span>
                    `;
                    
                    // Add delete functionality
                    eventElement.querySelector('.event-delete').addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (confirm('Delete this event?')) {
                            // Remove from DOM
                            eventElement.remove();
                            
                            // Remove from database
                            deleteEvent(event.id);
                        }
                    });
                    
                    dayContent.appendChild(eventElement);
                }
            });
        }
    } catch (error) {
        console.error('Error loading weekly events:', error);
    }
}

async function createWeeklyEvent(date, dayContent) {
    // Simple prompt for event creation
    const eventName = prompt('Enter event name:');
    if (!eventName || eventName.trim() === '') return;
    
    const hourInput = prompt('Enter hour (0-23):', '9');
    const hour = parseInt(hourInput);
    
    if (isNaN(hour) || hour < 0 || hour > 23) {
        alert('Please enter a valid hour between 0 and 23');
        return;
    }
    
    // Create event element
    const eventElement = document.createElement('div');
    eventElement.className = 'week-event';
    
    eventElement.innerHTML = `
        <span class="event-time">${formatHour(hour)}</span>
        <span class="event-title">${eventName}</span>
        <span class="event-delete">×</span>
    `;
    
    // Add delete functionality
    eventElement.querySelector('.event-delete').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete this event?')) {
            // Get event ID if it exists
            const eventId = eventElement.getAttribute('data-id');
            
            // Remove from DOM
            eventElement.remove();
            
            // Remove from database if it has an ID
            if (eventId) {
                deleteEvent(eventId);
            }
        }
    });
    
    dayContent.appendChild(eventElement);
    
    // Save to database
    const eventData = {
        title: eventName,
        hour: hour,
        date: date
    };
    
    const result = await saveEvent(eventData);
    if (result.success && result.data.length > 0) {
        // Set the event ID from the database
        eventElement.setAttribute('data-id', result.data[0].id);
    }
}

// Utility functions
function formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStartOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    result.setDate(diff);
    return result;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
} 