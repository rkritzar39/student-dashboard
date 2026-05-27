/**
 * DATA STORE
 * This could easily be replaced by a fetch() call to Google Sheets API
 */
const DATA = {
    student: {
        name: "Alex Johnson",
        major: "Computer Science",
        semester: "Fall 2025",
        gpa: 3.85,
        progress: 65 // Total degree progress %
    },
    courses: [
        { id: 1, name: "Data Structures", instructor: "Dr. Smith", grade: "A", status: "In Progress" },
        { id: 2, name: "Web Development", instructor: "Prof. Miller", grade: "A-", status: "In Progress" },
        { id: 3, name: "Discrete Math", instructor: "Dr. Kahn", grade: "B+", status: "Completed" },
        { id: 4, name: "UI/UX Design", instructor: "Sarah Lee", grade: "A", status: "In Progress" }
    ],
    assignments: [
        { id: 101, title: "Linked List Lab", course: "Data Structures", due: "Oct 24, 2025", status: "Completed" },
        { id: 102, title: "Portfolio Draft", course: "Web Development", due: "Oct 28, 2025", status: "Pending" },
        { id: 103, title: "Design System Quiz", course: "UI/UX Design", due: "Nov 02, 2025", status: "Pending" }
    ],
    announcements: [
        { date: "Oct 20", title: "Career Fair Next Friday", content: "Don't forget to polish your resumes for the CS Career Fair." },
        { date: "Oct 18", title: "System Maintenance", content: "Portal will be down for 2 hours on Sunday." }
    ],
    calendar: [
        { day: "24", month: "OCT", event: "Project 1 Submission" },
        { day: "30", month: "OCT", event: "Midterm Exam - Math" }
    ]
};

// --- CORE FUNCTIONALITY ---

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    renderSection('dashboard'); // Initial view
    updateSidebarProfile();
    setupEventListeners();
});

function setupEventListeners() {
    // Nav Links
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', (e) => {
            document.querySelector('.nav-links li.active').classList.remove('active');
            link.classList.add('active');
            renderSection(link.dataset.section);
            
            // Close mobile sidebar if open
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Dark Mode
    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
        document.body.classList.toggle('light-theme', !e.target.checked);
        document.body.classList.toggle('dark-theme', e.target.checked);
    });

    // Mobile Toggle
    document.getElementById('mobile-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

function updateSidebarProfile() {
    const header = document.getElementById('student-profile-header');
    header.innerHTML = `
        <div style="text-align: right; margin-right: 10px;">
            <p style="font-weight: 600;">${DATA.student.name}</p>
            <p style="font-size: 12px; color: var(--text-muted);">${DATA.student.semester}</p>
        </div>
        <img src="https://ui-avatars.com/api/?name=${DATA.student.name}&background=6366f1&color=fff" 
             style="width: 40px; border-radius: 10px;">
    `;
    document.getElementById('notif-badge').innerText = DATA.announcements.length;
}

// --- RENDER ENGINE ---

function renderSection(sectionId) {
    const container = document.getElementById('content-render-area');
    container.style.opacity = 0; // Simple fade transition start

    setTimeout(() => {
        switch(sectionId) {
            case 'dashboard': renderDashboard(container); break;
            case 'courses': renderCourses(container); break;
            case 'assignments': renderAssignments(container); break;
            case 'grades': renderGrades(container); break;
            case 'announcements': renderAnnouncements(container); break;
            default: container.innerHTML = `<h2>${sectionId.toUpperCase()} Section Coming Soon</h2>`;
        }
        container.style.opacity = 1;
    }, 200);
}

function renderDashboard(container) {
    container.innerHTML = `
        <h1 style="margin-bottom: 2rem;">Welcome back, ${DATA.student.name.split(' ')[0]}!</h1>
        <div class="dashboard-grid">
            <div class="card">
                <h3>Semester Progress</h3>
                <p style="font-size: 14px; color: var(--text-muted); margin-top: 5px;">${DATA.student.semester}</p>
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${DATA.student.progress}%"></div>
                </div>
                <p style="text-align: right; margin-top: 5px; font-weight: bold;">${DATA.student.progress}%</p>
            </div>
            <div class="card">
                <h3>Current GPA</h3>
                <div style="font-size: 2.5rem; font-weight: 800; margin-top: 10px;">${DATA.student.gpa}</div>
                <p style="color: #22c55e;"><i class="fas fa-arrow-up"></i> 0.2 from last term</p>
            </div>
            <div class="card">
                <h3>Upcoming Deadlines</h3>
                <ul style="list-style: none; margin-top: 15px;">
                    ${DATA.assignments.filter(a => a.status === 'Pending').map(a => `
                        <li style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                            <span>${a.title}</span>
                            <span style="color: #ef4444; font-size: 12px;">${a.due}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div class="card" style="margin-top: 2rem;">
            <h3>Recent Activity</h3>
            <table>
                <thead><tr><th>Course</th><th>Activity</th><th>Date</th></tr></thead>
                <tbody>
                    <tr><td>Computer Science 101</td><td>Assignment Submitted</td><td>Today</td></tr>
                    <tr><td>Web Development</td><td>New Grade Posted</td><td>Yesterday</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderCourses(container) {
    let cards = DATA.courses.map(course => `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h3 style="color: var(--primary);">${course.name}</h3>
                    <p style="font-size: 13px; color: var(--text-muted);">${course.instructor}</p>
                </div>
                <span class="status-tag ${course.status === 'Completed' ? 'status-completed' : 'status-pending'}">${course.status}</span>
            </div>
            <div style="margin-top: 2rem;">
                <p style="font-size: 12px; text-transform: uppercase; color: var(--text-muted);">Current Grade</p>
                <p style="font-size: 1.5rem; font-weight: bold;">${course.grade}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Current Enrolled Courses</h2>
        <div class="dashboard-grid">${cards}</div>
    `;
}

function renderAssignments(container) {
    let rows = DATA.assignments.map(asgn => `
        <tr>
            <td><strong>${asgn.title}</strong></td>
            <td>${asgn.course}</td>
            <td>${asgn.due}</td>
            <td><span class="status-tag ${asgn.status === 'Completed' ? 'status-completed' : 'status-pending'}">${asgn.status}</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="card">
            <h2>Assignment Tracker</h2>
            <table>
                <thead><tr><th>Task</th><th>Course</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderGrades(container) {
    let rows = DATA.courses.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.grade}</td>
            <td>${c.status}</td>
            <td style="color: var(--primary); cursor: pointer;">View Breakdown</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="card">
            <h2>Semester Grades</h2>
            <table>
                <thead><tr><th>Course Name</th><th>Grade</th><th>Status</th><th>Details</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="margin-top: 2rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                <strong>Est. Cumulative GPA: ${DATA.student.gpa}</strong>
            </div>
        </div>
    `;
}

function renderAnnouncements(container) {
    let feed = DATA.announcements.map(item => `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: flex; gap: 15px;">
                <div style="background: var(--primary); padding: 10px; border-radius: 10px; height: fit-content; min-width: 60px; text-align: center;">
                    <span style="font-size: 12px; display: block;">${item.date.split(' ')[0]}</span>
                    <span style="font-weight: bold;">${item.date.split(' ')[1]}</span>
                </div>
                <div>
                    <h4>${item.title}</h4>
                    <p style="color: var(--text-muted); margin-top: 5px;">${item.content}</p>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<h2 style="margin-bottom: 1.5rem;">Latest Announcements</h2>${feed}`;
}

// --- UTILS ---

function initClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('real-time-clock').innerText = now.toLocaleTimeString();
    }, 1000);
}
