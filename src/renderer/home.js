const { ipcRenderer } = require("electron");

document.getElementById("open-file").addEventListener("click", () => {
  ipcRenderer.send("open-file-dialog");
});

ipcRenderer.on("open-file-selected", (event, filePath) => {
  ipcRenderer.send('file-path', filePath);
  window.location.href = `../Review/index.html`;
});

const dropArea = document.getElementById("drop-area");

// Ngăn sự kiện mặc định khi kéo và thả
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight khu vực khi có tệp được kéo đến
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

// Loại bỏ highlight khi không còn tệp được kéo đến
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

// Xử lý khi tệp được thả vào khu vực
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const files = e.dataTransfer.files;
  if (files.length === 1) {
    const fileName = files[0].name;
    // Kiểm tra nếu tên tệp kết thúc bằng một trong các phần mở rộng của file Word
    if (/\.(doc|docx|dot|dotx|dotm)$/i.test(fileName)) {
      // Xử lý chỉ khi có một file Word
      const file = files[0];
      console.log('Dropped file:', file);
      // Xử lý tệp ở đây
      ipcRenderer.send('file-path', file?.path);
      window.location.href = `../Review/index.html`;
    } else {
      alert('Vui lòng chỉ thả một file Word (.doc, .docx, .dot, .dotx, .dotm).');
    }
  } else {
    alert('Vui lòng chỉ thả một file Word (.doc, .docx, .dot, .dotx, .dotm).');
  }
}

