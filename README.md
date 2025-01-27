# Just Do It - Task Manager

![Just Do It Logo](logo.jpeg)

A clean and intuitive task management application built with vanilla JavaScript, HTML, and CSS. This app helps you organize your tasks with a calendar-based interface and smart task categorization.

## Features

### Task Management

- Create tasks with title, optional description, and deadline
- Mark tasks as complete/incomplete
- Delete tasks with fade-out animation
- Tasks are automatically saved to local storage

### Calendar Integration

- Interactive calendar interface
- Navigate between months
- Visual indicators for days with tasks
- Select dates to view specific day's tasks
- Current day highlighted

### Task Organization

- **Today's Tasks**: View all tasks due today
- **Selected Day Tasks**: View tasks for any selected date
- **Backlog**: Automatically tracks overdue tasks
  - Overdue tasks are highlighted in red for better visibility
  - Only appears in backlog section to maintain clean interface

### User Interface

- Clean and modern design
- Responsive layout (works on desktop and mobile)
- Smooth animations for better user experience
- Intuitive task management with checkbox and trash icon
- Clear deadline display with clock icon

## Technical Details

### Built With

- HTML5
- CSS3
- Vanilla JavaScript
- Font Awesome icons
- Local Storage for data persistence

### Key Features

- No external libraries or frameworks required
- Fully responsive design
- Client-side storage
- Modern ES6+ JavaScript

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start managing your tasks!

No build process or installation required - it works right out of the box.

## Usage

### Creating Tasks

1. Enter a task title (required)
2. Add a description (optional)
3. Set a deadline (required)
4. Click "Add Task"

### Managing Tasks

- Click the checkbox to mark tasks as complete
- Click the trash icon to delete tasks
- Use the calendar to navigate between dates
- Tasks automatically appear in appropriate sections based on their deadline

### Calendar Navigation

- Use the arrow buttons to move between months
- Click on any date to view tasks for that specific day
- Days with tasks are marked with an indicator

## Storage

All tasks are automatically saved to your browser's local storage, ensuring your tasks persist between sessions.
