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
  .getElementById("mail-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Ngăn chặn việc gửi form mặc định

    // Lấy giá trị từ form
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const recipient = document.getElementById("recipient").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
    const questionRange = document.getElementById("question-range").value;

    // Xử lý validate từng trường
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const recipientError = validateEmail(recipient);
    const subjectError = validateField(subject, "Chủ đề");
    const messageError = validateField(message, "Nội dung");
    const questionRangeError = validateQuestionRange(questionRange);

    // Hiển thị thông báo lỗi
    displayError("email-error", emailError);
    displayError("password-error", passwordError);
    displayError("recipient-error", recipientError);
    displayError("subject-error", subjectError);
    displayError("message-error", messageError);
    displayError("question-range-error", questionRangeError);

    if (
      !emailError &&
      !passwordError &&
      !recipientError &&
      !subjectError &&
      !messageError &&
      !questionRangeError
    ) {
      const data = {
        email,
        password,
        recipient,
        subject,
        message,
        questionRange,
      };
      ipcRenderer.send("send-data", data);
    }
  });

// Hàm validate định dạng email
function validateEmail(email) {
  if (!email) {
    return "Vui lòng nhập email của bạn.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Vui lòng nhập địa chỉ email hợp lệ.";
  }
  return "";
}

// Hàm validate mật khẩu
function validatePassword(password) {
  if (!password) {
    return "Vui lòng nhập mật khẩu của bạn.";
  }
  // Kiểm tra độ dài của mật khẩu
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  return "";
}

// Hàm validate trường bắt buộc
function validateField(value, fieldName) {
  if (!value) {
    return `Vui lòng nhập ${fieldName.toLowerCase()}.`;
  }
  return "";
}

// Hàm validate số câu hỏi
function validateQuestionRange(questionRange) {
  if (!questionRange) {
    return "Vui lòng nhập số câu hỏi bạn muốn gửi.";
  }
  const rangeRegex = /^\d+-\d+$/;
  if (!rangeRegex.test(questionRange)) {
    return "Vui lòng nhập số câu hỏi trong định dạng số-số.";
  }
  return "";
}

// Hàm hiển thị thông báo lỗi
function displayError(elementId, errorMessage) {
  const errorElement = document.getElementById(elementId);
  errorElement.innerText = errorMessage;
}

ipcRenderer.on("send-mail-success", () => {
    alert('Email đã được gửi thành công!');
    window.location.href = `../Home/index.html`;
});

ipcRenderer.on("send-mail-fail", () => {
    alert('Email đã được gửi thất bại!');
});
