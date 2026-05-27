/**
 * NEXUS LMS CORE ENGINE ARCHITECTURE - PRODUCTION ENTRYPOINT
 */

const STORAGE_SYSTEM_KEY = "NEXUS_UNIVERSITY_PERSISTED_STATE_V4";

// 1. COMPREHENSIVE SEED DATA DATASET
const INITIAL_SYSTEM_STATE = {
    role: 'student',
    currentSemesterId: 'fa26',
    activeCourseId: null,
    profilePic: 'https://ui-avatars.com/api/?name=Student&background=6366f1&color=fff',
    announcements: [
        { id: 1, title: 'Academic Database Migration Successful', date: 'MAY 25, 2026', content: 'The Nexus matrix platform has been upgraded to support real-time weighted grading metrics, custom quarter/semester terms, and responsive execution tracking.' }
    ],
    semesters: [
        {
            id: 'fa26',
            name: 'Fall Semester 2026',
            courses: [
                {
                    id: 'cosc-401',
                    title: 'Distributed System Architectures',
                    instructor: 'Dr. Lysander Vance',
                    weights: { homework: 30, quiz: 15, exam: 35, project: 20, participation: 0 },
                    attendance: { present: 4, total: 4 },
                    assignments: [
                        { id: 101, title: 'Raft Consensus Protocol Build', category: 'project', score: 98, total: 100 },
                        { id: 102, title: 'Vector Clocks Matrix Lab', category: 'homework', score: 88, total: 100 },
                        { id: 103, title: 'Network Partition Quiz', category: 'quiz', score: 14, total: 15 }
                    ]
                },
                {
                    id: 'math-320',
                    title: 'Linear Optimization Models',
                    instructor: 'Prof. Henrietta Vance',
                    weights: { homework: 20, quiz: 20, exam: 40, project: 10, participation: 10 },
                    attendance: { present: 3, total: 4 },
                    assignments: [
                        { id: 201, title: 'Simplex Method Derivations', category: 'homework', score: 45, total: 50 },
                        { id: 202, title: 'Duality Theorem Midterm Exam', category: 'exam', score: 91, total: 100 }
                    ]
                }
            ]
        },
        {
            id: 'wtr27',
            name: 'Winter Quarter 2027',
            courses: []
        }
    ],
    schedule: [
        { day: 'Monday', classes: [{ id: 's1', time: '09:00 AM', course: 'Distributed System Architectures (COSC-401)' }] },
        { day: 'Tuesday', classes: [{ id: 's2', time: '11:30 AM', course: 'Linear Optimization Models (MATH-320)' }] },
        { day: 'Wednesday', classes: [{ id: 's3', time: '09:00 AM', course: 'Distributed System Architectures (COSC-401)' }] },
        { day: 'Thursday', classes: [{ id: 's4', time: '11:30 AM', course: 'Linear Optimization Models (MATH-320)' }] },
        { day: 'Friday', classes: [] }
    ]
};

let appState = JSON.parse(localStorage.getItem(STORAGE_SYSTEM_KEY)) || INITIAL_SYSTEM_STATE;

// 2. STATE PERSISTENCE ENGINE
function commitSystemState() {
    localStorage.setItem(STORAGE_SYSTEM_KEY, JSON.stringify(appState));
}

// 3. WEIGHTED ADVANCED GRADEBOOK ENGINE
function calculateCourseGrade(course) {
    if (!course.assignments || !course.assignments.length) return "100.0";
    
    let weightedSum = 0;
    let totalActiveWeight = 0;
    const categories = Object.keys(course.weights);
    
    categories.forEach(cat => {
        const matchingAssignments = course.assignments.filter(a => a.category === cat);
        if (matchingAssignments.length > 0) {
            const catScoreSum = matchingAssignments.reduce((acc, curr) => acc + curr.score, 0);
            const catTotalSum = matchingAssignments.reduce((acc, curr) => acc + curr.total, 0);
            
            if (catTotalSum > 0) {
                const categoryAverage = catScoreSum / catTotalSum;
                const categoryWeight = course.weights[cat] || 0;
                
                weightedSum += (categoryAverage * categoryWeight);
                totalActiveWeight += categoryWeight;
            }
        }
    });

    if (totalActiveWeight === 0) return "100.0";
    
    // Dynamically scales values if full categorical limits haven't been completed yet
    const computedFinalGrade = (weightedSum / totalActiveWeight) * 100;
    return computedFinalGrade.toFixed(1);
}

