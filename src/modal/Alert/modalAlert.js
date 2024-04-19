const { BrowserWindow } = require('electron');

let modalWindow;
let mainWindow;

function setMainWindow(window) {
    mainWindow = window;
}

function createModal(message) {
  modalWindow = new BrowserWindow({
    width: 350,
    height: 200,
    resizable: false,
    title: 'Thông báo',
    parent: mainWindow, // Thay mainWindow bằng biến chứa cửa sổ chính của ứng dụng
    modal: true,
    show: false,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  });

  modalWindow.loadFile('src/modal/Alert/index.html'); // Đường dẫn tới file HTML của modal

  modalWindow.once('ready-to-show', () => {
    modalWindow.webContents.send('modal-message', message);
    modalWindow.show();
  });
}

module.exports = { createModal, setMainWindow };