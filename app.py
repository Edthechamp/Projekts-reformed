from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime
import google.generativeai as genai
import ast


app = Flask(__name__)
app.secret_key = 'typeshi' # Important for flashing messages

# --- In-Memory Data Storage ---
# Replace with database interactions in a real app
projects = [] # { project_id: {'name': 'Project Name', 'tasks': [task_id1, task_id2]} }
tasks_list = []   # { task_id: {'description': 'Task Desc', 'project_id': 'proj_id', 'status': 'pending'/'allocated'/'completed', 'estimated_time_h': 4, 'completed_at': None} }
my_day_tasks = [] # List of task_ids allocated for "My Day"

@app.route('/')
def my_day():
    currentProjects = []
    for project in projects:
        if project['name'] not in currentProjects:
            currentProjects.append(project['name'])
    return render_template("my_day.html",projects=currentProjects)

@app.route('/task_list',methods=['POST'])
def task_list():   
    return jsonify({"tasks":tasks_list})

@app.route('/customTask',methods=['POST'])
def custom_task():
    data = request.get_json()
    task = data.get('task')
    if task not in tasks_list:
        tasks_list.append(task)
    return jsonify({'message': 'added succesfully'}), 200

@app.route('/get_tasks', methods=['POST'])
def get_tasks():
    tasks= []
    response = request.get_json()
    print(response)
    
    project_name = response.get('project') 

    print("project_name", project_name)

    for p in projects:
        if p['name'] == project_name:
            project=p
            break

    print(project)

    time = response.get('minutes')
    prompt = "Generate a list of tasks for the project: " + project['name'] + " with the following description: " + project['description'] + ".I dont have to finish the project now just have to get started with it. I have " + str(time) + " minutes for the tasks. Make the tasks short and concise but detailed, so that i can start working immediatly. The tasks should be in the format: ['Task1', 'Task2', 'Task3']. Make sure to output ONLY the list without any surrounding text! Ill repeat, output ONLY THE LIST!"

    print(prompt)

    genai.configure(api_key="AIzaSyBFuijWXQSDFPaExjPMkHNeTruLXFwwYyM")
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")

    tasks_reponse = model.generate_content(prompt)
    tasks = tasks_reponse.text


    tasks = ast.literal_eval(tasks)

    print(tasks)
    #git command to push to new branch: 
    for task in tasks:
        if task not in tasks_list:
            tasks_list.append(task)
    
    return jsonify({ 'tasks': tasks })


@app.route('/completed_task', methods=['POST'])
def completed_task():
    data = request.get_json()
    task = data.get('task')
    if task in tasks_list:
        tasks_list.remove(task)
    
    return jsonify({'message': 'removed succesfully'}), 200
    #TODO:save completed task to project for better future task generation
    #need to somehow manage which project the task belongs to, then
    #project['completed_tasks'].append(task)
    #also rememebr to edit the prompt, to pass completed tasks.


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