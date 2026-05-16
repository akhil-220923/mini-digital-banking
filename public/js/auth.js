/**
 * auth.js
 * Handles Registration, Login, OTP simulation and Session Management
 */

const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000/api"
  : https://mini-banking-backend.onrender.com/api"; // ⚠️ Replace with your Render URL after deployment
const SESSION_KEY = "nexusSession";

/* ===============================
   USER REGISTRATION
================================ */





async function handleRegistration(e) {

  e.preventDefault();

  const name = document.getElementById("regName")?.value.trim() || "";
  const email = document.getElementById("regEmail")?.value.trim() || "";
  const phone = document.getElementById("regPhone")?.value.trim() || "";
  const balance = document.getElementById("regBalance")?.value || "";
  const mpin = document.getElementById("regMpin")?.value || "";
  const password = document.getElementById("regPassword")?.value || "";
  const dob = document.getElementById("regDob")?.value || "";
  const aadhaarNumber = document.getElementById("regAadhaar")?.value.trim() || "";
  const gender = document.getElementById("regGender")?.value || "";
  const q1 = document.getElementById("regQuestion1")?.value || "";
  const a1 = document.getElementById("regAnswer1")?.value.trim() || "";
  const q2 = document.getElementById("regQuestion2")?.value || "";
  const a2 = document.getElementById("regAnswer2")?.value.trim() || "";

  // New branch fields
  const branch = document.getElementById("regBranch")?.value || "";
  const branchAddress = document.getElementById("regBranchAddress")?.value || "";
  const branchPincode = document.getElementById("regBranchPincode")?.value || "";

  if (branch) {
    localStorage.setItem('selectedBranch', branch);
  }

  const errorDiv = document.getElementById("regGlobalError");

  // Validate Age (Must be 18+)
  if (!dob) {
    if (errorDiv) { errorDiv.innerText = "Please enter your Date of Birth."; errorDiv.style.display = "block"; }
    return;
  } else {
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    if (age < 18) {
      if (errorDiv) { errorDiv.innerText = "You must be at least 18 years old to register."; errorDiv.style.display = "block"; }
      return;
    }
  }

  // Only check MPIN if the field exists, otherwise use password
  if (document.getElementById("regMpin")) {
    if (!mpin || mpin.length !== 6) {
      if (errorDiv) { errorDiv.innerText = "Please enter a 6-digit MPIN."; errorDiv.style.display = "block"; }
      return;
    }
  } else if (document.getElementById("regPassword")) {
    if (!password || password.length < 6) {
      if (errorDiv) { errorDiv.innerText = "Please enter a valid password (min 6 chars)."; errorDiv.style.display = "block"; }
      return;
    }
  }

  if (q1 === q2) {
    if (errorDiv) { errorDiv.innerText = "Please select two different security questions."; errorDiv.style.display = "block"; }
    return;
  }

  if (errorDiv) { errorDiv.style.display = "none"; }

  try {

    const response = await fetch(`${API_URL}/register`, {

      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        balance,
        mpin,
        password,
        dob,
        aadhaarNumber,
        gender,
        branch,
        branchAddress,
        branchPincode,
        securityQuestions: [
          { question: q1, answer: a1 },
          { question: q2, answer: a2 }
        ]
      })
    });

    let data;
    try {
      const textResponse = await response.text();
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        // Fallback for when backend just sends plain text like "Registered"
        data = { status: response.ok ? "active" : "error", message: textResponse };
      }
    } catch (e) {
      data = {};
    }

    if (response.ok || data.message === "Registered") {
      // Registration submitted — redirect to login with pending status
      window.location.href = "login.html?status=pending&email=" + encodeURIComponent(email);
    } else if (data.status === "pending") {
      if (errorDiv) { errorDiv.innerText = "A registration request with this email is already pending approval."; errorDiv.style.display = "block"; }
    } else if (data.status === "rejected") {
      if (errorDiv) { errorDiv.innerText = "Your previous registration was rejected. Please contact the bank."; errorDiv.style.display = "block"; }
    } else {
      if (errorDiv) { errorDiv.innerText = data.message || "Registration failed."; errorDiv.style.display = "block"; }
    }

  } catch (error) {
    console.error(error);
    if (errorDiv) { errorDiv.innerText = "Server error. Please try again."; errorDiv.style.display = "block"; }
  }

}

