from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import uuid # To generate unique IDs
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'pass' # Important for flashing messages

# Set up static folder structure - uncomment if needed to create structure
# if not os.path.exists('static/js'):
#     os.makedirs('static/js')
# if not os.path.exists('static/css'):
#     os.makedirs('static/css')

# --- In-Memory Data Storage ---
# Replace with database interactions in a real app
projects = [] # { project_id: {'name': 'Project Name', 'tasks': [task_id1, task_id2]} }
tasks = {}    # { task_id: {'description': 'Task Desc', 'project_id': 'proj_id', 'status': 'pending'/'allocated'/'completed', 'estimated_time_h': 4, 'completed_at': None} }
my_day_tasks = [] # List of task_ids allocated for "My Day"

@app.route('/')
def my_day():
    return render_template("my_day.html")

@app.route('/get_tasks', methods=['POST'])
def get_tasks():
    response = request.get_json()
    print(response)
    return jsonify(tasks=["task1","Task2"])

@app.route('/projects')
def show_projects():
    return render_template("projects.html", projects=projects)

@app.route('/calendar')
def show_calendar():
    return render_template("calendar.html")

@app.route('/api/tasks', methods=['GET', 'POST'])
def api_tasks():
    if request.method == 'GET':
        # Return all calendar tasks
        calendar_tasks = [task for task in tasks.values() if 'deadline' in task]
        return jsonify(calendar_tasks)
    elif request.method == 'POST':
        # Add new task
        data = request.get_json()
        task_id = str(uuid.uuid4())
        tasks[task_id] = {
            'id': task_id,
            'name': data.get('name'),
            'date': data.get('date'),
            'deadline': data.get('deadline'),
            'priority': data.get('priority', 'medium'),
            'time': data.get('time')
        }
        return jsonify({'success': True, 'task_id': task_id}), 201

@app.route('/getProjects')
def get_projects():
    print("get_projects")
    return jsonify(projects=projects)

@app.route('/addProject', methods=['POST'])
def add_project():
    data = request.get_json()
    if not data or 'name' not in data or 'description' not in data or 'deadline' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    project = {
        'id': len(projects) + 1,
        'name': data['name'],
        'description': data['description'],
        'deadline': data['deadline']
    }
    print(project)
    projects.append(project)
    return jsonify({'message': 'Project added successfully', 'project': project}), 200

@app.route('/removeProject', methods=['POST'])
def remove_project():
    data = request.get_json()
    ProjectName = data.get('projectName')
    global projects
    projects = [project for project in projects if project['name'] != ProjectName]
    print(projects)
    return jsonify({'message': 'Project removed successfully'}), 200

# --- Run the App ---
if __name__ == '__main__':
    app.run(debug=True) # debug=True for development (auto-reloads, shows errors)