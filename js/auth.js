const demoAccounts = [
    {
        role: "technical_lead",
        name: "Nguyễn Văn An",
        email: "lead@itsupport.local",
        password: "123456"
    },
    {
        role: "technician",
        name: "Trần Văn Bình",
        email: "technician@itsupport.local",
        password: "123456"
    },
    {
        role: "user",
        name: "Lê Minh Anh",
        email: "user@itsupport.local",
        password: "123456"
    }
];

function saveCurrentUser(user) {
    const safeUser = {
        email: user.email,
        name: user.name,
        role: user.role
    };

    localStorage.setItem("currentUser", JSON.stringify(safeUser));
}

function getCurrentUser() {
    const raw = localStorage.getItem("currentUser");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function isLoggedIn() {
    const user = getCurrentUser();

    return Boolean(
        user &&
        typeof user.email === "string" &&
        typeof user.name === "string" &&
        typeof user.role === "string"
    );
}

function clearCurrentUser() {
    localStorage.removeItem("currentUser");
}

const loginForm = document.querySelector(".login-form");
const errorElement = document.getElementById("login-error");

if (
    isLoggedIn() &&
    window.location.pathname.endsWith("login.html")
) {
    window.location.href = "../pages/dashboard.html";
}

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = (loginForm.email.value || "").trim();
        const password = loginForm.password.value || "";

        const account = demoAccounts.find(function (account) {
            return (
                account.email.toLowerCase() === email.toLowerCase() &&
                account.password === password
            );
        });

        if (!account) {
            if (errorElement) {
                errorElement.textContent =
                    "Email hoặc mật khẩu không chính xác.";
            }

            loginForm.password.value = "";
            return;
        }

        if (errorElement) {
            errorElement.textContent = "";
        }

        saveCurrentUser(account);

        window.location.href = "../pages/dashboard.html";
    });
}

function logout() {
    clearCurrentUser();
    window.location.href = "../pages/login.html";
}
const logoutButtons = document.querySelectorAll(".sidebar__logout");

logoutButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        logout();
    });
});
function isValidSession() {
    const user = getCurrentUser();

    if (!user) {
        return false;
    }

    if (
        typeof user.email !== "string" ||
        typeof user.name !== "string" ||
        typeof user.role !== "string"
    ) {
        return false;
    }

    if (
        !window.AppPermissions ||
        !window.AppPermissions.ROLES ||
        !window.AppPermissions.ROLES[user.role]
    ) {
        return false;
    }

    return true;
}   