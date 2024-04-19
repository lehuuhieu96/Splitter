const {  ipcMain, dialog } = require("electron");
const { createModal } = require('../../modal/Alert/modalAlert');

function registerEvents() {
    ipcMain.on("save-data-success", () => {
        createModal("Lưu thành công!")
    });
    ipcMain.on("delete-data-success", () => {
        createModal("Xóa thành công!")
    });
}

module.exports = { registerEvents };