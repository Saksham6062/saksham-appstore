// main.js - index page logic
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  getDocs, doc, runTransaction
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const db = getFirestore();

// dom nodes
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const darkToggle = document.getElementById('darkToggle');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalIcon = document.getElementById('modalIcon');
const modalScreens = document.getElementById('modalScreens');
const downloadBtn = document.getElementById('downloadBtn');
const downloadCount = document.getElementById('downloadCount');
const reviewsList = document.getElementById('reviewsList');
const reviewText = document.getElementById('reviewText');
const ratingInput = document.getElementById('ratingInput');
const submitReview = document.getElementById('submitReview');
const toastEl = document.getElementById('toast');

let allApps = [], categories = new Set(), currentApp = null;

function toast(msg, t=3000){ toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'), t); }

// listen apps realtime
const appsRef = collection(db, 'apps');
const q = query(appsRef, orderBy('createdAt','desc'));
onSnapshot(q, snap => {
  allApps = [];
  categories.clear();
  snap.forEach(s => {
    const d = s.data(); d._id = s.id;
    d.downloads = d.downloads || 0;
    d.rating = d.rating || {avg:0, count:0};
    allApps.push(d);
    if (d.category) categories.add(d.category);
  });
  populateCategories();
  renderGrid();
});

function populateCategories(){
  categorySelect.innerHTML = '<option value="">All categories</option>';
  Array.from(categories).sort().forEach(cat=>{
    const o = document.createElement('option'); o.value = cat; o.textContent = cat; categorySelect.appendChild(o);
  });
}

function renderGrid(){
  const qText = (searchInput.value||'').toLowerCase();
  const cat = categorySelect.value;
  const sort = sortSelect.value;
  let list = allApps.slice();
  if (cat) list = list.filter(a=> (a.category||'').toLowerCase() === cat.toLowerCase());
  if (qText) list = list.filter(a=> (a.appName||'').toLowerCase().includes(qText) || (a.description||'').toLowerCase().includes(qText) || (a.uploadedBy||'').toLowerCase().includes(qText));
  if (sort === 'trending') list.sort((a,b)=>(b.downloads||0)-(a.downloads||0));
  else if (sort === 'topRated') list.sort((a,b)=>(b.rating?.avg||0)-(a.rating?.avg||0));
  else list.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

  grid.innerHTML = '';
  if (list.length===0){ grid.innerHTML = '<div class="loading">No apps found</div>'; return; }
  list.forEach(app=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `
      <div class="top">
        <div class="icon"><img src="${app.iconUrl || 'https://via.placeholder.com/256'}"/></div>
        <div style="flex:1" class="meta">
          <h3>${escapeHtml(app.appName)}</h3>
          <p class="small">${escapeHtml(app.version||'1.0.0')} • ${escapeHtml(app.uploadedBy||'Anonymous')}</p>
          <div class="rating"><div class="stars">${renderStars(app.rating?.avg||0)}</div><div class="small">${(app.rating?.avg||0).toFixed(1)} (${app.rating?.count||0})</div></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <button class="fav">♡</button>
          <div class="small">${app.downloads||0} ⬇</div>
        </div>
      </div>
      <div class="download">
        <div class="left small">${escapeHtml((app.description||'').slice(0,100))}</div>
        <div><button class="btn open-btn" data-id="${app._id}">Open</button></div>
      </div>
    `;
    el.querySelector('.open-btn').addEventListener('click', ()=> openModal(app._id));
    const favBtn = el.querySelector('.fav'); if (getFavs().includes(app._id)) favBtn.textContent='❤';
    favBtn.addEventListener('click', ()=> { toggleFav(app._id); favBtn.textContent = getFavs().includes(app._id)?'❤':'♡'; });
    grid.appendChild(el);
  });
}

function renderStars(avg){
  const full = Math.round(avg);
  let s='';
  for(let i=0;i<5;i++) s += i<full ? '★' : '☆';
  return s;
}
function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') }