function calculateSemesterGPA() {
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!term || !term.courses || !term.courses.length) return "4.00";
    
    let totalGradePoints = 0;
    term.courses.forEach(c => {
        const percentage = parseFloat(calculateCourseGrade(c));
        if (percentage >= 93.0) totalGradePoints += 4.0;
        else if (percentage >= 90.0) totalGradePoints += 3.7;
        else if (percentage >= 87.0) totalGradePoints += 3.3;
        else if (percentage >= 83.0) totalGradePoints += 3.0;
        else if (percentage >= 80.0) totalGradePoints += 2.7;
        else if (percentage >= 77.0) totalGradePoints += 2.3;
        else if (percentage >= 73.0) totalGradePoints += 2.0;
        else if (percentage >= 70.0) totalGradePoints += 1.7;
        else if (percentage >= 60.0) totalGradePoints += 1.0;
        else totalGradePoints += 0.0;
    });
    return (totalGradePoints / term.courses.length).toFixed(2);
}

// 4. ROUTING AND APPLICATION NAVIGATOR
function navigate(viewTarget) {
    const mount = document.getElementById('mount');
    const indicator = document.getElementById('view-indicator');
    
    document.querySelectorAll('.nav-item').forEach(element => element.classList.remove('active'));
    
    const activeMapping = viewTarget === 'course-detail' ? 'courses' : viewTarget;
    const targets = document.querySelector(`[data-view="${activeMapping}"]`);
    if (targets) targets.classList.add('active');
    
    indicator.innerText = viewTarget === 'course-detail' ? "Course Dossier Matrix" : viewTarget.charAt(0).toUpperCase() + viewTarget.slice(1);
    document.getElementById('sidebar').classList.remove('mobile-open');

    switch(viewTarget) {
        case 'dashboard': renderDashboard(mount); break;
        case 'courses': renderCourses(mount); break;
        case 'course-detail': renderCourseDetail(mount); break;
        case 'assignments': renderAssignments(mount); break;
        case 'grades': renderGrades(mount); break;
        case 'schedule': renderSchedule(mount); break;
        case 'admin': renderAdmin(mount); break;
        default: renderDashboard(mount);
    }
}

function openCourse(courseId) {
    appState.activeCourseId = courseId;
    commitSystemState();
    navigate('course-detail');
}

// 5. SECURE COMPONENT PICTURE UPLOAD MATRIX (FileReader Serialization)
function handleProfileUpload(event) {
    const activeBlob = event.target.files[0];
    if (activeBlob) {
        if (activeBlob.size > 3 * 1024 * 1024) {
            alert("Security Payload Violation: Binary image size boundary limit exceeded (3MB maximum).");
            return;
        }
        const dataPipeline = new FileReader();
        dataPipeline.onload = function(e) {
            appState.profilePic = e.target.result;
            document.getElementById('user-avatar-img').src = appState.profilePic;
            commitSystemState();
        };
        dataPipeline.readAsDataURL(activeBlob);
    }
}

