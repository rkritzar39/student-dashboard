/**
 * NEXUS LMS V4 - CORE JAVASCRIPT
 */

// 1. DATA PERSISTENCE & INITIAL STATE
const STORAGE_KEY = "NEXUS_LMS_PRO_STATE";

const DEFAULT_STATE = {
    role: 'student',
    currentSemesterId: 'f24',
    semesters: [
        {
            id: 'f24',
            name: 'Fall 2024',
            courses: [
                {
                    id: 'cs101',
                    title: 'Advanced Web Architecture',
                    instructor: 'Dr. Evelyn Carter',
                    weights: { homework: 40, quiz: 20, exam: 40 },
                    assignments: [
                        { id: 1, title: 'Modular JS Lab', category: 'homework', score: 95, total: 100 },
                        { id: 2, title: 'Unit 1 Architecture Quiz', category: 'quiz', score: 82, total: 100 }
                    ]
                },
                {
                    id: 'ma202',
                    title: 'Discrete Mathematics',
                    instructor: 'Prof. Alan Turing',
                    weights: { homework: 30, quiz: 30, exam: 40 },
                    assignments: [
                        { id: 3, title: 'Set Theory Problems', category: 'homework', score: 100, total: 100 }
                    ]
                }
            ]
        },
        { id: 's25', name: 'Spring 2025', courses: [] }
    ],
    announcements: [
        { id: 1, title: 'Fall Registration Open', date: 'Oct 24, 2024', content: 'Ensure you meet with your advisor before the 30th.' }
    ],
    schedule: [
        { day: 'Monday', classes: [{ time: '10:00 AM', course: 'Advanced Web Architecture' }] },
        { day: 'Tuesday', classes: [{ time: '02:00 PM', course: 'Discrete Mathematics' }] }
    ]
};

let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_STATE;

// 2. CORE UTILITIES
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function calculateCourseGrade(course) {
    if (!course.assignments.length) return 0;
    let weightedSum = 0;
    let weightTotalUsed = 0;

    const cats = Object.keys(course.weights);
    cats.forEach(cat => {
        const catAsgns = course.assignments.filter(a => a.category === cat);
        if (catAsgns.length > 0) {
            const avg = catAsgns.reduce((sum, a) => sum + (a.score / a.total), 0) / catAsgns.length;
            weightedSum += avg * course.weights[cat];
            weightTotalUsed += course.weights[cat];
        }
    });

    const final = weightTotalUsed > 0 ? (weightedSum / weightTotalUsed) * 100 : 0;
    return final.toFixed(1);
}

function calculateSemesterGPA() {
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!sem || !sem.courses.length) return "0.00";
    const totalGrades = sem.courses.reduce((sum, c) => sum + parseFloat(calculateCourseGrade(c)), 0);
    const avg = totalGrades / sem.courses.length;
    return ((avg / 100) * 4).toFixed(2);
}

// 3. NAVIGATION & ROUTING
function navigate(view) {
    const mount = document.getElementById('mount');
    const indicator = document.getElementById('view-indicator');
    
    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    indicator.innerText = view.charAt(0).toUpperCase() + view.slice(1);

    switch(view) {
        case 'dashboard': renderDashboard(mount); break;
        case 'courses': renderCourses(mount); break;
        case 'assignments': renderAssignments(mount); break;
        case 'grades': renderGrades(mount); break;
        case 'schedule': renderSchedule(mount); break;
        case 'admin': renderAdmin(mount); break;
    }
}

