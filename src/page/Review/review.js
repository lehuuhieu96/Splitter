const {  ipcMain, ipcRenderer, app } = require("electron");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

function registerEvents() {
    ipcMain.on("file-path", (event, filePath) => {
        convertToPDF(event, filePath);
    });
}

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

async function createPdfFromHtml(htmlContent, outputPath) {
    const data = loadData();
    const header = data?.header || '';
    const footer = data?.footer || '';
    const watermark = data?.watermark || '';
    const imageBackground = data?.imageBackground || '';
    const imageHeader = data?.imageHeader || '';
    const imageFooter = data?.imageFooter || '';

    const processedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 100px;
                    opacity: 0.2;
                    z-index: -1;
                }
                body {
                    font-size: 22px; /* Đặt kích thước chữ mong muốn */
                }
                pre, p, div, span { 
                    white-space: pre-wrap; 
                }
                .margin-non {
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <header>
                <h3 class="margin-non">${header}</h3>
                ${imageHeader ? `<img src="${imageHeader}" id="image-header" class="margin-non">` : ''}
            </header>
            <div class="watermark">${watermark}</div>
            ${imageBackground ? `<img src="${imageBackground}" id="image-background" class="watermark">` : ''}
            ${htmlContent}
            <footer>
                <h3 class="margin-non">${footer}</h3>
                ${imageFooter ? `<img src="${imageFooter}" id="image-header" class="margin-non">` : ''}
            </footer>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const margins = {
        top: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
        right: '0.5cm'
        };

    // Đặt nội dung HTML cho trang
    await page.setContent(processedHtml);
    // Lấy tất cả các phần tử hình ảnh trên trang
    const images = await page.$$('img');
    // Duyệt qua từng phần tử hình ảnh để tìm hình ảnh WMF và thay thế chúng
    for (const image of images) {
        const src = await image.evaluate(node => node.getAttribute('src'));
        if (src && src.startsWith('data:image/x-wmf')) {
            const wmfBase64 = src.split(',')[1]; // Lấy phần dữ liệu base64 từ src
            const pngBase64 = await convertWMFtoPNG(wmfBase64); // Chuyển đổi WMF sang PNG
            const pngDataUrl = `data:image/png;base64,${pngBase64}`; // Tạo src mới cho hình ảnh PNG
            // Thay thế hình ảnh WMF bằng hình ảnh PNG trong nội dung HTML
            await page.evaluate((node, dataUrl) => {
                node.setAttribute('src', dataUrl);
            }, image, pngDataUrl);
        }
        if (src && src.startsWith('data:image/png')) {
            // Thay đổi kích thước của hình ảnh
            await page.evaluate((node) => {
                node.style.cssText = 'width: 32%; height: auto;';
                const images = document.querySelectorAll('img#image-header'); // Chọn tất cả các thẻ <img> có id="image-header"
                images.forEach((image) => {
                    image.style.cssText = 'height: 35px !important; with: auto !important;';
                });
                const imageBg = document.querySelectorAll('img#image-background'); // Chọn tất cả các thẻ <img> có id="image-header"
                imageBg.forEach((image) => {
                    image.style.cssText = 'width: 300px !important; height: auto !important;';
                });
            }, image);
        }
    }
    // Tạo file PDF từ trang
    await page.pdf({ path: outputPath, format: "A4", margin: margins, printBackground: true});
    await browser.close();

}

async function convertWMFtoPNG(wmfBase64) {
    return new Promise((resolve, reject) => {
        // Tạo tên tệp tạm thời cho WMF và PNG
        const wmfFilePath = 'temp.wmf';
        const pngFilePath = 'temp.png';

        // Ghi dữ liệu WMF vào tệp tạm thời
        fs.writeFileSync(wmfFilePath, Buffer.from(wmfBase64, 'base64'));
        // Sử dụng ImageMagick để chuyển đổi từ WMF sang PNG
        const command = `magick "${wmfFilePath}" -resize 5.5% "${pngFilePath}"`;
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            // Đọc dữ liệu PNG từ tệp tạm thời
            const pngBase64 = fs.readFileSync(pngFilePath, { encoding: 'base64' });
            // Xóa tệp tạm thời
            fs.unlinkSync(wmfFilePath);
            fs.unlinkSync(pngFilePath);
            resolve(pngBase64);
        });
    });
}

