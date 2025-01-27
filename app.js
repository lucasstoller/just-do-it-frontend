class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:8080/v1';
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            window.location.href = 'login.html';
            throw new Error('Authentication token is required');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 401) {
                removeToken();
                window.location.href = 'login.html';
            }
            throw new Error(error.message || 'An error occurred');
        }

        return response.status === 204 ? null : response.json();
    }

    async getTasks() {
        return this.request('/tasks');
    }

    async getTasksByDate(date) {
        return this.request(`/tasks?deadline=${date}`);
    }

    async getTodayTasks() {
        return this.request('/tasks/today');
    }

    async getBacklogTasks() {
        return this.request('/tasks/backlog');
    }

    async createTask(task) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    async updateTask(taskId, task) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(task)
        });
    }

    async deleteTask(taskId) {
        return this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    async toggleTaskComplete(taskId) {
        return this.request(`/tasks/${taskId}/toggle`, {
            method: 'PATCH'
        });
    }
}

class TaskManager {
    constructor() {
        this.api = new ApiClient();
        this.tasks = [];
        this.selectedDate = null;
        this.currentEditingTask = null;
        this.initializeEventListeners();
        this.setDefaultDeadline();
        this.renderCalendar();
        this.loadTasks();
    }

    async loadTasks() {
        try {
            const response = await this.api.getTasks();
            this.tasks = response.tasks;
            this.updateAllTaskLists();
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('Failed to load tasks. Please check your authentication token.');
        }
    }

    showError(message) {
        alert(message);
    }

