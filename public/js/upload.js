// upload.js - public upload logic
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const db = getFirestore();
const storage = getStorage();

const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const uploadState = document.getElementById('uploadState');

const appNameInput = document.getElementById('appName');
const versionInput = document.getElementById('version');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('category');
const apkFileInput = document.getElementById('apkFile');
const iconFileInput = document.getElementById('iconFile');
const screenshotsInput = document.getElementById('screenshots');
const developerNameInput = document.getElementById('developerName');
const toastEl = document.getElementById('toast');

function toast(msg, t=3000){ toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'), t); }

uploadBtn.addEventListener('click', async ()=>{
  const appName = appNameInput.value.trim();
  const version = versionInput.value.trim();
  const description = descriptionInput.value.trim();
  const category = categoryInput.value.trim();
  const developer = developerNameInput.value.trim() || 'Anonymous';
  const apkFile = apkFileInput.files[0];
  const iconFile = iconFileInput.files[0];
  const screenshots = Array.from(screenshotsInput.files || []);

  if(!appName || !version || !apkFile){ toast('Fill required fields and choose APK'); return; }
  try {
    uploadState.textContent = 'Uploading APK...';
    progressBar.style.width = '0%';
    const apkPath = `public_apks/${Date.now()}_${sanitize(apkFile.name)}`;
    const apkRef = ref(storage, apkPath);
    const apkUrl = await uploadFileWithProgress(apkRef, apkFile);

    let iconUrl = '';
    if(iconFile){
      const iconRef = ref(storage, `public_icons/${Date.now()}_${sanitize(iconFile.name)}`);
      iconUrl = await uploadFileWithProgress(iconRef, iconFile);
    }

    const screenshotsUrls = [];
    for(let i=0;i<screenshots.length;i++){
      const s = screenshots[i];
      const sRef = ref(storage, `public_screenshots/${Date.now()}_${i}_${sanitize(s.name)}`);
      const su = await uploadFileWithProgress(sRef, s);
      screenshotsUrls.push(su);
    }

    // save doc (approved instantly)
    await addDoc(collection(db,'apps'), {
      appName, version, description, category, apkUrl, iconUrl, screenshots: screenshotsUrls,
      uploadedBy: developer, createdAt: serverTimestamp(), downloads: 0, rating: { avg:0, count:0 }
    });

    progressBar.style.width='100%';
    uploadState.textContent = 'Upload complete';
    toast('App uploaded and is live');
    // clear
    appNameInput.value=''; versionInput.value=''; descriptionInput.value=''; apkFileInput.value=''; iconFileInput.value=''; screenshotsInput.value=''; developerNameInput.value='';
  } catch(err){
    console.error(err);
    toast('Upload failed: ' + (err.message||err));
    uploadState.textContent = 'Upload failed';
  }
});

function uploadFileWithProgress(refObj, file){
  return new Promise((resolve,reject)=>{
    const task = uploadBytesResumable(refObj, file);
    task.on('state_changed', snapshot=>{
      const p = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
      document.getElementById('progressBar').style.width = p + '%';
    }, reject, async ()=>{
      const url = await getDownloadURL(task.snapshot.ref);
      resolve(url);
    });
  });
}

function sanitize(n){ return n.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9._-]/g,''); }
