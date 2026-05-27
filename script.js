/**
 * CANVAS REPLICA ENGINE - ADVANCED ADMIN
 */

const STORAGE_KEY = "CANVAS_REPLICA_DATA";
const ADMIN_PASS = "022705";

const INITIAL_DATA = {
    student: {
        name: "Caleb Kritzar",
        bio: "Full Stack Student | Canvas Enthusiast",
        avatar: "https://ui-avatars.com/api/?name=Alex+Rivard&background=6366f1&color=fff",
        custom_pfp: null
    },
    config: {
        gradeScale: { A: 90, B: 80, C: 70, D: 60 },
        categories: [
            { id: "hw", name: "Homework", weight: 30 },
            { id: "exams", name: "Exams", weight: 50 },
            { id: "projects", name: "Projects", weight: 20 }
        ]
    },
    courses: [
        { id: "c1", name: "Mobile Development", instructor: "Dr. Jobs" },
        { id: "c2", name: "Algorithm Design", instructor: "Prof. Knuth" }
    ],
    assignments: [
        { id: 101, courseId: "c1", title: "First iOS App", type: "projects", score: 95, total: 100 },
        { id: 102, courseId: "c2", title: "Sorting Lab", type: "hw", score: 82, total: 100 }
    ]
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || INITIAL_DATA;
let editingAssignmentId = null; // Tracks if we are editing or creating

// --- CORE ---
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    renderHeader();
    navigate('dashboard');
});

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderHeader();
}

function navigate(view, params = null) {
    const el = document.getElementById('content-area');
    const title = document.getElementById('view-title');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const nav = document.querySelector(`[data-view="${view}"]`);
    if(nav) nav.classList.add('active');

    switch(view) {
        case 'dashboard': renderDashboard(el); title.innerText = "Global Dashboard"; break;
        case 'courses': renderCourses(el); title.innerText = "All Courses"; break;
        case 'course-view': renderCourseDetail(el, params); title.innerText = "Course Syllabus"; break;
        case 'assignments': renderAssignments(el); title.innerText = "Assignment List"; break;
        case 'grades': renderGrades(el); title.innerText = "Final Grades"; break;
        case 'profile': renderProfile(el); title.innerText = "User Profile"; break;
        case 'admin': renderAdmin(el); title.innerText = "Canvas Admin Console"; break;
    }
    if (window.innerWidth < 900) toggleSidebar(false);
}

// --- VIEWS ---

function renderDashboard(el) {
    const stats = calculateGPA();
    el.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">
            <div class="card">
                <p class="text-dim">Cumulative GPA</p>
                <h1 style="font-size:3rem">${stats}</h1>
            </div>
            <div class="card">
                <p class="text-dim">Enrolled Courses</p>
                <h1 style="font-size:3rem">${state.courses.length}</h1>
            </div>
        </div>
        <div class="card" style="margin-top:1.5rem">
            <h3>Quick Actions</h3>
            <div style="display:flex; gap:10px; margin-top:1rem">
                <button class="btn btn-primary" onclick="navigate('assignments')">View All Tasks</button>
                <button class="btn btn-secondary" onclick="navigate('courses')">Course Dashboard</button>
            </div>
        </div>
    `;
}

function renderCourses(el) {
    el.innerHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem">
        ${state.courses.map(c => {
            const g = calculateCourseGrade(c.id);
            return `
                <div class="card" onclick="navigate('course-view', '${c.id}')" style="cursor:pointer">
                    <div style="display:flex; justify-content:space-between; align-items:start">
                        <h3>${c.name}</h3>
                        <span style="color:var(--primary); font-weight:bold">${g.letter}</span>
                    </div>
                    <p class="text-dim">${c.instructor}</p>
                </div>
            `;
        }).join('')}
    </div>`;
}

