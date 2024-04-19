const { app, BrowserWindow, ipcMain } = require("electron");
const path = require('path');
const home = require('./src/page/Home/home');
const review = require('./src/page/Review/review');
const sendMail = require('./src/page/SendMail/sendMail');
const setting = require('./src/page/Setting/setting');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();
// Thêm đường dẫn đến thư mục bin của ImageMagick vào biến môi trường PATH
// const imagemagickPath = 'C:/Program Files/ImageMagick-7.1.1-Q16-HDRI'; // Thay đổi đường dẫn này để phản ánh đường dẫn thực tế
// process.env.PATH = `${imagemagickPath}${path.delimiter}${process.env.PATH}`;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        width: 1160, 
        height: 760, 
        minWidth: 1160, 
        minHeight: 760
    });

    home.registerEvents();
    review.registerEvents();
    sendMail.registerEvents();
    setting.registerEvents();

    mainWindow.loadURL(`file://${__dirname}/src/page/Home/index.html`);

    // Xử lý sự kiện lấy dữ liệu khi cửa sổ đã sẵn sàng
    mainWindow.webContents.on('did-finish-load', () => {
        const data = loadData();
        const imagemagickPath = data?.link || ""; // Thay đổi đường dẫn này để phản ánh đường dẫn thực tế
        process.env.PATH = `${imagemagickPath}${path.delimiter}${process.env.PATH}`;
        mainWindow.webContents.send('data-loaded', data);
    });

    // Lắng nghe yêu cầu quay lại từ renderer process
    ipcMain.on('go-back', () => {
        if (mainWindow.webContents.canGoBack()) {
            mainWindow.webContents.goBack();
        }
    });

    mainWindow.on("closed", function () {
        mainWindow = null;
    });

    ipcMain.on('electron-store-get-data', (event, key) => {
        const data = store.get(key);
        event.returnValue = data;
    });

    ipcMain.on('show-detail-pdf', (event, embedContent) => {
        let embedWindow = new BrowserWindow({
            width: 500, // Đặt chiều rộng modal
            height: 745, // Đặt chiều cao modal
            webPreferences: {
              nodeIntegration: true // Cho phép sử dụng Node.js trong cửa sổ modal
            }
          });
        embedWindow.loadFile('src/modal/ZoomIn/index.html');
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

// Xử lý sự kiện lưu dữ liệu
ipcMain.on('save-data', (event, data) => {
    const filePath = path.join(app.getPath('userData'), 'data.json');
    // Đọc dữ liệu hiện có (nếu có)
    const dataToSave = { ...data };
    // Ghi dữ liệu vào tệp
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    // Gửi thông báo cho renderer rằng dữ liệu đã được lưu
    event.sender.send('data-saved');
});

ipcMain.on('save-image-background', (event, imageBackground) => {
    const filePath = path.join(app.getPath('userData'), 'data.json');
    // Đảm bảo tệp tồn tại trước khi đọc và cập nhật dữ liệu
    if (fs.existsSync(filePath)) {
        // Đọc dữ liệu hiện có từ tệp JSON
        const existingData = JSON.parse(fs.readFileSync(filePath));
        // Thêm cặp key-value mới vào đối tượng dữ liệu
        existingData["imageBackground"] = imageBackground;
        // Ghi đối tượng dữ liệu đã cập nhật vào tệp JSON
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        // Gửi thông báo cho renderer rằng dữ liệu đã được thêm vào
        event.sender.send('data-added', imageBackground);
    } else {
        // Nếu tệp không tồn tại, bạn có thể xử lý tùy ý, ví dụ: tạo tệp mới
        console.error('File not found:', filePath);
        event.sender.send('file-not-found');
    }
});

ipcMain.on('file-path', (event, filePath) => {
    const fileName = getFileName(filePath);
    const filePathApp = path.join(app.getPath('userData'), 'data.json');
    // Đảm bảo tệp tồn tại trước khi đọc và cập nhật dữ liệu
    if (fs.existsSync(filePathApp)) {
        // Đọc dữ liệu hiện có từ tệp JSON
        const existingData = JSON.parse(fs.readFileSync(filePathApp));
        // Thêm cặp key-value mới vào đối tượng dữ liệu
        existingData["fileName"] = fileName;
        // Ghi đối tượng dữ liệu đã cập nhật vào tệp JSON
        fs.writeFileSync(filePathApp, JSON.stringify(existingData, null, 2));
        // Gửi thông báo cho renderer rằng dữ liệu đã được thêm vào
        event.sender.send('data-added', fileName);
    } else {
        // Nếu tệp không tồn tại, bạn có thể xử lý tùy ý, ví dụ: tạo tệp mới
        console.error('File not found:', filePathApp);
        event.sender.send('file-not-found');
    }
});

ipcMain.on('save-image-header', (event, imageHeader) => {
    const filePath = path.join(app.getPath('userData'), 'data.json');
    // Đảm bảo tệp tồn tại trước khi đọc và cập nhật dữ liệu
    if (fs.existsSync(filePath)) {
        // Đọc dữ liệu hiện có từ tệp JSON
        const existingData = JSON.parse(fs.readFileSync(filePath));
        // Thêm cặp key-value mới vào đối tượng dữ liệu
        existingData["imageHeader"] = imageHeader;
        // Ghi đối tượng dữ liệu đã cập nhật vào tệp JSON
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        // Gửi thông báo cho renderer rằng dữ liệu đã được thêm vào
        event.sender.send('data-added', imageHeader);
    } else {
        // Nếu tệp không tồn tại, bạn có thể xử lý tùy ý, ví dụ: tạo tệp mới
        console.error('File not found:', filePath);
        event.sender.send('file-not-found');
    }
});

ipcMain.on('save-image-footer', (event, imageFooter) => {
    const filePath = path.join(app.getPath('userData'), 'data.json');
    // Đảm bảo tệp tồn tại trước khi đọc và cập nhật dữ liệu
    if (fs.existsSync(filePath)) {
        // Đọc dữ liệu hiện có từ tệp JSON
        const existingData = JSON.parse(fs.readFileSync(filePath));
        // Thêm cặp key-value mới vào đối tượng dữ liệu
        existingData["imageFooter"] = imageFooter;
        // Ghi đối tượng dữ liệu đã cập nhật vào tệp JSON
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        // Gửi thông báo cho renderer rằng dữ liệu đã được thêm vào
        event.sender.send('data-added', imageFooter);
    } else {
        // Nếu tệp không tồn tại, bạn có thể xử lý tùy ý, ví dụ: tạo tệp mới
        console.error('File not found:', filePath);
        event.sender.send('file-not-found');
    }
});

// Xử lý sự kiện xóa dữ liệu đã lưu
ipcMain.on('delete-data', (event) => {
    const filePath = path.join(app.getPath('userData'), 'data.json');
    // Kiểm tra xem tệp tồn tại không
    if (fs.existsSync(filePath)) {
        // Xóa tệp
        fs.unlinkSync(filePath);
        // Gửi thông báo cho renderer rằng dữ liệu đã được xóa
        event.sender.send('data-deleted');
    } else {
        // Gửi thông báo cho renderer rằng không có dữ liệu để xóa
        event.sender.send('no-data-to-delete');
    }
});

// Hàm để load dữ liệu từ tệp JSON
function loadData() {
    const filePath = path.join(app.getPath('userData'), 'data.json');

    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath));
        return data;
    } else {
        return []; // Trả về một mảng rỗng nếu không có dữ liệu
    }
}

function getFileName(filePath) {
    // Split the file path by the backslash (\) character
    const parts = filePath.split('\\');
    // The last part will be the filename with extension
    const fileNameWithExtension = parts[parts.length - 1];
    // Extract the filename without the extension
    const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.');
    return fileName;
}

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

