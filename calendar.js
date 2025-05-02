document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
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
    // --- Sidebar Elements ---
    const sidebar = document.getElementById('sidebar');
    const menuButton = document.getElementById('menu-button');
    const sidebarCloseButton = document.getElementById('sidebar-close-btn');
    const mainContent = document.querySelector('.main-content'); // Need this for overlay effect

    // State variables
    let currentDate = new Date();
    let tasks = []; // Array to store task objects

    // Configuration
    const VISIBLE_TASK_LIMIT = 3; // Number of task rows initially visible per day

    // --- Sidebar Toggle Logic ---
    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        // Optional: Add overlay class to body
        // document.body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
         // Optional: Remove overlay class from body
        // document.body.classList.remove('sidebar-open');
    }

    if (menuButton) {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent potential conflicts
            openSidebar();
        });
    }

    if (sidebarCloseButton) {
        sidebarCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Close sidebar if clicking outside of it on mobile
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            // Check if the click is outside the sidebar and not on the menu button
            if (!sidebar.contains(e.target) && e.target !== menuButton && !menuButton.contains(e.target)) {
                closeSidebar();
            }
        }
    });


    // --- Core Calendar Logic ---

    /**
     * Renders the calendar grid for the given year and month.
     */
    function renderCalendar(year, month) {
        calendarGrid.innerHTML = ''; // Clear previous grid content
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        monthNameEl.textContent = firstDayOfMonth.toLocaleString('default', { month: 'long' });
        yearEl.textContent = year;

        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // --- Create Grid Cells ---
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateString;

            const dayHeader = document.createElement('div'); // Container for number
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

            // Container for the "show more" button
            const showMoreContainer = document.createElement('div');
            showMoreContainer.classList.add('show-more-container');
            dayCell.appendChild(showMoreContainer); // Add container to cell

            dayCell.addEventListener('dblclick', (e) => {
                 // Prevent modal opening if clicking on task or button
                 if (!e.target.closest('.task-entry') && !e.target.closest('.show-more-btn')) {
                    openModal(dateString);
                 }
            });
            calendarGrid.appendChild(dayCell);
        }

        const totalCells = startDayOfWeek + daysInMonth;
        const rowsNeeded = Math.ceil(totalCells / 7);
        const cellsToAdd = (rowsNeeded * 7) - totalCells;

        for (let i = 0; i < cellsToAdd; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day', 'day--disabled');
            calendarGrid.appendChild(emptyCell);
        }

        renderTasks(); // Render tasks onto the newly created grid
    }

    // --- Task Handling ---

    /**
     * Renders tasks, handles stacking, spanning, and "show more" logic.
     */
    function renderTasks() {
        // Clear previous task elements and buttons
        document.querySelectorAll('.task-entry').forEach(el => el.remove());
        document.querySelectorAll('.show-more-btn').forEach(el => el.remove()); // Remove old buttons
        document.querySelectorAll('.day--has-more').forEach(el => el.classList.remove('day--has-more', 'day--expanded')); // Reset day states


        // 1. Calculate Stacking Levels for all tasks globally first
        const dailyLevels = {}; // Tracks next available level per day: {'YYYY-MM-DD': level}
        const taskLevels = {}; // Stores the calculated level for each task: {taskId: level}

        // Sort tasks for potentially better visual placement (optional)
        tasks.sort((a, b) => {
            const durationA = new Date(a.deadline) - new Date(a.date);
            const durationB = new Date(b.deadline) - new Date(b.date);
            if (durationA !== durationB) return durationA - durationB;
            return new Date(a.date) - new Date(b.date);
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
            taskLevels[task.id] = maxLevelNeeded; // Store the level for this task

            // Update levels for the days this task occupies
            tempDate = new Date(taskStartDate);
            while (tempDate <= taskDeadlineDate) {
                const dateStr = tempDate.toISOString().split('T')[0];
                dailyLevels[dateStr] = maxLevelNeeded + 1;
                tempDate.setDate(tempDate.getDate() + 1);
            }
        });

        // 2. Render Task Segments and Handle "Show More" per day
        const dayTaskCounts = {}; // Track number of task *segments* rendered per day

        tasks.forEach(task => {
            const taskStartDate = new Date(task.date + 'T00:00:00');
            const taskDeadlineDate = new Date(task.deadline + 'T23:59:59');
            const taskStartDateStr = task.date;
            const taskDeadlineStr = task.deadline;
            const currentTaskLevel = taskLevels[task.id]; // Get pre-calculated level

            // Iterate through visible calendar days to render segments
            document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
                const cellDateStr = dayCell.dataset.date;
                if (!cellDateStr) return;

                const cellDate = new Date(cellDateStr + 'T12:00:00');

                if (cellDate >= taskStartDate && cellDate <= taskDeadlineDate) {
                    const taskListDiv = dayCell.querySelector('.task-list');
                    if (taskListDiv) {
                        // Increment task count for this day
                        dayTaskCounts[cellDateStr] = (dayTaskCounts[cellDateStr] || 0) + 1;

                        const taskElement = document.createElement('div');
                        taskElement.classList.add('task-entry', `task-priority-${task.priority}`);
                        taskElement.dataset.taskId = task.id;
                        taskElement.dataset.level = currentTaskLevel; // Store level on element

                        const isStart = cellDateStr === taskStartDateStr;
                        const isEnd = cellDateStr === taskDeadlineStr;
                        const dayOfWeek = cellDate.getDay();
                        const isSingleDay = isStart && isEnd;

                        taskElement.textContent = '\u00A0'; // Default non-breaking space

                        if (isStart) {
                            taskElement.classList.add('task-span-start');
                            taskElement.textContent = task.name;
                            if (isSingleDay) taskElement.classList.add('task-span-single');
                        } else if (isEnd) {
                            taskElement.classList.add('task-span-end');
                        } else {
                            taskElement.classList.add('task-span-middle');
                        }

                        if (dayOfWeek === 0 && !isStart) taskElement.classList.add('task-span-weekstart');
                        if (dayOfWeek === 6 && !isEnd) taskElement.classList.add('task-span-weekend');

                        // Apply Vertical Stacking based on pre-calculated level
                        const taskHeight = 18; // Match CSS
                        const taskMargin = 2;
                        taskElement.style.top = (currentTaskLevel * (taskHeight + taskMargin)) + 'px';

                        taskElement.title = `${task.name} (${task.date} to ${task.deadline}${task.time ? ', Time: ' + task.time : ''})`;
                        taskListDiv.appendChild(taskElement);

                         // Check if this task segment should be initially hidden
                         if (currentTaskLevel >= VISIBLE_TASK_LIMIT) {
                            taskElement.classList.add('task-hidden');
                            // Ensure it's hidden by default via JS too
                            taskElement.style.display = 'none';
                        }
                    }
                }
            });
        });

        // 3. Add "Show More" buttons where needed
        document.querySelectorAll('.day:not(.day--disabled)').forEach(dayCell => {
            const dateStr = dayCell.dataset.date;
            // Use dailyLevels which tracks the *next available* level.
            // So the highest level *used* is dailyLevels[dateStr] - 1
            const maxLevelUsed = (dailyLevels[dateStr] || 0) - 1;

            // Check if the highest level used is at or above the limit
            if (maxLevelUsed >= VISIBLE_TASK_LIMIT) {
                dayCell.classList.add('day--has-more');
                const showMoreContainer = dayCell.querySelector('.show-more-container');
                // Count hidden levels: total levels used (0 to maxLevelUsed) minus visible levels (0 to VISIBLE_TASK_LIMIT-1)
                const hiddenLevelsCount = (maxLevelUsed + 1) - VISIBLE_TASK_LIMIT;

                if (hiddenLevelsCount > 0 && showMoreContainer) { // Ensure there are actually hidden tasks
                    const showMoreBtn = document.createElement('button');
                    showMoreBtn.classList.add('show-more-btn');
                    showMoreBtn.textContent = `+${hiddenLevelsCount} more`; // Show count of hidden levels
                    showMoreBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent day dblclick
                        toggleDayExpansion(dayCell);
                    });
                    showMoreContainer.appendChild(showMoreBtn);
                 } else if (showMoreContainer) {
                     // Edge case: remove class if calculation resulted in 0 hidden somehow
                     dayCell.classList.remove('day--has-more');
                 }
            }
        });
    }

    /**
     * Toggles the expanded/collapsed state of a day cell.
     * @param {HTMLElement} dayCell - The day cell element to toggle.
     */
    function toggleDayExpansion(dayCell) {
        const isExpanded = dayCell.classList.toggle('day--expanded');
        const taskList = dayCell.querySelector('.task-list');
        const showMoreBtn = dayCell.querySelector('.show-more-btn');
        const tasksToToggle = dayCell.querySelectorAll('.task-entry.task-hidden');

        tasksToToggle.forEach(taskEl => {
            // Toggle visibility based on expanded state
            taskEl.style.display = isExpanded ? 'block' : 'none';
        });

        if (showMoreBtn) {
            if (isExpanded) {
                showMoreBtn.textContent = 'Show less';
            } else {
                 // Recalculate hidden count for the button text on collapse
                 const dateStr = dayCell.dataset.date;
                 // Find highest level among ALL tasks in this cell
                 const allTaskLevels = Array.from(dayCell.querySelectorAll('.task-entry'))
                                           .map(el => parseInt(el.dataset.level || -1));
                 const maxLevelOnDay = Math.max(0, ...allTaskLevels);
                 const hiddenLevelsCount = (maxLevelOnDay + 1) - VISIBLE_TASK_LIMIT;

                 if (hiddenLevelsCount > 0) {
                    showMoreBtn.textContent = `+${hiddenLevelsCount} more`;
                 } else {
                     // Should not happen if button exists, but handle defensively
                     showMoreBtn.textContent = `+ more`;
                 }
            }
        }
    }


    // --- Modal Handling ---
    function openModal(date) {
        taskModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        taskDateInput.value = date;
        taskDeadlineInput.value = date;
        taskNameInput.value = '';
        taskPriorityInput.value = 'medium';
        taskTimeInput.value = '';
        taskNameInput.focus();
    }
    window.closeModal = function() {
        taskModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    window.saveTask = function() {
        const task = {
            id: Date.now(),
            date: taskDateInput.value,
            name: taskNameInput.value.trim(),
            deadline: taskDeadlineInput.value,
            priority: taskPriorityInput.value,
            time: taskTimeInput.value
        };
        if (!task.name) { alert("Please enter a task description."); taskNameInput.focus(); return; }
        if (!task.deadline) { alert("Please select a deadline."); taskDeadlineInput.focus(); return; }
        if (task.deadline < task.date) { alert("Deadline cannot be before the task start date."); taskDeadlineInput.focus(); return; }
        tasks.push(task);
        closeModal();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    // --- Navigation Event Listeners ---
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

    // --- Close Modal on Outside Click ---
    window.addEventListener('click', (event) => {
        if (event.target === taskModal) {
            closeModal();
        }
    });

    // --- Initial Render ---
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

}); // End DOMContentLoaded listener
