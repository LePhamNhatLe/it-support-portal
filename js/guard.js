// Kiểm tra đăng nhập cho các trang bên trong hệ thống
function protectPage() {
  if (typeof isLoggedIn !== "function") {
    return;
  }

  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

protectPage();
