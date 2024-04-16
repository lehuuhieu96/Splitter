const { ipcMain, ipcRenderer } = require("electron");
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

function registerEvents() {
    ipcMain.on("path-to-send-mail",async (event, pdfPaths) => {
        await sendEmailWithAttachments(pdfPaths)
    });
}

const sendEmailWithAttachments = async (pdfPaths) => {
    console.log('pdfPaths', pdfPaths);
    ipcMain.on("send-data",async (event, data) => {
        const questionRange = data?.questionRange;
        const rangeParts = questionRange.split('-'); // Tách chuỗi thành mảng gồm hai phần tử
        const startIndex = parseInt(rangeParts[0]) - 1; // Lấy vị trí bắt đầu và chuyển đổi sang số nguyên (trừ 1 vì mảng bắt đầu từ 0)
        const endIndex = parseInt(rangeParts[1]); // Lấy vị trí kết thúc và chuyển đổi sang số nguyên
        const subPath = pdfPaths.slice(startIndex, endIndex);
        try {
            // Create a nodemailer transporter
            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: data?.email,
                    pass: data?.password
                }
            });
            // Mail options
            let mailOptions = {
                from: data?.email,
                to: data?.recipient,
                subject: data?.subject,
                text: data?.message,
                attachments: subPath.map(pdfPath => ({
                    filename: path.basename(pdfPath), // Extract filename from file path
                    content: fs.readFileSync(pdfPath)
                }))
            };
            // Send mail
            // let info = await transporter.sendMail(mailOptions);
            // console.log('Message sent: %s', info.messageId);
            // window.location.href = '../Home/index.html?success=true';
            event.sender.send('send-mail-success', data);
        } catch (error) {
            event.sender.send('send-mail-fail');
            console.error(`Error sending email: ${error.message}`);
        }
    });
};

module.exports = { registerEvents };
