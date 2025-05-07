document.addEventListener('DOMContentLoaded', () => {
    // Core DOM elements
    const calendarGrid = document.getElementById('calendar-grid');
    const monthNameEl = document.getElementById('month-name');
    const yearEl = document.getElementById('year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const taskModal = document.getElementById('task-modal');
    const taskDateInput = document.getElementById('task-date');
    const taskNameInput = document.getElementById('task-name');
    const taskDeadlineInput = document.getElementById('task-deadline');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskTimeInput = document.getElementById('task-time');
    
    // Menu button functionality (for mobile)
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
        });
    }
    
    if (sidebarCloseBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('sidebar-open');
        });
    }

    // State variables
    let currentDate = new Date();
    let tasks = [];
    const VISIBLE_TASK_LIMIT = 3;
    const LOCAL_STORAGE_KEY = 'calendarTasks';

    // Load tasks from local storage
    function loadTasks() {
        try {
            const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
                console.log(`Loaded ${tasks.length} tasks from local storage`);
            }
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
            tasks = [];
        }
        renderTasks();
    }

    // Save tasks to local storage
    function saveTasksToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
            console.log(`Saved ${tasks.length} tasks to local storage`);
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    // Render calendar
    function renderCalendar(year, month) {
        calendarGrid.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        monthNameEl.textContent = firstDayOfMonth.toLocaleString('default', { month: 'long' });
        yearEl.textContent = year;

        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Empty cells for start of month
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            calendarGrid.appendChild(emptyCell);
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

            dayCell.addEventListener('dblclick', (e) => {
                if (!e.target.closest('.task-entry') && !e.target.closest('.show-more-btn')) {
                    openModal(dateString);
                }
            });
            
            // Add single click for mobile users
            dayCell.addEventListener('click', (e) => {
                if (window.innerWidth < 768 && !e.target.closest('.task-entry') && !e.target.closest('.show-more-btn')) {
                    // Only for mobile - double click already works for desktop
                    const now = Date.now();
                    if (dayCell.lastClick && (now - dayCell.lastClick) < 300) {
                        // This is a double click
                        openModal(dateString);
                    } else {
                        // Store the timestamp
                        dayCell.lastClick = now;
                    }
                }
            });
            
            calendarGrid.appendChild(dayCell);
        }

        // Empty cells for end of month
        const totalCells = startDayOfWeek + daysInMonth;
        const rowsNeeded = Math.ceil(totalCells / 7);
        const cellsToAdd = (rowsNeeded * 7) - totalCells;

        for (let i = 0; i < cellsToAdd; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            calendarGrid.appendChild(emptyCell);
        }

        renderTasks();
    }

    // Render tasks
    function renderTasks() {
        document.querySelectorAll('.task-entry').forEach(el => el.remove());
        document.querySelectorAll('.show-more-btn').forEach(el => el.remove());
        document.querySelectorAll('.day--has-more').forEach(el => el.classList.remove('day--has-more', 'day--expanded'));

        const dailyLevels = {};
        const taskLevels = {};

        tasks.sort((a, b) => {
            const durationA = new Date(a.deadline) - new Date(a.date);
            const durationB = new Date(b.deadline) - new Date(b.date);
            return durationA !== durationB ? durationA - durationB : new Date(a.date) - new Date(b.date);
        });

        tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');

            let maxLevelNeeded = 0;
            let tempDate = new Date(taskStartDate);
            while (tempDate <= taskDeadlineDate) {
                const dateStr = tempDate.toISOString().split('T')[0];
                maxLevelNeeded = Math.max(maxLevelNeeded, dailyLevels[dateStr] || 0);
                tempDate.setDate(tempDate.getDate() + 1);
            }
            taskLevels[task.id] = maxLevelNeeded;

            tempDate = new Date(taskStartDate);
            while (tempDate <= taskDeadlineDate) {
                const dateStr = tempDate.toISOString().split('T')[0];
                dailyLevels[dateStr] = maxLevelNeeded + 1;
                tempDate.setDate(tempDate.getDate() + 1);
            }
        });

        const dayTaskCounts = {};

        tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');
            const taskStartDateStr = task.date;
            const taskDeadlineStr = task.deadline;
            const currentTaskLevel = taskLevels[task.id];

            document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
                const cellDateStr = dayCell.dataset.date;
                if (!cellDateStr) return;

                const cellDate = new Date(cellDateStr + 'T12:00:00');

                if (cellDate >= taskStartDate && cellDate <= taskDeadlineDate) {
                    const taskListDiv = dayCell.querySelector('.task-list');
                    if (taskListDiv) {
                        dayTaskCounts[cellDateStr] = (dayTaskCounts[cellDateStr] || 0) + 1;

                        const taskElement = document.createElement('div');
                        taskElement.classList.add('task-entry', `task-priority-${task.priority}`);
                        taskElement.dataset.taskId = task.id;
                        taskElement.dataset.level = currentTaskLevel;
                        
                        // Always display task name for better visibility
                        taskElement.textContent = task.name;

                        const isStart = cellDateStr === taskStartDateStr;
                        const isEnd = cellDateStr === taskDeadlineStr;
                        const dayOfWeek = cellDate.getDay();
                        const isSingleDay = isStart && isEnd;

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

                        const taskHeight = 24; // Increased height for better readability
                        const taskMargin = 2;
                        taskElement.style.top = (currentTaskLevel * (taskHeight + taskMargin)) + 'px';
                        taskElement.title = `${task.name} (${task.date} to ${task.deadline}${task.time ? ', Time: ' + task.time : ''})`;
                        
                        // Add click handler for task edit
                        taskElement.addEventListener('click', (e) => {
                            e.stopPropagation();
                            editTask(task.id);
                        });
                        
                        taskListDiv.appendChild(taskElement);

                        if (currentTaskLevel >= VISIBLE_TASK_LIMIT) {
                            taskElement.classList.add('task-hidden');
                            taskElement.style.display = 'none';
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
            const dateStr = dayCell.dataset.date;
            const maxLevelUsed = (dailyLevels[dateStr] || 0) - 1;

            if (maxLevelUsed >= VISIBLE_TASK_LIMIT) {
                dayCell.classList.add('day--has-more');
                const showMoreContainer = dayCell.querySelector('.show-more-container');
                const hiddenLevelsCount = (maxLevelUsed + 1) - VISIBLE_TASK_LIMIT;

                if (hiddenLevelsCount > 0 && showMoreContainer) {
                    const showMoreBtn = document.createElement('button');
                    showMoreBtn.classList.add('show-more-btn');
                    showMoreBtn.textContent = `+${hiddenLevelsCount} more`;
                    showMoreBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleDayExpansion(dayCell);
                    });
                    showMoreContainer.appendChild(showMoreBtn);
                } else if (showMoreContainer) {
                    dayCell.classList.remove('day--has-more');
                }
            }
        });
    }

    // Toggle day expansion
    function toggleDayExpansion(dayCell) {
        const isExpanded = dayCell.classList.toggle('day--expanded');
        const tasksToToggle = dayCell.querySelectorAll('.task-entry.task-hidden');
        const showMoreBtn = dayCell.querySelector('.show-more-btn');

        tasksToToggle.forEach(taskEl => {
            taskEl.style.display = isExpanded ? 'block' : 'none';
        });

        if (showMoreBtn) {
            if (isExpanded) {
                showMoreBtn.textContent = 'Show less';
            } else {
                const dateStr = dayCell.dataset.date;
                const allTaskLevels = Array.from(dayCell.querySelectorAll('.task-entry'))
                    .map(el => parseInt(el.dataset.level || -1));
                const maxLevelOnDay = Math.max(0, ...allTaskLevels);
                const hiddenLevelsCount = (maxLevelOnDay + 1) - VISIBLE_TASK_LIMIT;

                showMoreBtn.textContent = hiddenLevelsCount > 0 ? `+${hiddenLevelsCount} more` : '+ more';
            }
        }
    }

    // Modal handling
    function openModal(date, editTaskId = null) {
        taskModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Reset modal first
        taskNameInput.value = '';
        taskPriorityInput.value = 'medium';
        taskTimeInput.value = '';
        
        if (editTaskId) {
            // Editing existing task
            const task = tasks.find(t => t.id == editTaskId);
            if (task) {
                taskDateInput.value = task.date;
                taskNameInput.value = task.name;
                taskDeadlineInput.value = task.deadline;
                taskPriorityInput.value = task.priority;
                taskTimeInput.value = task.time || '';
                
                // Add task ID to the modal for the save function to recognize edit mode
                taskModal.dataset.editTaskId = editTaskId;
                document.getElementById('modal-title').textContent = 'Edit Task';
                
                // Add delete button if not already present
                if (!document.getElementById('delete-task-btn')) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.id = 'delete-task-btn';
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.onclick = function() {
                        if (confirm('Are you sure you want to delete this task?')) {
                            deleteTask(editTaskId);
                            closeModal();
                        }
                    };
                    document.querySelector('.modal-actions').appendChild(deleteBtn);
                }
            }
        } else {
            // Adding new task
            taskDateInput.value = date;
            taskDeadlineInput.value = date;
            delete taskModal.dataset.editTaskId;
            document.getElementById('modal-title').textContent = 'Add New Task';
            
            // Remove delete button if present (for new tasks)
            const deleteBtn = document.getElementById('delete-task-btn');
            if (deleteBtn) {
                deleteBtn.remove();
            }
        }
        
        taskNameInput.focus();
    }

    function editTask(taskId) {
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            openModal(task.date, taskId);
        }
    }

    window.closeModal = function() {
        taskModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Task saving with local storage only
    window.saveTask = function() {
        const isEditing = taskModal.dataset.editTaskId;
        const taskId = isEditing ? parseInt(taskModal.dataset.editTaskId) : Date.now();
        
        const task = {
            id: taskId,
            date: taskDateInput.value,
            name: taskNameInput.value.trim(),
            deadline: taskDeadlineInput.value,
            priority: taskPriorityInput.value,
            time: taskTimeInput.value
        };
        
        if (!task.name) { alert("Please enter a task description."); return; }
        if (!task.deadline) { alert("Please select a deadline."); return; }
        if (task.deadline < task.date) { alert("Deadline cannot be before the start date."); return; }
        
        if (isEditing) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = task;
                console.log(`Task #${taskId} updated`);
            }
        } else {
            // Add new task
            tasks.push(task);
            console.log(`New task #${taskId} added`);
        }
        
        // Save to local storage
        if (saveTasksToLocalStorage()) {
            closeModal();
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
            
            // Show success notification
            showNotification(isEditing ? 'Task updated successfully!' : 'Task added successfully!');
        } else {
            alert("Error saving task to local storage. Please check browser storage settings.");
        }
    }

    // Delete task function
    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        if (taskIndex !== -1) {
            const taskName = tasks[taskIndex].name;
            tasks.splice(taskIndex, 1);
            
            if (saveTasksToLocalStorage()) {
                renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
                showNotification(`Task "${taskName}" deleted`);
            } else {
                alert("Error deleting task. Please check browser storage settings.");
            }
        }
    }

    // Notification function
    function showNotification(message) {
        // Check if notification container exists, if not create it
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
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Fade out and remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Add support for keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Esc key to close modal
        if (e.key === 'Escape' && taskModal.style.display === 'flex') {
            closeModal();
        }
        
        // Enter key in modal to save
        if (e.key === 'Enter' && taskModal.style.display === 'flex' && 
            e.target.tagName !== 'TEXTAREA' && !e.ctrlKey && !e.shiftKey) {
            saveTask();
        }
    });

    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    window.addEventListener('click', (event) => {
        if (event.target === taskModal) {
            closeModal();
        }
    });

    // Export calendar data
    window.exportCalendarData = function() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `calendar-tasks-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Import calendar data
    window.importCalendarData = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (Array.isArray(importedData)) {
                        if (confirm(`Import ${importedData.length} tasks? This will replace all existing tasks.`)) {
                            tasks = importedData;
                            saveTasksToLocalStorage();
                            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
                            showNotification(`Imported ${importedData.length} tasks successfully!`);
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

    // Add export/import buttons to the header
    function addDataManagementButtons() {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            // Create export button
            const exportBtn = document.createElement('button');
            exportBtn.className = 'icon-button';
            exportBtn.title = 'Export Tasks';
            exportBtn.innerHTML = '<i class="fas fa-download"></i>';
            exportBtn.addEventListener('click', exportCalendarData);
            
            // Create import button
            const importBtn = document.createElement('button');
            importBtn.className = 'icon-button';
            importBtn.title = 'Import Tasks';
            importBtn.innerHTML = '<i class="fas fa-upload"></i>';
            importBtn.addEventListener('click', importCalendarData);
            
            // Add buttons to header
            headerRight.prepend(importBtn);
            headerRight.prepend(exportBtn);
        }
    }

    // Initialize
    loadTasks();
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    addDataManagementButtons();
    
    // Apply necessary styles if not already added
    function addRequiredStyles() {
        if (!document.getElementById('calendar-fix-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'calendar-fix-styles';
            styleSheet.textContent = `
                .task-entry {
                    position: relative;
                    background-color: #4285f4;
                    color: white;
                    padding: 3px 6px;
                    border-radius: 3px;
                    font-size: 0.75rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                    margin-bottom: 2px;
                    height: 24px;
                    z-index: 1;
                    box-sizing: border-box;
                    transition: opacity 0.2s ease;
                }
                
                .task-priority-high {
                    background-color: #ea4335;
                }
                
                .task-priority-medium {
                    background-color: #fbbc05;
                    color: #333;
                }
                
                .task-priority-low {
                    background-color: #34a853;
                }
                
                .task-span-start {
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                    margin-right: -1px;
                    padding-right: 8px;
                    box-shadow: 2px 0 0 rgba(0,0,0,0.05);
                    z-index: 2;
                }
                
                .task-span-middle {
                    border-radius: 0;
                    margin-left: -1px;
                    margin-right: -1px;
                    border-left: 1px dashed rgba(255,255,255,0.5);
                    border-right: 1px dashed rgba(255,255,255,0.5);
                    padding-left: 8px;
                    padding-right: 8px;
                }
                
                .task-span-end {
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                    margin-left: -1px;
                    border-left: 1px dashed rgba(255,255,255,0.5);
                    padding-left: 8px;
                    box-shadow: -2px 0 0 rgba(0,0,0,0.05);
                }
                
                .task-span-single {
                    border-radius: 3px;
                    box-shadow: none;
                }
                
                .task-span-weekstart {
                    border-left: none;
                    border-top-left-radius: 3px;
                    border-bottom-left-radius: 3px;
                }
                
                .task-span-weekend {
                    border-right: none;
                    border-top-right-radius: 3px;
                    border-bottom-right-radius: 3px;
                }
                
                .day:hover .task-entry {
                    opacity: 0.9;
                }
                
                .task-entry:hover {
                    opacity: 1 !important;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                
                .show-more-btn {
                    background-color: rgba(0,0,0,0.05);
                    border: none;
                    border-radius: 4px;
                    padding: 2px 6px;
                    font-size: 0.7rem;
                    cursor: pointer;
                }
                
                .show-more-btn:hover {
                    background-color: rgba(0,0,0,0.1);
                }
                
                .day--expanded .task-hidden {
                    display: block !important;
                }
                
                .delete-btn {
                    background-color: #ea4335;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 8px 16px;
                    cursor: pointer;
                    margin-left: 10px;
                }
                
                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                        position: fixed;
                        top: 0;
                        left: 0;
                        height: 100%;
                        z-index: 1000;
                    }
                    
                    .sidebar-open {
                        transform: translateX(0);
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
    
    addRequiredStyles();
});