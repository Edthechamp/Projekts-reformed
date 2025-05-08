function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
  
    const isOpen = sidebar.classList.contains("open");
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show", !isOpen);
  }
  
  function fetchTasks() {
    const minutes = document.getElementById("timeInput").value;
    const projectName = document.getElementById("projectSelector").value;
  
    fetch('/get_tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        minutes: parseInt(minutes),
        project: projectName 
      })
    })
    .then(response => {
      return response.json();
    })
    .then(data => {
      const container = document.getElementById("tasksContainer");
      container.innerHTML = '';
      console.log("inside tasks:", data.tasks);
      data.tasks.forEach(task => {
        const div = createTaskElement(task);
        container.appendChild(div);
      });
    });
  }

  function createTaskElement(taskText) {
    const div = document.createElement('div');
        div.className = 'task';
        
        // Display task as text initially
        const taskTextNode = document.createElement('span');
        taskTextNode.className = 'task-text';
        taskTextNode.innerText = taskText;
        taskTextNode.addEventListener('dblclick', () => makeEditable(taskTextNode));

        // Remove button
        const removeButton = document.createElement('button');
        removeButton.innerText = 'Done';
        removeButton.className = 'remove-btn';
        removeButton.onclick = () => {
            //pass complted task to server
            console.log(taskText)
            fetch('/completed_task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task: taskText })
            })
            div.remove(); // Remove from UI
        };

        div.appendChild(taskTextNode);
        div.appendChild(removeButton);

        return div;
      }

      function renderTasks() {
        fetch('/task_list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
          const container = document.getElementById("tasksContainer");
          container.innerHTML = ''; // Clear existing tasks
      
          if (data.tasks && Array.isArray(data.tasks)) {
            data.tasks.forEach(task => {
              const div = createTaskElement(task);
              container.appendChild(div);
            });
          } else {
            container.innerHTML = '<p>No tasks found.</p>';
          }
        })
        .catch(error => {
          console.error("Error fetching task list:", error);
        });
      }
      
    function makeEditable(taskTextNode) {
        const input = document.createElement('input');
        input.value = taskTextNode.innerText;
        input.className = 'task-input';
        input.addEventListener('blur', () => saveTask(input, taskTextNode));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveTask(input, taskTextNode); // Save when pressing Enter
        });

        taskTextNode.innerText = ''; // Clear text
        taskTextNode.appendChild(input);
        input.focus(); // Focus the input field
      }

      // Save edited task
      function saveTask(input, taskTextNode) {
        taskTextNode.innerText = input.value;
    }

    function addCustomTask() {
        const customTaskInput = document.getElementById("customTaskInput");
        const customTaskText = customTaskInput.value.trim();
        fetch('/customTask', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task: customTaskText })
      })
      
        
        if (customTaskText) {
          const container = document.getElementById("tasksContainer");
          const div = createTaskElement(customTaskText);
          container.appendChild(div);
          customTaskInput.value = '';  // Clear input
        }
        
      }

    window.onload = function() {
      renderTasks();
    }