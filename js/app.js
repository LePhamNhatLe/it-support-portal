(function () {
    const target = typeof window.isValidSession === "function" && window.isValidSession()
        ? "pages/dashboard.html"
        : "pages/login.html";

    window.location.replace(target);
})();
