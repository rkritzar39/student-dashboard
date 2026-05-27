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
    if (!course.assignments || !course.assignments.length) return "0.0";
    
    let weightedSum = 0;
    let weightTotalUsed = 0;

    const cats = Object.keys(course.weights);
    cats.forEach(cat => {
        const catAsgns = course.assignments.filter(a => a.category === cat);
        if (catAsgns.length > 0) {
            // Calculate percentage for this category
            const avg = catAsgns.reduce((sum, a) => sum + (a.score / a.total), 0) / catAsgns.length;
            weightedSum += (avg * 100) * (course.weights[cat] / 100);
            weightTotalUsed += course.weights[cat];
        }
    });

    // Scale out of 100% based on categories actually completed
    const final = weightTotalUsed > 0 ? (weightedSum / (weightTotalUsed / 100)) : 0;
    return final.toFixed(1);
}

function calculateSemesterGPA() {
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!sem || !sem.courses || !sem.courses.length) return "0.00";
    
    let totalPoints = 0;
    
    sem.courses.forEach(c => {
        const grade = parseFloat(calculateCourseGrade(c));
        // Standard College 4.0 Scale
        if (grade >= 90) totalPoints += 4.0;
        else if (grade >= 80) totalPoints += 3.0;
        else if (grade >= 70) totalPoints += 2.0;
        else if (grade >= 60) totalPoints += 1.0;
    });

    return (totalPoints / sem.courses.length).toFixed(2);
}

