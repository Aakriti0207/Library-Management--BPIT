/* ---------- OOP Models ---------- */

class Book {
  constructor(id, title, subject, code, available = true) {
    this.id = id;
    this.title = title;
    this.subject = subject;
    this.code = code;
    this.available = available;
  }
}

class Student {
  constructor(id, name, enrollment, department, phone, email) {
    this.id = id;
    this.name = name;
    this.enrollment = enrollment;
    this.department = department;
    this.phone = phone;
    this.email = email;
  }
}

class IssueRecord {
  constructor(id, bookId, studentId, issuedOn = new Date().toISOString()) {
    this.id = id;
    this.bookId = bookId;
    this.studentId = studentId;
    this.issuedOn = issuedOn;
  }
}

/* Library manager (single place to operate on data) */
class Library {
  constructor() {
    this.books = [];
    this.students = [];
    this.issues = [];
    this.load();
  }

  // Persistence
  save() {
    localStorage.setItem('lib_books', JSON.stringify(this.books));
    localStorage.setItem('lib_students', JSON.stringify(this.students));
    localStorage.setItem('lib_issues', JSON.stringify(this.issues));
  }

  load() {
    const b = JSON.parse(localStorage.getItem('lib_books') || 'null');
    const s = JSON.parse(localStorage.getItem('lib_students') || 'null');
    const i = JSON.parse(localStorage.getItem('lib_issues') || 'null');

    if (b && s && i) {
      this.books = b;
      this.students = s;
      this.issues = i;
    } else {
      // first-run: seed with sample data
      this.seedSample();
      this.save();
    }
  }

  seedSample() {
    // 6 sample books
    this.books = [
      new Book(this._uid(), 'Programming in C', 'Computer Science', 'CS101', true),
      new Book(this._uid(), 'Discrete Mathematics', 'Mathematics', 'MA102', true),
      new Book(this._uid(), 'Data Structures', 'Computer Science', 'CS201', true),
      new Book(this._uid(), 'Digital Logic', 'Electronics', 'EC103', true),
      new Book(this._uid(), 'English Communication', 'Language', 'HS100', true),
      new Book(this._uid(), 'Calculus', 'Mathematics', 'MA101', true)
    ];

    // 5 sample students
    this.students = [
      new Student(this._uid(), 'Aakriti Arya', 'BPIT2025001', 'CSE', '9876543210', 'aakriti@example.com'),
      new Student(this._uid(), 'Riya Sharma', 'BPIT2025002', 'ECE', '9876501234', 'riya@example.com'),
      new Student(this._uid(), 'Vikram Singh', 'BPIT2025003', 'ME', '9876512345', 'vikram@example.com'),
      new Student(this._uid(), 'Rahul Kumar', 'BPIT2025004', 'CSE', '9876523456', 'rahul@example.com'),
      new Student(this._uid(), 'Meera Joshi', 'BPIT2025005', 'IT', '9876534567', 'meera@example.com')
    ];

    this.issues = []; // none issued initially
  }

  _uid() {
    // simple unique id
    return 'id' + Math.random().toString(36).substr(2, 9);
  }

  // Books
  addBook(title, subject, code) {
    const book = new Book(this._uid(), title, subject, code, true);
    this.books.push(book);
    this.save();
    return book;
  }
  removeBook(bookId) {
    // remove only if not issued
    const isIssued = this.issues.some(i => i.bookId === bookId);
    if (isIssued) throw new Error('Book is issued, cannot delete');
    this.books = this.books.filter(b => b.id !== bookId);
    this.save();
  }

  // Students
  addStudent(name, enrollment, department, phone, email) {
    const s = new Student(this._uid(), name, enrollment, department, phone, email);
    this.students.push(s);
    this.save();
    return s;
  }
  removeStudent(studentId) {
    const hasIssued = this.issues.some(i => i.studentId === studentId);
    if (hasIssued) throw new Error('Student has issued books, cannot delete');
    this.students = this.students.filter(s => s.id !== studentId);
    this.save();
  }

  // Issue / Return
  issueBook(bookId, studentId) {
    const book = this.books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found');
    if (!book.available) throw new Error('Book not available');

    const student = this.students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const rec = new IssueRecord(this._uid(), bookId, studentId);
    this.issues.push(rec);
    book.available = false;
    this.save();
    return rec;
  }

