// ---------------------------
// 1️⃣ Hardcoded developer accounts
const developers = [
  { email: "saksham@appstore.com", password: "supersecret123" }
];

// ---------------------------
// 2️⃣ Function to handle login
function login(email, password) {
  const dev = developers.find(d => d.email === email && d.password === password);

  if (dev) {
    // ✅ Save login info with expiry time (7 days)
    const sessionData = {
      loggedIn: true,
      email: email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    localStorage.setItem("devSession", JSON.stringify(sessionData));
    return true;
  }
  return false;
}

// ---------------------------
// 3️⃣ Function to check if session is valid
function isLoggedIn() {
  const data = localStorage.getItem("devSession");
  if (!data) return false;

  const session = JSON.parse(data);
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem("devSession");
    return false;
  }
  return session.loggedIn === true;
}

// ---------------------------
// 4️⃣ Function to require login (for protected pages)
function checkLogin() {
  if (!isLoggedIn()) {
    alert("Login required!");
    window.location.href = "login.html";
  }
}

// ---------------------------
// 5️⃣ Logout function
function logout() {
  localStorage.removeItem("devSession");
  window.location.href = "login.html";
}

// ---------------------------
// 6️⃣ Attach login button on login.html
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      if (login(email, password)) {
        document.getElementById("statusMsg").textContent = "✅ Login successful!";
        setTimeout(() => window.location.href = "upload.html", 1000);
      } else {
        document.getElementById("statusMsg").textContent = "❌ Invalid email or password";
      }
    });
  }
});