function addPrefixToOlLi(str, index) {
    if (str.startsWith('<ol><li>')) {
        return str.replace(/^<ol><li>/, `<ol><li>Câu ${index}: `)
    }
    return str;
}

async function convertToPDF(event, inputFilePath) {
    const data = loadData();
    const styleSplit = data?.styleSplit || "Câu";
    try {
        const value = await mammoth.convertToHtml({ path: inputFilePath });

        const fileName = getFileName(inputFilePath);
        let pdfPaths = []
        // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<p>Câu|<ol><li>)/).map((str, index) => addPrefixToOlLi(str, index + 1));;
        // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<strong>Câu|<p>Câu|<ol><li>)/).filter(item => item.startsWith('<p><strong>Câu') || item.startsWith('<p><strong>Câu') || item.startsWith('<p>Câu') || item.startsWith('<ol><li>'));
        let htmlContents = value?.value?.split(new RegExp(`(?=<p><strong>${styleSplit}|<p>${styleSplit})`));
        if(htmlContents.length > 1 && (!htmlContents[0].startsWith(`<p><strong>${styleSplit}`) || !htmlContents[0].startsWith(`<p>${styleSplit}`))){
            let newHtmlContents = [htmlContents[0] + htmlContents[1], ...htmlContents.slice(2)];
            for (let i = 0; i < newHtmlContents?.length; i++) {
                const paragraph = newHtmlContents[i];
                // Tạo tệp PDF cho câu hỏi
                const pdfFilePath = `${styleSplit}_${i + 1}_${fileName}.pdf`;
                await createPdfFromHtml(paragraph, pdfFilePath)
                    .then(() => pdfPaths.push(pdfFilePath))
                    .catch((error) => console.error("Lỗi khi tạo file PDF:", error));
            }
        } else {
            for (let i = 0; i < htmlContents?.length; i++) {
                const paragraph = htmlContents[i];
                // Tạo tệp PDF cho câu hỏi
                const pdfFilePath = `${styleSplit}_${i + 1}_${fileName}.pdf`;
                await createPdfFromHtml(paragraph, pdfFilePath)
                    .then(() => pdfPaths.push(pdfFilePath))
                    .catch((error) => console.error("Lỗi khi tạo file PDF:", error));
            }
        }
        try { 
            // Xử lý yêu cầu lấy danh sách PDF từ renderer process
            event.sender.send('pdf-list', pdfPaths);
            event.sender.send('loading-pdf-success');
            console.log('Email sent successfully!');
        } catch (error) {
            event.sender.send('loading-pdf-fail');
            console.error(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error("Lỗi khi chuyển đổi sang PDF:", error);
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

const sendEmailWithAttachments = async (pdfPaths) => {
    try {
        // Create a nodemailer transporter
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'lehuuhieu05@gmail.com',
                pass: 'eojhuqhmemtiqnmc'
            }
        });
        // Mail options
        let mailOptions = {
            from: 'lehuuhieu05@gmail.com',
            // to: 'bachhuudong0001@gmail.com',
            // to: 'lehuuhieu1996@gmail.com',
            subject: 'PDF Attachment',
            text: 'Please find the attached PDF file.',
            attachments: pdfPaths.map(pdfPath => ({
                filename: path.basename(pdfPath), // Extract filename from file path
                content: fs.readFileSync(pdfPath)
            }))
        };
        // Send mail
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
    }
};

module.exports = { registerEvents };
