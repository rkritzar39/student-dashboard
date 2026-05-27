/**
 * LMS CORE ENGINE - PERSISTENT STATE
 */

const STORAGE_KEY = "LMS_ULTIMATE_DATA";
const ADMIN_PASSCODE = "022705";

const INITIAL_DATA = {
    student: {
        name: "Alex Rivard",
        bio: "Senior CS Student | Academic Portal Lead",
        avatar: "https://ui-avatars.com/api/?name=Alex+Rivard&background=6366f1&color=fff",
        pfp_custom: null
    },
    config: {
        gradeScale: { A: 90, B: 80, C: 70, D: 60 },
        weights: [
            { id: "exams", name: "Exams", value: 50 },
            { id: "hw", name: "Homework", value: 30 },
            { id: "projects", name: "Projects", value: 20 }
        ]
    },
    courses: [
        { id: "c1", name: "Network Security", instructor: "Dr. Smith" },
        { id: "c2", name: "Web Development", instructor: "Prof. Miller" }
    ],
    assignments: [
        { id: 1, courseId: "c1", title: "Firewall Lab", type: "hw", score: 95, total: 100 },
        { id: 2, courseId: "c1", title: "Midterm Exam", type: "exams", score: 88, total: 100 }
    ]
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || INITIAL_DATA;
let isAdmin = false;

// --- CORE APP ---

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderUserPill();
    navigate('dashboard');
});

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderUserPill();
}

function navigate(view, params = null) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('view-title');
    
    // UI Active State
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const activeNav = document.querySelector(`[data-view="${view}"]`);
    if (activeNav) activeNav.classList.add('active');

    // View Routing
    switch(view) {
        case 'dashboard': renderDashboard(content); title.innerText = "Student Dashboard"; break;
        case 'courses': renderCourses(content); title.innerText = "My Enrolled Courses"; break;
        case 'course-detail': renderCourseDetail(content, params); title.innerText = "Course Hub"; break;
        case 'assignments': renderAssignments(content); title.innerText = "All Tasks"; break;
        case 'grades': renderGrades(content); title.innerText = "Grades & Standing"; break;
        case 'profile': renderProfile(content); title.innerText = "Student Profile"; break;
        case 'admin': renderAdmin(content); title.innerText = "Management Console"; break;
        case 'ai': renderAI(content); title.innerText = "AI Study Assistant"; break;
    }
    
    if (window.innerWidth < 900) toggleSidebar(false);
}

// --- RENDERERS ---

