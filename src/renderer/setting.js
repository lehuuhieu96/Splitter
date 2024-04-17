const { ipcRenderer } = require("electron");

document
  .getElementById("show-password")
  .addEventListener("change", function (event) {
    const passwordInput = document.getElementById("password");
    const showPasswordCheckbox = document.getElementById("show-password");

    if (showPasswordCheckbox.checked) {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }
  });

document
  .getElementById("setting-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Ngăn chặn việc gửi form mặc định

    // Lấy giá trị từ form
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const link = document.getElementById("link").value;
    const header = document.getElementById("header").value;
    const footer = document.getElementById("footer").value;
    const watermark = document.getElementById("watermark").value;

    // Xử lý validate từng trường
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    // Hiển thị thông báo lỗi
    displayError("email-setting-error", emailError);
    displayError("password-setting-error", passwordError);

    if (!emailError && !passwordError) {
      const data = {
        email,
        password,
        link,
        header,
        footer,
        watermark,
      };
      ipcRenderer.send("save-data", data);
    }
  });

// Hàm validate định dạng email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Vui lòng nhập địa chỉ email hợp lệ.";
  }
  return "";
}

// Hàm validate mật khẩu
function validatePassword(password) {
  // Kiểm tra độ dài của mật khẩu
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  return "";
}

// Hàm hiển thị thông báo lỗi
function displayError(elementId, errorMessage) {
  const errorElement = document.getElementById(elementId);
  errorElement.innerText = errorMessage;
}

ipcRenderer.on("data-loaded", (event, data) => {
  // Sử dụng dữ liệu tại đây
  document.getElementById("email").value = data[data.length - 1]?.email || "";
  document.getElementById("password").value =
    data[data.length - 1]?.password || "";
  document.getElementById("link").value = data[data.length - 1]?.link || "";
  document.getElementById("header").value = data[data.length - 1]?.header || "";
  document.getElementById("footer").value = data[data.length - 1]?.footer || "";
  document.getElementById("watermark").value =
    data[data.length - 1]?.watermark || "";
});

document.getElementById("go-back-btn").addEventListener("click", () => {
  ipcRenderer.send("go-back");
});

document.getElementById("delete").addEventListener("click", () => {
  ipcRenderer.send("delete-data");
});

ipcRenderer.on("data-deleted", () => {
  // Sử dụng dữ liệu tại đây
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("link").value = "";
  document.getElementById("header").value = "";
  document.getElementById("footer").value = "";
  document.getElementById("watermark").value = "";
});
