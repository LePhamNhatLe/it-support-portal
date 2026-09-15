const demoAccounts = [
    { email: "lead@itsupport.local", password: "123456" },
    { email: "technician@itsupport.local", password: "123456" },
    { email: "user@itsupport.local", password: "123456" }
];

function normalizeAuthEmail(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getDirectoryUsers() {
    try {
        const raw = localStorage.getItem("users");
        if (!raw) return [];
        const users = JSON.parse(raw);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function getDirectoryUserByEmail(email) {
    const target = normalizeAuthEmail(email);
    if (!target) return null;
    return getDirectoryUsers().find(function (user) {
        return user && normalizeAuthEmail(user.email) === target;
    }) || null;
}

function buildSessionUser(user) {
    if (!user || typeof user !== "object") return null;
    const email = normalizeAuthEmail(user.email);
    const name = typeof user.name === "string" ? user.name.trim() : "";
    const role = typeof user.role === "string" ? user.role.trim() : "";
    if (!email || !name || !role) return null;
    return { email, name, role };
}

function saveCurrentUser(user) {
    const safeUser = buildSessionUser(user);
    if (!safeUser) return false;
    try {
        localStorage.setItem("currentUser", JSON.stringify(safeUser));
        return true;
    } catch (error) {
        return false;
    }
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem("currentUser");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

function getAuthToken() {
    if (window.AppApi && typeof window.AppApi.getToken === "function") {
        return window.AppApi.getToken();
    }
    try {
        return localStorage.getItem("authToken") || "";
    } catch (error) {
        return "";
    }
}

function saveAuthToken(token) {
    if (window.AppApi && typeof window.AppApi.setToken === "function") {
        return window.AppApi.setToken(token);
    }
    try {
        if (token) localStorage.setItem("authToken", token);
        else localStorage.removeItem("authToken");
        return true;
    } catch (error) {
        return false;
    }
}

function isLoggedIn() {
    return Boolean(buildSessionUser(getCurrentUser()) && getAuthToken());
}

function clearCurrentUser() {
    try {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
    } catch (error) {}
}

function authenticateDemoAccount(email, password) {
    const normalizedEmail = normalizeAuthEmail(email);
    const credential = demoAccounts.find(function (account) {
        return account.email === normalizedEmail && account.password === password;
    });
    if (!credential) {
        return { ok: false, reason: "invalid_credentials", message: "Email hoặc mật khẩu không chính xác.", user: null };
    }
    const directoryUser = getDirectoryUserByEmail(normalizedEmail);
    if (!directoryUser || directoryUser.status !== "active") {
        return { ok: false, reason: "account_unavailable", message: "Tài khoản không hoạt động.", user: null };
    }
    return { ok: true, reason: null, message: "Đăng nhập demo hợp lệ.", user: buildSessionUser(directoryUser) };
}

async function authenticateBackendAccount(email, password) {
    if (!window.AppApi) throw new Error("API client chưa được tải.");
    const data = await window.AppApi.post(
        "/auth/login",
        { email: normalizeAuthEmail(email), password: String(password || "") },
        { skipAuth: true }
    );
    if (!data || !data.token || !data.user) throw new Error("Backend trả về phiên đăng nhập không hợp lệ.");
    const user = buildSessionUser(data.user);
    if (!user) throw new Error("Thông tin tài khoản không hợp lệ.");
    if (!saveAuthToken(data.token) || !saveCurrentUser(user)) {
        clearCurrentUser();
        throw new Error("Không thể lưu phiên đăng nhập trên trình duyệt.");
    }
    return { ok: true, user, token: data.token };
}

function isValidSession() {
    const current = buildSessionUser(getCurrentUser());
    if (!current || !getAuthToken()) return false;
    if (!window.AppPermissions || !window.AppPermissions.ROLES) return false;
    return Boolean(window.AppPermissions.ROLES[current.role]);
}

async function refreshSession() {
    if (!window.AppApi || !getAuthToken()) return false;
    try {
        const user = await window.AppApi.get("/auth/me");
        return Boolean(user && saveCurrentUser(user));
    } catch (error) {
        clearCurrentUser();
        return false;
    }
}

function logout() {
    clearCurrentUser();
    window.location.href = "login.html";
}

const loginForm = document.querySelector(".login-form");
const errorElement = document.getElementById("login-error");

if (window.location.pathname.endsWith("login.html") && isValidSession()) {
    window.location.href = "dashboard.html";
}

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (loginForm.dataset.pending === "true") return;
        loginForm.dataset.pending = "true";
        const submit = loginForm.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        if (errorElement) errorElement.textContent = "Đang xác thực...";

        try {
            await authenticateBackendAccount(loginForm.email.value || "", loginForm.password.value || "");
            if (errorElement) errorElement.textContent = "";
            window.location.href = "dashboard.html";
        } catch (error) {
            if (errorElement) errorElement.textContent = error.message || "Đăng nhập thất bại.";
            loginForm.password.value = "";
        } finally {
            loginForm.dataset.pending = "false";
            if (submit) submit.disabled = false;
        }
    });
}

const logoutButtons = document.querySelectorAll(".sidebar__logout");
logoutButtons.forEach(function (button) {
    button.addEventListener("click", logout);
});

window.AppAuth = {
    demoAccounts,
    normalizeEmail: normalizeAuthEmail,
    getDirectoryUsers,
    getDirectoryUserByEmail,
    buildSessionUser,
    authenticateDemoAccount,
    authenticateBackendAccount,
    saveCurrentUser,
    getCurrentUser,
    getAuthToken,
    isLoggedIn,
    isValidSession,
    refreshSession,
    clearCurrentUser,
    logout
};