function renderDashboard(el) {
    const overall = calculateOverallGPA();
    el.innerHTML = `
        <div class="grid">
            <div class="card stat-box">
                <p class="text-dim">Cumulative GPA</p>
                <h1>${overall.gpa}</h1>
                <p style="color:var(--success)"><i class="fas fa-caret-up"></i> Academic Excellence</p>
            </div>
            <div class="card stat-box">
                <p class="text-dim">Total Assignments</p>
                <h1>${state.assignments.length}</h1>
                <p class="text-dim">Across ${state.courses.length} classes</p>
            </div>
        </div>
        <div class="card" style="margin-top:1.5rem">
            <h3>Recent Grades</h3>
            <div class="table-wrapper">
                <table>
                    ${state.assignments.slice(-4).reverse().map(a => `
                        <tr>
                            <td>${a.title}</td>
                            <td class="text-dim">${state.courses.find(c => c.id === a.courseId)?.name}</td>
                            <td style="color:var(--primary); font-weight:bold">${((a.score/a.total)*100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>
    `;
}

function renderCourses(el) {
    el.innerHTML = `<div class="grid">
        ${state.courses.map(c => {
            const data = calculateCourseGrade(c.id);
            return `
                <div class="card" onclick="navigate('course-detail', '${c.id}')" style="cursor:pointer">
                    <div style="display:flex; justify-content:space-between">
                        <h3>${c.name}</h3>
                        <span style="color:var(--primary); font-weight:bold">${data.letter}</span>
                    </div>
                    <p class="text-dim">${c.instructor}</p>
                    <div style="margin-top:1.5rem">
                        <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:10px">
                            <div style="width:${data.percent}%; height:100%; background:var(--primary); border-radius:10px"></div>
                        </div>
                        <p style="font-size:0.8rem; margin-top:5px">${data.percent}% Weighted Average</p>
                    </div>
                </div>
            `;
        }).join('')}
    </div>`;
}

function renderCourseDetail(el, courseId) {
    const course = state.courses.find(c => c.id === courseId);
    const asgns = state.assignments.filter(a => a.courseId === courseId);
    const grade = calculateCourseGrade(courseId);

    el.innerHTML = `
        <button class="btn btn-secondary" onclick="navigate('courses')" style="margin-bottom:1.5rem">← Back to Courses</button>
        <div class="card">
            <h1>${course.name}</h1>
            <p class="text-dim">Instructor: ${course.instructor}</p>
            <div style="font-size:3rem; font-weight:800; margin-top:1rem; color:var(--primary)">${grade.percent}%</div>
            <p>Letter Grade: ${grade.letter}</p>
        </div>
        <div class="card">
            <h3>Assignments for this Class</h3>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Task</th><th>Category</th><th>Score</th></tr></thead>
                    <tbody>
                        ${asgns.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td class="text-dim">${a.type.toUpperCase()}</td>
                                <td>${a.score}/${a.total}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderProfile(el) {
    el.innerHTML = `
        <div class="card">
            <h2>Edit Student Profile</h2>
            <div class="form-group" style="margin-top:1.5rem">
                <label>Change Profile Picture</label>
                <input type="file" accept="image/*" onchange="uploadAvatar(event)">
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="p-name" value="${state.student.name}">
            </div>
            <div class="form-group">
                <label>Bio</label>
                <textarea id="p-bio" rows="4">${state.student.bio}</textarea>
            </div>
            <button class="btn btn-primary" onclick="updateProfile()">Save Profile</button>
        </div>
    `;
}

function renderAdmin(el) {
    el.innerHTML = `
        <div class="card">
            <h3>1. Create New Class</h3>
            <div class="grid" style="grid-template-columns: 1fr 1fr auto; align-items:end; gap:10px">
                <div><label>Class Name</label><input id="adm-c-name"></div>
                <div><label>Instructor</label><input id="adm-c-instr"></div>
                <button class="btn btn-primary" onclick="adminAddCourse()">Add</button>
            </div>
        </div>
        <div class="card">
            <h3>2. Post Grade (Assignment)</h3>
            <div class="form-group">
                <label>Select Course</label>
                <select id="adm-a-cid">${state.courses.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            </div>
            <div class="form-group">
                <label>Assignment Title</label>
                <input id="adm-a-title">
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap:10px">
                <div><label>Category</label><select id="adm-a-type">${state.config.weights.map(w => `<option value="${w.id}">${w.name}</option>`)}</select></div>
                <div><label>Score</label><input type="number" id="adm-a-score"></div>
                <div><label>Total</label><input type="number" id="adm-a-total"></div>
            </div>
            <button class="btn btn-primary" style="margin-top:15px" onclick="adminAddAsgn()">Post Grade</button>
        </div>
        <div class="card">
            <h3>3. Grade Scale & Weights</h3>
            <p class="text-dim">Current: Exams=${state.config.weights.find(w=>w.id==='exams').value}% | HW=${state.config.weights.find(w=>w.id==='hw').value}%</p>
            <button class="btn btn-danger" onclick="resetAll()">Reset All Data</button>
        </div>
    `;
}

function renderAI(el) {
    el.innerHTML = `
        <div class="card chat-container">
            <h3>AI Tutor</h3>
            <div class="chat-window" id="chat-win">
                <div class="msg ai">Hi ${state.student.name.split(' ')[0]}! I see you have ${state.assignments.length} grades posted. How can I help you study?</div>
            </div>
            <div style="display:flex; gap:10px">
                <input id="ai-msg" placeholder="Ask about your grades...">
                <button class="btn btn-primary" onclick="sendAI()">Ask</button>
            </div>
        </div>
    `;
}

// --- LOGIC ---

function calculateCourseGrade(courseId) {
    const asgns = state.assignments.filter(a => a.courseId === courseId);
    if (!asgns.length) return { percent: 0, letter: 'N/A' };

    let weightedSum = 0;
    let totalWeights = 0;

    state.config.weights.forEach(cat => {
        const catAsgns = asgns.filter(a => a.type === cat.id);
        if (catAsgns.length) {
            const avg = catAsgns.reduce((s, a) => s + (a.score / a.total), 0) / catAsgns.length;
            weightedSum += avg * cat.value;
            totalWeights += cat.value;
        }
    });

    const final = totalWeights > 0 ? (weightedSum / totalWeights) * 100 : 0;
    let letter = 'F';
    if (final >= state.config.gradeScale.A) letter = 'A';
    else if (final >= state.config.gradeScale.B) letter = 'B';
    else if (final >= state.config.gradeScale.C) letter = 'C';

    return { percent: final.toFixed(1), letter };
}

function calculateOverallGPA() {
    if (!state.courses.length) return { gpa: "0.00" };
    let points = 0;
    state.courses.forEach(c => {
        const g = calculateCourseGrade(c.id);
        if (g.letter === 'A') points += 4.0;
        else if (g.letter === 'B') points += 3.0;
        else if (g.letter === 'C') points += 2.0;
    });
    return { gpa: (points / state.courses.length).toFixed(2) };
}

function uploadAvatar(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        state.student.pfp_custom = reader.result;
        save();
        alert("PFP Updated!");
    };
    if (file) reader.readAsDataURL(file);
}

function updateProfile() {
    state.student.name = document.getElementById('p-name').value;
    state.student.bio = document.getElementById('p-bio').value;
    save();
    navigate('dashboard');
}

function adminAddCourse() {
    const name = document.getElementById('adm-c-name').value;
    const instr = document.getElementById('adm-c-instr').value;
    if (!name) return;
    state.courses.push({ id: 'c' + Date.now(), name, instructor: instr });
    save();
    navigate('admin');
}

function adminAddAsgn() {
    const title = document.getElementById('adm-a-title').value;
    const cid = document.getElementById('adm-a-cid').value;
    const type = document.getElementById('adm-a-type').value;
    const score = parseFloat(document.getElementById('adm-a-score').value);
    const total = parseFloat(document.getElementById('adm-a-total').value);

    state.assignments.push({ id: Date.now(), courseId: cid, title, type, score, total });
    save();
    alert("Grade Posted!");
    navigate('admin');
}

function sendAI() {
    const input = document.getElementById('ai-msg');
    const win = document.getElementById('chat-win');
    if (!input.value) return;

    win.innerHTML += `<div class="msg user">${input.value}</div>`;
    const q = input.value.toLowerCase();
    let res = "I'm not sure. Try asking about your GPA.";

    if (q.includes("gpa")) res = `Your current GPA is ${calculateOverallGPA().gpa}.`;
    if (q.includes("hi") || q.includes("hello")) res = `Hello ${state.student.name}! How are your ${state.courses.length} classes going?`;

    setTimeout(() => {
        win.innerHTML += `<div class="msg ai">${res}</div>`;
        win.scrollTop = win.scrollHeight;
    }, 500);
    input.value = "";
}

function attemptAdminLogin() {
    if (document.getElementById('admin-pass-input').value === ADMIN_PASSCODE) {
        isAdmin = true;
        document.getElementById('admin-nav').style.display = 'flex';
        document.getElementById('lock-btn').innerHTML = '<i class="fas fa-unlock"></i> <span>Admin Active</span>';
        closeAdminModal();
        navigate('admin');
    } else {
        alert("Access Denied");
    }
}

function renderUserPill() {
    const p = state.student;
    document.getElementById('pfp-pill').innerHTML = `
        <span>${p.name.split(' ')[0]}</span>
        <img src="${p.pfp_custom || p.avatar}">
    `;
}

function openAdminModal() { document.getElementById('admin-modal').classList.add('open'); }
function closeAdminModal() { document.getElementById('admin-modal').classList.remove('open'); }
function toggleSidebar(val) { document.getElementById('sidebar').classList.toggle('open', val); }
function updateClock() { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }
function resetAll() { if(confirm("Reset everything?")) { localStorage.clear(); location.reload(); } }
