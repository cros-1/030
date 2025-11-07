// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref as sRef, uploadBytes } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// === ضع هنا تكوين Firebase الخاص بك ===
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// عناصر
const authPanel = document.getElementById('auth-panel');
const adminUI = document.getElementById('admin-ui');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

btnLogin.addEventListener('click', async ()=>{
  const email = document.getElementById('admin-email').value;
  const pass = document.getElementById('admin-password').value;
  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(e){
    alert('خطأ بتسجيل الدخول: ' + e.message);
  }
});

btnLogout.addEventListener('click', async (e)=>{
  e.preventDefault();
  await signOut(auth);
});

// التحقق من الحالة
onAuthStateChanged(auth, async (user)=>{
  if(user){
    authPanel.style.display = 'none';
    adminUI.style.display = 'block';
    loadAdminData();
  } else {
    authPanel.style.display = 'block';
    adminUI.style.display = 'none';
  }
});

// THEMES
document.getElementById('save-theme').addEventListener('click', async ()=>{
  const bg = document.getElementById('theme-bg').value;
  const text = document.getElementById('theme-text').value;
  const accent = document.getElementById('theme-accent').value;
  await setDoc(doc(db, "site", "theme"), { bg, text, accent });
  alert('تم حفظ الألوان. انتقل للصفحة الرئيسية لرؤية التحديث أو قم بتحديث الصفحة.');
});

// LINKS management
const linksList = document.getElementById('links-list');
document.getElementById('add-link').addEventListener('click', async ()=>{
  const title = document.getElementById('new-link-title').value;
  const url = document.getElementById('new-link-url').value;
  if(!title) return alert('ادخل عنوان');
  const linksRef = collection(db, "site_links");
  await addDoc(linksRef, { title, url });
  document.getElementById('new-link-title').value = '';
  document.getElementById('new-link-url').value = '';
  loadLinks();
});

async function loadLinks(){
  linksList.innerHTML = '';
  const snaps = await getDocs(collection(db, "site_links"));
  snaps.forEach(docSnap=>{
    const li = document.createElement('li');
    li.textContent = docSnap.data().title + ' ➜ ' + docSnap.data().url;
    const del = document.createElement('button');
    del.textContent = 'حذف';
    del.addEventListener('click', async ()=>{
      await deleteDoc(doc(db, "site_links", docSnap.id));
      loadLinks();
    });
    li.appendChild(del);
    linksList.appendChild(li);
  });
}

// Announcement
document.getElementById('save-announcement').addEventListener('click', async ()=>{
  const text = document.getElementById('announce-text').value;
  const visible = document.getElementById('announce-visible').checked;
  await setDoc(doc(db, "site", "announcement"), { text, visible });
  alert('تم حفظ الإعلان.');
});

// Featured upload
document.getElementById('upload-featured').addEventListener('click', async ()=>{
  const fileInput = document.getElementById('featured-image');
  const title = document.getElementById('featured-title').value || 'بدون عنوان';
  if(!fileInput.files.length) return alert('اختر صورة أولاً');
  const file = fileInput.files[0];
  const storagePath = `featured/${Date.now()}_${file.name}`;
  const ref = sRef(storage, storagePath);
  await uploadBytes(ref, file);
  await addDoc(collection(db, "featured"), { title, storagePath });
  fileInput.value = '';
  document.getElementById('featured-title').value = '';
  alert('تم رفع الصورة وإضافة اللوحة.');
  loadFeaturedAdmin();
});

async function loadFeaturedAdmin(){
  const container = document.getElementById('featured-admin-list');
  container.innerHTML = '';
  const snaps = await getDocs(collection(db, "featured"));
  snaps.forEach(s=>{
    const d = document.createElement('div');
    d.textContent = s.data().title + ' — ' + s.id;
    container.appendChild(d);
  });
}

async function loadAdminData(){
  // load saved theme values
  const themeSnap = await getDoc(doc(db, "site", "theme"));
  if(themeSnap.exists()){
    const d = themeSnap.data();
    if(d.bg) document.getElementById('theme-bg').value = d.bg;
    if(d.text) document.getElementById('theme-text').value = d.text;
    if(d.accent) document.getElementById('theme-accent').value = d.accent;
  }

  // announcement
  const ann = await getDoc(doc(db, "site", "announcement"));
  if(ann.exists()){
    const data = ann.data();
    document.getElementById('announce-text').value = data.text || '';
    document.getElementById('announce-visible').checked = !!data.visible;
  }

  loadLinks();
  loadFeaturedAdmin();
}