  returnBook(issueId) {
    const rec = this.issues.find(r => r.id === issueId);
    if (!rec) throw new Error('Issue record not found');
    const book = this.books.find(b => b.id === rec.bookId);
    if (book) book.available = true;
    this.issues = this.issues.filter(r => r.id !== issueId);
    this.save();
  }

  // helpers
  getIssuedCount() { return this.issues.length; }
  getTotalBooks() { return this.books.length; }
  getTotalStudents() { return this.students.length; }
}

/* ---------- UI / App Logic ---------- */

const library = new Library();

/* Simple "auth" — single admin account */
const Auth = {
  login(email, password) {
    // hard-coded admin for demo
    return email === 'admin@bpitindia.edu.in' && password === 'admin123';
  }
}

/* --- DOM references --- */
const loginPage = document.getElementById('loginPage');
const dashPage = document.getElementById('dashPage');

const signInBtn = document.getElementById('signInBtn');
const logoutBtn = document.getElementById('logoutBtn');

const booksTabBtn = document.querySelector('.dashTab[data-tab="books"]');
const studentsTabBtn = document.querySelector('.dashTab[data-tab="students"]');
const issuedTabBtn = document.querySelector('.dashTab[data-tab="issued"]');
const allTabBtns = document.querySelectorAll('.dashTab');

const booksTable = document.getElementById('booksTable');
const studentsTable = document.getElementById('studentsTable');
const issuedTable = document.getElementById('issuedTable');

const totalBooksEl = document.getElementById('totalBooks');
const totalStudentsEl = document.getElementById('totalStudents');
const issuedBooksCountEl = document.getElementById('issuedBooksCount');

const bookSearch = document.getElementById('bookSearch');
const studentSearch = document.getElementById('studentSearch');
const addBookBtn = document.getElementById('addBookBtn');
const addStudentBtn = document.getElementById('addStudentBtn');

/* --- Events --- */

// login & signup tab toggle on login page
document.getElementById('tabLogin').addEventListener('click', ()=> toggleLoginTabs(true));
document.getElementById('tabSignup').addEventListener('click', ()=> toggleLoginTabs(false));
function toggleLoginTabs(isLogin){
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('signupForm').classList.toggle('hidden', isLogin);
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
}

// sign in
signInBtn.addEventListener('click', ()=>{
  const email = document.getElementById('loginEmail').value;
  const pwd = document.getElementById('loginPassword').value;
  if (Auth.login(email,pwd)){
    showDashboard();
  } else {
    alert('Wrong admin credentials. For demo use admin@bpitindia.edu.in / admin123');
  }
});

// sign up (very simple — stores nothing for demo)
document.getElementById('signUpBtn').addEventListener('click', ()=>{
  alert('Sign up not connected in demo. Use admin account to enter dashboard.');
});

// logout
logoutBtn.addEventListener('click', ()=> {
  dashPage.classList.add('hidden');
  loginPage.classList.remove('hidden');
});

// tab switching
allTabBtns.forEach(b => b.addEventListener('click', (e) => {
  allTabBtns.forEach(x=>x.classList.remove('active'));
  e.currentTarget.classList.add('active');
  showTab(e.currentTarget.dataset.tab);
}));

function showTab(tabName){
  document.getElementById('booksTab').classList.toggle('hidden', tabName !== 'books');
  document.getElementById('studentsTab').classList.toggle('hidden', tabName !== 'students');
  document.getElementById('issuedTab').classList.toggle('hidden', tabName !== 'issued');
}

/* add / search */
addBookBtn.addEventListener('click', ()=> {
  const title = prompt('Book Title:');
  if (!title) return;
  const subject = prompt('Subject:') || '';
  const code = prompt('Code (e.g., CS101):') || '';
  library.addBook(title, subject, code);
  renderAll();
});

addStudentBtn.addEventListener('click', ()=> {
  const name = prompt('Full Name:');
  if (!name) return;
  const enrollment = prompt('Enrollment No:') || '';
  const department = prompt('Department:') || '';
  const phone = prompt('Phone:') || '';
  const email = prompt('Email:') || '';
  library.addStudent(name, enrollment, department, phone, email);
  renderAll();
});

