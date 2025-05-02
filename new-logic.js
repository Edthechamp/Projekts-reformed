
const menuButton = document.getElementById('menu-button');
const sidebar = document.getElementById('sidebar');
const contentArea = document.getElementById('content-area');
const navLinks = document.querySelectorAll('#sidebar a');

const myDaySection = document.getElementById('my-day');
const projectsSection = document.getElementById('projects');
const settingsSection = document.getElementById('settings');
const calendarSection = document.getElementById('calendar');


const addProjectButton = document.getElementById('add-project-button');
const addProjectModal = document.getElementById('add-project-modal');
const addProjectForm = document.getElementById('add-project-form');

const closeModalButtons = document.querySelectorAll('.close-button');
const projectList = document.getElementById('project-list');
const noTasksMessage = document.getElementById('no-tasks');
const tasksContainer = document.getElementById('tasks-container');
const generateTasksButton = document.getElementById('generate-tasks-button');
const timeAvailableInput = document.getElementById('time-available');
const calendarButton = document.getElementById('calendar-button');

let projects = JSON.parse(localStorage.getItem('projects')) || [];
let currentSection = 'my-day';
let selectedProjectId = null;

// Function to show a section and hide others
function showSection(sectionId) {
    myDaySection.classList.add('hidden');
    projectsSection.classList.add('hidden');
    settingsSection.classList.add('hidden');
    calendarSection.classList.add('hidden');
    
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('bg-gray-100');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('text-gray-900');
    document.querySelectorAll(`[data-section]`).forEach(link => {
        if (link.getAttribute('data-section') !== sectionId) {
            link.classList.remove('bg-gray-100');
            link.classList.remove('text-gray-900');
        }
    });
    document.getElementById(sectionId).classList.remove('hidden');
    currentSection = sectionId;
    if (currentSection === 'my-day') {
        if (projects.length === 0) {
            noTasksMessage.classList.remove('hidden');
            tasksContainer.classList.add('hidden');
        } else {
            noTasksMessage.classList.add('hidden');
            tasksContainer.classList.remove('hidden');
        }
    }
}

// Event listener for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const section = link.getAttribute('data-section');
        showSection(section);
        if (section === 'projects') {
            console.log("project section clicked");
            renderProjects();
        }
    });
});

// Event listener for menu button (for small screens)
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
});

// Event listener for add project button
addProjectButton.addEventListener('click', () => {
    addProjectModal.classList.remove('hidden');
});

// Event listener for close modal buttons
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        addProjectModal.classList.add('hidden');
    });
});

// Event listener for add project form submission
addProjectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const projectName = document.getElementById('project-name').value;
    const projectDescription = document.getElementById('project-description').value;
    const projectDeadline = document.getElementById('project-deadline').value;
    if (projectName && projectDeadline) {
        const newProject = {
            id: Date.now(),
            name: projectName,
            description: projectDescription,
            deadline: projectDeadline,
            roadmap: [],
            completedTasks: [],
            tasks: [] // Added tasks array here
        };
        projects.push(newProject);
        localStorage.setItem('projects', JSON.stringify(projects));
        addProjectModal.classList.add('hidden');
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';
        document.getElementById('project-deadline').value = '';
        renderProjects();
        if (currentSection === 'my-day' && projects.length > 0) {
            noTasksMessage.classList.add('hidden');
            tasksContainer.classList.remove('hidden');
        }
    } else {
        alert('Please enter both project name and deadline.');
    }
});

// Function to render projects list
function renderProjects() {
    projectList.innerHTML = '';
    projects.forEach(project => {
        const projectItem = document.createElement('li');
        projectItem.classList.add('bg-white', 'rounded-md', 'shadow-sm', 'py-2', 'px-3', 'flex', 'justify-between', 'items-center', 'hover:bg-gray-50', 'cursor-pointer');
        projectItem.textContent = project.name;
        projectItem.dataset.projectId = project.id;
        projectItem.addEventListener('click', () => {
            selectedProjectId = project.id;
            renderProjectDetails(selectedProjectId);
        });
        projectList.appendChild(projectItem);
    });
}

