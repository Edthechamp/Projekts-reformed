import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, Circle, Calendar, Tag, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TodoApp = () => {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddClick = () => {
    if (inputValue.trim()) {
      const newTodo = {
        id: Date.now(),
        text: inputValue.trim(),
        timeEstimate: timeEstimate.trim(),
        completed: false,
        category,
        dueDate,
        createdAt: new Date().toISOString()
      };
      
      setTodos(currentTodos => [...currentTodos, newTodo]);
      setInputValue('');
      setTimeEstimate('');
      setDueDate('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(currentTodos => currentTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
  };

  const categories = [
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'health', label: 'Health' }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-purple-100 text-purple-800',
      shopping: 'bg-green-100 text-green-800',
      health: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (date) => {
    return date && new Date(date) < new Date() && date !== '';
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed === b.completed) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return a.completed ? 1 : -1;
  });

  // Calculate total estimated time for incomplete tasks
  const totalEstimatedTime = todos
    .filter(todo => !todo.completed)
    .reduce((total, todo) => {
      const estimate = parseFloat(todo.timeEstimate) || 0;
      return total + estimate;
    }, 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Todo List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a new task..."
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddClick();
                }
              }}
            />
            <Input
              type="number"
              value={timeEstimate}
              onChange={(e) => setTimeEstimate(e.target.value)}
              placeholder="Time (hours)"
              className="w-32"
              min="0"
              step="0.5"
            />
            <Button 
              onClick={handleAddClick}
              disabled={!inputValue.trim()}
            >
              Add Task
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-grow"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({todos.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            size="sm"
          >
            Active ({todos.filter(t => !t.completed).length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed ({todos.filter(t => t.completed).length})
          </Button>
        </div>

        <div className="space-y-2">
          {sortedTodos.map(todo => (
            <div
              key={todo.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors
                ${todo.completed ? 'bg-gray-50' : 'bg-white'}
                ${isOverdue(todo.dueDate) && !todo.completed ? 'border-red-200 border-2' : 'border border-gray-200'}
              `}
            >
              <div className="flex items-center gap-2 flex-grow">
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className={`${todo.completed ? 'text-green-500' : 'text-gray-400'} hover:text-green-600`}
                >
                  {todo.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                
                <div className="flex flex-col">
                  <span className={`${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.text}
                  </span>
                  <div className="flex gap-2 items-center text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(todo.category)}`}>
                      <Tag className="h-3 w-3 inline mr-1" />
                      {todo.category}
                    </span>
                    {todo.timeEstimate && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-3 w-3" />
                        {todo.timeEstimate}h
                      </span>
                    )}
                    {todo.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue(todo.dueDate) && !todo.completed ? 'text-red-500' : 'text-gray-500'}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-600 ml-2"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {todos.length > 0 && (
          <div className="mt-6 flex justify-between text-sm text-gray-500">
            <div>
              <div>{todos.filter(t => t.completed).length} of {todos.length} tasks completed</div>
              <div>{todos.filter(t => !t.completed && isOverdue(t.dueDate)).length} overdue</div>
            </div>
            <div className="text-right">
              <div>Remaining time:</div>
              <div>{totalEstimatedTime.toFixed(1)} hours</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodoApp;
