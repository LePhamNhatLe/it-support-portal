const demoAccounts = [
    {
        email: "lead@itsupport.local",
        password: "123456"
    },
    {
        email: "technician@itsupport.local",
        password: "123456"
    },
    {
        email: "user@itsupport.local",
        password: "123456"
    }
];

function normalizeAuthEmail(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getDirectoryUsers() {
    try {
        const raw = localStorage.getItem("users");
        if (!raw) {
            return [];
        }
        const users = JSON.parse(raw);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function getDirectoryUserByEmail(email) {
    const target = normalizeAuthEmail(email);
    if (!target) {
        return null;
    }

    return getDirectoryUsers().find(function (user) {
        return user && normalizeAuthEmail(user.email) === target;
    }) || null;
}

function buildSessionUser(user) {
    if (!user || typeof user !== "object") {
        return null;
    }

    const email = normalizeAuthEmail(user.email);
    const name = typeof user.name === "string" ? user.name.trim() : "";
    const role = typeof user.role === "string" ? user.role.trim() : "";

    if (!email || !name || !role) {
        return null;
    }

    return { email, name, role };
}

function saveCurrentUser(user) {
    const safeUser = buildSessionUser(user);
    if (!safeUser) {
        return false;
    }

    try {
        localStorage.setItem("currentUser", JSON.stringify(safeUser));
        return true;
    } catch (error) {
        return false;
    }
}

function getCurrentUser() {
    const raw = localStorage.getItem("currentUser");

    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

function isLoggedIn() {
    return Boolean(buildSessionUser(getCurrentUser()));
}

function clearCurrentUser() {
    localStorage.removeItem("currentUser");
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
    if (!directoryUser) {
        return { ok: false, reason: "account_not_found", message: "Tài khoản không còn tồn tại trong danh sách người dùng.", user: null };
    }

    if (directoryUser.status === "locked") {
        return { ok: false, reason: "account_locked", message: "Tài khoản đang bị khóa.", user: null };
    }

    if (directoryUser.status !== "active") {
        return { ok: false, reason: "account_disabled", message: "Tài khoản đã bị vô hiệu hóa.", user: null };
    }

    const sessionUser = buildSessionUser(directoryUser);
    if (!sessionUser) {
        return { ok: false, reason: "invalid_account", message: "Thông tin tài khoản không hợp lệ.", user: null };
    }

    return { ok: true, reason: null, message: "Đăng nhập thành công.", user: sessionUser };
}

function isValidSession() {
    const current = buildSessionUser(getCurrentUser());

    if (!current) {
        return false;
    }

    if (
        !window.AppPermissions ||
        !window.AppPermissions.ROLES
    ) {
        return false;
    }

    const directoryUser = getDirectoryUserByEmail(current.email);
    if (!directoryUser || directoryUser.status !== "active") {
        return false;
    }

    const canonical = buildSessionUser(directoryUser);
    if (!canonical || !window.AppPermissions.ROLES[canonical.role]) {
        return false;
    }

    if (
        current.name !== canonical.name ||
        current.role !== canonical.role ||
        current.email !== canonical.email
    ) {
        saveCurrentUser(canonical);
    }

    return true;
}

function logout() {
    clearCurrentUser();
    window.location.href = "login.html";
}

const loginForm = document.querySelector(".login-form");
const errorElement = document.getElementById("login-error");

if (
    window.location.pathname.endsWith("login.html") &&
    isValidSession()
) {
    window.location.href = "dashboard.html";
}

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = loginForm.email.value || "";
        const password = loginForm.password.value || "";
        const result = authenticateDemoAccount(email, password);

        if (!result.ok || !result.user) {
            if (errorElement) {
                errorElement.textContent = result.message;
            }
            loginForm.password.value = "";
            return;
        }

        if (!saveCurrentUser(result.user)) {
            if (errorElement) {
                errorElement.textContent = "Không thể lưu phiên đăng nhập trên trình duyệt.";
            }
            return;
        }

        if (errorElement) {
            errorElement.textContent = "";
        }

        window.location.href = "dashboard.html";
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
    saveCurrentUser,
    getCurrentUser,
    isLoggedIn,
    isValidSession,
    clearCurrentUser
};
