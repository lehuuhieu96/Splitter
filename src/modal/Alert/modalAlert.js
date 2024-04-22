const { BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');

const store = new Store();
let modalWindow;
let mainWindow;

function setMainWindow(window) {
    mainWindow = window;
}

function createModal(message, goToMain) {
  modalWindow = new BrowserWindow({
    width: 350,
    height: 250,
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

  store.set('goToMain', goToMain);
}

ipcMain.on('close-modal', () => {
  // Kiểm tra nếu modalWindow tồn tại thì đóng nó
  if (modalWindow) {
      modalWindow.close();
  }
});

module.exports = { createModal, setMainWindow };