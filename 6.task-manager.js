// Task Management System
class TaskManager {
    constructor() {
        this.currentTasks = [];
        this.currentFilter = 'all';
        this.isEditing = false;
        this.editingTaskId = null;
    }
    
    init() {
        console.log('Task Manager initialized');
    }
    
    // Load tasks from storage
    async loadTasks() {
        try {
            this.currentTasks = this.getLocalTasks();
            this.renderTasks();
            this.updateDashboard();
            this.updateTaskSelector();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showToast('Failed to load tasks', 'error');
        }
    }
    
    // Render tasks based on current filter
    renderTasks() {
        const tasksContainer = document.getElementById('all-tasks');
        const priorityContainer = document.getElementById('priority-tasks');
        
        if (!tasksContainer || !priorityContainer) return;
        
        let filteredTasks = this.currentTasks;
        
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = this.currentTasks.filter(task => task.status !== 'completed');
                break;
            case 'completed':
                filteredTasks = this.currentTasks.filter(task => task.status === 'completed');
                break;
            case 'high':
                filteredTasks = this.currentTasks.filter(task => task.priority === 'high');
                break;
        }
        
        // Render main tasks list
        this.renderTaskList(tasksContainer, filteredTasks, 'No tasks match your filter');
        
        // Render priority tasks for dashboard
        const priorityTasks = this.currentTasks
            .filter(task => task.status !== 'completed')
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
            })
            .slice(0, 5);
        
        this.renderTaskList(priorityContainer, priorityTasks, 'No priority tasks');
    }
    
    // Render a list of tasks in a container
    renderTaskList(container, tasks, emptyMessage) {
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>${emptyMessage}</div>
                </div>
            `;
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }
    
    // Create individual task element
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority || 'medium'}`;
        
        const dueDate = task.due ? new Date(task.due).toLocaleDateString() : null;
        const isOverdue = dueDate && new Date(task.due) < new Date() && task.status !== 'completed';
        
        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                   onchange="radzzApp.taskManager.toggleTaskCompletion('${task.id}')">
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-meta">
                    ${dueDate ? `<span class="${isOverdue ? 'overdue' : ''}">📅 ${dueDate} ${isOverdue ? ' (Overdue)' : ''}</span>` : ''}
                    ${task.priority ? `<span>⚡ ${task.priority} priority</span>` : ''}
                    ${task.status === 'completed' ? '<span>✅ Completed</span>' : ''}
                </div>
                ${task.notes ? `<div style="margin-top: 6px; color: #666; font-size: 0.85rem;">${this.escapeHtml(task.notes)}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-warning" onclick="radzzApp.taskManager.editTask('${task.id}')">Edit</button>
                <button class="btn btn-danger" onclick="radzzApp.taskManager.deleteTask('${task.id}')">Delete</button>
            </div>
        `;
        
        return taskElement;
    }
    
    // Handle save task
    async handleSaveTask() {
        const title = document.getElementById('task-title').value.trim();
        const notes = document.getElementById('task-notes').value.trim();
        const due = document.getElementById('task-due').value;
        const priority = document.getElementById('task-priority').value;
        
        if (!title) {
            this.showToast('Please enter a task title', 'warning');
            return;
        }
        
        const taskData = {
            title,
            notes: notes || '',
            due: due || undefined,
            priority,
            status: 'needsAction'
        };
        
        try {
            if (this.isEditing && this.editingTaskId) {
                await this.updateTask(this.editingTaskId, taskData);
                this.showToast('Task updated!', 'success');
            } else {
                await this.createTask(taskData);
                this.showToast('Task created!', 'success');
            }
            
            window.radzzApp.uiManager.hideTaskModal();
            this.resetTaskForm();
            
        } catch (error) {
            console.error('Error saving task:', error);
            this.showToast('Failed to save task', 'error');
        }
    }
    
    // Create new task
    async createTask(taskData) {
        const newTask = this.createLocalTask(taskData);
        await this.loadTasks();
        return newTask;
    }
    
    // Update existing task
    async updateTask(taskId, updates) {
        const updatedTask = this.updateLocalTask(taskId, updates);
        await this.loadTasks();
        return updatedTask;
    }
    
    // Toggle task completion
    async toggleTaskCompletion(taskId) {
        try {
            const task = this.currentTasks.find(t => t.id === taskId);
            if (!task) return;
            
            const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
            await this.updateTask(taskId, { status: newStatus });
            
            const message = newStatus === 'completed' ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showToast(message, 'success');
            
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('Failed to update task', 'error');
        }
    }
    
    // Delete task
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        try {
            this.deleteLocalTask(taskId);
            await this.loadTasks();
            this.showToast('Task deleted',