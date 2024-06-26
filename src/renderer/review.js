const { ipcRenderer, ipcMain, dialog, BrowserWindow } = require("electron");
const Store = require('electron-store');

const store = new Store();
// Lắng nghe sự kiện từ main process khi danh sách PDF được gửi từ main process
ipcRenderer.on("pdf-list", (event, pdfPaths) => {
  store.set('pdfPaths', pdfPaths);
  displayPDFList(pdfPaths);
});

// Hàm hiển thị danh sách PDF
function displayPDFList(pdfPaths) {
  const fileInfo = document.getElementById("file-info");
  const fileName = store.get('fileName') || '';
  const fileNamePdf = document.createElement("p");
  fileNamePdf.textContent = `Đề: ${fileName} gồm ${pdfPaths.length} câu`;
  fileInfo.appendChild(fileNamePdf);

  for (const [index, pdfPath] of pdfPaths.entries()) {
    try {
      const thumbnailsContainer = document.getElementById("thumbnails");
      const embed = document.createElement("embed");
      embed.id = `embed${index}`;
      embed.src = `../../../${pdfPath}`;
      embed.width = "183px";
      embed.height = "258px";
      embed.classList.add("embed-pdf");
      // Tạo một button "Thông tin file" cho mỗi file PDF
      const fileInfoButton = document.createElement("button");
      fileInfoButton.textContent = `${pdfPath}`;
      fileInfoButton.classList.add("button-info-file");
      fileInfoButton.onclick = () => {
      // Xử lý sự kiện khi button "Thông tin file" được nhấp vào
        const embedContent = embed.outerHTML; // Lấy mã HTML của thẻ embed
        ipcRenderer.send("show-detail-pdf", embedContent);
      };
      // Tạo một container cho mỗi cặp embed và button
      const pdfContainer = document.createElement("div");
      pdfContainer.classList.add("pdf-container");
      pdfContainer.appendChild(embed);
      pdfContainer.appendChild(fileInfoButton);

      thumbnailsContainer.appendChild(pdfContainer);
    } catch (error) {
      console.error("Error extracting thumbnails:", error);
    }
  }
  const loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.style.display = 'none';
  document.getElementById("go-to-send-mail").addEventListener("click", () => {
    const questionRange = document.getElementById("question-range").value;
    const questionRangeError = validateQuestionRange(questionRange, pdfPaths.length);
    displayError("question-range-error", questionRangeError);
    if (!questionRangeError) {
      store.set('questionRange', questionRange);
      window.location.href = `../SendMail/index.html`;
      ipcRenderer.send('path-to-send-mail', pdfPaths);
    }
  });
}

// Hàm hiển thị thông báo lỗi
function displayError(elementId, errorMessage) {
  const errorElement = document.getElementById(elementId);
  errorElement.innerText = errorMessage;
}

// Hàm validate số câu hỏi
function validateQuestionRange(questionRange, questions) {
  if (!questionRange) {
    return "Vui lòng nhập số câu hỏi bạn muốn gửi.";
  }
  const rangeRegex = /^\d+-\d+$/;
  if (!rangeRegex.test(questionRange)) {
    return "Vui lòng nhập số câu hỏi trong định dạng số-số.";
  }
  const [start, end] = questionRange.split("-").map(Number);
  if (start < 1 || end > questions) {
    return `Số câu hỏi phải nằm trong khoảng từ 1 đến ${questions}.`;
  }

  if (start > end) {
    return "Số câu hỏi bắt đầu không thể lớn hơn số câu hỏi kết thúc.";
  }
  return "";
}

document.getElementById("go-back-btn").addEventListener("click", () => {
  ipcRenderer.send("go-back");
});