// Function to render project details
function renderProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        const projectDetailsDiv = document.getElementById('project-details');
        projectDetailsDiv.classList.remove('hidden');
        document.getElementById('project-name-display').querySelector('span').textContent = project.name;
        document.getElementById('project-deadline-display').querySelector('span').textContent = project.deadline;
        const projectRoadmapDiv = document.getElementById('project-roadmap');
        projectRoadmapDiv.innerHTML = '';

        if (project.roadmap && project.roadmap.length > 0) {
            project.roadmap.forEach(milestone => {
                const milestoneDiv = document.createElement('div');
                milestoneDiv.classList.add('milestone');
                    if(milestone.completed){
                    milestoneDiv.classList.add('completed')
                }
                milestoneDiv.innerHTML = `<span class="milestone-name">${milestone.name}</span><span class="milestone-date">${milestone.date}</span>`;
                projectRoadmapDiv.appendChild(milestoneDiv);
            });
        } else {
            generateRoadmap(projectId); // Generate roadmap if it doesn't exist
        }
        const completedTasksList = document.getElementById('completed-tasks-list');
        completedTasksList.innerHTML = '';
        if(project.completedTasks && project.completedTasks.length>0){
                project.completedTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.classList.add('completed-task-item');
                taskItem.textContent = task.name;
                completedTasksList.appendChild(taskItem);
            });
        }

        // Update the collapsible section
        const collapsible = document.querySelector('.collapsible');
        const content = document.querySelector('.collapsible-content');
        if (project.completedTasks && project.completedTasks.length > 0) {
            collapsible.classList.remove('hidden');
            content.classList.remove('hidden');
        } else {
            collapsible.classList.add('hidden');
            content.classList.add('hidden');
        }

        collapsible.addEventListener('click', () => {
            content.classList.toggle('show');
        });
    }
}

// Function to generate roadmap
async function generateRoadmap(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        const deadline = new Date(project.deadline);
        const today = new Date();
        const timeDiff = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (diffDays > 0) {
            try {
                const apiKey = "AIzaSyBFuijWXQSDFPaExjPMkHNeTruLXFwwYyM";
                if (!apiKey) {
                    alert("API key is required to generate a roadmap.");
                    return;
                }
                const prompt = `Generate a roadmap with development and dates for the project: ${project.description}. The project deadline is ${project.deadline}.
                Return the response as a JSON array of objects, with each object containing the milestone name and date in separate properties.
                Do not include any text outside the JSON array! the respone should be ONLY a JSON array! example: [{"name": "(Phase 1)", "date": "2022-12-31"}, {"name": "(Phase)", "date": "2023-01-31"}]`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }],
                        }],
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                var responseText = data.candidates[0].content.parts[0].text;
                responseText = responseText.replace(/```json|```/g, "").trim(); //formatot output ta lai necakarejas
                console.log("Gemini API Response:", responseText); // Debugging
                try{
                    const roadmapData = JSON.parse(responseText);
                        if (!Array.isArray(roadmapData)) {
                        console.error("Expected an array, but got:", roadmapData);
                        alert("Invalid response format from AI: Expected a JSON array.");
                        return;
                    }
                    //Basic validation of the response
                    let hasErrors = false;
                    for (const milestone of roadmapData) {
                        if (!milestone.name || !milestone.date) {
                            console.error("Invalid milestone format:", milestone);
                            hasErrors = true;
                            break;
                        }
                    }
                    if (hasErrors) {
                        alert("Invalid response format from AI: Missing 'name' or 'date' in milestones.");
                        return;
                    }

                    project.roadmap = roadmapData.map(item => ({
                        name: item.name,
                        date: item.date,
                        completed: false
                    }));
                    localStorage.setItem('projects', JSON.stringify(projects));
                    renderProjectDetails(projectId);
                }catch(error){  
                    console.error("Error parsing JSON response:", error);
                    alert("Error parsing response from AI. Please check the API key and try again.");
                    return;
                }



            } catch (error) {
                console.error("Error calling Gemini API:", error);
                alert("Failed to generate roadmap. Please check your API key and network connection.");
                return;
            }
        }
    }
}