// 6. VIEW COMPONENT COMPILERS
function renderDashboard(mount) {
    const activeGPA = calculateSemesterGPA();
    const activeTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);

    mount.innerHTML = `
        <div class="stats-grid">
            <div class="glass-card">
                <p style="color:var(--text-secondary); font-size:0.85rem; font-weight:700; text-transform:uppercase;">Cumulative GPA Grade Point Index</p>
                <div class="stat-val">${activeGPA}</div>
                <div style="color:var(--neon-green); font-size: 0.85rem; font-weight: 700;"><i class="fas fa-shield-check"></i> Status: Academic Honors Status Active</div>
            </div>
            <div class="glass-card">
                <p style="color:var(--text-secondary); font-size:0.85rem; font-weight:700; text-transform:uppercase;">Registry Vector Modules</p>
                <div class="stat-val">${activeTerm ? activeTerm.courses.length : 0}</div>
                <p style="color:var(--text-secondary); font-size: 0.85rem; font-weight:600;">Total Certified Units: ${(activeTerm ? activeTerm.courses.length : 0) * 4}</p>
            </div>
            <div class="glass-card" style="grid-column: 1 / -1;">
                <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-bullhorn" style="color: var(--primary);"></i> Broadcast Feeds</h3>
                ${appState.announcements.length ? appState.announcements.map(announcement => `
                    <div class="announcement-item">
                        <div class="announcement-date">${announcement.date}</div>
                        <h4 style="margin-bottom: 6px; font-weight:700;">${announcement.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height:1.5;">${announcement.content}</p>
                    </div>
                `).reverse().join('') : `<p style="color:var(--text-secondary)">No localized transmission broadcasts logged.</p>`}
            </div>
        </div>
        <div class="glass-card">
            <h3 style="margin-bottom: 1.25rem; font-weight:800;">Integrated Performance Arrays</h3>
            <div class="table-container">
                <table>
                    <thead><tr><th>Course Registry</th><th>Instructor Component</th><th>Calculated Matrix Score</th></tr></thead>
                    <tbody>
                        ${activeTerm && activeTerm.courses.length ? activeTerm.courses.map(course => `
                            <tr>
                                <td><a class="course-link" onclick="openCourse('${course.id}')"><strong>${course.title}</strong></a></td>
                                <td>${course.instructor}</td>
                                <td style="color:var(--primary); font-weight:800">${calculateCourseGrade(course)}%</td>
                            </tr>
                        `).join('') : `<tr><td colspan="3" style="color:var(--text-secondary)">No terminal course connections active in this term.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCourses(mount) { 
    const currentTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
    mount.innerHTML = `<div class="stats-grid">
        ${currentTerm && currentTerm.courses.length ? currentTerm.courses.map(course => `
        <div class="glass-card clickable-card" onclick="openCourse('${course.id}')">
            <div style="height: 110px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-alpha); margin: -2rem -2rem 1.25rem -2rem; border-radius: var(--border-radius) var(--border-radius) 0 0; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 2.2rem;">
                <i class="fas fa-network-wired"></i>
            </div>
            <h3 style="margin-bottom: 6px; font-weight:800; font-size:1.15rem;">${course.title}</h3>
            <p style="color:var(--text-secondary); font-size: 0.9rem; font-weight:600;"><i class="fas fa-user-circle"></i> ${course.instructor}</p>
        </div>`).join('') : '<div class="glass-card" style="grid-column:1/-1;"><p style="color:var(--text-secondary)">No courses associated with this academic identity parameter profile.</p></div>'}
    </div>`; 
}

function renderCourseDetail(mount) {
    const currentTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const targetCourse = currentTerm ? currentTerm.courses.find(c => c.id === appState.activeCourseId) : null;

    if (!targetCourse) {
        mount.innerHTML = `<div class="glass-card"><h3>Course Pointer ID Index Missing.</h3><button class="btn btn-secondary" onclick="navigate('courses')" style="margin-top: 1.5rem;">Return to Registry</button></div>`;
        return;
    }
    
    const attendanceRatio = targetCourse.attendance && targetCourse.attendance.total > 0 ? ((targetCourse.attendance.present / targetCourse.attendance.total) * 100).toFixed(0) : 100;

    mount.innerHTML = `
        <button class="btn btn-secondary" onclick="navigate('courses')" style="margin-bottom: 2rem;">
            <i class="fas fa-arrow-left"></i> Return to Registry Index
        </button>
        <div class="glass-card" style="margin-bottom: 2rem; border-left: 5px solid var(--primary);">
            <h2 style="font-size: 2rem; font-weight:800; margin-bottom: 6px; letter-spacing:-0.5px;">${targetCourse.title}</h2>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight:600;"><i class="fas fa-user-astronaut"></i> Principal Instructor: ${targetCourse.instructor}</p>
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-alpha); display: flex; flex-wrap: wrap; gap: 4rem;">
                <div>
                    <p style="color:var(--text-secondary); font-size: 0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Running Final Weight Score</p>
                    <p style="font-size: 2rem; font-weight: 800; color: var(--primary);">${calculateCourseGrade(targetCourse)}%</p>
                </div>
                <div>
                    <p style="color:var(--text-secondary); font-size: 0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Attendance Verification Threshold</p>
                    <p style="font-size: 2rem; font-weight: 800; color: ${attendanceRatio < 75 ? 'var(--neon-red)' : 'var(--text-primary)'};">${attendanceRatio}%</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight:600;">Logged Sessions: ${targetCourse.attendance?.present || 0} / ${targetCourse.attendance?.total || 0}</p>
                </div>
            </div>
        </div>
        <div class="glass-card">
            <h3 style="margin-bottom: 1.25rem; font-weight:800;">Target Evaluated Grade Ledger Entries</h3>
            <div class="table-container">
                <table>
                    <thead><tr><th>Task Key Assignment</th><th>Categorical Weight Group</th><th>Acquired Absolute Raw Value</th><th>Relative Structural Weight</th></tr></thead>
                    <tbody>
                        ${targetCourse.assignments.length ? targetCourse.assignments.map(assignment => `
                            <tr>
                                <td><strong>${assignment.title}</strong></td>
                                <td><span style="background: var(--card-hover); border:1px solid var(--border-alpha); padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight:700; color:var(--text-primary); text-transform:uppercase;">${assignment.category}</span></td>
                                <td><strong>${assignment.score}</strong> / ${assignment.total}</td>
                                <td style="color:var(--text-secondary); font-weight:600;">${targetCourse.weights[assignment.category]}% distribution</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="color:var(--text-secondary)">No parameters evaluated yet inside this course tracking model.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGrades(mount) {
    const currentTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!currentTerm || !currentTerm.courses.length) {
        mount.innerHTML = `<div class="glass-card"><h3 style="color:var(--text-secondary)">No transcript points available for evaluation processing.</h3></div>`;
        return;
    }
    
    mount.innerHTML = currentTerm.courses.map(course => `
        <div class="glass-card" style="margin-bottom:2rem">
            <div style="display:flex; justify-content:between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:15px;">
                <h2 style="font-size: 1.3rem; font-weight:800; flex:1;" class="course-link" onclick="openCourse('${course.id}')">${course.title}</h2>
                <span class="btn btn-secondary" style="border-color:var(--primary); font-weight:800; color:white;">Running Total: ${calculateCourseGrade(course)}%</span>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Task Item</th><th>Evaluation Tier</th><th>Raw Metric Performance</th><th>Weight Proportion Impact</th></tr></thead>
                    <tbody>
                        ${course.assignments.length ? course.assignments.map(a => `
                            <tr>
                                <td>${a.title}</td>
                                <td><span style="background: rgba(99,102,241,0.08); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">${a.category}</span></td>
                                <td><strong>${a.score}</strong> / ${a.total}</td>
                                <td style="color:var(--text-secondary); font-weight:600;">${course.weights[a.category]}% total group weight</td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" style="color:var(--text-secondary)">No elements evaluated.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('');
}

function renderSchedule(mount) { 
    mount.innerHTML = `<div class="glass-card"><h3 style="margin-bottom: 1.5rem; font-weight:800;"><i class="fas fa-calendar" style="color:var(--primary)"></i> Calendar Coordination Matrix</h3><div class="table-container"><table>
        <thead><tr><th>Target Weekday Node</th><th>Assigned Core Classes & Time Vectors</th></tr></thead>
        <tbody>
        ${appState.schedule.map(d => `<tr>
            <td style="font-weight: 700; width: 180px; font-size:1rem; color:white;">${d.day}</td>
            <td>${d.classes.length ? d.classes.map(c => `<div style="margin-bottom: 8px; font-weight:600;"><span style="color:var(--primary); font-family:monospace; font-size: 0.9rem; margin-right: 15px; background:rgba(255,255,255,0.02); padding:3px 8px; border:1px solid var(--border-alpha); border-radius:6px;">${c.time}</span> ${c.course}</div>`).join('') : '<span style="color:var(--text-secondary); font-size: 0.9rem;">No class sessions scheduled.</span>'}</td>
        </tr>`).join('')}
        </tbody>
    </table></div></div>`; 
}

function renderAssignments(mount) { 
    let allAggregatedTasks = [];
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if(term && term.courses) {
        term.courses.forEach(c => {
            c.assignments.forEach(a => {
                allAggregatedTasks.push({courseTitle: c.title, ...a});
            });
        });
    }

    mount.innerHTML = `<div class="glass-card">
        <h3 style="margin-bottom: 1.5rem; font-weight:800;">Evaluation Task Manager Stream</h3>
        <div class="table-container">
            <table>
                <thead><tr><th>Task Title</th><th>Associated Module Registry</th><th>Category Group</th><th>Scoring Evaluation</th></tr></thead>
                <tbody>
                    ${allAggregatedTasks.length ? allAggregatedTasks.map(t => `
                        <tr>
                            <td><strong>${t.title}</strong></td>
                            <td style="color:var(--text-secondary); font-weight:600;">${t.courseTitle}</td>
                            <td><span style="text-transform:uppercase; font-size:0.75rem; font-weight:700; color:var(--primary);">${t.category}</span></td>
                            <td><strong>${t.score}</strong> / ${t.total} (${((t.score / t.total)*100).toFixed(0)}%)</td>
                        </tr>
                    `).join('') : `<tr><td colspan="4" style="color:var(--text-secondary)">No transactional task parameters present.</td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`; 
}

// 7. MULTI-TERM COMPLETE GRADUATED ADMIN CONTROL PORTAL VIEW
function renderAdmin(mount) {
    if (appState.role !== 'admin') {
        mount.innerHTML = `<h3>Security Level Authentication Token Failure. Access Terminated.</h3>`;
        return;
    }
    const targetTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const selectionOptions = targetTerm && targetTerm.courses.length ? targetTerm.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('') : `<option disabled>No courses live in current matrix target</option>`;

    mount.innerHTML = `
        <div class="admin-grid">
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                
                <!-- Dynamic Academic Term Creation Deck Module -->
                <div class="glass-card" style="border-top:3px solid var(--neon-amber)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-folder-plus"></i> Initialize Academic Matrix Term</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <input id="new-term-id" placeholder="Unique Index ID Code (e.g., sp27, q127)">
                        <input id="new-term-name" placeholder="Official Term Title (e.g., Spring Semester 2027)">
                        <button class="btn btn-secondary btn-full" onclick="adminAddSemester()">Inject Term Into LMS Cluster</button>
                    </div>
                </div>

                <!-- Dynamic Course Ingestion Module with Custom Categorical Weights -->
                <div class="glass-card" style="border-top:3px solid var(--primary)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-folder-plus"></i> Register Course in [${targetTerm ? targetTerm.name : 'Unknown'}]</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <input id="new-c-title" placeholder="Course Name & Code (e.g., Advanced Calculus)">
                        <input id="new-c-instr" placeholder="Lead Instructor Core Persona">
                        
                        <p style="color:var(--text-secondary); font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-top:8px;">Custom Evaluation Tiers Target Group Split Weights (%)</p>
                        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                            <div><label style="font-size:0.75rem; color:var(--text-secondary)">HW %</label><input type="number" id="w-hw" value="25"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-secondary)">Quiz %</label><input type="number" id="w-qz" value="25"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-secondary)">Exam %</label><input type="number" id="w-ex" value="25"></div>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                            <div><label style="font-size:0.75rem; color:var(--text-secondary)">Project %</label><input type="number" id="w-pj" value="25"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-secondary)">Participation %</label><input type="number" id="w-pt" value="0"></div>
                        </div>
                        <button class="btn btn-primary btn-full" onclick="adminAddCourse()">Instantiate Core Course Module</button>
                    </div>
                </div>

                <!-- Dynamic Gradebook Performance Metric Score Registry Ingestion Module -->
                <div class="glass-card" style="border-top:3px solid var(--primary)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-file-invoice"></i> Append Raw Evaluation Score Node</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <select id="asgn-course-sel">${selectionOptions}</select>
                        <input id="asgn-name" placeholder="Evaluation Item Name (e.g., Lab 1 Coding Proof)">
                        <select id="asgn-cat">
                            <option value="homework">Homework Entry Tier</option>
                            <option value="quiz">Quiz Target Evaluation</option>
                            <option value="exam">Examination Core Assessment</option>
                            <option value="project">Project Execution Architecture</option>
                            <option value="participation">Engagement/Participation Factor</option>
                        </select>
                        <div style="display:flex; gap:12px">
                            <input type="number" id="asgn-score" placeholder="Acquired Points" style="width: 50%;">
                            <input type="number" id="asgn-total" placeholder="Max Threshold Potential" style="width: 50%;">
                        </div>
                        <button class="btn btn-primary btn-full" onclick="adminAddAssignment()">Commit Entry Array</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <!-- Announcement Dispatch Deck Module -->
                <div class="glass-card" style="border-top:3px solid var(--primary)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-rss-square"></i> Transmit Transmission Broadcast</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <input id="ann-title" placeholder="Broadcast Header Descriptor">
                        <textarea id="ann-content" placeholder="Compile programmatic transmission block parameters..."></textarea>
                        <button class="btn btn-secondary btn-full" onclick="adminPostAnnouncement()">Broadcast Stream Data Packet</button>
                    </div>
                </div>

                <!-- Time Scheduling Coordination Dynamic Injector Module -->
                <div class="glass-card" style="border-top:3px solid var(--primary)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-hourglass-start"></i> Append Class Calendar Metric Connection</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <select id="sch-day">
                            <option value="Monday">Monday Node</option><option value="Tuesday">Tuesday Node</option>
                            <option value="Wednesday">Wednesday Node</option><option value="Thursday">Thursday Node</option><option value="Friday">Friday Node</option>
                        </select>
                        <input type="time" id="sch-time">
                        <input id="sch-course-name" placeholder="Class Descriptive Module Code & Location String">
                        <button class="btn btn-secondary btn-full" onclick="adminAddSchedule()">Append Calendar Matrix</button>
                    </div>
                </div>

                <!-- Attendance Log Counter Modification Module Interface -->
                <div class="glass-card" style="border-top:3px solid var(--primary)">
                    <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-fingerprint"></i> Attendance Integrity Log Override</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <select id="att-course-sel">${selectionOptions}</select>
                        <div style="display:flex; gap:12px">
                            <input type="number" id="att-present" placeholder="Attended Vector Units" style="width: 50%;">
                            <input type="number" id="att-total" placeholder="Global Evaluation Held" style="width: 50%;">
                        </div>
                        <button class="btn btn-secondary btn-full" onclick="adminUpdateAttendance()">Synchronize Attendance Array Logs</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 8. DATA CORE STATE OVERRIDE MUTATION MODULE OPERATIONS
function adminAddSemester() {
    const rawCodeID = document.getElementById('new-term-id').value.trim().toLowerCase().replace(/\s+/g, '');
    const clearNameString = document.getElementById('new-term-name').value.trim();
    
    if (!rawCodeID || !clearNameString) return alert("Validation Core Exception: Identification token values cannot be evaluated as empty null variants.");
    if (appState.semesters.find(s => s.id === rawCodeID)) return alert("Data Integrity Exception: Target identifier code parameters collide with a sequence track matching this registry token.");

    appState.semesters.push({ id: rawCodeID, name: clearNameString, courses: [] });
    commitSystemState();
    rebuildSemesterDropdownIndex();
    alert("System Ledger Modification Acknowledged: Generated secondary evaluation registry matrix track mapping node successfully.");
    renderAdmin(document.getElementById('mount'));
}

function adminAddCourse() {
    const title = document.getElementById('new-c-title').value.trim();
    const instructor = document.getElementById('new-c-instr').value.trim();
    
    const wHw = parseFloat(document.getElementById('w-hw').value) || 0;
    const wQz = parseFloat(document.getElementById('w-qz').value) || 0;
    const wEx = parseFloat(document.getElementById('w-ex').value) || 0;
    const wPj = parseFloat(document.getElementById('w-pj').value) || 0;
    const wPt = parseFloat(document.getElementById('w-pt').value) || 0;

    if (!title || !instructor) return alert("Required Parameter Error: Title vector tracking points and Instructor identifiers required.");
    if ((wHw + wQz + wEx + wPj + wPt) !== 100) {
        alert("Verification System Warning: Compiled evaluation segment allocation sets do not balance down cleanly to equal exactly 100%. The mathematical computation logic engine will adjust proportions dynamically.");
    }

    const currentTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if(!currentTerm) return alert("System Mapping Core Fault: Active term contextual processing tracking anchor target index is not registered.");

    currentTerm.courses.push({ 
        id: 'course-node-' + Date.now().toString(), 
        title, 
        instructor, 
        weights: { homework: wHw, quiz: wQz, exam: wEx, project: wPj, participation: wPt }, 
        attendance: { present: 0, total: 0 }, 
        assignments: [] 
    });
    
    commitSystemState(); 
    alert("Course Registration Ingest Engine: Connection sequence validated and committed to storage layer layout logs."); 
    renderAdmin(document.getElementById('mount'));
}

function adminAddAssignment() {
    const targetCoursePointerID = document.getElementById('asgn-course-sel').value;
    const identificationHeader = document.getElementById('asgn-name').value.trim();
    const evaluatedScore = parseFloat(document.getElementById('asgn-score').value);
    const systemThresholdTotal = parseFloat(document.getElementById('asgn-total').value);
    
    if (!targetCoursePointerID || !identificationHeader || isNaN(evaluatedScore) || isNaN(systemThresholdTotal) || systemThresholdTotal <= 0) {
        return alert("Validation Ingest Exception: Matrix entry values contain invalid numeric structures.");
    }
    
    const activeTermNode = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const courseMatch = activeTermNode.courses.find(c => c.id === targetCoursePointerID);
    
    courseMatch.assignments.push({ 
        id: Date.now(), 
        title: identificationHeader, 
        category: document.getElementById('asgn-cat').value, 
        score: evaluatedScore, 
        total: systemThresholdTotal 
    });
    
    commitSystemState(); 
    alert("Grade Matrix Ledger Synchronized successfully."); 
    renderAdmin(document.getElementById('mount'));
}

function adminPostAnnouncement() {
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();
    if (!title || !content) return alert("Structural Argument Invalid: Message frames must contain both string blocks.");
    
    const timestampStringFormat = new Date().toLocaleDateString('en-US', { month: 'SHORT', day: 'NUMERIC', year: 'NUMERIC' }).toUpperCase();
    appState.announcements.push({ id: Date.now(), title, content, date: timestampStringFormat });
    
    commitSystemState(); 
    alert("Transmission broadcast pipeline data packet stream verified."); 
    renderAdmin(document.getElementById('mount'));
}

function adminAddSchedule() {
    const selectorDayVal = document.getElementById('sch-day').value;
    const timeValueString = document.getElementById('sch-time').value;
    const descriptiveCourseCode = document.getElementById('sch-course-name').value.trim();
    if (!timeValueString || !descriptiveCourseCode) return alert("System Parameter Vector Fault: Missing contextual metrics.");
    
    const parsedSplitParts = timeValueString.split(':');
    let dynamicHourFrame = parseInt(parsedSplitParts[0]);
    const identifierMarker = dynamicHourFrame >= 12 ? 'PM' : 'AM';
    dynamicHourFrame = dynamicHourFrame % 12; 
    dynamicHourFrame = dynamicHourFrame ? dynamicHourFrame : 12; 
    const structuralTimeStampOutput = `${dynamicHourFrame}:${parsedSplitParts[1]} ${identifierMarker}`;

    const matchTargetDayObject = appState.schedule.find(d => d.day === selectorDayVal);
    if (matchTargetDayObject) {
        matchTargetDayObject.classes.push({ id: Date.now(), time: structuralTimeStampOutput, course: descriptiveCourseCode });
    }
    
    commitSystemState(); 
    alert("Calendar integration vectors rewritten into timetable node mapping structure."); 
    renderAdmin(document.getElementById('mount'));
}

function adminUpdateAttendance() {
    const matchingID = document.getElementById('att-course-sel').value;
    const verifiedPresentCount = parseInt(document.getElementById('att-present').value);
    const evaluationHeldTotal = parseInt(document.getElementById('att-total').value);
    
    if (!matchingID || isNaN(verifiedPresentCount) || isNaN(evaluationHeldTotal) || verifiedPresentCount > evaluationHeldTotal) {
        return alert("Integrity Check Failure: Attendance metric input combinations are conflicting or log totals are invalid.");
    }
    
    const activeTermNode = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const courseInstance = activeTermNode.courses.find(c => c.id === matchingID);
    
    courseInstance.attendance = { present: verifiedPresentCount, total: evaluationHeldTotal };
    commitSystemState(); 
    alert("Biometric validation array records override successful."); 
    renderAdmin(document.getElementById('mount'));
}

// 9. LOCAL GEMINI INTELLIGENT COGNITIVE INTERFACE MOCKUP
function askAI() {
    const fieldInput = document.getElementById('ai-query');
    const interfaceArea = document.getElementById('chat-area');
    const systemNormalizationQuery = fieldInput.value.trim().toLowerCase();
    if (!systemNormalizationQuery) return;

    interfaceArea.innerHTML += `<div class="user-msg">${fieldInput.value}</div>`;
    fieldInput.value = "";
    interfaceArea.scrollTop = interfaceArea.scrollHeight;

    setTimeout(() => {
        let engineResponseResult = "Cognitive context analyzer evaluated query. I can run specific optimization tracks on your **GPA tracking logs**, weighted group category offsets (**weights**), or tabular metrics index records.";
        
        if (systemNormalizationQuery.includes('gpa') || systemNormalizationQuery.includes('transcript')) {
            engineResponseResult = `Current algorithmic index scan processes identify a running GPA projection total of **${calculateSemesterGPA()}** associated with the context target mapping block: **${appState.currentSemesterId.toUpperCase()}**.`;
        } else if (systemNormalizationQuery.includes('weight') || systemNormalizationQuery.includes('category') || systemNormalizationQuery.includes('%')) {
            engineResponseResult = "The calculation tracking framework is handling complex multidirectional custom percentage distribution math patterns across assignments. Access the Gradebook Matrix dashboard interface for specific categorical breakdowns.";
        } else if (systemNormalizationQuery.includes('schedule') || systemNormalizationQuery.includes('class') || systemNormalizationQuery.includes('time')) {
            engineResponseResult = "I have cross-referenced your weekly active coordinate parameters. The timetable array contains structured tracking targets for structural week grids. Navigate to the schedule deck for visual index rendering matrices.";
        }
        
        interfaceArea.innerHTML += `<div class="ai-msg">${engineResponseResult}</div>`;
        interfaceArea.scrollTop = interfaceArea.scrollHeight;
    }, 600);
}

// 10. AUTHENTICATION GATE GATEKEEPER
function verifyAdmin() {
    const tokenPayloadInput = document.getElementById('admin-pass').value;
    if (tokenPayloadInput === "1234") {
        appState.role = 'admin';
        document.getElementById('admin-nav').classList.remove('hidden');
        document.getElementById('admin-trigger').classList.add('admin-unlocked');
        document.getElementById('admin-trigger').innerHTML = `<i class="fas fa-unlock-alt"></i> <span>Admin Active Session</span>`;
        closeAdminModal(); 
        navigate('admin'); 
        commitSystemState();
    } else { 
        alert("Security Credentials Core Matrix Flag: Invalid access pass code entered."); 
    }
}

function switchSemester(targetTermIdCode) { 
    appState.currentSemesterId = targetTermIdCode; 
    commitSystemState(); 
    navigate('dashboard'); 
}

function rebuildSemesterDropdownIndex() {
    const selectionElementNode = document.getElementById('semester-selector');
    selectionElementNode.innerHTML = appState.semesters.map(s => `<option value="${s.id}" ${s.id === appState.currentSemesterId ? 'selected' : ''}>${s.name}</option>`).join('');
}

function initializeApplicationLifecycle() {
    if (appState.profilePic) document.getElementById('user-avatar-img').src = appState.profilePic;
    rebuildSemesterDropdownIndex();
    
    if (appState.role === 'admin') {
        document.getElementById('admin-nav').classList.remove('hidden');
        document.getElementById('admin-trigger').classList.add('admin-unlocked');
        document.getElementById('admin-trigger').innerHTML = `<i class="fas fa-unlock-alt"></i> <span>Admin Active Session</span>`;
    }
}

function openAdminModal() { document.getElementById('admin-modal').classList.add('open'); document.getElementById('admin-pass').focus(); }
function closeAdminModal() { document.getElementById('admin-modal').classList.remove('open'); document.getElementById('admin-pass').value = ''; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('mobile-open'); }
function toggleAI() { 
    const coreWidgetNode = document.getElementById('ai-hub');
    const iconStateIndicator = document.getElementById('ai-icon');
    const dynamicUIVisibilityOpen = coreWidgetNode.classList.toggle('open');
    coreWidgetNode.querySelector('.ai-header').setAttribute('aria-expanded', dynamicUIVisibilityOpen);
    if (dynamicUIVisibilityOpen) { 
        iconStateIndicator.classList.replace('fa-chevron-up', 'fa-chevron-down'); 
        setTimeout(() => document.getElementById('ai-query').focus(), 250); 
    } else { 
        iconStateIndicator.classList.replace('fa-chevron-down', 'fa-chevron-up'); 
    }
}
function synchronizeSystemClock() { 
    document.getElementById('time-display').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
}

// Main Lifecycle Operational Hook
document.addEventListener('DOMContentLoaded', () => {
    setInterval(synchronizeSystemClock, 1000);
    synchronizeSystemClock();
    initializeApplicationLifecycle();
    navigate('dashboard');
});