function renderCourseDetail(el, cid) {
    const c = state.courses.find(x => x.id === cid);
    const asgns = state.assignments.filter(a => a.courseId === cid);
    const g = calculateCourseGrade(cid);

    el.innerHTML = `
        <button class="btn btn-secondary" onclick="navigate('courses')" style="margin-bottom:1.5rem">← Back</button>
        <div class="card">
            <h1>${c.name}</h1>
            <p>${c.instructor}</p>
            <h2 style="color:var(--primary); margin-top:1rem">${g.percent}% (${g.letter})</h2>
        </div>
        <div class="card">
            <h3>Syllabus / Assignments</h3>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Name</th><th>Category</th><th>Grade</th></tr></thead>
                    <tbody>
                        ${asgns.map(a => `<tr><td>${a.title}</td><td>${a.type}</td><td>${a.score}/${a.total}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderProfile(el) {
    el.innerHTML = `
        <div class="card" style="text-align:center">
            <img src="${state.student.custom_pfp || state.student.avatar}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid var(--primary)">
            <input type="file" id="pfp-input" style="display:none" onchange="processPfp(event)">
            <div style="margin-top:1rem">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pfp-input').click()">Upload Photo</button>
            </div>
        </div>
        <div class="card">
            <h3>Personal Info</h3>
            <label>Full Name</label>
            <input id="prof-name" value="${state.student.name}">
            <label>Bio</label>
            <textarea id="prof-bio" rows="3">${state.student.bio}</textarea>
            <button class="btn btn-primary" style="margin-top:1rem" onclick="updateProfile()">Update Profile</button>
        </div>
    `;
}

// --- ADMIN PORTAL (THE HUB) ---

function renderAdmin(el) {
    el.innerHTML = `
        <div class="card" id="asgn-editor-card">
            <h3 id="editor-title">Post New Assignment/Grade</h3>
            <div class="form-group">
                <label>Course</label>
                <select id="adm-a-cid">${state.courses.map(c => `<option value="${c.id}">${c.name}</option>`)}</select>
            </div>
            <div class="form-group">
                <label>Assignment Name</label>
                <input id="adm-a-title" placeholder="e.g. Chapter 1 Quiz">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px">
                <div><label>Type</label><select id="adm-a-type">${state.config.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`)}</select></div>
                <div><label>Score</label><input type="number" id="adm-a-score"></div>
                <div><label>Total Points</label><input type="number" id="adm-a-total"></div>
            </div>
            <div style="margin-top:1.5rem; display:flex; gap:10px">
                <button class="btn btn-primary" onclick="adminSubmitAsgn()" id="asgn-submit-btn">Post Grade</button>
                <button class="btn btn-secondary" onclick="resetAsgnEditor()" id="asgn-cancel-btn" style="display:none">Cancel Edit</button>
            </div>
        </div>

        <div class="card">
            <h3>Gradebook Manager</h3>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Task</th><th>Course</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${state.assignments.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td class="text-dim">${state.courses.find(c => c.id === a.courseId)?.name}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="prepareEditAsgn(${a.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteAsgn(${a.id})"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h3>Course Manager</h3>
            <div style="display:flex; gap:10px; margin-bottom:1rem">
                <input id="new-c-name" placeholder="New Course Name">
                <button class="btn btn-primary" onclick="addClass()">Add Class</button>
            </div>
            <div class="table-wrapper">
                <table>
                    ${state.courses.map(c => `
                        <tr>
                            <td>${c.name}</td>
                            <td style="text-align:right"><button class="btn btn-sm btn-danger" onclick="deleteClass('${c.id}')">Remove</button></td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>
    `;
}

// --- ADMIN LOGIC ---

function adminSubmitAsgn() {
    const title = document.getElementById('adm-a-title').value;
    const cid = document.getElementById('adm-a-cid').value;
    const type = document.getElementById('adm-a-type').value;
    const score = parseFloat(document.getElementById('adm-a-score').value);
    const total = parseFloat(document.getElementById('adm-a-total').value);

    if(!title || isNaN(score)) return alert("Please fill details correctly.");

    if (editingAssignmentId) {
        // UPDATE MODE
        const idx = state.assignments.findIndex(a => a.id === editingAssignmentId);
        state.assignments[idx] = { ...state.assignments[idx], courseId: cid, title, type, score, total };
        editingAssignmentId = null;
        alert("Assignment updated successfully!");
    } else {
        // CREATE MODE
        state.assignments.push({ id: Date.now(), courseId: cid, title, type, score, total });
        alert("Grade posted!");
    }

    save();
    navigate('admin');
}

function prepareEditAsgn(id) {
    const a = state.assignments.find(x => x.id === id);
    editingAssignmentId = id;

    // Scroll to form and highlight
    const card = document.getElementById('asgn-editor-card');
    card.classList.add('editing-highlight');
    document.getElementById('editor-title').innerText = "Editing: " + a.title;
    document.getElementById('asgn-submit-btn').innerText = "Update Grade";
    document.getElementById('asgn-cancel-btn').style.display = "inline-flex";

    // Fill form
    document.getElementById('adm-a-title').value = a.title;
    document.getElementById('adm-a-cid').value = a.courseId;
    document.getElementById('adm-a-type').value = a.type;
    document.getElementById('adm-a-score').value = a.score;
    document.getElementById('adm-a-total').value = a.total;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAsgnEditor() {
    editingAssignmentId = null;
    navigate('admin');
}

function deleteAsgn(id) {
    if(confirm("Delete this assignment?")) {
        state.assignments = state.assignments.filter(a => a.id !== id);
        save();
        navigate('admin');
    }
}

function addClass() {
    const name = document.getElementById('new-c-name').value;
    if(!name) return;
    state.courses.push({ id: 'c' + Date.now(), name, instructor: "TBA" });
    save();
    navigate('admin');
}

function deleteClass(id) {
    if(confirm("Deleting this class will also delete its assignments. Proceed?")) {
        state.courses = state.courses.filter(c => c.id !== id);
        state.assignments = state.assignments.filter(a => a.courseId !== id);
        save();
        navigate('admin');
    }
}

// --- UTILS ---

function calculateCourseGrade(cid) {
    const asgns = state.assignments.filter(a => a.courseId === cid);
    if(!asgns.length) return { percent: 0, letter: 'N/A' };
    
    let wSum = 0, wTotal = 0;
    state.config.categories.forEach(cat => {
        const matching = asgns.filter(a => a.type === cat.id);
        if(matching.length) {
            const avg = matching.reduce((s, a) => s + (a.score/a.total), 0) / matching.length;
            wSum += avg * cat.weight;
            wTotal += cat.weight;
        }
    });
    const p = wTotal > 0 ? (wSum / wTotal) * 100 : 0;
    let l = 'F';
    if(p >= state.config.gradeScale.A) l = 'A';
    else if(p >= state.config.gradeScale.B) l = 'B';
    else if(p >= state.config.gradeScale.C) l = 'C';
    return { percent: p.toFixed(1), letter: l };
}

function calculateGPA() {
    if(!state.courses.length) return "0.00";
    let pts = 0;
    state.courses.forEach(c => {
        const g = calculateCourseGrade(c.id);
        if(g.letter === 'A') pts += 4.0;
        else if(g.letter === 'B') pts += 3.0;
        else if(g.letter === 'C') pts += 2.0;
    });
    return (pts / state.courses.length).toFixed(2);
}

function processPfp(e) {
    const reader = new FileReader();
    reader.onload = () => { state.student.custom_pfp = reader.result; save(); navigate('profile'); };
    reader.readAsDataURL(e.target.files[0]);
}

function updateProfile() {
    state.student.name = document.getElementById('prof-name').value;
    state.student.bio = document.getElementById('prof-bio').value;
    save();
    alert("Profile Updated!");
}

function attemptAdminLogin() {
    if(document.getElementById('admin-pass-input').value === ADMIN_PASS) {
        document.getElementById('admin-nav').style.display = 'flex';
        document.getElementById('lock-btn').innerHTML = '<i class="fas fa-unlock"></i> <span>Admin Mode</span>';
        closeAdminModal();
        navigate('admin');
    } else { alert("Error: Passcode Incorrect."); }
}

function renderHeader() {
    document.getElementById('pfp-pill').innerHTML = `
        <span>${state.student.name.split(' ')[0]}</span>
        <img src="${state.student.custom_pfp || state.student.avatar}">
    `;
}

function toggleSidebar(v) { document.getElementById('sidebar').classList.toggle('open', v); }
function openAdminModal() { document.getElementById('admin-modal').classList.add('open'); }
function closeAdminModal() { document.getElementById('admin-modal').classList.remove('open'); }
function updateClock() { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }
