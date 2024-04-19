const {  ipcMain, dialog } = require("electron");

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
                    event.sender.send("open-file-selected", filePath);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

// async function createPdfFromHtml(htmlContent, outputPath) {
//     //   const browser = await puppeteer.launch();
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     // Đặt nội dung HTML cho trang
//     await page.setContent(htmlContent);

//     // Lấy tất cả các phần tử hình ảnh trên trang
//     const images = await page.$$('img');

//     // Duyệt qua từng phần tử hình ảnh để tìm hình ảnh WMF và thay thế chúng
//     for (const image of images) {
//         const src = await image.evaluate(node => node.getAttribute('src'));
//         if (src && src.startsWith('data:image/x-wmf')) {
//             const wmfBase64 = src.split(',')[1]; // Lấy phần dữ liệu base64 từ src
//             const pngBase64 = await convertWMFtoPNG(wmfBase64); // Chuyển đổi WMF sang PNG
//             const pngDataUrl = `data:image/png;base64,${pngBase64}`; // Tạo src mới cho hình ảnh PNG

//             // Thay thế hình ảnh WMF bằng hình ảnh PNG trong nội dung HTML
//             await page.evaluate((node, dataUrl) => {
//                 node.setAttribute('src', dataUrl);
//             }, image, pngDataUrl);
//         }
//         if (src && src.startsWith('data:image/png')) {
//             // Thay đổi kích thước của hình ảnh
//             await page.evaluate((node) => {
//                 node.style.width = '30%';
//                 node.style.height = 'auto';
//             }, image);
//         }
//     }

//     // Tạo file PDF từ trang
//     await page.pdf({ path: outputPath, format: "A4" });

//     await browser.close();
// }

// async function convertWMFtoPNG(wmfBase64) {
//     return new Promise((resolve, reject) => {
//         // Tạo tên tệp tạm thời cho WMF và PNG
//         const wmfFilePath = 'temp.wmf';
//         const pngFilePath = 'temp.png';

//         // Ghi dữ liệu WMF vào tệp tạm thời
//         fs.writeFileSync(wmfFilePath, Buffer.from(wmfBase64, 'base64'));

//         // Sử dụng ImageMagick để chuyển đổi từ WMF sang PNG
//         const command = `magick "${wmfFilePath}" -resize 4.2% "${pngFilePath}"`;
//         exec(command, async (error, stdout, stderr) => {
//             if (error) {
//                 reject(error);
//                 return;
//             }
//             if (stderr) {
//                 reject(stderr);
//                 return;
//             }
//             // Đọc dữ liệu PNG từ tệp tạm thời
//             const pngBase64 = fs.readFileSync(pngFilePath, { encoding: 'base64' });

//             // Xóa tệp tạm thời
//             fs.unlinkSync(wmfFilePath);
//             fs.unlinkSync(pngFilePath);

//             resolve(pngBase64);
//         });
//     });
// }

// function addPrefixToOlLi(str, index) {
//     if (str.startsWith('<ol><li>')) {
//         return str.replace(/^<ol><li>/, `<ol><li>Câu ${index}: `)
//     }
//     return str;
// }

// async function convertToPDF(inputFilePath) {
//     console.log('inputFilePath', inputFilePath);
//     try {
//         const value = await mammoth.convertToHtml({ path: inputFilePath });
//         console.log('value', value);

//         const fileName = getFileName(inputFilePath);
//         let pdfPaths = []
//         // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<p>Câu|<ol><li>)/).map((str, index) => addPrefixToOlLi(str, index + 1));;

//         // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<strong>Câu|<p>Câu|<ol><li>)/).filter(item => item.startsWith('<p><strong>Câu') || item.startsWith('<p><strong>Câu') || item.startsWith('<p>Câu') || item.startsWith('<ol><li>'));
//         let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<p>Câu|<ol><li>)/);
//         if(!htmlContents[0].startsWith('<p><strong>Câu') || !htmlContents[0].startsWith('<p>Câu') || !htmlContents[0].startsWith('<ol><li>')){
//             let newHtmlContents = [htmlContents[0] + htmlContents[1], ...htmlContents.slice(2)];
//             for (let i = 0; i < newHtmlContents?.length; i++) {
//                 const paragraph = newHtmlContents[i];
//                 // Tạo tệp PDF cho câu hỏi
//                 const pdfFilePath = `Câu_${i + 1}_${fileName}.pdf`;
//                 await createPdfFromHtml(paragraph, pdfFilePath)
//                     .then(() => pdfPaths.push(pdfFilePath))
//                     .catch((error) => console.error("Lỗi khi tạo file PDF:", error));
//             }
//         } else {
//             for (let i = 0; i < htmlContents?.length; i++) {
//                 const paragraph = htmlContents[i];
//                 // Tạo tệp PDF cho câu hỏi
//                 const pdfFilePath = `Câu_${i + 1}_${fileName}.pdf`;
//                 await createPdfFromHtml(paragraph, pdfFilePath)
//                     .then(() => pdfPaths.push(pdfFilePath))
//                     .catch((error) => console.error("Lỗi khi tạo file PDF:", error));
//             }
//         }
//         console.log('htmlContents', htmlContents);

//         console.log("pdfPaths", pdfPaths);
//         try { 
//             // Send email with PDF attachment
//             // await sendEmailWithAttachments(pdfPaths)
//             // ipcRenderer.send('pdf-paths', pdfPaths);

//             console.log('Email sent successfully!');
//         } catch (error) {
//             console.error(`Error: ${error.message}`);
//         }
//     } catch (error) {
//         console.error("Lỗi khi chuyển đổi sang PDF:", error);
//     }

// }

// function getFileName(filePath) {
//     // Split the file path by the backslash (\) character
//     const parts = filePath.split('\\');
//     // The last part will be the filename with extension
//     const fileNameWithExtension = parts[parts.length - 1];
//     // Extract the filename without the extension
//     const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.');
//     return fileName;
// }

// const sendEmailWithAttachments = async (pdfPaths) => {
//     console.log('pdfPaths', pdfPaths);
//     try {
//         // Create a nodemailer transporter
//         let transporter = nodemailer.createTransport({
//             service: 'Gmail',
//             auth: {
//                 user: 'lehuuhieu05@gmail.com',
//                 pass: 'eojhuqhmemtiqnmc'
//             }
//         });

//         // Mail options
//         let mailOptions = {
//             from: 'lehuuhieu05@gmail.com',
//             // to: 'bachhuudong0001@gmail.com',
//             // to: 'lehuuhieu1996@gmail.com',
//             subject: 'PDF Attachment',
//             text: 'Please find the attached PDF file.',
//             attachments: pdfPaths.map(pdfPath => ({
//                 filename: path.basename(pdfPath), // Extract filename from file path
//                 content: fs.readFileSync(pdfPath)
//             }))
//         };

//         // Send mail
//         let info = await transporter.sendMail(mailOptions);
//         console.log('Message sent: %s', info.messageId);
//     } catch (error) {
//         console.error(`Error sending email: ${error.message}`);
//     }
// };

module.exports = { registerEvents };
