document.addEventListener('DOMContentLoaded', () => {
    // Initialize application components
    const app = new CalendarApp();
    app.initialize();
});

class CalendarApp {
    constructor() {
        // Core DOM elements
        this.elements = {
            calendarGrid: document.getElementById('calendar-grid'),
            monthNameEl: document.getElementById('month-name'),
            yearEl: document.getElementById('year'),
            prevMonthBtn: document.getElementById('prev-month'),
            nextMonthBtn: document.getElementById('next-month'),
            todayBtn: document.getElementById('today-btn'),
            taskModal: document.getElementById('task-modal'),
            taskDateInput: document.getElementById('task-date'),
            taskNameInput: document.getElementById('task-name'),
            taskDeadlineInput: document.getElementById('task-deadline'),
            taskPriorityInput: document.getElementById('task-priority'),
            taskTimeInput: document.getElementById('task-time'),
            menuButton: document.getElementById('menu-button'),
            sidebar: document.getElementById('sidebar'),
            sidebarCloseBtn: document.getElementById('sidebar-close-btn')
        };
        
        // State variables
        this.currentDate = new Date();
        this.tasks = [];
        this.VISIBLE_TASK_LIMIT = 2; // Changed from 3 to 2 per your request
        this.LOCAL_STORAGE_KEY = 'calendarTasks';
    }
    