/* ===============================
   FORGOT PASSWORD
================================ */

/* ===============================
   FORGOT MPIN VIA SECURITY QUESTIONS
================================ */

async function handleFetchQuestions() {
  const email = document.getElementById("forgotEmail").value.trim();
  const errorDiv = document.getElementById("forgotError");
  const successDiv = document.getElementById("forgotSuccess");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!email) {
    showError(errorDiv, "Please enter your email.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/get-security-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("q1Label").innerText = data.questions[0];
      document.getElementById("q2Label").innerText = data.questions[1];
      document.getElementById("step1").style.display = "none";
      document.getElementById("step2").style.display = "block";
      successDiv.innerText = "Questions fetched successfully.";
      successDiv.style.display = "block";
    } else {
      showError(errorDiv, data.message || "User not found.");
    }
  } catch (error) {
    showError(errorDiv, "Server error. Please try again.");
  }
}

async function handleVerifyAnswers() {
  const email = document.getElementById("forgotEmail").value.trim();
  const ans1 = document.getElementById("ans1").value.trim();
  const ans2 = document.getElementById("ans2").value.trim();
  const errorDiv = document.getElementById("forgotError");
  const successDiv = document.getElementById("forgotSuccess");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!ans1 || !ans2) {
    showError(errorDiv, "Please answer both questions.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/verify-security-answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, answers: [ans1, ans2] })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("step2").style.display = "none";
      document.getElementById("step3").style.display = "block";
      successDiv.innerText = "Answers verified. Please set your new MPIN.";
      successDiv.style.display = "block";
    } else {
      showError(errorDiv, data.message || "Invalid answers.");
    }
  } catch (error) {
    showError(errorDiv, "Server error. Please try again.");
  }
}

async function handleResetMpin() {
  const email = document.getElementById("forgotEmail").value.trim();
  const newMpin = document.getElementById("newMpin").value;
  const confirmMpin = document.getElementById("confirmMpin").value;
  const errorDiv = document.getElementById("forgotError");
  const successDiv = document.getElementById("forgotSuccess");

  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  if (!newMpin || !confirmMpin) {
    showError(errorDiv, "Please enter and confirm your new MPIN.");
    return;
  }

  if (newMpin !== confirmMpin) {
    showError(errorDiv, "MPINs do not match.");
    return;
  }

  if (newMpin.length !== 6 || !/^\d+$/.test(newMpin)) {
    showError(errorDiv, "MPIN must be exactly 6 digits.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/reset-mpin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, newMPIN: newMpin })
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.innerText = "MPIN reset successful. Redirecting to login...";
      successDiv.style.display = "block";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showError(errorDiv, data.message || "Failed to reset MPIN.");
    }
  } catch (error) {
    showError(errorDiv, "Server error. Please try again.");
  }
}

/* ===============================
   LOGIN WITH PASSWORD
================================ */

async function handleFinalLogin(e) {

  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const mpin = document.getElementById("loginMpin").value;
  const errorDiv = document.getElementById("loginError");
  const statusBanner = document.getElementById("loginStatusBanner");

  errorDiv.style.display = "none";
  if (statusBanner) statusBanner.style.display = "none";

  if (!email || !mpin || mpin.length !== 6) {
    showError(errorDiv, "Please enter email and 6-digit MPIN");
    return;
  }

  try {

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, mpin })
    });

    const data = await response.json();

    if (response.ok && data.status === "active") {
      // Sync with frontend legacy localStorage array so app.js doesn't crash
      let mockUsers = JSON.parse(localStorage.getItem('nexusUsers')) || [];
      let userId = data.user?.id || data.user?._id || data.userId || data.token;
      let existing = mockUsers.find(u => u.id === userId);
      if (!existing && data.user) {
        mockUsers.push({
          id: userId,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          balance: data.user.balance || 0,
          dob: data.user.dob,
          aadhaarNumber: data.user.aadhaarNumber,
          gender: data.user.gender,
          branch: localStorage.getItem('selectedBranch') || data.user.branch || '',
          accountNumber: data.user.accountNumber,
          transactions: [],
          notifications: []
        });
        localStorage.setItem('nexusUsers', JSON.stringify(mockUsers));
      } else if (existing) {
        existing.branch = localStorage.getItem('selectedBranch') || existing.branch || '';
        localStorage.setItem('nexusUsers', JSON.stringify(mockUsers));
      }
      startSession(userId, data.token);
    } else if (response.status === 403 && data.status === "pending") {
      showStatusBanner(statusBanner, "pending", data.message);
    } else if (response.status === 403 && data.status === "rejected") {
      showStatusBanner(statusBanner, "rejected", data.message);
    } else {
      showError(errorDiv, data.message || "Invalid credentials");
    }

  } catch (err) {
    showError(errorDiv, "Server error. Please try again later.");
  }

}


