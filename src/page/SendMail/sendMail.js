const { ipcMain, ipcRenderer } = require("electron");
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const archiver = require('archiver'); // Module để tạo file zip

function registerEvents() {
    ipcMain.on("path-to-send-mail",async (event, pdfPaths) => {
        await sendEmailWithAttachments(pdfPaths)
    });
}

const sendEmailWithAttachments = async (pdfPaths) => {
    ipcMain.on("send-data",async (event, data) => {
        const questionRange = data?.questionRange;
        const rangeParts = questionRange.split('-'); // Tách chuỗi thành mảng gồm hai phần tử
        const startIndex = parseInt(rangeParts[0]) - 1; // Lấy vị trí bắt đầu và chuyển đổi sang số nguyên (trừ 1 vì mảng bắt đầu từ 0)
        const endIndex = parseInt(rangeParts[1]); // Lấy vị trí kết thúc và chuyển đổi sang số nguyên
        const subPath = pdfPaths.slice(startIndex, endIndex);
        const fileName = pdfPaths[0].slice(6, -4);
        try {
            // Create a nodemailer transporter
            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: data?.email,
                    pass: data?.password
                }
            });

            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            const zipFilePath = path.join(tempDir, `${fileName}.zip`);
            await createZip(subPath, zipFilePath); // Assume createZip function creates the zip file
            // Mail options
            let mailOptions = {
                from: data?.email,
                to: data?.recipient,
                subject: data?.subject,
                text: data?.message,
                attachments: [{
                    filename: `${fileName}.zip`, // Name of the zip file
                    path: zipFilePath // Path to the zip file
                }]
            };
            // Send mail
            // let info = await transporter.sendMail(mailOptions);
            await transporter.sendMail(mailOptions);
            fs.rmSync(tempDir, { recursive: true });
            event.sender.send('send-mail-success', data);
        } catch (error) {
            event.sender.send('send-mail-fail');
            console.error(`Error sending email: ${error.message}`);
        }
    });
};

async function createZip(pdfPaths, zipFilePath) {
    return new Promise((resolve, reject) => {
        // Tạo một stream đến tệp zip
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip');
        // Đặt sự kiện xảy ra lỗi cho stream xuất
        output.on('error', reject);
        // Đặt sự kiện 'close' cho archive (khi tất cả dữ liệu đã được đẩy vào tệp zip)
        archive.on('close', () => {
            console.log(`${archive.pointer()} total bytes`);
            console.log('Tạo file zip thành công');
            resolve();
        });
        // Đặt sự kiện xảy ra lỗi cho archive
        archive.on('error', reject);
        // Phương thức pipe để chuyển dữ liệu từ archive đến output (tệp zip)
        archive.pipe(output);
        // Thêm các tệp PDF vào archive
        pdfPaths.forEach(pdfPath => {
            const pdfName = pdfPath.split('/').pop(); // Lấy tên tệp PDF từ đường dẫn
            archive.append(fs.createReadStream(pdfPath), { name: pdfName });
        });
        // Kết thúc archive
        archive.finalize();
    });
}

module.exports = { registerEvents };
