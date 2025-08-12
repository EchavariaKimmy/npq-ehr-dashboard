// Firebase config - replace with your project config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const adminEmail = "echavariakimberly@gmail.com";

// Elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authSection = document.getElementById("authSection");
const appDiv = document.getElementById("app");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const registerSubmitBtn = document.getElementById("registerSubmitBtn");
const closeAuthBtn = document.getElementById("closeAuthBtn");
const authMessage = document.getElementById("authMessage");
const themeToggle = document.getElementById("themeToggle");

const postAnnouncementBtn = document.getElementById("postAnnouncementBtn");
const newAnnouncement = document.getElementById("newAnnouncement");
const announcementList = document.getElementById("announcementList");

const newMemo = document.getElementById("newMemo");
const addMemoBtn = document.getElementById("addMemoBtn");
const memoList = document.getElementById("memoList");

const newDeadline = document.getElementById("newDeadline");
const addDeadlineBtn = document.getElementById("addDeadlineBtn");
const deadlineList = document.getElementById("deadlineList");

const folderNameInput = document.getElementById("folderName");
const fileInput = document.getElementById("fileInput");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const fileList = document.getElementById("fileList");

const addTrackerBtn = document.getElementById("addTrackerBtn");
const trackersContainer = document.getElementById("trackersContainer");

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Show login modal
loginBtn.addEventListener("click", () => {
  authSection.style.display = "flex";
  authMessage.textContent = "";
});

// Close login modal
closeAuthBtn.addEventListener("click", () => {
  authSection.style.display = "none";
});

// Login
loginSubmitBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      authSection.style.display = "none";
      emailInput.value = "";
      passwordInput.value = "";
    })
    .catch(e => {
      authMessage.textContent = "Login failed: " + e.message;
    });
});

// Register
registerSubmitBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      // New users require admin approval (disable login until approved)
      db.collection("users").doc(cred.user.uid).set({
        email: email,
        role: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      authMessage.textContent = "Registration successful. Wait for admin approval.";
      auth.signOut();
    })
    .catch(e => {
      authMessage.textContent = "Registration failed: " + e.message;
    });
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// On auth state change
auth.onAuthStateChanged(async user => {
  if (user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const role = userDoc.exists ? userDoc.data().role : null;
    if (!userDoc.exists || role === "pending") {
      authMessage.textContent = "Waiting for admin approval.";
      auth.signOut();
      return;
    }
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    appDiv.style.display = "block";

    // Show admin-only buttons
    if(user.email === adminEmail){
      postAnnouncementBtn.style.display = "inline-block";
      addMemoBtn.style.display = "inline-block";
      addDeadlineBtn.style.display = "inline-block";
      uploadFileBtn.style.display = "inline-block";
    } else {
      postAnnouncementBtn.style.display = "none";
      addMemoBtn.style.display = "none";
      addDeadlineBtn.style.display = "none";
      uploadFileBtn.style.display = "none";
    }

    loadAnnouncements();
    loadMemos();
    loadDeadlines();
    loadFiles();
    loadTrackers();

  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    appDiv.style.display = "none";
  }
});

// Announcements
postAnnouncementBtn.addEventListener("click", () => {
  const text = newAnnouncement.value.trim();
  if(text){
    db.collection("announcements").add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      newAnnouncement.value = "";
      loadAnnouncements();
    });
  }
});

async function loadAnnouncements(){
  const snapshot = await db.collection("announcements").orderBy("createdAt", "desc").get();
  announcementList.innerHTML = "";
  snapshot.forEach(doc => {
    const div = document.createElement("div");
    div.textContent = doc.data().text;
    announcementList.appendChild(div);
  });
}

// Memos
addMemoBtn.addEventListener("click", () => {
  const text = newMemo.value.trim();
  if(text){
    db.collection("memos").add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      newMemo.value = "";
      loadMemos();
    });
  }
});

async function loadMemos(){
  const snapshot = await db.collection("memos").orderBy("createdAt", "desc").get();
  memoList.innerHTML = "";
  snapshot.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.data().text;
    memoList.appendChild(li);
  });
}

// Deadlines
addDeadlineBtn.addEventListener("click", () => {
  const text = newDeadline.value.trim();
  if(text){
    db.collection("deadlines").add({
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      newDeadline.value = "";
      loadDeadlines();
    });
  }
});

async function loadDeadlines(){
  const snapshot = await db.collection("deadlines").orderBy("createdAt", "desc").get();
  deadlineList.innerHTML = "";
  snapshot.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.data().text;
    deadlineList.appendChild(li);
  });
}

// File Upload
uploadFileBtn.addEventListener("click", () => {
  const folder = folderNameInput.value.trim() || "Uncategorized";
  const file = fileInput.files[0];
  if(file){
    const storageRef = storage.ref(`${folder}/${file.name}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
      null,
      error => { alert("Upload failed: " + error.message); },
      () => {
        alert("Upload successful!");
        folderNameInput.value = "";
        fileInput.value = "";
        loadFiles();
      });
  }
});

async function loadFiles(){
  fileList.innerHTML = "";
  const foldersSnapshot = await storage.ref().listAll();
  for(const folderRef of foldersSnapshot.prefixes){
    const folderName = folderRef.name;
    const filesSnapshot = await folderRef.listAll();
    const folderHeader = document.createElement("li");
    folderHeader.style.fontWeight = "bold";
    folderHeader.textContent = folderName;
    fileList.appendChild(folderHeader);

    for(const fileRef of filesSnapshot.items){
      const url = await fileRef.getDownloadURL();
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.textContent = fileRef.name;
      li.appendChild(a);
      fileList.appendChild(li);
    }
  }
}

// Trackers (simple example)
addTrackerBtn.addEventListener("click", () => {
  const name = prompt("Enter tracker name (e.g. Service Credits)");
  if(!name) return;
  db.collection("trackers").add({
    name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    loadTrackers();
  });
});

async function loadTrackers(){
  trackersContainer.innerHTML = "";
  const snapshot = await db.collection("trackers").orderBy("createdAt","desc").get();
  snapshot.forEach(doc => {
    const div = document.createElement("div");
    div.textContent = doc.data().name;
    trackersContainer.appendChild(div);
  });
}