// Function to format date
function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to generate tasks for the day using Gemini AI
async function generateTasks(projectId, availableHours) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    try {
        const apiKey = "AIzaSyBFuijWXQSDFPaExjPMkHNeTruLXFwwYyM";
            if (!apiKey) {
            alert("API key is required to generate tasks.");
            return;
        }

        const today = new Date();
        const deadline = new Date(project.deadline);
        const timeDiff = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const roadmap = project.roadmap;

        let roadmapString = "";
        if(roadmap && roadmap.length > 0){
            roadmapString = "Here is the roadmap for the project: " + roadmap.map(m => `${m.name} (${m.date})`).join(", ") + ". ";
        }
        console.log("attempting task generation"); // Debugging
        const prompt = `${roadmapString} Generate a list of tasks for today, ${formatDate(today)}, with an estimated total of ${availableHours}hours, for the project: ${project.description}. The project deadline is ${project.deadline}. Return the response as a JSON array of objects. Each object should contain the task name and estimated hours. Do not include any text outside the JSON array.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }],
                }],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        console.log("Gemini Task API Response:", responseText); // Debugging

        try {
            const tasksData = JSON.parse(responseText);
            if (!Array.isArray(tasksData)) {
                console.error("Expected an array, but got:", tasksData);
                alert("Invalid response format from AI: Expected a JSON array for tasks.");
                return;
            }
                //Basic validation of the response
            let hasErrors = false;
            for (const task of tasksData) {
                if (!task.name || !task.estimatedHours) {
                    console.error("Invalid task format:", task);
                    hasErrors = true;
                    break;
                }
            }
            if (hasErrors) {
                alert("Invalid response format from AI: Missing 'name' or 'estimatedHours' in tasks.");
                return;
            }
            const tasksForToday = tasksData.map(item => ({
                name: item.name,
                estimatedHours: item.estimatedHours,
                completed: false
            }));

            project.tasks = tasksForToday;
            localStorage.setItem('projects', JSON.stringify(projects));
            return tasksForToday;

        } catch (error) {
            console.error("Error parsing JSON response:", error);
            alert("Error parsing task response from AI. Please check the API key and try again.");
            return [];
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        alert("Failed to generate tasks. Please check your API key and network connection.");
        return [];
    }
}

// Function to render tasks
function renderTasks(projectId, tasks) {
    const project = projects.find(p => p.id === projectId);
        if (!project) return;
    tasksContainer.innerHTML = ''; // Clear previous tasks
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="text-gray-500">No tasks generated for today.</p>';
        return;
    }
    project.tasks = tasks; // Store generated tasks in the project
    localStorage.setItem('projects', JSON.stringify(projects));

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('bg-white', 'rounded-md', 'shadow-sm', 'py-2', 'px-3', 'flex', 'justify-between', 'items-center');
        taskItem.innerHTML = `<span class="${task.completed ? 'line-through text-gray-400' : ''}">${task.name}</span>
                                <input type="checkbox" ${task.completed ? 'checked' : ''} class="form-checkbox h-5 w-5 text-blue-600 rounded">`;
        const checkbox = taskItem.querySelector('input');
        checkbox.addEventListener('change', (event) => {
            task.completed = event.target.checked;
            if (task.completed) {
                taskItem.querySelector('span').classList.add('line-through', 'text-gray-400');
                    // Find the project and update completedTasks
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    // Add to completed tasks
                    project.completedTasks.push(task);
                    // Remove from the current tasks
                    project.tasks = project.tasks.filter(t => t.name !== task.name);
                    localStorage.setItem('projects', JSON.stringify(projects));
                    renderProjectDetails(projectId); // re-render project details to update completed tasks section
                }
            } else {
                taskItem.querySelector('span').classList.remove('line-through', 'text-gray-400');
                    const project = projects.find(p => p.id === projectId);
                    if (project) {
                    // Remove from completed tasks
                    project.completedTasks = project.completedTasks.filter(t => t.name !== task.name);
                    localStorage.setItem('projects', JSON.stringify(projects));
                    renderProjectDetails(projectId);
                }
            }
        });
        tasksContainer.appendChild(taskItem);
    });
}

// Initial setup: show the default section and render existing projects
showSection('my-day');
renderProjects();
if (projects.length > 0) {
    noTasksMessage.classList.add('hidden');
    tasksContainer.classList.remove('hidden');
}
