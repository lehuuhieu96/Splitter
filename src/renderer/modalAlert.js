// JavaScript để hiển thị thông điệp trong modal
const { ipcRenderer } = require("electron");

ipcRenderer.on('modal-message', (event, message) => {
    document.getElementById('modal-message').textContent = message;
});