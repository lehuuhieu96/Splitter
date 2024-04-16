const { ipcRenderer, dialog, BrowserWindow } = require("electron");

// Lắng nghe sự kiện từ main process khi danh sách PDF được gửi từ main process
ipcRenderer.on("pdf-list", (event, pdfPaths) => {
  const fileInfo = document.getElementById("file-info");

  const fileName = pdfPaths[0].slice(6, -4);
  console.log('filename', fileName);
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
        console.log(`Thông tin file cho ${pdfPath}`);
        const embedContent = embed.outerHTML; // Lấy mã HTML của thẻ embed
        ipcRenderer.send("show-detail-pdf", embedContent);
        // Gọi hàm để hiển thị dialog và truyền mã HTML của thẻ embed vào
        // showEmbedModal(embedContent);
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

// function showEmbedModal(embedContent) {
//   // Tạo cửa sổ modal mới
//   let embedWindow = new BrowserWindow({
//     width: 800, // Đặt chiều rộng modal
//     height: 600, // Đặt chiều cao modal
//     webPreferences: {
//       nodeIntegration: true // Cho phép sử dụng Node.js trong cửa sổ modal
//     }
//   });

//   // Load một HTML trống vào cửa sổ modal
//   embedWindow.loadURL(`data:text/html;charset=utf-8,<html></html>`);

//   // Khi cửa sổ modal đã sẵn sàng, chèn nội dung của thẻ embed vào
//   embedWindow.webContents.on('did-finish-load', () => {
//     // Chèn nội dung của thẻ embed vào cửa sổ modal
//     embedWindow.webContents.executeJavaScript(`document.body.innerHTML = '${embedContent}';`);
//   });

//   // Mở cửa sổ modal
//   embedWindow.show();
// }