    initialize() {
        this.loadTasks();
        this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.addDataManagementButtons();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Navigation listeners
        this.elements.prevMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        });
        
        this.elements.nextMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        });
        
        this.elements.todayBtn.addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        });
        
        // Modal close on outside click
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.taskModal) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Esc key to close modal
            if (e.key === 'Escape' && this.elements.taskModal.style.display === 'flex') {
                this.closeModal();
            }
            
            // Enter key in modal to save
            if (e.key === 'Enter' && this.elements.taskModal.style.display === 'flex' && 
                e.target.tagName !== 'TEXTAREA' && !e.ctrlKey && !e.shiftKey) {
                this.saveTask();
            }
        });
        
        // Mobile menu toggle
        if (this.elements.menuButton && this.elements.sidebar) {
            this.elements.menuButton.addEventListener('click', () => {
                this.elements.sidebar.classList.toggle('sidebar-open');
            });
        }
        
        if (this.elements.sidebarCloseBtn && this.elements.sidebar) {
            this.elements.sidebarCloseBtn.addEventListener('click', () => {
                this.elements.sidebar.classList.remove('sidebar-open');
            });
        }
        
        // Expose methods to window for HTML onclick handlers
        window.closeModal = this.closeModal.bind(this);
        window.saveTask = this.saveTask.bind(this);
        window.exportCalendarData = this.exportCalendarData.bind(this);
        window.importCalendarData = this.importCalendarData.bind(this);
    }
    
    loadTasks() {
        try {
            const storedTasks = localStorage.getItem(this.LOCAL_STORAGE_KEY);
            if (storedTasks) {
                this.tasks = JSON.parse(storedTasks);
                console.log(`Loaded ${this.tasks.length} tasks from local storage`);
            }
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
            this.tasks = [];
        }
    }
    
    saveTasksToLocalStorage() {
        try {
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.tasks));
            console.log(`Saved ${this.tasks.length} tasks to local storage`);
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }
    
    renderCalendar(year, month) {
        const calendarGrid = this.elements.calendarGrid;
        calendarGrid.innerHTML = '';
        
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();
        
        this.elements.monthNameEl.textContent = firstDayOfMonth.toLocaleString('default', { month: 'long' });
        this.elements.yearEl.textContent = year;
        
        const today = new Date();
        const todayString = this.formatDate(today);
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Empty cells for start of month
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            fragment.appendChild(emptyCell);
        }
        
        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateString;
            
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayHeader.appendChild(dayNumberSpan);
            dayCell.appendChild(dayHeader);
            
            if (dateString === todayString) {
                dayCell.classList.add('day--today');
            }
            
            const taskListDiv = document.createElement('div');
            taskListDiv.classList.add('task-list');
            dayCell.appendChild(taskListDiv);
            
            const showMoreContainer = document.createElement('div');
            showMoreContainer.classList.add('show-more-container');
            dayCell.appendChild(showMoreContainer);
            
            // Unified click handler for desktop/mobile
            this.setupDayCellClickHandlers(dayCell, dateString);
            
            fragment.appendChild(dayCell);
        }
        
        // Empty cells for end of month
        const totalCells = startDayOfWeek + daysInMonth;
        const rowsNeeded = Math.ceil(totalCells / 7);
        const cellsToAdd = (rowsNeeded * 7) - totalCells;
        
        for (let i = 0; i < cellsToAdd; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            fragment.appendChild(emptyCell);
        }
        
        calendarGrid.appendChild(fragment);
        this.renderTasks();
    }
    
    setupDayCellClickHandlers(dayCell, dateString) {
        // Simplify to a single click handler with time threshold for mobile
        dayCell.addEventListener('click', (e) => {
            if (!e.target.closest('.task-entry') && !e.target.closest('.show-more-btn')) {
                const now = Date.now();
                
                // For desktop - use double click detection
                if (dayCell.lastClick && (now - dayCell.lastClick) < 300) {
                    this.openModal(dateString);
                } else {
                    dayCell.lastClick = now;
                }
            }
        });
        
        // Keep double click for desktop users
        dayCell.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.task-entry') && !e.target.closest('.show-more-btn')) {
                this.openModal(dateString);
            }
        });
    }
    
    renderTasks() {
        // Reset existing task elements
        document.querySelectorAll('.task-entry').forEach(el => el.remove());
        document.querySelectorAll('.show-more-btn').forEach(el => el.remove());
        document.querySelectorAll('.day--has-more').forEach(el => el.classList.remove('day--has-more', 'day--expanded'));
        
        // Sort tasks by duration and start date for better visualization
        this.tasks.sort((a, b) => {
            const durationA = new Date(a.deadline) - new Date(a.date);
            const durationB = new Date(b.deadline) - new Date(b.date);
            return durationA !== durationB ? durationA - durationB : new Date(a.date) - new Date(b.date);
        });
        
        // Group tasks by date to count tasks per day
        const tasksByDate = {};
        this.tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');
            let tempDate = new Date(taskStartDate);
            
            while (tempDate <= taskDeadlineDate) {
                const dateStr = this.formatDate(tempDate);
                if (!tasksByDate[dateStr]) {
                    tasksByDate[dateStr] = [];
                }
                tasksByDate[dateStr].push(task);
                tempDate.setDate(tempDate.getDate() + 1);
            }
        });
        
        // Optimized task positioning algorithm
        const taskPositions = this.calculateTaskPositions();
        this.renderTasksToCalendar(taskPositions, tasksByDate);
    }
    
    calculateTaskPositions() {
        const dailyLevels = {};
        const taskLevels = {};
        
        // First pass: determine required levels for each task
        this.tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');
            
            let maxLevelNeeded = 0;
            let tempDate = new Date(taskStartDate);
            
            while (tempDate <= taskDeadlineDate) {
                const dateStr = this.formatDate(tempDate);
                maxLevelNeeded = Math.max(maxLevelNeeded, dailyLevels[dateStr] || 0);
                tempDate.setDate(tempDate.getDate() + 1);
            }
            
            taskLevels[task.id] = maxLevelNeeded;
            
            // Second pass: occupy the levels
            tempDate = new Date(taskStartDate);
            while (tempDate <= taskDeadlineDate) {
                const dateStr = this.formatDate(tempDate);
                dailyLevels[dateStr] = maxLevelNeeded + 1;
                tempDate.setDate(tempDate.getDate() + 1);
            }
        });
        
        return { dailyLevels, taskLevels };
    }
    
    renderTasksToCalendar(positions, tasksByDate) {
        const { dailyLevels, taskLevels } = positions;
        const dayTaskCounts = {};
        
        this.tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');
            const taskLevel = taskLevels[task.id];
            
            document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
                const cellDateStr = dayCell.dataset.date;
                if (!cellDateStr) return;
                
                const cellDate = new Date(cellDateStr + 'T12:00:00');
                
                if (cellDate >= taskStartDate && cellDate <= taskDeadlineDate) {
                    this.createTaskElement(dayCell, task, cellDateStr, taskLevel);
                    dayTaskCounts[cellDateStr] = (dayTaskCounts[cellDateStr] || 0) + 1;
                }
            });
        });
        
        // Add "show more" buttons where needed
        this.addShowMoreButtons(tasksByDate);
    }
    
    createTaskElement(dayCell, task, cellDateStr, taskLevel) {
        const taskListDiv = dayCell.querySelector('.task-list');
        if (!taskListDiv) return;
        
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-entry', `task-priority-${task.priority}`);
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.level = taskLevel;
        
        // Display task name
        taskElement.textContent = task.name;
        
        const isStart = cellDateStr === task.date;
        const isEnd = cellDateStr === task.deadline;
        const cellDate = new Date(cellDateStr + 'T12:00:00');
        const dayOfWeek = cellDate.getDay();
        const isSingleDay = isStart && isEnd;
        
        // Add appropriate CSS classes
        if (isStart) {
            taskElement.classList.add('task-span-start');
            if (isSingleDay) taskElement.classList.add('task-span-single');
        } else if (isEnd) {
            taskElement.classList.add('task-span-end');
        } else {
            taskElement.classList.add('task-span-middle');
        }
        
        if (dayOfWeek === 0 && !isStart) taskElement.classList.add('task-span-weekstart');
        if (dayOfWeek === 6 && !isEnd) taskElement.classList.add('task-span-weekend');
        
        // Position the task
        const taskHeight = 24;
        const taskMargin = 2;
        taskElement.style.top = (taskLevel * (taskHeight + taskMargin)) + 'px';
        taskElement.title = `${task.name} (${task.date} to ${task.deadline}${task.time ? ', Time: ' + task.time : ''})`;
        
        // Add click handler for task edit
        taskElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTask(task.id);
        });
        
        taskListDiv.appendChild(taskElement);
        
        // Hide tasks beyond the visible limit
        if (taskLevel >= this.VISIBLE_TASK_LIMIT) {
            taskElement.classList.add('task-hidden');
            taskElement.style.display = 'none';
        }
    }
    
    addShowMoreButtons(tasksByDate) {
        document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
            const dateStr = dayCell.dataset.date;
            if (!dateStr || !tasksByDate[dateStr]) return;
            
            const tasksForDay = tasksByDate[dateStr];
            
            if (tasksForDay.length > this.VISIBLE_TASK_LIMIT) {
                dayCell.classList.add('day--has-more');
                const showMoreContainer = dayCell.querySelector('.show-more-container');
                
                if (showMoreContainer) {
                    const hiddenTasksCount = tasksForDay.length - this.VISIBLE_TASK_LIMIT;
                    
                    const showMoreBtn = document.createElement('button');
                    showMoreBtn.classList.add('show-more-btn');
                    showMoreBtn.textContent = `+${hiddenTasksCount} tasks`;
                    showMoreBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleDayExpansion(dayCell);
                    });
                    showMoreContainer.appendChild(showMoreBtn);
                }
            }
        });
    }
    
    toggleDayExpansion(dayCell) {
        const isExpanded = dayCell.classList.toggle('day--expanded');
        const tasksToToggle = dayCell.querySelectorAll('.task-entry.task-hidden');
        const showMoreBtn = dayCell.querySelector('.show-more-btn');
        
        tasksToToggle.forEach(taskEl => {
            taskEl.style.display = isExpanded ? 'block' : 'none';
        });
        
        if (showMoreBtn) {
            const dateStr = dayCell.dataset.date;
            const hiddenTasksCount = tasksToToggle.length;
            
            showMoreBtn.textContent = isExpanded ? 'Show less' : `+${hiddenTasksCount} tasks`;
        }
    }
    
    openModal(date, editTaskId = null) {
        const modal = this.elements.taskModal;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset modal first
        this.elements.taskNameInput.value = '';
        this.elements.taskPriorityInput.value = 'medium';
        this.elements.taskTimeInput.value = '';
        
        if (editTaskId) {
            // Editing existing task
            const task = this.tasks.find(t => t.id == editTaskId);
            if (task) {
                this.elements.taskDateInput.value = task.date;
                this.elements.taskNameInput.value = task.name;
                this.elements.taskDeadlineInput.value = task.deadline;
                this.elements.taskPriorityInput.value = task.priority;
                this.elements.taskTimeInput.value = task.time || '';
                
                // Add task ID to the modal for the save function to recognize edit mode
                modal.dataset.editTaskId = editTaskId;
                document.getElementById('modal-title').textContent = 'Edit Task';
                
                this.ensureDeleteButton();
            }
        } else {
            // Adding new task
            this.elements.taskDateInput.value = date;
            this.elements.taskDeadlineInput.value = date;
            delete modal.dataset.editTaskId;
            document.getElementById('modal-title').textContent = 'Add New Task';
            
            // Remove delete button if present (for new tasks)
            const deleteBtn = document.getElementById('delete-task-btn');
            if (deleteBtn) {
                deleteBtn.remove();
            }
        }
        
        this.elements.taskNameInput.focus();
    }
    
    ensureDeleteButton() {
        // Add delete button if not already present
        if (!document.getElementById('delete-task-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-task-btn';
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.deleteTask(this.elements.taskModal.dataset.editTaskId);
                    this.closeModal();
                }
            };
            document.querySelector('.modal-actions').appendChild(deleteBtn);
        }
    }
    
    closeModal() {
        this.elements.taskModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    saveTask() {
        const modal = this.elements.taskModal;
        const isEditing = modal.dataset.editTaskId;
        const taskId = isEditing ? parseInt(modal.dataset.editTaskId) : Date.now();
        
        const task = {
            id: taskId,
            date: this.elements.taskDateInput.value,
            name: this.elements.taskNameInput.value.trim(),
            deadline: this.elements.taskDeadlineInput.value,
            priority: this.elements.taskPriorityInput.value,
            time: this.elements.taskTimeInput.value
        };
        
        if (!task.name) { alert("Please enter a task description."); return; }
        if (!task.deadline) { alert("Please select a deadline."); return; }
        if (task.deadline < task.date) { alert("Deadline cannot be before the start date."); return; }
        
        if (isEditing) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id == taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = task;
                console.log(`Task #${taskId} updated`);
            }
        } else {
            // Add new task
            this.tasks.push(task);
            console.log(`New task #${taskId} added`);
        }
        
        // Save to local storage
        if (this.saveTasksToLocalStorage()) {
            this.closeModal();
            this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
            
            // Show success notification
            this.showNotification(isEditing ? 'Task updated successfully!' : 'Task added successfully!');
        } else {
            alert("Error saving task to local storage. Please check browser storage settings.");
        }
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (task) {
            this.openModal(task.date, taskId);
        }
    }
    
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            const taskName = this.tasks[taskIndex].name;
            this.tasks.splice(taskIndex, 1);
            
            if (this.saveTasksToLocalStorage()) {
                this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
                this.showNotification(`Task "${taskName}" deleted`);
            } else {
                alert("Error deleting task. Please check browser storage settings.");
            }
        }
    }
    
    showNotification(message) {
        // Check if notification container exists, create if not
        let notifContainer = document.getElementById('notification-container');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'notification-container';
            notifContainer.style.position = 'fixed';
            notifContainer.style.bottom = '20px';
            notifContainer.style.right = '20px';
            notifContainer.style.zIndex = '1000';
            document.body.appendChild(notifContainer);
        }
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.marginTop = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.textContent = message;
        
        notifContainer.appendChild(notification);
        
        // Fade in and out with transitions
        setTimeout(() => {
            notification.style.opacity = '1';
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 10);
    }
    
    addDataManagementButtons() {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            // Create export button
            const exportBtn = document.createElement('button');
            exportBtn.className = 'icon-button';
            exportBtn.title = 'Export Tasks';
            exportBtn.innerHTML = '<i class="fas fa-download"></i>';
            exportBtn.addEventListener('click', this.exportCalendarData.bind(this));
            
            // Create import button
            const importBtn = document.createElement('button');
            importBtn.className = 'icon-button';
            importBtn.title = 'Import Tasks';
            importBtn.innerHTML = '<i class="fas fa-upload"></i>';
            importBtn.addEventListener('click', this.importCalendarData.bind(this));
            
            // Add buttons to header
            headerRight.prepend(importBtn);
            headerRight.prepend(exportBtn);
        }
    }
    
    exportCalendarData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `calendar-tasks-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    importCalendarData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (Array.isArray(importedData)) {
                        if (confirm(`Import ${importedData.length} tasks? This will replace all existing tasks.`)) {
                            this.tasks = importedData;
                            this.saveTasksToLocalStorage();
                            this.renderCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
                            this.showNotification(`Imported ${importedData.length} tasks successfully!`);
                        }
                    } else {
                        alert('Invalid data format. Expected an array of tasks.');
                    }
                } catch (e) {
                    alert('Error parsing import file: ' + e.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}