/* ===============================
   START SESSION
================================ */

function startSession(userId, tokenstr) {

  const token = tokenstr || ("token_" + Math.random().toString(36).substr(2));

  const session = {

    userId: userId,
    token: token,
    expiresAt: Date.now() + (1000 * 60 * 60 * 24) // 24 hours to match backend expiresIn: "1d"

  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  window.location.href = "dashboard.html";

}

/* ===============================
   LOGOUT
================================ */

function logout() {

  localStorage.removeItem(SESSION_KEY);

  window.location.href = "login.html";

}

/* ===============================
   PROTECT DASHBOARD
================================ */
function requireAuth() {

  // ✅ Step 2: Normal session check
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));

  if (!session || Date.now() > session.expiresAt) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
    return null;
  }

  return session.userId;
}

/* ===============================
   REDIRECT IF ALREADY LOGIN
================================ */

function redirectIfAuthenticated() {

  const session = JSON.parse(localStorage.getItem(SESSION_KEY));

  if (session && Date.now() < session.expiresAt) {

    window.location.href = "dashboard.html";

  }

}

/* ===============================
   SHOW ERROR
================================ */

function showError(element, message) {

  element.innerText = message;

  element.style.display = "block";

}

/* ===============================
   SHOW STATUS BANNER (Accountant Approval)
================================ */

