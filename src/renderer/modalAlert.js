// JavaScript để hiển thị thông điệp trong modal
const { ipcRenderer } = require("electron");
const Store = require('electron-store');

const store = new Store();
ipcRenderer.on('modal-message', (event, message) => {
    document.getElementById('modal-message').textContent = message;
});

document.getElementById('action-button').addEventListener('click', () => {
    // Thực hiện hành động khi nút được click
    const goToMain = store.get('goToMain'); // Lấy giá trị của cờ goToMain từ store
    ipcRenderer.send("close-modal");
    if(goToMain){
        ipcRenderer.send("go-to-main");
    }
});