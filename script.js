/**
 * NEXUS LMS CORE ENGINE ARCHITECTURE - PRODUCTION ENTRYPOINT
 *
 * Full script.js combining core app state, view renderers, admin mutation APIs,
 * and the Gradebook integration module (draft grades, weighted/total/none modes).
 *
 * Paste this file as your script.js. It expects the HTML and CSS you provided.
 */

/* =========================
   1. STORAGE & INITIAL STATE
   ========================= */
const STORAGE_SYSTEM_KEY = "NEXUS_UNIVERSITY_PERSISTED_STATE_V4";

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

/* =========================
   2. STATE PERSISTENCE
   ========================= */
function commitSystemState() {
  try {
    localStorage.setItem(STORAGE_SYSTEM_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Failed to persist appState', e);
  }
}

/* =========================
   3. GRADE CALCULATION ENGINE
   ========================= */
function calculateCourseGrade(course) {
  if (!course.assignments || !course.assignments.length) return "100.0";

  let weightedSum = 0;
  let totalActiveWeight = 0;
  const categories = Object.keys(course.weights || {});

  categories.forEach(cat => {
    const matchingAssignments = (course.assignments || []).filter(a => a.category === cat);
    if (matchingAssignments.length > 0) {
      const catScoreSum = matchingAssignments.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
      const catTotalSum = matchingAssignments.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

      if (catTotalSum > 0) {
        const categoryAverage = catScoreSum / catTotalSum;
        const categoryWeight = Number(course.weights[cat] || 0);

        weightedSum += (categoryAverage * categoryWeight);
        totalActiveWeight += categoryWeight;
      }
    }
  });

  if (totalActiveWeight === 0) return "100.0";

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

/* =========================
   4. NAVIGATION & ROUTING
   ========================= */
function navigate(viewTarget) {
  const mount = document.getElementById('mount');
  const indicator = document.getElementById('view-indicator');

  document.querySelectorAll('.nav-item').forEach(element => element.classList.remove('active'));

  const activeMapping = viewTarget === 'course-detail' ? 'courses' : viewTarget;
  const targets = document.querySelector(`[data-view="${activeMapping}"]`);
  if (targets) targets.classList.add('active');

  indicator.innerText = viewTarget === 'course-detail' ? "Course Dossier Matrix" : (viewTarget.charAt(0).toUpperCase() + viewTarget.slice(1));
  document.getElementById('sidebar').classList.remove('mobile-open');

  switch (viewTarget) {
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

/* =========================
   5. PROFILE UPLOAD (FileReader)
   ========================= */
function handleProfileUpload(event) {
  const activeBlob = event.target.files[0];
  if (activeBlob) {
    if (activeBlob.size > 3 * 1024 * 1024) {
      alert("Security Payload Violation: Binary image size boundary limit exceeded (3MB maximum).");
      return;
    }
    const dataPipeline = new FileReader();
    dataPipeline.onload = function (e) {
      appState.profilePic = e.target.result;
      const img = document.getElementById('user-avatar-img');
      if (img) img.src = appState.profilePic;
      commitSystemState();
    };
    dataPipeline.readAsDataURL(activeBlob);
  }
}

/* =========================
   6. VIEW RENDERERS
   ========================= */
function renderDashboard(mount) {
  const activeGPA = calculateSemesterGPA();
  const activeTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);

  if (!mount) return;
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
  if (!mount) return;
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

  if (!mount) return;
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
  if (!mount) return;
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
  if (!mount) return;
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
  if (!mount) return;
  let allAggregatedTasks = [];
  const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
  if (term && term.courses) {
    term.courses.forEach(c => {
      (c.assignments || []).forEach(a => {
        allAggregatedTasks.push({ courseTitle: c.title, ...a });
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
              <td><strong>${t.score}</strong> / ${t.total} (${((t.score / t.total) * 100).toFixed(0)}%)</td>
            </tr>
          `).join('') : `<tr><td colspan="4" style="color:var(--text-secondary)">No transactional task parameters present.</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* =========================
   7. ADMIN CONTROL PANEL
   ========================= */
function renderAdmin(mount) {
  if (!mount) return;
  if (appState.role !== 'admin') {
    mount.innerHTML = `<h3>Security Level Authentication Token Failure. Access Terminated.</h3>`;
    return;
  }
  const targetTerm = appState.semesters.find(s => s.id === appState.currentSemesterId);
  const selectionOptions = targetTerm && targetTerm.courses.length ? targetTerm.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('') : `<option disabled>No courses live in current matrix target</option>`;

  mount.innerHTML = `
    <div class="admin-grid">
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div class="glass-card" style="border-top:3px solid var(--neon-amber)">
          <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-folder-plus"></i> Initialize Academic Matrix Term</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <input id="new-term-id" placeholder="Unique Index ID Code (e.g., sp27, q127)">
            <input id="new-term-name" placeholder="Official Term Title (e.g., Spring Semester 2027)">
            <button class="btn btn-secondary btn-full" onclick="adminAddSemester()">Inject Term Into LMS Cluster</button>
          </div>
        </div>

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
        <div class="glass-card" style="border-top:3px solid var(--primary)">
          <h3 style="margin-bottom: 1.25rem; font-weight:800;"><i class="fas fa-rss-square"></i> Transmit Transmission Broadcast</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <input id="ann-title" placeholder="Broadcast Header Descriptor">
            <textarea id="ann-content" placeholder="Compile programmatic transmission block parameters..."></textarea>
            <button class="btn btn-secondary btn-full" onclick="adminPostAnnouncement()">Broadcast Stream Data Packet</button>
          </div>
        </div>

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

/* =========================
   8. ADMIN MUTATION OPERATIONS
   ========================= */
function adminAddSemester() {
  const rawCodeID = (document.getElementById('new-term-id')?.value || '').trim().toLowerCase().replace(/\s+/g, '');
  const clearNameString = (document.getElementById('new-term-name')?.value || '').trim();

  if (!rawCodeID || !clearNameString) return alert("Validation Core Exception: Identification token values cannot be evaluated as empty null variants.");
  if (appState.semesters.find(s => s.id === rawCodeID)) return alert("Data Integrity Exception: Target identifier code parameters collide with a sequence track matching this registry token.");

  appState.semesters.push({ id: rawCodeID, name: clearNameString, courses: [] });
  commitSystemState();
  alert("System Ledger Modification Acknowledged: Generated secondary evaluation registry matrix track mapping node successfully.");
  renderAdmin(document.getElementById('mount'));
}

function adminAddCourse() {
  const title = (document.getElementById('new-c-title')?.value || '').trim();
  const instructor = (document.getElementById('new-c-instr')?.value || '').trim();

  const wHw = parseFloat(document.getElementById('w-hw')?.value) || 0;
  const wQz = parseFloat(document.getElementById('w-qz')?.value) || 0;
  const wEx = parseFloat(document.getElementById('w-ex')?.value) || 0;
  const wPj = parseFloat(document.getElementById('w-pj')?.value) || 0;
  const wPt = parseFloat(document.getElementById('w-pt')?.value) || 0;

  if (!title || !instructor) return alert("Course title and instructor are required.");
  const total = wHw + wQz + wEx + wPj + wPt;
  if (Math.round(total) !== 100) return alert(`Category weights must sum to 100. Current total: ${total}%`);

  const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
  if (!term) return alert("No active term selected.");

  const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  const newCourse = {
    id,
    title,
    instructor,
    weights: { homework: wHw, quiz: wQz, exam: wEx, project: wPj, participation: wPt },
    attendance: { present: 0, total: 0 },
    assignments: []
  };
  term.courses.push(newCourse);
  commitSystemState();
  alert("Course instantiated successfully.");
  renderAdmin(document.getElementById('mount'));
}

function adminAddAssignment() {
  const courseId = document.getElementById('asgn-course-sel')?.value;
  const name = (document.getElementById('asgn-name')?.value || '').trim();
  const cat = document.getElementById('asgn-cat')?.value;
  const score = Number(document.getElementById('asgn-score')?.value || 0);
  const total = Number(document.getElementById('asgn-total')?.value || 0);

  if (!courseId || !name) return alert("Course and assignment name required.");
  const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
  const course = term?.courses.find(c => c.id === courseId);
  if (!course) return alert("Course not found.");

  const id = Date.now();
  course.assignments.push({ id, title: name, category: cat, score, total });
  commitSystemState();
  alert("Assignment appended to course.");
  renderAdmin(document.getElementById('mount'));
}

function adminPostAnnouncement() {
  const title = (document.getElementById('ann-title')?.value || '').trim();
  const content = (document.getElementById('ann-content')?.value || '').trim();
  if (!title || !content) return alert("Title and content required.");
  const id = Date.now();
  const date = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  appState.announcements.push({ id, title, date, content });
  commitSystemState();
  alert("Announcement broadcasted.");
  renderAdmin(document.getElementById('mount'));
}

function adminAddSchedule() {
  const day = document.getElementById('sch-day')?.value;
  const time = document.getElementById('sch-time')?.value;
  const courseName = (document.getElementById('sch-course-name')?.value || '').trim();
  if (!day || !time || !courseName) return alert("Day, time, and course name required.");
  const slot = { id: Date.now(), time: time, course: courseName };
  const dayObj = appState.schedule.find(d => d.day === day);
  if (dayObj) dayObj.classes.push(slot);
  else appState.schedule.push({ day, classes: [slot] });
  commitSystemState();
  alert("Schedule appended.");
  renderAdmin(document.getElementById('mount'));
}

function adminUpdateAttendance() {
  const courseId = document.getElementById('att-course-sel')?.value;
  const present = Number(document.getElementById('att-present')?.value || 0);
  const total = Number(document.getElementById('att-total')?.value || 0);
  if (!courseId) return alert("Select a course.");
  const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
  const course = term?.courses.find(c => c.id === courseId);
  if (!course) return alert("Course not found.");
  course.attendance = { present, total };
  commitSystemState();
  alert("Attendance synchronized.");
  renderAdmin(document.getElementById('mount'));
}

/* =========================
   9. GRADEBOOK INTEGRATION MODULE
   - Uses appState and commitSystemState
   - Adds UI templates into DOM if missing and mounts into #mount
   ========================= */
(function () {
  // Ensure mount exists
  const mount = document.getElementById('mount');
  if (!mount) return;

  // Initialize gradebook settings in appState if missing
  if (!appState.gradebook) {
    appState.gradebook = {
      settings: {
        draftEnabled: true,
        draftPercent: 0,        // percent 0-100
        calcMode: 'weighted',   // 'none' | 'weighted' | 'total'
        showOverall: false
      },
      categories: ['homework', 'exam', 'project', 'quiz', 'participation'],
      scales: []
    };
    commitSystemState();
  }

  // Insert gradebook HTML templates if not present
  function ensureGradebookHTML() {
    if (document.getElementById('gradebook-modal')) return;
    const html = `
      <!-- Gradebook Settings Modal -->
      <div id="gradebook-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="gradebook-title" hidden>
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h2 id="gradebook-title"><i class="fas fa-book-open"></i> Gradebook Settings</h2>
            <button class="close-btn" onclick="toggleGradebookModal()" aria-label="Close Gradebook Settings">&times;</button>
          </div>
          <div class="modal-body">
            <section class="settings-section">
              <h3>Draft Grade for Missing Assignments</h3>
              <label class="row"><span>Apply draft grade to missing assignments</span><input id="gb-draft-enabled" type="checkbox" /></label>
              <label class="row"><span>Draft grade percentage</span><input id="gb-draft-percent" type="number" min="0" max="100" value="0" /> %</label>
              <p class="muted">Draft grades are hidden from students until returned.</p>
            </section>

            <section class="settings-section">
              <h3>Overall Grade Calculation</h3>
              <label class="row"><input name="gb-calc-mode" type="radio" value="none" /> <span>No overall grade</span></label>
              <label class="row"><input name="gb-calc-mode" type="radio" value="weighted" /> <span>Weighted by category</span></label>
              <label class="row"><input name="gb-calc-mode" type="radio" value="total" /> <span>Total points</span></label>
              <label class="row"><span>Show overall grade to students</span><input id="gb-show-overall" type="checkbox" /></label>
            </section>

            <section class="settings-section">
              <h3>Grading Periods</h3>
              <div id="gb-period-warning" class="warning" hidden></div>
              <p class="small-muted">Grading periods are your existing semesters; you can create up to 12 terms in Admin.</p>
            </section>

            <section class="settings-actions">
              <button class="btn btn-primary" onclick="saveGradebookSettings()">Save Settings</button>
              <button class="btn" onclick="closeGradebookModal()">Cancel</button>
            </section>
          </div>
        </div>
      </div>

      <!-- Gradebook Template -->
      <template id="gradebook-template">
        <div class="gradebook-root">
          <div class="gradebook-header">
            <h2>Gradebook Matrix</h2>
            <div class="actions">
              <button class="btn" onclick="toggleGradebookModal()">Settings</button>
              <button class="btn" onclick="exportGradebook()">Export (JSON)</button>
            </div>
          </div>

          <div class="gradebook-controls">
            <label>Term
              <select id="gb-term-select"></select>
            </label>
            <label>Course
              <select id="gb-course-select"></select>
            </label>
            <button class="btn" onclick="openAddAssignment()">Add Assignment</button>
          </div>

          <div id="assignments-table-wrap"></div>
        </div>
      </template>

      <!-- Add Assignment Modal -->
      <div id="assignment-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="assignment-title" hidden>
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h2 id="assignment-title">Add Assignment</h2>
            <button class="close-btn" onclick="closeAssignmentModal()" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <label>Title <input id="gb-assign-title" /></label>
            <label>Category
              <select id="gb-assign-category"></select>
            </label>
            <label>Due date <input id="gb-assign-due" type="date" /></label>
            <label>Points possible <input id="gb-assign-points" type="number" min="0" value="100" /></label>
            <label>Status
              <select id="gb-assign-status">
                <option value="normal">Normal (counts)</option>
                <option value="missing">Missing</option>
                <option value="excused">Excused</option>
                <option value="late">Late</option>
              </select>
            </label>
            <div class="modal-actions">
              <button class="btn btn-primary" onclick="saveAssignment()">Save</button>
              <button class="btn" onclick="closeAssignmentModal()">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  ensureGradebookHTML();

  // Modal toggles
  window.toggleGradebookModal = function () {
    const modal = document.getElementById('gradebook-modal');
    if (!modal) return;
    if (modal.hasAttribute('hidden')) {
      document.getElementById('gb-draft-enabled').checked = appState.gradebook.settings.draftEnabled;
      document.getElementById('gb-draft-percent').value = appState.gradebook.settings.draftPercent;
      document.querySelectorAll('input[name="gb-calc-mode"]').forEach(r => r.checked = (r.value === appState.gradebook.settings.calcMode));
      document.getElementById('gb-show-overall').checked = !!appState.gradebook.settings.showOverall;
      modal.removeAttribute('hidden'); modal.classList.add('open');
    } else {
      modal.setAttribute('hidden', ''); modal.classList.remove('open');
    }
  };
  window.closeGradebookModal = function () { const m = document.getElementById('gradebook-modal'); if (m) { m.setAttribute('hidden', ''); m.classList.remove('open'); } };

  // Render gradebook view into #mount
  function renderGradebookView() {
    const tpl = document.getElementById('gradebook-template');
    if (!tpl) return;
    mount.innerHTML = '';
    mount.appendChild(tpl.content.cloneNode(true));
    populateTermSelect();
    populateCourseSelect();
    renderAssignmentsTable();
  }

  // Populate term select (uses appState.semesters)
  function populateTermSelect() {
    const sel = document.getElementById('gb-term-select');
    if (!sel) return;
    sel.innerHTML = '';
    appState.semesters.forEach(s => {
      const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; sel.appendChild(opt);
    });
    sel.value = appState.currentSemesterId || (appState.semesters[0] && appState.semesters[0].id);
    sel.addEventListener('change', () => {
      appState.currentSemesterId = sel.value; commitSystemState(); populateCourseSelect(); renderAssignmentsTable();
    });
  }

  function populateCourseSelect() {
    const sel = document.getElementById('gb-course-select');
    if (!sel) return;
    sel.innerHTML = '';
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!term) { sel.innerHTML = '<option disabled>No term</option>'; return; }
    term.courses.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.title; sel.appendChild(opt);
    });
    sel.addEventListener('change', () => renderAssignmentsTable());
  }

  // Render assignments table for selected course
  function renderAssignmentsTable() {
    const wrap = document.getElementById('assignments-table-wrap');
    if (!wrap) return;
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!term) { wrap.innerHTML = '<div class="glass-card">No term selected.</div>'; return; }
    const courseId = document.getElementById('gb-course-select')?.value || (term.courses[0] && term.courses[0].id);
    const course = term.courses.find(c => c.id === courseId);
    if (!course) { wrap.innerHTML = '<div class="glass-card">No course selected.</div>'; return; }

    // Ensure assignments have grade metadata for draft/returned flags
    course.assignments = (course.assignments || []).map(a => {
      if (a.draftApplied === undefined) a.draftApplied = false;
      if (a.draftScore === undefined) a.draftScore = null;
      if (a.draftReturned === undefined) a.draftReturned = false;
      return a;
    });

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr><th>Title</th><th>Category</th><th>Due</th><th>Points</th><th>Status</th><th>Actions</th></tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');

    course.assignments.forEach(a => {
      const tr = document.createElement('tr');
      const due = a.due || '-';
      const status = a.status || (a.draftApplied ? 'missing (draft applied)' : 'normal');
      tr.innerHTML = `
        <td>${escapeHtml(a.title || a.name || 'Untitled')}</td>
        <td>${escapeHtml(a.category || 'Uncategorized')}</td>
        <td>${due}</td>
        <td>${a.total || a.points || 0}</td>
        <td>${escapeHtml(status)}</td>
        <td>
          <button class="btn" data-action="mark-missing" data-id="${a.id}">Mark Missing</button>
          <button class="btn" data-action="return-draft" data-id="${a.id}">Return Draft</button>
          <button class="btn" data-action="delete-assignment" data-id="${a.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.innerHTML = '';
    wrap.appendChild(table);

    // wire action buttons
    wrap.querySelectorAll('button[data-action="mark-missing"]').forEach(b => {
      b.addEventListener('click', e => markAssignmentMissing(course.id, Number(e.currentTarget.dataset.id)));
    });
    wrap.querySelectorAll('button[data-action="return-draft"]').forEach(b => {
      b.addEventListener('click', e => returnDraftForAssignment(course.id, Number(e.currentTarget.dataset.id)));
    });
    wrap.querySelectorAll('button[data-action="delete-assignment"]').forEach(b => {
      b.addEventListener('click', e => deleteAssignmentFromCourse(course.id, Number(e.currentTarget.dataset.id)));
    });
  }

  // Add / Save assignment modal
  window.openAddAssignment = function () {
    const m = document.getElementById('assignment-modal');
    if (!m) return;
    const sel = document.getElementById('gb-assign-category');
    sel.innerHTML = '';
    (appState.gradebook.categories || []).forEach(c => {
      const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt);
    });
    m.removeAttribute('hidden'); m.classList.add('open');
  };
  window.closeAssignmentModal = function () { const m = document.getElementById('assignment-modal'); if (m) { m.setAttribute('hidden', ''); m.classList.remove('open'); } };

  window.saveAssignment = function () {
    const title = (document.getElementById('gb-assign-title')?.value || '').trim();
    if (!title) return alert('Title required');
    const category = document.getElementById('gb-assign-category')?.value || 'homework';
    const due = document.getElementById('gb-assign-due')?.value || null;
    const points = Number(document.getElementById('gb-assign-points')?.value || 0);
    const status = document.getElementById('gb-assign-status')?.value || 'normal';

    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    if (!term) return alert('No term selected.');
    const courseId = document.getElementById('gb-course-select')?.value || (term.courses[0] && term.courses[0].id);
    const course = term.courses.find(c => c.id === courseId);
    if (!course) return alert('No course selected.');

    const id = Date.now();
    const assignment = { id, title, category, due, total: points, status, draftApplied: false, draftScore: null, draftReturned: false };
    course.assignments.push(assignment);
    commitSystemState();
    closeAssignmentModal();
    renderAssignmentsTable();
  };

  function deleteAssignmentFromCourse(courseId, assignmentId) {
    if (!confirm('Delete assignment?')) return;
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = term?.courses.find(c => c.id === courseId);
    if (!course) return;
    course.assignments = course.assignments.filter(a => a.id !== assignmentId);
    commitSystemState();
    renderAssignmentsTable();
  }

  // Mark assignment missing and apply draft grade
  function markAssignmentMissing(courseId, assignmentId) {
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = term?.courses.find(c => c.id === courseId);
    if (!course) return;
    const a = course.assignments.find(x => x.id === assignmentId);
    if (!a) return;
    a.status = 'missing';
    if (appState.gradebook.settings.draftEnabled) {
      const draftScore = (Number(appState.gradebook.settings.draftPercent || 0) / 100) * (Number(a.total || a.points || 0));
      a.draftApplied = true;
      a.draftScore = draftScore;
      a.draftReturned = false;
    } else {
      a.draftApplied = true;
      a.draftScore = null;
      a.draftReturned = false;
    }
    commitSystemState();
    renderAssignmentsTable();
    showToast('Marked missing and applied draft grade (hidden from students).');
  }
  window.markAssignmentMissing = markAssignmentMissing;

  // Return draft (finalize) — teacher action to convert draft to actual score
  function returnDraftForAssignment(courseId, assignmentId) {
    const term = appState.semesters.find(s => s.id === appState.currentSemesterId);
    const course = term?.courses.find(c => c.id === courseId);
    if (!course) return;
    const a = course.assignments.find(x => x.id === assignmentId);
    if (!a) return;
    if (!a.draftApplied) return alert('No draft applied to this assignment.');
    // If draftScore is null, treat as zero; otherwise use draftScore
    const finalScore = (a.draftScore == null) ? 0 : a.draftScore;
    a.score = finalScore;
    a.total = a.total || a.points || 0;
    a.draftReturned = true;
    a.draftApplied = false;
    a.status = 'returned';
    commitSystemState();
    renderAssignmentsTable();
    showToast('Draft returned and finalized.');
  }
  window.returnDraftForAssignment = returnDraftForAssignment;

  // Export gradebook (JSON)
  window.exportGradebook = function () {
    const data = JSON.stringify(appState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus_gradebook_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save gradebook settings
  window.saveGradebookSettings = function () {
    const draftEnabled = document.getElementById('gb-draft-enabled')?.checked;
    const draftPercent = Number(document.getElementById('gb-draft-percent')?.value || 0);
    const calcMode = Array.from(document.querySelectorAll('input[name="gb-calc-mode"]')).find(r => r.checked)?.value || 'weighted';
    const showOverall = document.getElementById('gb-show-overall')?.checked;

    appState.gradebook.settings.draftEnabled = !!draftEnabled;
    appState.gradebook.settings.draftPercent = Math.max(0, Math.min(100, draftPercent));
    appState.gradebook.settings.calcMode = calcMode;
    appState.gradebook.settings.showOverall = !!showOverall;

    commitSystemState();
    closeGradebookModal();
    renderGradebookView();
  };

  // Small UI helper
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'glass-card';
    t.style.position = 'fixed';
    t.style.right = '20px';
    t.style.bottom = '100px';
    t.style.zIndex = 3000;
    t.style.padding = '12px 18px';
    t.style.borderRadius = '12px';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  // Utility: escape HTML
  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  // Mount gradebook view when user navigates to 'grades' or when app loads and view is grades
  // Hook into existing navigate function by overriding renderGrades to call renderGradebookView when appropriate
  const originalRenderGrades = renderGrades;
  renderGrades = function (mount) {
    // If gradebook UI is desired as the grades view, mount the gradebook view
    renderGradebookView();
  };

  // Initialize: if current view is grades on load, render gradebook
  document.addEventListener('DOMContentLoaded', () => {
    // If the app initially loads on grades view, render gradebook
    const initialView = document.querySelector('.nav-item.active')?.dataset?.view || 'dashboard';
    if (initialView === 'grades') renderGradebookView();
  });

})();

/* =========================
   10. LIGHTWEIGHT UI HELPERS & FALLBACKS
   ========================= */

// Minimal stubs for UI actions referenced in HTML but not defined above
function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
}
function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
}
function verifyAdmin() {
  const pass = document.getElementById('admin-pass')?.value;
  if (pass === '1234') {
    document.getElementById('admin-nav')?.classList.remove('hidden');
    document.getElementById('admin-trigger')?.classList.add('admin-unlocked');
    appState.role = 'admin';
    commitSystemState();
    alert('Admin token elevated.');
    closeAdminModal();
  } else {
    alert('Invalid passcode.');
  }
}
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.classList.toggle('mobile-open');
}
function switchSemester(id) {
  if (!id) return;
  appState.currentSemesterId = id;
  commitSystemState();
  navigate('dashboard');
}
function askAI() {
  const q = document.getElementById('ai-query')?.value || '';
  if (!q) return;
  const area = document.getElementById('chat-area');
  if (area) {
    const userMsg = document.createElement('div'); userMsg.className = 'user-msg'; userMsg.textContent = q; area.appendChild(userMsg);
    const aiMsg = document.createElement('div'); aiMsg.className = 'ai-msg'; aiMsg.textContent = 'Analyzing... (mock)'; area.appendChild(aiMsg);
    setTimeout(() => { aiMsg.textContent = 'Analysis complete. Use the Gradebook settings to adjust weights and draft grade behavior.'; }, 800);
  }
}
function toggleAI() {
  const hub = document.getElementById('ai-hub');
  if (!hub) return;
  hub.classList.toggle('open');
}

/* =========================
   11. BOOTSTRAP: initial render
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  // Populate semester selector in top nav
  const semSel = document.getElementById('semester-selector');
  if (semSel) {
    semSel.innerHTML = '';
    appState.semesters.forEach(s => {
      const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; semSel.appendChild(opt);
    });
    semSel.value = appState.currentSemesterId || (appState.semesters[0] && appState.semesters[0].id);
    semSel.addEventListener('change', (e) => switchSemester(e.target.value));
  }

  // Set avatar
  const avatar = document.getElementById('user-avatar-img');
  if (avatar) avatar.src = appState.profilePic || avatar.src;

  // Initial navigation to dashboard
  navigate('dashboard');

  // Time display (simple clock)
  const timeEl = document.getElementById('time-display');
  if (timeEl) {
    setInterval(() => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString();
    }, 1000);
  }
});
