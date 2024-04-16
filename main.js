const { app, BrowserWindow, ipcMain } = require("electron");
const path = require('path');
const home = require('./src/page/Home/home');
const review = require('./src/page/Review/review');
const sendMail = require('./src/page/SendMail/sendMail');

// Thêm đường dẫn đến thư mục bin của ImageMagick vào biến môi trường PATH
const imagemagickPath = 'C:/Program Files/ImageMagick-7.1.1-Q16-HDRI'; // Thay đổi đường dẫn này để phản ánh đường dẫn thực tế
process.env.PATH = `${imagemagickPath}${path.delimiter}${process.env.PATH}`;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        width: 1160, 
        height: 630, 
        minWidth: 1160, 
        minHeight: 630
    });

    home.registerEvents();
    review.registerEvents();
    sendMail.registerEvents();

    mainWindow.loadURL(`file://${__dirname}/src/page/Home/index.html`);

    mainWindow.on("closed", function () {
        mainWindow = null;
    });

    ipcMain.on('show-detail-pdf', (event, embedContent) => {
        let embedWindow = new BrowserWindow({
            width: 500, // Đặt chiều rộng modal
            height: 745, // Đặt chiều cao modal
            webPreferences: {
              nodeIntegration: true // Cho phép sử dụng Node.js trong cửa sổ modal
            }
          });
            // Load một HTML trống vào cửa sổ modal
        // embedWindow.loadURL(`data:text/html;charset=utf-8,<html></html>`);
        embedWindow.loadFile('src/modal/ZoomIn/index.html');
        // embedWindow.webContents.on('did-finish-load', () => {
        //     embedWindow.webContents.send('embed-content', embedContent);
        // });
        
        // // Hiển thị cửa sổ modal
        // embedWindow.show();
        // const newWidth = '505px';
        // const newHeight = '750px';
        const newWidth = '432px';
        const newHeight = '642px';
        embedContent = embedContent.replace('width="183px"', `width="${newWidth}"`);
        embedContent = embedContent.replace('height="258px"', `height="${newHeight}"`);

        // // Khi cửa sổ modal đã sẵn sàng, chèn nội dung của thẻ embed vào
        embedWindow.webContents.on('did-finish-load', () => {
            // Chèn nội dung của thẻ embed vào cửa sổ modal
            embedWindow.webContents.executeJavaScript(`document.body.innerHTML = '${embedContent}';`);
        });

        // Hiển thị cửa sổ modal
        embedWindow.show();
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    if (mainWindow === null) {
        createWindow();
    }
});

