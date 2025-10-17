// admin.js - admin approve/reject
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const db = getFirestore();
const tableBody = document.getElementById('appsTableBody');
const toastEl = document.getElementById('toast');
function toast(msg, t=3000){ toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'), t); }

const appsRef = collection(db,'apps');
const q = query(appsRef, orderBy('createdAt','desc'));
onSnapshot(q, snap=>{
  tableBody.innerHTML = '';
  if (snap.empty) { tableBody.innerHTML = '<tr><td colspan="5">No apps</td></tr>'; return; }
  snap.forEach(s=>{
    const d = s.data(); const id = s.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(d.appName)}</td><td>${escapeHtml(d.version||'')}</td><td>${escapeHtml(d.uploadedBy||'Anonymous')}</td><td>${escapeHtml(d.category||'')}</td>
      <td>
        <a href="${d.apkUrl}" target="_blank" class="btn">Download</a>
        <button class="btn" data-id="${id}" data-action="approve">Approve</button>
        <button class="btn reject" data-id="${id}" data-action="reject">Reject</button>
        <button class="btn" data-id="${id}" data-action="delete">Delete</button>
      </td>`;
    tableBody.appendChild(tr);
  });

  // attach handlers
  tableBody.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const id = btn.dataset.id; const action = btn.dataset.action;
      if(action==='approve') {
        await updateDoc(doc(db,'apps',id), { status: 'approved' });
        toast('App approved');
      } else if(action==='reject'){
        await updateDoc(doc(db,'apps',id), { status: 'rejected' });
        toast('App rejected');
      } else if(action==='delete'){
        if(!confirm('Delete this app?')) return;
        await deleteDoc(doc(db,'apps',id));
        toast('App deleted');
      }
    });
  });
});

function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') }
