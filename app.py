from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime
import google.generativeai as genai


app = Flask(__name__)
app.secret_key = 'typeshi' # Important for flashing messages

# --- In-Memory Data Storage ---
# Replace with database interactions in a real app
projects = [] # { project_id: {'name': 'Project Name', 'tasks': [task_id1, task_id2]} }
tasks = {}    # { task_id: {'description': 'Task Desc', 'project_id': 'proj_id', 'status': 'pending'/'allocated'/'completed', 'estimated_time_h': 4, 'completed_at': None} }
my_day_tasks = [] # List of task_ids allocated for "My Day"

@app.route('/')
def my_day():
    return render_template("my_day.html",)
@app.route('/get_tasks', methods=['POST'])
def get_tasks():
    response = request.get_json()
    print(response)
    
    project = projects[0]
    print(project['name'])

    time = response.get('minutes')
    prompt = "Generate a list of tasks for the project: " + project['name'] + " with the following description: " + project['description'] + ". I have " + str(time) + " minutes for the tasks. Make the tasks detailed, so that i can start working immediatly. The tasks should be in the format: ['Task1', 'Task2', 'Task3']. Make sure to output ONLY the list without any surrounding text! Ill repeat, output ONLY THE LIST!"

    genai.configure(api_key="AIzaSyBFuijWXQSDFPaExjPMkHNeTruLXFwwYyM")
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")

    tasks_reponse = model.generate_content(prompt)
    tasks = tasks_reponse.text

    print(tasks)
    print("jsonified",jsonify(tasks))
    return jsonify(tasks)

@app.route('/completed_task', methods=['POST'])
def completed_task():
    data = request.get_json()
    task = data.get('taskText')
    tasks.append(task)


@app.route('/projects')
def show_projects():
    return render_template("projects.html", projects=projects)

@app.route('/calendar')
def show_calendar():
    return render_template("calendar.html")

@app.route('/getProjects')
def get_projects():
    print("get_projects")
    return jsonify(projects=projects)

@app.route('/addProject', methods=['POST'])
def add_project():
    data = request.get_json()
    #check for valid data
    if not data or 'name' not in data or 'description' not in data or 'deadline' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    #check for duplicates
    if any(project['name'] == data['name'] for project in projects):
        return jsonify({'error': 'Project with this name already exists'}), 400
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

# --- Run the App ---s
if __name__ == '__main__':
    app.run(debug=True) # debug=True for development (auto-reloads, shows errors)