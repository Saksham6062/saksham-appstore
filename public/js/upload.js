import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBSqIqhKAyRz0aTghiKs4exajVXXExN-kA",
  authDomain: "saksham-appstore-8a2bc.firebaseapp.com",
  projectId: "saksham-appstore-8a2bc",
  storageBucket: "saksham-appstore-8a2bc.firebasestorage.app",
  messagingSenderId: "864411399391",
  appId: "1:864411399391:web:5d33d77205f9e12eff656a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const appNameInput = document.getElementById("appName");
const versionInput = document.getElementById("version");
const descriptionInput = document.getElementById("description");
const apkFileInput = document.getElementById("apkFile");
const iconFileInput = document.getElementById("iconFile");
const uploadBtn = document.getElementById("uploadBtn");
const statusMsg = document.getElementById("statusMsg");

uploadBtn.addEventListener("click", async () => {
  const appName = appNameInput.value.trim();
  const version = versionInput.value.trim();
  const description = descriptionInput.value.trim();
  const apkFile = apkFileInput.files[0];
  const iconFile = iconFileInput.files[0];

  if (!appName || !version || !apkFile) {
    alert("Please fill in all required fields and select an APK file.");
    return;
  }

  statusMsg.textContent = "⏳ Uploading files...";

  try {
    // Upload APK
    const apkRef = ref(storage, `apks/${Date.now()}_${apkFile.name}`);
    await uploadBytes(apkRef, apkFile);
    const apkUrl = await getDownloadURL(apkRef);

    // Upload Icon (if provided)
    let iconUrl = "";
    if (iconFile) {
      const iconRef = ref(storage, `icons/${Date.now()}_${iconFile.name}`);
      await uploadBytes(iconRef, iconFile);
      iconUrl = await getDownloadURL(iconRef);
    }

    // Add app info to Firestore
    await addDoc(collection(db, "apps"), {
      appName,
      version,
      description,
      apkUrl,
      iconUrl,
      uploadedAt: serverTimestamp()
    });

    statusMsg.textContent = "✅ Upload successful!";

    appNameInput.value = "";
    versionInput.value = "";
    descriptionInput.value = "";
    apkFileInput.value = "";
    iconFileInput.value = "";

  } catch (error) {
    console.error("Upload failed:", error);
    statusMsg.textContent = "❌ Upload failed: " + error.message;
  }
});