// 4. RENDERING VIEWS
function renderDashboard(mount) {
    const gpa = calculateSemesterGPA();
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="stats-grid">
            <div class="glass-card">
                <p class="text-muted">Academic GPA</p>
                <div class="stat-val">${gpa}</div>
                <div style="color:var(--success); font-size: 0.8rem;"><i class="fas fa-arrow-up"></i> In Good Standing</div>
            </div>
            <div class="glass-card">
                <p class="text-muted">Courses Enrolled</p>
                <div class="stat-val">${sem.courses.length}</div>
                <p class="text-dim">Total Credits: ${sem.courses.length * 3}</p>
            </div>
            <div class="glass-card">
                <p class="text-muted">Pending Tasks</p>
                <div class="stat-val">0</div>
                <p class="text-dim">All caught up!</p>
            </div>
        </div>
        <div class="glass-card">
            <h3>Recent Grade Activity</h3>
            <div class="table-container">
                <table>
                    <thead><tr><th>Course</th><th>Instructor</th><th>Grade</th></tr></thead>
                    <tbody>
                        ${sem.courses.map(c => `
                            <tr>
                                <td><strong>${c.title}</strong></td>
                                <td>${c.instructor}</td>
                                <td style="color:var(--accent); font-weight:bold">${calculateCourseGrade(c)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGrades(mount) {
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    mount.innerHTML = sem.courses.map(course => `
        <div class="glass-card" style="margin-bottom:1.5rem">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                <h2>${course.title}</h2>
                <span class="btn btn-secondary">${calculateCourseGrade(course)}%</span>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Assignment</th><th>Category</th><th>Score</th><th>Impact</th></tr></thead>
                    <tbody>
                        ${course.assignments.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td>${a.category.toUpperCase()}</td>
                                <td>${a.score} / ${a.total}</td>
                                <td>${course.weights[a.category]}% weight</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('') || `<h3>No grades available for this semester.</h3>`;
}

function renderAdmin(mount) {
    if (appState.role !== 'admin') return mount.innerHTML = `<h3>Admin Authentication Required</h3>`;
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="glass-card" style="margin-bottom:2rem">
            <h3>Add New Course to ${sem.name}</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:10px; margin-top:1rem">
                <input id="new-c-title" placeholder="Course Name">
                <input id="new-c-instr" placeholder="Instructor Name">
                <button class="btn btn-primary" onclick="adminAddCourse()">Add</button>
            </div>
        </div>
        <div class="glass-card">
            <h3>Post Final Assignment Score</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:1rem">
                <select id="asgn-course-sel">${sem.courses.map(c => `<option value="${c.id}">${c.title}</option>`)}</select>
                <input id="asgn-name" placeholder="Assignment Name">
                <select id="asgn-cat">
                    <option value="homework">Homework</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                </select>
                <div style="display:flex; gap:10px">
                    <input type="number" id="asgn-score" placeholder="Earned">
                    <input type="number" id="asgn-total" placeholder="Total">
                </div>
            </div>
            <button class="btn btn-primary" style="margin-top:1.5rem" onclick="adminAddAssignment()">Post Score</button>
        </div>
    `;
}

// 5. DATA MUTATIONS (ADMIN ONLY)
function adminAddCourse() {
    const title = document.getElementById('new-c-title').value;
    const instructor = document.getElementById('new-c-instr').value;
    if (!title) return alert("Course name required");

    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    sem.courses.push({
        id: Date.now().toString(),
        title,
        instructor,
        weights: { homework: 40, quiz: 20, exam: 40 },
        assignments: []
    });
    saveState();
    renderAdmin(document.getElementById('mount'));
}

function adminAddAssignment() {
    const cid = document.getElementById('asgn-course-sel').value;
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = sem.courses.find(c => c.id === cid);

    course.assignments.push({
        id: Date.now(),
        title: document.getElementById('asgn-name').value,
        category: document.getElementById('asgn-cat').value,
        score: parseFloat(document.getElementById('asgn-score').value),
        total: parseFloat(document.getElementById('asgn-total').value)
    });
    saveState();
    alert("Grade successfully posted.");
    renderAdmin(document.getElementById('mount'));
}

// 6. AI INTERFACE
function askAI() {
    const input = document.getElementById('ai-query');
    const area = document.getElementById('chat-area');
    if (!input.value) return;

    area.innerHTML += `<div class="user-msg">${input.value}</div>`;
    const query = input.value.toLowerCase();
    input.value = "";

    setTimeout(() => {
        let reply = "I can't access that specific module yet. Try asking about your GPA!";
        if (query.includes('gpa')) reply = `Your current GPA for the ${appState.currentSemesterId} semester is ${calculateSemesterGPA()}. You are doing excellent!`;
        if (query.includes('grade')) reply = "You currently have A's and B's in all courses. Check the Grades tab for category breakdowns.";
        
        area.innerHTML += `<div class="ai-msg">${reply}</div>`;
        area.scrollTop = area.scrollHeight;
    }, 600);
}

// 7. UI HELPERS
function verifyAdmin() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === "1234") {
        appState.role = 'admin';
        document.getElementById('admin-nav').classList.remove('hidden');
        document.getElementById('admin-trigger').classList.add('admin-unlocked');
        document.getElementById('admin-trigger').innerHTML = `<i class="fas fa-unlock"></i> <span>Admin Active</span>`;
        closeAdminModal();
        navigate('admin');
    } else {
        alert("Invalid Access Code");
    }
}

function switchSemester(id) {
    appState.currentSemesterId = id;
    navigate('dashboard');
}

function initSelectors() {
    const sel = document.getElementById('semester-selector');
    sel.innerHTML = appState.semesters.map(s => `<option value="${s.id}" ${s.id === appState.currentSemesterId ? 'selected' : ''}>${s.name}</option>`).join('');
}

function openAdminModal() { document.getElementById('admin-modal').classList.add('open'); }
function closeAdminModal() { document.getElementById('admin-modal').classList.remove('open'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('mobile-open'); }
function toggleAI() { 
    document.getElementById('ai-hub').classList.toggle('open');
    document.getElementById('ai-icon').classList.toggle('fa-chevron-up');
    document.getElementById('ai-icon').classList.toggle('fa-chevron-down');
}
function updateClock() { document.getElementById('time-display').innerText = new Date().toLocaleTimeString(); }

// Simple Render for missing views
function renderSchedule(m) { 
    m.innerHTML = `<div class="glass-card"><h3>Active Weekly Timetable</h3><div class="table-container"><table>${appState.schedule.map(d => `<tr><td>${d.day}</td><td>${d.classes.map(c => `${c.time} - ${c.course}`).join('<br>')}</td></tr>`).join('')}</table></div></div>`; 
}
function renderCourses(m) { 
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    m.innerHTML = `<div class="stats-grid">${sem.courses.map(c => `<div class="glass-card"><h3>${c.title}</h3><p class="text-dim">${c.instructor}</p></div>`).join('')}</div>`; 
}
function renderAssignments(m) { m.innerHTML = `<div class="glass-card"><h3>Upcoming Tasks</h3><p class="text-dim">No upcoming deadlines detected in system.</p></div>`; }

// First Init
initSelectors();
navigate('dashboard');
