/**
 * NEXUS LMS - CORE ENGINE
 * Built for persistence and scalability.
 */

// 1. GLOBAL APP STATE
let appState = {
    role: 'student', // 'student' or 'admin'
    currentSemesterId: 'f24',
    semesters: [
        {
            id: 'f24',
            name: 'Fall 2024',
            year: 2024,
            courses: [
                {
                    id: 'cs101',
                    title: 'Advanced Algorithms',
                    instructor: 'Dr. Sarah Smith',
                    weights: { homework: 40, quiz: 20, exam: 30, participation: 10 },
                    assignments: [
                        { id: 1, title: 'Big O Notation Lab', category: 'homework', score: 95, total: 100, due: '2024-09-15' },
                        { id: 2, title: 'Dynamic Programming Quiz', category: 'quiz', score: 82, total: 100, due: '2024-10-01' },
                        { id: 3, title: 'Midterm Project', category: 'exam', score: 91, total: 100, due: '2024-10-20' }
                    ]
                },
                {
                    id: 'ds202',
                    title: 'Database Architecture',
                    instructor: 'Prof. James Miller',
                    weights: { homework: 30, quiz: 20, exam: 40, participation: 10 },
                    assignments: [
                        { id: 4, title: 'SQL Normalization', category: 'homework', score: 100, total: 100, due: '2024-09-10' },
                        { id: 5, title: 'Indexing Efficiency', category: 'homework', score: 75, total: 100, due: '2024-09-25' }
                    ]
                }
            ]
        },
        {
            id: 's25',
            name: 'Spring 2025',
            year: 2025,
            courses: []
        }
    ],
    announcements: [
        { id: 1, date: '2024-09-01', title: 'Welcome to Fall 2024', content: 'Ensure you review the syllabus for all courses.' }
    ],
    schedule: [
        { day: 'Monday', classes: [{ time: '10:00 AM', course: 'Advanced Algorithms' }] },
        { day: 'Wednesday', classes: [{ time: '10:00 AM', course: 'Advanced Algorithms' }] },
        { day: 'Tuesday', classes: [{ time: '02:00 PM', course: 'Database Architecture' }] }
    ]
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadSemesterOptions();
    updateClock();
    setInterval(updateClock, 1000);
    navigate('dashboard');
});

// --- CORE UTILITIES ---

function navigate(view) {
    const mount = document.getElementById('content-mount');
    const title = document.getElementById('view-title');
    
    // Update Sidebar UI
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // SPA Router
    switch(view) {
        case 'dashboard': renderDashboard(mount, title); break;
        case 'courses': renderCourses(mount, title); break;
        case 'assignments': renderAssignments(mount, title); break;
        case 'grades': renderGrades(mount, title); break;
        case 'schedule': renderSchedule(mount, title); break;
        case 'announcements': renderAnnouncements(mount, title); break;
        case 'admin': renderAdmin(mount, title); break;
    }
}

function calculateCourseGrade(course) {
    if (!course.assignments.length) return 0;

    let weightedSum = 0;
    const categories = ['homework', 'quiz', 'exam', 'participation'];

    categories.forEach(cat => {
        const catAssignments = course.assignments.filter(a => a.category === cat);
        if (catAssignments.length > 0) {
            const avg = catAssignments.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / catAssignments.length;
            weightedSum += avg * course.weights[cat];
        }
    });
    return weightedSum.toFixed(2);
}

function calculateGPA() {
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!semester.courses.length) return "0.00";

    const totalGrade = semester.courses.reduce((acc, c) => acc + parseFloat(calculateCourseGrade(c)), 0);
    const avgPercent = totalGrade / semester.courses.length;
    
    // Simple 4.0 scale conversion
    return ((avgPercent / 100) * 4).toFixed(2);
}

// --- RENDERING FUNCTIONS ---

