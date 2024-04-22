const {  ipcMain, dialog } = require("electron");
const path = require('path');
const Store = require('electron-store');

const store = new Store();
function registerEvents() {
    ipcMain.on("open-file-dialog", (event) => {
        dialog
            .showOpenDialog({
                properties: ["openFile"],
                filters: [
                    { name: "Word Documents", extensions: ["docx"] },
                    { name: "All Files", extensions: ["*"] },
                ],
            })
            .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                    const filePath = result.filePaths[0];
                    const fileNameFull = path.basename(filePath); // Extract file name from file path
                    const fileNameParts = fileNameFull.split(".");
                    const fileName = fileNameParts[fileNameParts?.length-2];
                    store.set('fileName', fileName);
                    event.sender.send("open-file-selected", filePath);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

module.exports = { registerEvents };