bookSearch.addEventListener('input', renderBooksTable);
studentSearch.addEventListener('input', renderStudentsTable);

/* --- Rendering --- */
function showDashboard(){
  loginPage.classList.add('hidden');
  dashPage.classList.remove('hidden');
  renderAll();
}

function renderAll(){
  renderStats();
  renderBooksTable();
  renderStudentsTable();
  renderIssuedTable();
}

function renderStats(){
  totalBooksEl.textContent = library.getTotalBooks();
  totalStudentsEl.textContent = library.getTotalStudents();
  issuedBooksCountEl.textContent = library.getIssuedCount();
}

function renderBooksTable(){
  const q = bookSearch.value.trim().toLowerCase();
  booksTable.innerHTML = '';
  const list = library.books.filter(b => {
    if (!q) return true;
    return b.title.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q) || b.code.toLowerCase().includes(q);
  });
  if (list.length === 0) {
    booksTable.innerHTML = `<tr><td colspan="5">No books found.</td></tr>`;
    return;
  }
  list.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(b.title)}</td>
      <td>${escapeHTML(b.subject)}</td>
      <td>${escapeHTML(b.code)}</td>
      <td>${b.available ? 'Available' : 'Issued'}</td>
      <td>
        ${b.available ? `<button class="tiny" data-act="issue" data-id="${b.id}">Issue</button>` : ''}
        <button class="tiny" data-act="del" data-id="${b.id}">Delete</button>
      </td>
    `;
    booksTable.appendChild(tr);
  });

  // attach actions
  booksTable.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const act = e.currentTarget.dataset.act;
      if (act === 'del') {
        try { library.removeBook(id); renderAll(); }
        catch(err){ alert(err.message); }
      } else if (act === 'issue') {
        // pick a student (simple)
        const studentEnrollment = prompt('Enter student enrollment number to issue to: (e.g. BPIT2025001)');
        if (!studentEnrollment) return;
        const student = library.students.find(s => s.enrollment === studentEnrollment);
        if (!student) { alert('Student not found. Use exact enrollment.'); return; }
        try {
          library.issueBook(id, student.id);
          renderAll();
        } catch(err) { alert(err.message); }
      }
    });
  });
}

function renderStudentsTable(){
  const q = studentSearch.value.trim().toLowerCase();
  studentsTable.innerHTML = '';
  const list = library.students.filter(s => {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.enrollment.toLowerCase().includes(q);
  });
  if (list.length === 0) {
    studentsTable.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
    return;
  }
  list.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(s.name)}</td>
      <td>${escapeHTML(s.enrollment)}</td>
      <td>${escapeHTML(s.department)}</td>
      <td>${escapeHTML(s.phone)}</td>
      <td>${escapeHTML(s.email)}</td>
      <td>
        <button class="tiny" data-act="del" data-id="${s.id}">Delete</button>
      </td>
    `;
    studentsTable.appendChild(tr);
  });
  studentsTable.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      try { library.removeStudent(id); renderAll(); }
      catch(err){ alert(err.message); }
    });
  });
}

function renderIssuedTable(){
  issuedTable.innerHTML = '';
  if (library.issues.length === 0){
    issuedTable.innerHTML = `<tr><td colspan="5">No issued books.</td></tr>`;
    return;
  }
  library.issues.forEach(rec => {
    const book = library.books.find(b => b.id === rec.bookId) || { title: 'Unknown' };
    const student = library.students.find(s => s.id === rec.studentId) || { name: 'Unknown', enrollment: '' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(book.title)}</td>
      <td>${escapeHTML(student.name)}</td>
      <td>${escapeHTML(student.enrollment)}</td>
      <td>${new Date(rec.issuedOn).toLocaleDateString()}</td>
      <td><button class="tiny" data-act="return" data-id="${rec.id}">Return</button></td>
    `;
    issuedTable.appendChild(tr);
  });

  issuedTable.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Mark this book as returned?')){
        try { library.returnBook(id); renderAll(); }
        catch(err){ alert(err.message); }
      }
    });
  });
}

/* small helper */
function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* On first load, show login page. But if you want to auto-open dashboard uncomment below */
// showDashboard();
