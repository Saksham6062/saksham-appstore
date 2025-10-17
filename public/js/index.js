import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

const appsContainer = document.getElementById("appsContainer");

async function loadApps() {
  appsContainer.innerHTML = "<p>Loading apps...</p>";

  try {
    const appsRef = collection(db, "apps");
    const snapshot = await getDocs(appsRef);

    if (snapshot.empty) {
      appsContainer.innerHTML = "<p>No apps found yet.</p>";
      return;
    }

    appsContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const appData = doc.data();

      const card = document.createElement("div");
      card.className = "app-card";

      card.innerHTML = `
        <img src="${appData.iconUrl || 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png'}" alt="${appData.appName}">
        <h3>${appData.appName}</h3>
        <p>${appData.description || 'No description available.'}</p>
        <span>Version: ${appData.version || '1.0.0'}</span>
        <a href="${appData.apkUrl}" class="download-btn" download>⬇ Download</a>
      `;

      appsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading apps:", error);
    appsContainer.innerHTML = "<p>Error loading apps. Please try again later.</p>";
  }
}

loadApps();
