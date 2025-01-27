// Task Management
class Task {
    constructor(title, description, deadline) {
        this.id = Date.now().toString();
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.completed = false;
    }
}

class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.selectedDate = null;
        this.currentEditingTask = null;
        this.initializeEventListeners();
        this.setDefaultDeadline();
        this.renderCalendar();
        this.updateAllTaskLists();
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
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Edit form submission
        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
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
    }

    addTask() {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const deadline = document.getElementById('taskDeadline').value;

        const task = new Task(title, description, deadline);
        this.tasks.push(task);
        this.saveTasks();
        this.updateAllTaskLists();
        this.renderCalendar();

        // Reset form and set new default deadline
        document.getElementById('taskForm').reset();
        this.setDefaultDeadline();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.updateAllTaskLists();
        this.renderCalendar();
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateAllTaskLists();
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
    updateAllTaskLists() {
        this.updateTodayTasks();
        this.updateSelectedDayTasks();
        this.updateBacklogTasks();
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
            document.getElementById('editTaskDeadline').value = task.deadline;
            this.showUpdateForm();
        }
    }

    updateTask() {
        if (this.currentEditingTask) {
            // Update the existing task object
            this.currentEditingTask.title = document.getElementById('editTaskTitle').value;
            this.currentEditingTask.description = document.getElementById('editTaskDescription').value;
            this.currentEditingTask.deadline = document.getElementById('editTaskDeadline').value;
            
            this.saveTasks();
            this.updateAllTaskLists();
            this.renderCalendar();
            this.hideUpdateForm();
        }
    }

    createTaskElement(task, context = 'default') {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        const deadlineDate = new Date(task.deadline);
        
        // Only mark tasks as overdue in the backlog section
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

    updateTodayTasks() {
        const todayList = document.getElementById('todayTasksList');
        todayList.innerHTML = '';
        
        const today = new Date();
        const todayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toDateString() === today.toDateString();
        });

        todayTasks.forEach(task => {
            todayList.appendChild(this.createTaskElement(task));
        });
    }

    updateSelectedDayTasks() {
        const selectedList = document.getElementById('selectedDayTasksList');
        selectedList.innerHTML = '';

        if (this.selectedDate) {
            const selectedTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.deadline);
                return taskDate.toDateString() === this.selectedDate.toDateString();
            });

            selectedTasks.forEach(task => {
                selectedList.appendChild(this.createTaskElement(task));
            });
        }
    }

    updateBacklogTasks() {
        const backlogList = document.getElementById('backlogTasksList');
        backlogList.innerHTML = '';

        const now = new Date();
        const backlogTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return !task.completed && taskDate < now;
        });

        backlogTasks.forEach(task => {
            backlogList.appendChild(this.createTaskElement(task, 'backlog'));
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
