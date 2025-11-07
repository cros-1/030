// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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

async function applyTheme(){
  try{
    const themeDoc = await getDoc(doc(db, "site", "theme"));
    if(themeDoc.exists()){
      const data = themeDoc.data();
      if(data.bg) document.documentElement.style.setProperty('--bg', data.bg);
      if(data.text) document.documentElement.style.setProperty('--text', data.text);
      if(data.accent) document.documentElement.style.setProperty('--accent', data.accent);
    }
  }catch(e){
    console.error('خطأ بجلب الثيم:', e);
  }
}

async function loadAnnouncement(){
  try{
    const docSnap = await getDoc(doc(db, "site", "announcement"));
    if(docSnap.exists()){
      const data = docSnap.data();
      const ann = document.getElementById('announcement');
      if(data.visible && data.text){
        ann.textContent = data.text;
        ann.style.display = 'block';
        document.body.insertBefore(ann, document.body.firstChild);
      } else {
        ann.style.display = 'none';
      }
    }
  }catch(e){
    console.error('خطأ بجلب الإعلان:', e);
  }
}

async function loadFeatured(){
  const featuredList = document.getElementById('featured-list');
  featuredList.innerHTML = '';
  try{
    const q = query(collection(db, "featured"));
    const snaps = await getDocs(q);
    for(const docSnap of snaps.docs){
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'feature-card';
      const img = document.createElement('img');
      try{
        const url = await getDownloadURL(sRef(storage, data.storagePath));
        img.src = url;
      }catch(e){
        img.alt = '';
      }
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<strong>${data.title || ''}</strong>`;
      card.appendChild(img);
      card.appendChild(meta);
      featuredList.appendChild(card);
    }
  }catch(e){
    console.error('خطأ بجلب لوحات التميز:', e);
  }
}

async function loadNavLinks(){
  const nav = document.getElementById('top-nav');
  try{
    const snaps = await getDocs(collection(db, "site_links"));
    snaps.forEach(s=>{
      const data = s.data();
      const a = document.createElement('a');
      a.href = data.url || '#';
      a.textContent = data.title || 'رابط';
      nav.appendChild(a);
    });
  }catch(e){
    console.error('خطأ بجلب الروابط:', e);
  }
}

async function init(){
  await applyTheme();
  await loadAnnouncement();
  await loadNavLinks();
  await loadFeatured();
}

init();
