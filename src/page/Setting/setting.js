const {  ipcMain, dialog } = require("electron");

function registerEvents() {
    ipcMain.on("open-setting", (event) => {
    });
}

module.exports = { registerEvents };