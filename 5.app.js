// Main Application Entry Point
import { TaskManager } from './task-manager.js';
import { StudyTimer } from './study-timer.js';
import { UIManager } from './ui-manager.js';
import { GoogleTasksAPI } from './google-tasks-api.js';

class RadzzApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.studyTimer = new StudyTimer();
        this.uiManager = new UIManager();
        this.googleAPI = new GoogleTasksAPI();
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Radzz App Initializing...');
        
        // Initialize components
        this.uiManager.init();
        this.taskManager.init();
        this.studyTimer.init();
        this.googleAPI.init();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        console.log('✅ Radzz App Ready!');
    }
    
    async loadInitialData() {
        try {
            await this.taskManager.loadTasks();
            this.uiManager.updateAuthUI();
            this.loadPreferences();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.uiManager.showToast('Error loading tasks', 'error');
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                if (section) {
                    this.uiManager.showSection(section);
                }
            });
        });
        
        // Task management
        document.getElementById('add-task-btn')?.addEventListener('click', () => {
            this.uiManager.showTaskModal();
        });
        
        document.getElementById('create-task-btn')?.addEventListener('click', () => {
            this.uiManager.showTaskModal();
        });
        
        document.getElementById('save-task')?.addEventListener('click', () => {
            this.taskManager.handleSaveTask();
        });
        
        document.getElementById('cancel-task')?.addEventListener('click', () => {
            this.uiManager.hideTaskModal();
        });
        
        document.getElementById('task-filter')?.addEventListener('change', (e) => {
            this.taskManager.setFilter(e.target.value);
        });
        
        // Study timer
        document.getElementById('start-timer')?.addEventListener('click', () => {
            this.studyTimer.start();
        });
        
        document.getElementById('pause-timer')?.addEventListener('click', () => {
            this.studyTimer.pause();
        });
        
        document.getElementById('reset-timer')?.addEventListener('click', () => {
            this.studyTimer.reset();
        });
        
        document.getElementById('timer-type')?.addEventListener('change', (e) => {
            this.studyTimer.setType(e.target.value);
        });
        
        // Settings
        document.getElementById('connect-google-btn')?.addEventListener('click', () => {
            this.googleAPI.authenticate();
        });
        
        document.getElementById('save-preferences')?.addEventListener('click', () => {
            this.savePreferences();
        });
        
        // Task selector for focus
        document.getElementById('task-selector')?.addEventListener('change', (e) => {
            this.setFocusTask(e.target.value);
        });
        
        // Modal close on background click
        document.getElementById('task-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.uiManager.hideTaskModal();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.uiManager.hideTaskModal();
            }
        });
    }
    
    setFocusTask(taskId) {
        if (taskId) {
            const task = this.taskManager.getTask(taskId);
            if (task) {
                this.uiManager.showToast(`Focusing on: ${task.title}`, 'success');
                this.studyTimer.setFocusTask(task);
            }
        }
    }
    
    savePreferences() {
        const studyDuration = document.getElementById('study-duration').value;
        const breakDuration = document.getElementById('break-duration').value;
        
        const preferences = {
            studyDuration: parseInt(studyDuration),
            breakDuration: parseInt(breakDuration)
        };
        
        localStorage.setItem('radzz_preferences', JSON.stringify(preferences));
        this.uiManager.showToast('Preferences saved!', 'success');
    }
    
    loadPreferences() {
        const saved = localStorage.getItem('radzz_preferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            document.getElementById('study-duration').value = preferences.studyDuration || 25;
            document.getElementById('break-duration').value = preferences.breakDuration || 5;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.radzzApp = new RadzzApp();
});

// Export for other modules
export { RadzzApp };