// ---------------------------
// 1️⃣ Hardcoded developer accounts
// Add as many developers as you want
const developers = [
  { email: "dev1@example.com", password: "123456" },
  { email: "dev2@example.com", password: "1234567" },
  { email: "dev3@example.com", password: "12345678" },
  { email: "dev4@example.com", password: "123456789" }
];

// ---------------------------
// 2️⃣ Grab input fields and button from login.html
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const statusMsg = document.getElementById("statusMsg");

// ---------------------------
// 3️⃣ Login button click event
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Find developer in list
  const dev = developers.find(d => d.email === email && d.password === password);

  if (dev) {
    // ✅ Successful login
    localStorage.setItem("devLoggedIn", "true");
    localStorage.setItem("devEmail", email); // optional
    statusMsg.textContent = "✅ Login successful!";
    setTimeout(() => { window.location.href = "upload.html"; }, 1000);
  } else {
    // ❌ Invalid credentials
    statusMsg.textContent = "❌ Invalid email or password";
  }
});

// ---------------------------
// 4️⃣ Function to check login on protected pages (upload.html)
function checkLogin() {
  if (localStorage.getItem("devLoggedIn") !== "true") {
    alert("Login required!");
    window.location.href = "login.html";
  }
}

// ---------------------------
// 5️⃣ Logout function (optional)
function logout() {
  localStorage.removeItem("devLoggedIn");
  localStorage.removeItem("devEmail");
  window.location.href = "login.html";
}