    setDefaultDeadline() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('taskDeadline').value = defaultDateTime;
    }

    initializeEventListeners() {

        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addTask();
        });

        // Edit form submission
        document.getElementById('editTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateTask();
        });

        // Cancel edit button
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.hideUpdateForm();
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.navigateMonth(-1);
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.navigateMonth(1);
        });

        // Initialize logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            removeToken();
            window.location.href = 'login.html';
        });
    }

    async addTask() {
        try {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDescription').value;
            const localDeadline = document.getElementById('taskDeadline').value;
            const deadline = new Date(localDeadline).toISOString();

            const newTask = await this.api.createTask({
                title,
                description,
                deadline
            });

            this.tasks.push(newTask);
            this.updateAllTaskLists();
            this.renderCalendar();

            // Reset form and set new default deadline
            document.getElementById('taskForm').reset();
            this.setDefaultDeadline();
        } catch (error) {
            console.error('Failed to add task:', error);
            this.showError('Failed to add task. Please try again.');
        }
    }

    async deleteTask(taskId) {
        try {
            await this.api.deleteTask(taskId);
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.updateAllTaskLists();
            this.renderCalendar();
        } catch (error) {
            console.error('Failed to delete task:', error);
            this.showError('Failed to delete task. Please try again.');
        }
    }

    async toggleTaskComplete(taskId) {
        try {
            const response = await this.api.toggleTaskComplete(taskId);
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = response.completed;
                this.updateAllTaskLists();
            }
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
            this.showError('Failed to update task status. Please try again.');
        }
    }

    // Calendar Functions
    renderCalendar() {
        const today = new Date();
        const currentMonth = this.selectedDate || today;
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Get last day of previous month
        const prevMonthLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
        
        // Update month display
        document.getElementById('monthDisplay').textContent = 
            firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

        const calendarBody = document.getElementById('calendarDays');
        calendarBody.innerHTML = '';

        let currentWeek = document.createElement('tr');
        currentWeek.className = 'calendar-week';

        // Add days from previous month
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayElement = document.createElement('td');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = prevMonthLastDay.getDate() - i;
            currentWeek.appendChild(dayElement);
        }

        // Add days of current month
        let currentDay = 1;
        while (currentDay <= lastDay.getDate()) {
            if (currentWeek.children.length === 7) {
                calendarBody.appendChild(currentWeek);
                currentWeek = document.createElement('tr');
                currentWeek.className = 'calendar-week';
            }

            const dayElement = document.createElement('td');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDay;

            const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentDay);
            
            // Check if this day has tasks
            const hasTasks = this.tasks.some(task => {
                const taskDate = new Date(task.deadline);
                return taskDate.toDateString() === currentDate.toDateString();
            });

            // Add appropriate classes
            if (hasTasks) {
                dayElement.classList.add('has-tasks');
            }
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            if (this.selectedDate && currentDate.toDateString() === this.selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }

            // Add click event
            dayElement.addEventListener('click', () => {
                this.selectDate(currentDate);
            });

            currentWeek.appendChild(dayElement);
            currentDay++;
        }

        // Add days from next month
        let nextMonthDay = 1;
        while (currentWeek.children.length < 7) {
            const dayElement = document.createElement('td');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = nextMonthDay++;
            currentWeek.appendChild(dayElement);
        }
        calendarBody.appendChild(currentWeek);

        // Add remaining weeks to make it 6 rows total
        while (calendarBody.children.length < 6) {
            const weekRow = document.createElement('tr');
            weekRow.className = 'calendar-week';
            for (let i = 0; i < 7; i++) {
                const dayElement = document.createElement('td');
                dayElement.className = 'calendar-day other-month';
                dayElement.textContent = nextMonthDay++;
                weekRow.appendChild(dayElement);
            }
            calendarBody.appendChild(weekRow);
        }
    }

    navigateMonth(delta) {
        const currentMonth = this.selectedDate || new Date();
        this.selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
        this.renderCalendar();
        this.updateAllTaskLists();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
        this.updateAllTaskLists();
    }

    // Task Display Functions
    async updateAllTaskLists() {
        await Promise.all([
            this.updateTodayTasks(),
            this.updateSelectedDayTasks(),
            this.updateBacklogTasks()
        ]);
    }

    showUpdateForm() {
        document.getElementById('addTaskForm').style.display = 'none';
        document.getElementById('updateTaskForm').style.display = 'block';
    }

    hideUpdateForm() {
        document.getElementById('addTaskForm').style.display = 'block';
        document.getElementById('updateTaskForm').style.display = 'none';
        this.currentEditingTask = null;
        document.getElementById('editTaskForm').reset();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.currentEditingTask = task;
            // Fill the edit form with task data
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description || '';
            // Convert UTC ISO string to local datetime-local format
            const deadline = new Date(task.deadline);
            const year = deadline.getFullYear();
            const month = String(deadline.getMonth() + 1).padStart(2, '0');
            const day = String(deadline.getDate()).padStart(2, '0');
            const hours = String(deadline.getHours()).padStart(2, '0');
            const minutes = String(deadline.getMinutes()).padStart(2, '0');
            
            document.getElementById('editTaskDeadline').value = `${year}-${month}-${day}T${hours}:${minutes}`;
            this.showUpdateForm();
        }
    }

    async updateTask() {
        if (this.currentEditingTask) {
            try {
                const updatedTask = {
                    title: document.getElementById('editTaskTitle').value,
                    description: document.getElementById('editTaskDescription').value,
                    deadline: new Date(document.getElementById('editTaskDeadline').value).toISOString()
                };

                const response = await this.api.updateTask(this.currentEditingTask.id, updatedTask);
                
                // Update the task in the local array
                const index = this.tasks.findIndex(t => t.id === this.currentEditingTask.id);
                if (index !== -1) {
                    this.tasks[index] = response;
                }

                this.updateAllTaskLists();
                this.renderCalendar();
                this.hideUpdateForm();
            } catch (error) {
                console.error('Failed to update task:', error);
                this.showError('Failed to update task. Please try again.');
            }
        }
    }

    createTaskElement(task, context = 'default') {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        const deadlineDate = new Date(task.deadline);
        
        if (context === 'backlog' && !task.completed && deadlineDate < new Date()) {
            taskElement.classList.add('overdue');
        }

        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} />
            </div>
            <div class="task-content">
                <h3>${task.title}</h3>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <div class="deadline">
                    <i class="far fa-clock"></i>
                    ${new Date(task.deadline).toLocaleString()}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            this.toggleTaskComplete(task.id);
            taskElement.classList.toggle('completed', task.completed);
        });

        const editBtn = taskElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            this.editTask(task.id);
        });

        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            taskElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => this.deleteTask(task.id), 300);
        });

        return taskElement;
    }

    async updateTodayTasks() {
        try {
            const todayList = document.getElementById('todayTasksList');
            todayList.innerHTML = '';
            
            const response = await this.api.getTodayTasks();
            response.tasks.forEach(task => {
                todayList.appendChild(this.createTaskElement(task));
            });
        } catch (error) {
            console.error('Failed to load today\'s tasks:', error);
        }
    }

    async updateSelectedDayTasks() {
        if (this.selectedDate) {
            try {
                const selectedList = document.getElementById('selectedDayTasksList');
                selectedList.innerHTML = '';

                const date = this.selectedDate.toISOString().split('T')[0];
                const response = await this.api.getTasksByDate(date);
                response.tasks.forEach(task => {
                    selectedList.appendChild(this.createTaskElement(task));
                });
            } catch (error) {
                console.error('Failed to load selected day tasks:', error);
            }
        }
    }

    async updateBacklogTasks() {
        try {
            const backlogList = document.getElementById('backlogTasksList');
            backlogList.innerHTML = '';

            const response = await this.api.getBacklogTasks();
            response.tasks.forEach(task => {
                backlogList.appendChild(this.createTaskElement(task, 'backlog'));
            });
        } catch (error) {
            console.error('Failed to load backlog tasks:', error);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
