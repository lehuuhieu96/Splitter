const { ipcRenderer, dialog, BrowserWindow } = require("electron");

// Lắng nghe sự kiện từ main process khi danh sách PDF được gửi từ main process
ipcRenderer.on("pdf-list", (event, pdfPaths) => {
  const fileInfo = document.getElementById("file-info");
  const fileName = pdfPaths[0].slice(6, -4);
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

  document.getElementById("go-to-send-mail").addEventListener("click", () => {
    window.location.href = `../SendMail/index.html`;
    ipcRenderer.send('path-to-send-mail', pdfPaths);
  });
});


ipcRenderer.on("loading-pdf-success", () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.style.display = 'none';
});

ipcRenderer.on("loading-pdf-fail", () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  loadingOverlay.style.display = 'none';
});

document.getElementById("go-back-btn").addEventListener("click", () => {
  ipcRenderer.send("go-back");
});


