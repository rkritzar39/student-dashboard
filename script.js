/**
 * LMS MASTER SCRIPT
 * Logic: Data is stored in LocalStorage. If empty, it loads defaults.
 */

// 1. DATA INITIALIZATION
const DEFAULT_DATA = {
    student: { name: "Alex Johnson", gpa: "3.85", progress: 72 },
    courses: [
        { name: "Advanced Web Dev", instructor: "Dr. Byte", status: "In Progress", grade: "A" },
        { name: "Cloud Computing", instructor: "Prof. Nimbus", status: "In Progress", grade: "B+" }
    ],
    assignments: [
        { title: "Final Project Draft", course: "Advanced Web Dev", due: "2025-11-15", status: "Pending" },
        { title: "AWS Quiz", course: "Cloud Computing", due: "2025-11-10", status: "Completed" }
    ],
    announcements: [
        { title: "Winter Break Dates", content: "Campus will be closed from Dec 20 to Jan 5." }
    ]
};

let APP_DATA = JSON.parse(localStorage.getItem('my_lms_data')) || DEFAULT_DATA;
const ADMIN_PASSCODE = "022705"; // CHANGE THIS

// 2. CORE APP ENGINE
document.addEventListener('DOMContentLoaded', () => {
    renderSection('dashboard');
    updateClock();
    updateProfile();
    setupListeners();
    setInterval(updateClock, 1000);
});

function setupListeners() {
    // Navigation
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.onclick = () => {
            document.querySelector('.nav-links li.active').classList.remove('active');
            item.classList.add('active');
            renderSection(item.dataset.section);
            document.getElementById('sidebar').classList.remove('open');
        };
    });

    // Mobile Toggle
    document.getElementById('mobile-toggle').onclick = () => {
        document.getElementById('sidebar').classList.toggle('open');
    };

    // Dark Mode
    document.getElementById('dark-mode-toggle').onchange = (e) => {
        document.body.className = e.target.checked ? 'dark-theme' : 'light-theme';
    };

    // Admin Unlock Logic
    document.getElementById('unlock-admin-btn').onclick = () => {
        const pw = prompt("Enter Admin Passcode:");
        if (pw === ADMIN_PASSCODE) {
            document.getElementById('admin-nav-item').style.display = "flex";
            alert("Admin Access Granted.");
        } else {
            alert("Incorrect Passcode.");
        }
    };
}

// 3. RENDERERS
function renderSection(id) {
    const area = document.getElementById('content-render-area');
    area.innerHTML = ''; // Clear

    if (id === 'dashboard') {
        area.innerHTML = `
            <h1>Dashboard</h1>
            <div class="dashboard-grid">
                <div class="card"><h3>GPA</h3><p style="font-size: 2rem;">${APP_DATA.student.gpa}</p></div>
                <div class="card">
                    <h3>Course Progress</h3>
                    <div style="height:10px; background:#334155; border-radius:5px; margin:10px 0;">
                        <div style="width:${APP_DATA.student.progress}%; height:100%; background:var(--primary); border-radius:5px;"></div>
                    </div>
                    <p>${APP_DATA.student.progress}% Overall</p>
                </div>
            </div>
            <div class="card" style="margin-top:20px;">
                <h3>Active Courses</h3>
                <table>
                    ${APP_DATA.courses.map(c => `<tr><td>${c.name}</td><td>${c.instructor}</td><td>${c.grade}</td></tr>`).join('')}
                </table>
            </div>
        `;
    } 

    else if (id === 'assignments') {
        area.innerHTML = `
            <div class="card">
                <h2>Upcoming Assignments</h2>
                <table>
                    <thead><tr><th>Title</th><th>Course</th><th>Due</th><th>Status</th></tr></thead>
                    <tbody>
                        ${APP_DATA.assignments.map(a => `
                            <tr><td>${a.title}</td><td>${a.course}</td><td>${a.due}</td><td>${a.status}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    else if (id === 'ai-assistant') {
        area.innerHTML = `
            <div class="card">
                <h2>AI Study Buddy</h2>
                <div class="chat-box" id="chat-box">
                    <div class="msg ai">Hello! Ask me about your courses or grades.</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="ai-input" class="admin-input" style="margin:0;" placeholder="Ask something...">
                    <button class="btn-primary" style="width:100px; margin:0;" onclick="handleAI()">Send</button>
                </div>
            </div>
        `;
    }

    else if (id === 'admin') {
        area.innerHTML = `
            <h1>Admin Control Panel</h1>
            <div class="dashboard-grid">
                <div class="card">
                    <h3>Add Course</h3>
                    <input id="new-c-name" class="admin-input" placeholder="Course Name">
                    <input id="new-c-instr" class="admin-input" placeholder="Instructor">
                    <button class="btn-primary" onclick="addCourse()">Save Course</button>
                </div>
                <div class="card">
                    <h3>Update Progress</h3>
                    <input id="new-prog" type="number" class="admin-input" value="${APP_DATA.student.progress}">
                    <button class="btn-primary" onclick="updateProg()">Update %</button>
                </div>
            </div>
            <button class="btn-primary" style="background:#ef4444; margin-top:20px;" onclick="clearAll()">Clear All Data</button>
        `;
    }
}

// 4. FUNCTIONALITY
function handleAI() {
    const input = document.getElementById('ai-input');
    const box = document.getElementById('chat-box');
    if (!input.value) return;

    box.innerHTML += `<div class="msg user">${input.value}</div>`;
    const val = input.value.toLowerCase();
    let reply = "I can't find that in your syllabus. Try asking about your GPA!";

    if (val.includes("gpa")) reply = `Your current GPA is ${APP_DATA.student.gpa}.`;
    if (val.includes("assignment")) reply = `You have ${APP_DATA.assignments.filter(a => a.status === 'Pending').length} assignments left.`;

    setTimeout(() => {
        box.innerHTML += `<div class="msg ai">${reply}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 600);
    input.value = '';
}

function addCourse() {
    const name = document.getElementById('new-c-name').value;
    const instr = document.getElementById('new-c-instr').value;
    if (!name || !instr) return alert("Fill all fields");

    APP_DATA.courses.push({ name, instructor: instr, status: "In Progress", grade: "N/A" });
    save();
    alert("Course Added!");
    renderSection('admin');
}

function updateProg() {
    APP_DATA.student.progress = document.getElementById('new-prog').value;
    save();
    alert("Progress Updated!");
}

function save() {
    localStorage.setItem('my_lms_data', JSON.stringify(APP_DATA));
}

function clearAll() {
    if (confirm("Delete everything?")) {
        localStorage.clear();
        location.reload();
    }
}

function updateClock() {
    document.getElementById('real-time-clock').innerText = new Date().toLocaleTimeString();
}

function updateProfile() {
    document.getElementById('student-profile-header').innerHTML = `
        <span style="font-weight:600;">${APP_DATA.student.name}</span>
        <img src="https://ui-avatars.com/api/?name=${APP_DATA.student.name}&background=6366f1&color=fff" style="width:35px; border-radius:8px; margin-left:10px;">
    `;
}