// favorites
function getFavs(){ try{ return JSON.parse(localStorage.getItem('saksham_favs')||'[]')}catch(e){return []} }
function toggleFav(id){ const f=getFavs(); if(f.includes(id)){ localStorage.setItem('saksham_favs', JSON.stringify(f.filter(x=>x!==id))); toast('Removed from favorites') } else { f.push(id); localStorage.setItem('saksham_favs', JSON.stringify(f)); toast('Added to favorites') } }

// modal
async function openModal(id){
  const app = allApps.find(a=>a._id===id);
  if(!app) return;
  currentApp = app;
  modalTitle.textContent = app.appName;
  modalDesc.textContent = app.description||'';
  modalIcon.src = app.iconUrl || 'https://via.placeholder.com/256';
  modalScreens.innerHTML = '';
  (app.screenshots||[]).forEach(url => { const i=document.createElement('img'); i.src=url; modalScreens.appendChild(i); });

  // reviews
  reviewsList.innerHTML = 'Loading reviews...';
  const reviewsSnap = await getDocs(collection(getFirestore(), 'apps', id, 'reviews'));
  const reviews = []; reviewsSnap.forEach(s=>reviews.push(s.data()));
  reviewsList.innerHTML = '';
  if(reviews.length===0) reviewsList.innerHTML = '<div class="small">No reviews</div>';
  else reviews.forEach(r=> { const d=document.createElement('div'); d.className='review'; d.innerHTML=`<div style="display:flex;justify-content:space-between"><strong>${escapeHtml(r.name||'Anonymous')}</strong><div class="small">${r.rating}★</div></div><div style="margin-top:6px">${escapeHtml(r.text||'')}</div>`; reviewsList.appendChild(d); });

  downloadCount.textContent = (app.downloads||0) + ' downloads';
  modal.classList.add('show');
  downloadBtn.onclick = ()=> handleDownload(id, app.apkUrl);
  submitReview.onclick = ()=> submitReviewForApp(id);
}
closeModal.addEventListener('click', ()=> modal.classList.remove('show'));

// download increments
import { collection, addDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
async function handleDownload(appId, url){
  try {
    const appRef = doc(getFirestore(), 'apps', appId);
    await runTransaction(getFirestore(), async tx => {
      const snap = await tx.get(appRef);
      const cur = snap.data().downloads || 0;
      tx.update(appRef, { downloads: cur + 1 });
    });
  } catch(e){ console.warn(e); }
  window.open(url, '_blank');
  toast('Download started');
}

// reviews
async function submitReviewForApp(appId){
  const rating = Number(ratingInput.value);
  const text = reviewText.value.trim();
  if(!rating || rating<1 || rating>5){ toast('Enter rating 1-5'); return; }
  try {
    await addDoc(collection(getFirestore(), 'apps', appId, 'reviews'), { rating, text, name: 'Anonymous', createdAt: serverTimestamp() });
    // update aggregated rating
    const appRef = doc(getFirestore(), 'apps', appId);
    await runTransaction(getFirestore(), async tx=>{
      const snap = await tx.get(appRef);
      const data = snap.data();
      const old = data.rating || {avg:0, count:0};
      const newCount = (old.count||0) + 1;
      const newAvg = ((old.avg||0)*(old.count||0) + rating)/newCount;
      tx.update(appRef, { rating: { avg: newAvg, count: newCount } });
    });
    ratingInput.value=''; reviewText.value='';
    toast('Review submitted');
  } catch(e){ console.error(e); toast('Failed to submit review'); }
}

// listeners
searchInput.addEventListener('input', ()=> renderGrid());
categorySelect.addEventListener('change', ()=> renderGrid());
sortSelect.addEventListener('change', ()=> renderGrid());
darkToggle.addEventListener('click', ()=> { document.body.classList.toggle('dark'); darkToggle.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark'; });

// helper import for getDocs used in openModal reviews
import { getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