function showStatusBanner(element, status, message) {
  if (!element) return;

  const configs = {
    pending: {
      bg: "rgba(245, 166, 35, 0.12)",
      border: "rgba(245, 166, 35, 0.5)",
      icon: "fa-clock",
      iconColor: "#f5a623",
      badgeText: "Pending",
      badgeBg: "rgba(245, 166, 35, 0.2)",
      badgeColor: "#c47d0e"
    },
    rejected: {
      bg: "rgba(255, 59, 48, 0.1)",
      border: "rgba(255, 59, 48, 0.4)",
      icon: "fa-times-circle",
      iconColor: "#ff3b30",
      badgeText: "Rejected",
      badgeBg: "rgba(255, 59, 48, 0.15)",
      badgeColor: "#cc2d24"
    },
    approved: {
      bg: "rgba(52, 199, 89, 0.1)",
      border: "rgba(52, 199, 89, 0.4)",
      icon: "fa-check-circle",
      iconColor: "#34c759",
      badgeText: "Approved",
      badgeBg: "rgba(52, 199, 89, 0.15)",
      badgeColor: "#2a9e47"
    }
  };

  const c = configs[status] || configs.pending;

  element.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:12px;">
            <i class="fas ${c.icon}" style="color:${c.iconColor}; font-size:1.3rem; margin-top:2px; flex-shrink:0;"></i>
            <div>
                <span style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; letter-spacing:0.5px; background:${c.badgeBg}; color:${c.badgeColor}; margin-bottom:6px; text-transform:uppercase;">
                    ${c.badgeText}
                </span>
                <p style="margin:0; font-size:0.92rem; color:var(--text-main);">${message}</p>
            </div>
        </div>
    `;
  element.style.cssText = `display:block; background:${c.bg}; border:1px solid ${c.border}; border-radius:10px; padding:14px 16px; margin-bottom:16px;`;
}


/* ===============================
   AUTO CHECK LOGIN
================================ */

/* ===============================
   RANDOMIZED NUMERIC KEYPAD LOGIC
   ================================ */

let currentMpinInput = "";

function initializeKeypad() {
  const keypadContainer = document.getElementById("numericKeypad");
  if (!keypadContainer) return;

  renderKeypad();
}

function renderKeypad() {
  const keypadContainer = document.getElementById("numericKeypad");
  if (!keypadContainer) return;

  // Numbers 0-9
  let numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Fisher-Yates Shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  keypadContainer.innerHTML = "";

  // Create buttons for shuffled numbers
  numbers.forEach(num => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "key-btn";
    btn.innerText = num;
    btn.onclick = () => handleKeyClick(num);
    keypadContainer.appendChild(btn);
  });

  // Add Clear button
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "key-btn action-btn clear-btn";
  clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  clearBtn.onclick = clearMpin;
  keypadContainer.appendChild(clearBtn);

  // Add Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "key-btn action-btn delete-btn";
  deleteBtn.innerHTML = '<i class="fas fa-backspace"></i>';
  deleteBtn.onclick = deleteLastDigit;
  keypadContainer.appendChild(deleteBtn);
}

function handleKeyClick(num) {
  if (currentMpinInput.length < 6) {
    currentMpinInput += num;
    updateMpinDisplay();

    // Auto-shuffle on every click for extra security (optional, but SBI does it sometimes)
    // renderKeypad(); 
  }
}

function deleteLastDigit() {
  currentMpinInput = currentMpinInput.slice(0, -1);
  updateMpinDisplay();
}

function clearMpin() {
  currentMpinInput = "";
  updateMpinDisplay();
}

function updateMpinDisplay() {
  const dots = document.querySelectorAll(".mpin-dot");
  const mpinHiddenInput = document.getElementById("loginMpin");

  dots.forEach((dot, index) => {
    if (index < currentMpinInput.length) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });

  if (mpinHiddenInput) {
    mpinHiddenInput.value = currentMpinInput;
  }
}

/* ===============================
   SECURITY QUESTIONS UI LOGIC
   ================================ */

function initializeSecurityQuestions() {
  const q1Select = document.getElementById("regQuestion1");
  const q2Select = document.getElementById("regQuestion2");

  if (!q1Select || !q2Select) return;

  function updateOptions() {
    const val1 = q1Select.value;
    const val2 = q2Select.value;

    // Since the lists are now completely different, we don't strictly need to disable 
    // options in the other dropdown unless there is overlap.
    // However, we keep the robust check just in case.

    // Reset both first
    Array.from(q1Select.options).forEach(opt => {
      if (opt.value) opt.disabled = false;
    });
    Array.from(q2Select.options).forEach(opt => {
      if (opt.value) opt.disabled = false;
    });

    // Disable selected in the other (only if the value exists in the other set)
    if (val1) {
      const optToDisable = Array.from(q2Select.options).find(opt => opt.value === val1);
      if (optToDisable) {
        optToDisable.disabled = true;
        if (q2Select.value === val1) q2Select.selectedIndex = 0;
      }
    }
    if (val2) {
      const optToDisable = Array.from(q1Select.options).find(opt => opt.value === val2);
      if (optToDisable) {
        optToDisable.disabled = true;
        if (q1Select.value === val2) q1Select.selectedIndex = 0;
      }
    }
  }

  q1Select.addEventListener("change", updateOptions);
  q2Select.addEventListener("change", updateOptions);
  updateOptions();
}

/* ===============================
   AUTO INITIALIZE
   ================================ */

if (window.location.pathname.includes("login.html") ||
  window.location.pathname.includes("register.html")) {

  redirectIfAuthenticated();

  if (window.location.pathname.includes("login.html")) {
    window.addEventListener('DOMContentLoaded', initializeKeypad);
  }

  if (window.location.pathname.includes("register.html")) {
    window.addEventListener('DOMContentLoaded', initializeSecurityQuestions);
  }
}