// 3. NAVIGATION & ROUTING
function navigate(view) {
    const mount = document.getElementById('mount');
    const indicator = document.getElementById('view-indicator');
    
    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const targetNav = document.querySelector(`[data-view="${view}"]`);
    if (targetNav) targetNav.classList.add('active');
    
    indicator.innerText = view.charAt(0).toUpperCase() + view.slice(1);

    // Close mobile sidebar if open
    document.getElementById('sidebar').classList.remove('mobile-open');

    switch(view) {
        case 'dashboard': renderDashboard(mount); break;
        case 'courses': renderCourses(mount); break;
        case 'assignments': renderAssignments(mount); break;
        case 'grades': renderGrades(mount); break;
        case 'schedule': renderSchedule(mount); break;
        case 'admin': renderAdmin(mount); break;
        default: renderDashboard(mount);
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
                <div style="color:var(--success); font-size: 0.8rem; font-weight: 600;">
                    <i class="fas fa-arrow-up"></i> In Good Standing
                </div>
            </div>
            <div class="glass-card">
                <p class="text-muted">Courses Enrolled</p>
                <div class="stat-val">${sem.courses.length}</div>
                <p style="color:var(--text-muted); font-size: 0.85rem;">Total Credits: ${sem.courses.length * 3}</p>
            </div>
            <div class="glass-card">
                <p class="text-muted">Pending Tasks</p>
                <div class="stat-val">0</div>
                <p style="color:var(--text-muted); font-size: 0.85rem;">All caught up!</p>
            </div>
        </div>
        <div class="glass-card">
            <h3 style="margin-bottom: 1rem;">Recent Grade Activity</h3>
            <div class="table-container">
                <table>
                    <thead><tr><th>Course</th><th>Instructor</th><th>Grade</th></tr></thead>
                    <tbody>
                        ${sem.courses.length ? sem.courses.map(c => `
                            <tr>
                                <td><strong>${c.title}</strong></td>
                                <td>${c.instructor}</td>
                                <td style="color:var(--accent); font-weight:bold">${calculateCourseGrade(c)}%</td>
                            </tr>
                        `).join('') : `<tr><td colspan="3">No courses registered.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGrades(mount) {
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    
    if (!sem.courses.length) {
        mount.innerHTML = `<div class="glass-card"><h3>No grades available for this semester.</h3></div>`;
        return;
    }

    mount.innerHTML = sem.courses.map(course => `
        <div class="glass-card" style="margin-bottom:1.5rem">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                <h2 style="font-size: 1.2rem;">${course.title}</h2>
                <span class="btn btn-secondary">${calculateCourseGrade(course)}%</span>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Assignment</th><th>Category</th><th>Score</th><th>Impact</th></tr></thead>
                    <tbody>
                        ${course.assignments.length ? course.assignments.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td><span style="background: var(--surface-hover); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${a.category.toUpperCase()}</span></td>
                                <td><strong>${a.score}</strong> / ${a.total}</td>
                                <td style="color:var(--text-muted)">${course.weights[a.category]}% weight</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4">No assignments graded yet.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');
}

function renderAdmin(mount) {
    if (appState.role !== 'admin') return mount.innerHTML = `<h3>Admin Authentication Required</h3>`;
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="glass-card" style="margin-bottom:2rem">
            <h3 style="margin-bottom: 1rem;">Add New Course to ${sem.name}</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                <input id="new-c-title" placeholder="Course Name" aria-label="Course Name">
                <input id="new-c-instr" placeholder="Instructor Name" aria-label="Instructor Name">
                <button class="btn btn-primary" onclick="adminAddCourse()">Add Course</button>
            </div>
        </div>
        <div class="glass-card">
            <h3 style="margin-bottom: 1rem;">Post Final Assignment Score</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                <select id="asgn-course-sel" aria-label="Select Course">
                    ${sem.courses.length ? sem.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('') : `<option disabled>No courses available</option>`}
                </select>
                <input id="asgn-name" placeholder="Assignment Name" aria-label="Assignment Name">
                <select id="asgn-cat" aria-label="Assignment Category">
                    <option value="homework">Homework</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                </select>
                <div style="display:flex; gap:10px">
                    <input type="number" id="asgn-score" placeholder="Earned" aria-label="Points Earned" style="width: 50%;">
                    <input type="number" id="asgn-total" placeholder="Total" aria-label="Total Points" style="width: 50%;">
                </div>
            </div>
            <button class="btn btn-primary" style="margin-top:1.5rem; width: 100%;" onclick="adminAddAssignment()">Post Score</button>
        </div>
    `;
}

// 5. DATA MUTATIONS (ADMIN ONLY)
function adminAddCourse() {
    const title = document.getElementById('new-c-title').value.trim();
    const instructor = document.getElementById('new-c-instr').value.trim();
    if (!title || !instructor) return alert("Both course name and instructor are required.");

    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    sem.courses.push({
        id: 'c' + Date.now().toString(),
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
    if (!cid) return alert("No course selected.");

    const title = document.getElementById('asgn-name').value.trim();
    const score = parseFloat(document.getElementById('asgn-score').value);
    const total = parseFloat(document.getElementById('asgn-total').value);

    if (!title || isNaN(score) || isNaN(total) || total === 0) {
        return alert("Please enter a valid assignment name, earned score, and total score.");
    }

    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = sem.courses.find(c => c.id === cid);

    course.assignments.push({
        id: Date.now(),
        title: title,
        category: document.getElementById('asgn-cat').value,
        score: score,
        total: total
    });
    
    saveState();
    alert("Grade successfully posted.");
    renderAdmin(document.getElementById('mount'));
}

// 6. AI INTERFACE
function askAI() {
    const input = document.getElementById('ai-query');
    const area = document.getElementById('chat-area');
    const query = input.value.trim().toLowerCase();
    
    if (!query) return;

    // Post User Message
    area.innerHTML += `<div class="user-msg">${input.value}</div>`;
    input.value = "";
    area.scrollTop = area.scrollHeight;

    // Simulate Network/Processing Delay
    setTimeout(() => {
        let reply = "I'm still learning about that specific module. Try asking me to check your **GPA** or **grades**!";
        
        if (query.includes('gpa')) {
            reply = `Your current Academic GPA for the ${appState.currentSemesterId.toUpperCase()} semester is **${calculateSemesterGPA()}**.`;
        } else if (query.includes('grade') || query.includes('class')) {
            reply = "You are currently passing all registered courses. Check the Grades tab for a detailed breakdown of your homework and exams.";
        } else if (query.includes('hello') || query.includes('hi')) {
            reply = "Hello! I am Nexus AI. How can I assist with your coursework today?";
        }
        
        area.innerHTML += `<div class="ai-msg">${reply}</div>`;
        area.scrollTop = area.scrollHeight;
    }, 800);
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
        saveState();
    } else {
        alert("Invalid Access Code");
    }
}

function switchSemester(id) {
    appState.currentSemesterId = id;
    saveState();
    navigate('dashboard');
}

function initSelectors() {
    const sel = document.getElementById('semester-selector');
    sel.innerHTML = appState.semesters.map(s => 
        `<option value="${s.id}" ${s.id === appState.currentSemesterId ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    // Check if previously logged in as admin
    if (appState.role === 'admin') {
        document.getElementById('admin-nav').classList.remove('hidden');
        document.getElementById('admin-trigger').classList.add('admin-unlocked');
        document.getElementById('admin-trigger').innerHTML = `<i class="fas fa-unlock"></i> <span>Admin Active</span>`;
    }
}

// Modals and Toggles
function openAdminModal() { 
    document.getElementById('admin-modal').classList.add('open'); 
}
function closeAdminModal() { 
    document.getElementById('admin-modal').classList.remove('open'); 
    document.getElementById('admin-pass').value = '';
}
function toggleSidebar() { 
    document.getElementById('sidebar').classList.toggle('mobile-open'); 
}
function toggleAI() { 
    const hub = document.getElementById('ai-hub');
    const icon = document.getElementById('ai-icon');
    const header = hub.querySelector('.ai-header');
    
    const isOpen = hub.classList.toggle('open');
    header.setAttribute('aria-expanded', isOpen);
    
    if (isOpen) {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        setTimeout(() => document.getElementById('ai-query').focus(), 300);
    } else {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
}

// Clock Logic
function updateClock() {
    const now = new Date();
    document.getElementById('time-display').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Simple Render for secondary views
function renderSchedule(m) { 
    m.innerHTML = `<div class="glass-card"><h3 style="margin-bottom: 1rem;">Active Weekly Timetable</h3><div class="table-container"><table>
        <thead><tr><th>Day</th><th>Classes</th></tr></thead>
        <tbody>
        ${appState.schedule.map(d => `<tr>
            <td style="font-weight: 600;">${d.day}</td>
            <td>${d.classes.map(c => `<div><span style="color:var(--accent); font-size: 0.85rem; margin-right: 10px;">${c.time}</span> ${c.course}</div>`).join('')}</td>
        </tr>`).join('')}
        </tbody>
    </table></div></div>`; 
}
function renderCourses(m) { 
    const sem = appState.semesters.find(s => s.id === appState.currentSemesterId);
    m.innerHTML = `<div class="stats-grid">
        ${sem.courses.length ? sem.courses.map(c => `
        <div class="glass-card">
            <h3 style="margin-bottom: 5px;">${c.title}</h3>
            <p style="color:var(--text-muted); font-size: 0.9rem;"><i class="fas fa-user-tie"></i> ${c.instructor}</p>
        </div>`).join('') : '<div class="glass-card"><p>No courses registered.</p></div>'}
    </div>`; 
}
function renderAssignments(m) { 
    m.innerHTML = `<div class="glass-card"><h3 style="margin-bottom: 1rem;">Upcoming Tasks</h3><p style="color:var(--text-muted)">No upcoming deadlines detected in system.</p></div>`; 
}

// Initialization Sequence
document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateClock, 1000);
    updateClock();
    initSelectors();
    navigate('dashboard');
});
