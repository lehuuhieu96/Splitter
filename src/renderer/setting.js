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
    const styleSplit = document.getElementById('style-split').value;
    const imageFile = document.getElementById('image').files[0];
    const imageHeaderInput = document.getElementById('image-header-input').files[0];
    const imageFooterInput = document.getElementById('image-footer-input').files[0];
    const imgElement = document.getElementById('preview-image');
    const imgHeaderElement = document.getElementById('preview-image-header');
    const imgFooterElement = document.getElementById('preview-image-footer');
    const imageBackground = imgElement?.src.startsWith('data:image') ? imgElement?.src : '';
    const imageHeader = imgHeaderElement?.src.startsWith('data:image') ? imgHeaderElement?.src : '';
    const imageFooter = imgFooterElement?.src.startsWith('data:image') ? imgFooterElement?.src : '';

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
        styleSplit,
        imageBackground,
        imageHeader,
        imageFooter
      };
      ipcRenderer.send("save-data", data);
    }

    if (imageFile) {
      // Tạo một FileReader object
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
        const imageBackground = event.target.result;
        // Ở đây bạn có thể làm bất kỳ điều gì với URL của hình ảnh
        ipcRenderer.send("save-image-background", imageBackground);
      };
      reader.readAsDataURL(imageFile);
      // Đọc hình ảnh dưới dạng Data URL
    }

    if (imageHeaderInput) {
      // Tạo một FileReader object
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
        const imageFooter = event.target.result;
        // Ở đây bạn có thể làm bất kỳ điều gì với URL của hình ảnh
        ipcRenderer.send("save-image-header", imageFooter);
      };
      reader.readAsDataURL(imageHeaderInput);
      // Đọc hình ảnh dưới dạng Data URL
    }

    if (imageFooterInput) {
      // Tạo một FileReader object
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
        const imageHeader = event.target.result;
        // Ở đây bạn có thể làm bất kỳ điều gì với URL của hình ảnh
        ipcRenderer.send("save-image-footer", imageHeader);
      };
      reader.readAsDataURL(imageFooterInput);
      // Đọc hình ảnh dưới dạng Data URL
    }
  });

// Hàm validate định dạng email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return "Vui lòng nhập địa chỉ email hợp lệ.";
  }
  return "";
}

// Hàm validate mật khẩu
function validatePassword(password) {
  // Kiểm tra độ dài của mật khẩu
  if (password && password.length < 6) {
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
  document.getElementById("email").value = data?.email || "";
  document.getElementById("password").value =
    data?.password || "";
  document.getElementById("link").value = data?.link || "";
  document.getElementById("header").value = data?.header || "";
  document.getElementById("footer").value = data?.footer || "";
  document.getElementById("watermark").value =
    data?.watermark || "";
  const imgElement = document.getElementById("preview-image");
  if(data?.imageBackground) {
    imgElement.src = data?.imageBackground;
    imgElement.style.display = 'block'; // Hiển thị thẻ <img
  }
  const imgHearderElement = document.getElementById("preview-image-header");
  if(data?.imageHeader) {
    imgHearderElement.src = data?.imageHeader;
    imgHearderElement.style.display = 'block'; // Hiển thị thẻ <img
  }
  const imgFooterElement = document.getElementById("preview-image-footer");
  if(data?.imageFooter) {
    imgFooterElement.src = data?.imageFooter;
    imgFooterElement.style.display = 'block'; // Hiển thị thẻ <img
  }
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
  const imgElement = document.getElementById("preview-image");
  imgElement.style.display = 'none';
  const imgHeaderElement = document.getElementById("preview-image-header");
  imgHeaderElement.style.display = 'none';
  const imgFooterElement = document.getElementById("preview-image-footer");
  imgFooterElement.style.display = 'none';
});

// Lắng nghe sự kiện khi người dùng chọn file hình ảnh
document.getElementById('image').addEventListener('change', function(event) {
  // Kiểm tra xem có file nào đã được chọn hay không
  if (event.target.files && event.target.files[0]) {
      // Tạo một đối tượng FileReader để đọc file hình ảnh
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
          // Lấy URL của hình ảnh được chọn
          const imageUrl = event.target.result;
          // Hiển thị hình ảnh trong thẻ img
          const imgElement = document.getElementById('preview-image');
          imgElement.src = imageUrl;
          imgElement.style.display = 'block'; // Hiển thị thẻ <img>
      };
      // Đọc file hình ảnh dưới dạng Data URL
      reader.readAsDataURL(event.target.files[0]);
  }
});

// Lắng nghe sự kiện khi người dùng chọn file hình ảnh
document.getElementById('image-header-input').addEventListener('change', function(event) {
  // Kiểm tra xem có file nào đã được chọn hay không
  if (event.target.files && event.target.files[0]) {
      // Tạo một đối tượng FileReader để đọc file hình ảnh
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
          // Lấy URL của hình ảnh được chọn
          const imageUrl = event.target.result;
          // Hiển thị hình ảnh trong thẻ img
          const imgElement = document.getElementById('preview-image-header');
          imgElement.src = imageUrl;
          imgElement.style.display = 'block'; // Hiển thị thẻ <img>
      };
      // Đọc file hình ảnh dưới dạng Data URL
      reader.readAsDataURL(event.target.files[0]);
  }
});

// Lắng nghe sự kiện khi người dùng chọn file hình ảnh
document.getElementById('image-footer-input').addEventListener('change', function(event) {
  // Kiểm tra xem có file nào đã được chọn hay không
  if (event.target.files && event.target.files[0]) {
      // Tạo một đối tượng FileReader để đọc file hình ảnh
      const reader = new FileReader();
      // Định nghĩa hàm callback được gọi khi việc đọc hình ảnh hoàn tất
      reader.onload = function(event) {
          // Lấy URL của hình ảnh được chọn
          const imageUrl = event.target.result;
          // Hiển thị hình ảnh trong thẻ img
          const imgElement = document.getElementById('preview-image-footer');
          imgElement.src = imageUrl;
          imgElement.style.display = 'block'; // Hiển thị thẻ <img>
      };
      // Đọc file hình ảnh dưới dạng Data URL
      reader.readAsDataURL(event.target.files[0]);
  }
});