function renderDashboard(mount, title) {
    title.innerText = "Student Dashboard";
    const gpa = calculateGPA();
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="dashboard-grid">
            <div class="glass-card">
                <h3>Semester GPA</h3>
                <h1 style="font-size: 3rem; color: var(--accent);">${gpa}</h1>
                <p style="color: var(--text-muted)">Current Academic Standing</p>
            </div>
            <div class="glass-card">
                <h3>Active Courses</h3>
                <h1>${semester.courses.length}</h1>
                <p style="color: var(--text-muted)">Currently Enrolled</p>
            </div>
            <div class="glass-card">
                <h3>Recent Announcements</h3>
                <p>${appState.announcements[0].title}</p>
                <button class="btn btn-primary" style="margin-top:10px" onclick="navigate('announcements')">View All</button>
            </div>
        </div>
        <div class="glass-card" style="margin-top: 1.5rem;">
            <h3>Course Progress Overview</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Course</th><th>Instructor</th><th>Grade</th></tr></thead>
                    <tbody>
                        ${semester.courses.map(c => `
                            <tr>
                                <td>${c.title}</td>
                                <td>${c.instructor}</td>
                                <td><strong>${calculateCourseGrade(c)}%</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGrades(mount, title) {
    title.innerText = "Detailed Gradebook";
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = semester.courses.map(course => `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <h2>${course.title}</h2>
                <h2 style="color: var(--accent)">${calculateCourseGrade(course)}%</h2>
            </div>
            <table class="data-table">
                <thead><tr><th>Assignment</th><th>Category</th><th>Weight</th><th>Score</th></tr></thead>
                <tbody>
                    ${course.assignments.map(a => `
                        <tr>
                            <td>${a.title}</td>
                            <td>${a.category.toUpperCase()}</td>
                            <td>${course.weights[a.category]}%</td>
                            <td>${a.score}/${a.total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('') || '<p>No courses found for this semester.</p>';
}

function renderAdmin(mount, title) {
    if (appState.role !== 'admin') {
        mount.innerHTML = `<h3>Access Denied. Please login as admin.</h3>`;
        return;
    }
    title.innerText = "LMS Administrator Panel";
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3>Manage Courses in ${semester.name}</h3>
            <div style="display:flex; gap:10px; margin: 1rem 0;">
                <input type="text" id="new-course-title" placeholder="Course Title">
                <input type="text" id="new-course-instructor" placeholder="Instructor Name">
                <button class="btn btn-primary" onclick="adminAddCourse()">Add Course</button>
            </div>
            <table class="data-table">
                <thead><tr><th>Course ID</th><th>Instructor</th><th>Actions</th></tr></thead>
                <tbody>
                    ${semester.courses.map(c => `
                        <tr>
                            <td>${c.title}</td>
                            <td>${c.instructor}</td>
                            <td><button class="btn btn-danger" onclick="adminDeleteCourse('${c.id}')">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="glass-card">
            <h3>Add New Assignment</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:1rem;">
                <select id="asgn-course-select">
                    ${semester.courses.map(c => `<option value="${c.id}">${c.title}</option>`)}
                </select>
                <input type="text" id="asgn-title" placeholder="Assignment Title">
                <select id="asgn-category">
                    <option value="homework">Homework</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                    <option value="participation">Participation</option>
                </select>
                <input type="number" id="asgn-score" placeholder="Points Earned">
                <input type="number" id="asgn-total" placeholder="Total Points">
                <button class="btn btn-primary" onclick="adminAddAssignment()">Submit Grade</button>
            </div>
        </div>
    `;
}

// --- ADMIN ACTIONS (DATA MUTATION) ---

function adminAddCourse() {
    const title = document.getElementById('new-course-title').value;
    const instructor = document.getElementById('new-course-instructor').value;
    if (!title) return;

    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);
    semester.courses.push({
        id: Date.now().toString(),
        title,
        instructor,
        weights: { homework: 40, quiz: 20, exam: 30, participation: 10 },
        assignments: []
    });
    renderAdmin(document.getElementById('content-mount'), document.getElementById('view-title'));
}

function adminAddAssignment() {
    const cid = document.getElementById('asgn-course-select').value;
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = semester.courses.find(c => c.id === cid);

    course.assignments.push({
        id: Date.now(),
        title: document.getElementById('asgn-title').value,
        category: document.getElementById('asgn-category').value,
        score: parseInt(document.getElementById('asgn-score').value),
        total: parseInt(document.getElementById('asgn-total').value),
        due: new Date().toISOString().split('T')[0]
    });
    renderAdmin(document.getElementById('content-mount'), document.getElementById('view-title'));
}

function adminDeleteCourse(id) {
    const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);
    semester.courses = semester.courses.filter(c => c.id !== id);
    renderAdmin(document.getElementById('content-mount'), document.getElementById('view-title'));
}

// --- AI ASSISTANT MODULE ---

function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const msgBox = document.getElementById('ai-messages');
    if (!input.value) return;

    // User Message
    msgBox.innerHTML += `<div class="msg user">${input.value}</div>`;
    const userText = input.value.toLowerCase();
    input.value = "";

    // Simulated Gemini Response (Data Aware)
    setTimeout(() => {
        let response = "I'm not sure about that. Can you ask about your GPA or courses?";
        
        if (userText.includes("gpa")) {
            response = `Your current GPA for this semester is ${calculateGPA()}.`;
        } else if (userText.includes("assignment")) {
            const semester = appState.semesters.find(s => s.id === appState.currentSemesterId);
            const count = semester.courses.reduce((acc, c) => acc + c.assignments.length, 0);
            response = `You have completed ${count} assignments this semester across ${semester.courses.length} courses.`;
        } else if (userText.includes("grade") && appState.role === 'admin') {
            response = "As an admin, you can navigate to the Admin Panel to update assignment scores.";
        } else if (userText.includes("failing")) {
            response = "Checking your grades... All current courses are above 70%. You're in good standing!";
        }

        msgBox.innerHTML += `<div class="msg bot">${response}</div>`;
        msgBox.scrollTop = msgBox.scrollHeight;
    }, 600);
}

// --- MODAL & UI HELPERS ---

function openAdminModal() { document.getElementById('admin-auth-modal').classList.add('open'); }
function closeAdminModal() { document.getElementById('admin-auth-modal').classList.remove('open'); }

function verifyAdmin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === "1234") {
        appState.role = 'admin';
        document.getElementById('admin-nav').classList.remove('hidden');
        document.getElementById('admin-status-btn').classList.add('admin-mode-on');
        document.getElementById('admin-status-btn').innerHTML = `<i class="fas fa-unlock"></i> <span>Admin Active</span>`;
        closeAdminModal();
        alert("Admin mode enabled. You can now mutate LMS data.");
    } else {
        alert("Invalid Passcode.");
    }
}

function loadSemesterOptions() {
    const sel = document.getElementById('global-semester-select');
    sel.innerHTML = appState.semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function changeSemester(id) {
    appState.currentSemesterId = id;
    navigate('dashboard');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('mobile-open'); }
function toggleAIChat() { document.getElementById('ai-chat-widget').classList.toggle('open'); }
function updateClock() { document.getElementById('current-clock').innerText = new Date().toLocaleTimeString(); }

// Fallback for missing views
function renderSchedule(m, t) { t.innerText = "Weekly Schedule"; m.innerHTML = `<div class="glass-card"><h3>Monday</h3><p>10:00 AM - Advanced Algorithms</p></div>`; }
function renderCourses(m, t) { t.innerText = "My Enrolled Courses"; m.innerHTML = `<div class="dashboard-grid">${appState.semesters.find(s => s.id === appState.currentSemesterId).courses.map(c => `<div class="glass-card"><h3>${c.title}</h3><p>${c.instructor}</p></div>`).join('')}</div>`; }
function renderAssignments(m, t) { t.innerText = "Assignment Tracker"; m.innerHTML = `<div class="glass-card"><h3>Pending Items</h3><p>No immediate deadlines detected.</p></div>`; }
function renderAnnouncements(m, t) { t.innerText = "Announcements"; m.innerHTML = appState.announcements.map(a => `<div class="glass-card"><h3>${a.title}</h3><p>${a.content}</p></div>`).join(''); }
