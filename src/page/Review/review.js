const { ipcMain, app } = require("electron");
const mammoth = require("mammoth");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");
const { GLOBAL } = require("../../../global");

const store = new Store();

function registerEvents() {
  ipcMain.on("file-path", (event, filePath) => {
    convertToPDF(event, filePath);
  });

  ipcMain.on("get-pdf-list", (event) => {
    // Lấy danh sách PDF từ nơi lưu trữ hoặc bất kỳ nguồn dữ liệu nào khác
    const pdfPaths = store.get("pdfPaths");
    // Gửi danh sách PDF về Renderer Process
    setTimeout(() => {
      event.sender.send("pdf-list", pdfPaths);
    }, 500);
  });
}

// Hàm để load dữ liệu từ tệp JSON
function loadData() {
  const filePath = path.join(app.getPath("userData"), "data.json");

  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath));
    return data;
  } else {
    return []; // Trả về một mảng rỗng nếu không có dữ liệu
  }
}

async function createPdfFromHtml(htmlContent, outputPath) {
  const data = loadData();
  const header = data?.header || "";
  const footer = data?.footer || "";
  const watermark = data?.watermark || "";
  const imageBackground = data?.imageBackground || "";
  const imageHeader = data?.imageHeader || "";
  const imageFooter = data?.imageFooter || "";

  const page = await GLOBAL.browserPuppeteer?.newPage();

  const margins = {
    top: "20px",
    bottom: "20px",
    left: "20px",
    right: "20px",
  };

  const processedHtmlTemp = `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
      header {
        height: 40px
      }
          body {
            font-size: 20px; /* Đặt kích thước chữ mong muốn */
            margin: 0;
            padding: 0;
            position: relative;
        }
          pre, p, div, span { 
              white-space: pre-wrap; 
          }
          p {
            line-height: 2;
          }
          .margin-non {
              margin: 0;
          }
    
      </style>
  </head>
  <body>
        <header>
            ${!!header ? `<h3 class="margin-non">${header}</h3>` : ""}
            ${
              imageHeader
                ? `<img src="${imageHeader}" id="image-header" class="margin-non" height="40">`
                : ""
            }
        </header>
        ${htmlContent}
  </body>
  </html>
`;

  // Đặt nội dung HTML cho trang
  await page.setContent(processedHtmlTemp);

  const contentHeight = await page.evaluate(() => {
    const content = document.documentElement;
    const { height } = content.getBoundingClientRect();
    let contentHeight = 1083;
    if (height > 1083) {
      const heightParseFloat = parseFloat(height / 1083);
      const heightParseInt = parseInt(height / 1083);

      if (heightParseFloat > heightParseInt) {
        contentHeight = heightParseInt + 1;
      } else {
        contentHeight = heightParseInt;
      }
      contentHeight = contentHeight * 1083;
    }
    return contentHeight;
  });

  const processedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                header {
                  height: 40px;
                  overflow: hidden;
                }
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
                    font-size: 20px; /* Đặt kích thước chữ mong muốn */
                    margin: 0;
                    padding: 0;
                    position: relative;
                }
                .content1 {
                    display: block;
                    padding: 0;
                    margin: 0;
                    overflow: scroll;
                    height: ${contentHeight - 40}px;
                }
                pre, p, span { 
                    white-space: pre-wrap; 
                    line-height: 2;
                }
                p {
                    line-height: 2;
                }
                .margin-non {
                    margin: 0;
                }
                .footer-pdf {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 40px;
                    overflow: hidden;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            <header>
              ${!!header ? `<h3 class="margin-non">${header}</h3>` : ""}
              ${
                imageHeader
                  ? `<img src="${imageHeader}" id="image-header" class="margin-non" height="40">`
                  : ""
              }
            </header>
            <div class="watermark">${watermark}</div>
            ${
              imageBackground
                ? `<img src="${imageBackground}" id="image-background" class="watermark" width="350">`
                : ""
            }
            <div class="content1">
              ${htmlContent}
            </div>
            <footer class="footer-pdf">
                <h3 class="margin-non">${footer}</h3>
                ${
                  imageFooter
                    ? `<img src="${imageFooter}" id="image-footer" class="margin-non" height="40">`
                    : ""
                }
            </footer>
        </body>
        </html>
    `;
  await page.setContent(processedHtml);
  // Lấy tất cả các phần tử hình ảnh trên trang
  const images = await page.$$("img");
  // Duyệt qua từng phần tử hình ảnh để tìm hình ảnh WMF và thay thế chúng
  for (const image of images) {
    const src = await image.evaluate((node) => node.getAttribute("src"));
    if (src && src.startsWith("data:image/x-wmf")) {
      const wmfBase64 = src.split(",")[1]; // Lấy phần dữ liệu base64 từ src
      const pngBase64 = await convertWMFtoPNG(wmfBase64, outputPath); // Chuyển đổi WMF sang PNG
      const pngDataUrl = `data:image/png;base64,${pngBase64}`; // Tạo src mới cho hình ảnh PNG
      // Thay thế hình ảnh WMF bằng hình ảnh PNG trong nội dung HTML
      await page.evaluate(
        (node, dataUrl) => {
          node.setAttribute("src", dataUrl);
        },
        image,
        pngDataUrl
      );
      await page.evaluate((node) => {
        node.style.cssText = `margin-bottom: -${
          (node.height * 4 * (node.height / 23)) / 23
        }px`;
      }, image);
    } else if (
      src &&
      (src.startsWith("data:image/png") ||
        src.startsWith("data:image/jpeg") ||
        src.startsWith("data:image/jpg"))
    ) {
      // Thay đổi kích thước của hình ảnh
      await page.evaluate((node) => {
        // node.style.cssText = 'width: 40%; height: auto;';
        const imageHeader = document.querySelectorAll("img#image-header"); // Chọn tất cả các thẻ <img> có id="image-header"
        imageHeader.forEach((image) => {
          image.style.cssText =
            "height: 40px !important; with: auto !important;";
        });
        const imageFooter = document.querySelectorAll("img#image-footer"); // Chọn tất cả các thẻ <img> có id="image-header"
        imageFooter.forEach((image) => {
          image.style.cssText =
            "height: 40px !important; with: auto !important;";
        });
        const imageBg = document.querySelectorAll("img#image-background"); // Chọn tất cả các thẻ <img> có id="image-header"
        imageBg.forEach((image) => {
          image.style.cssText =
            "width: 350px !important; height: auto !important;";
        });
      }, image);
    }
  }

  // Tạo file PDF từ trang
  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: margins,
    printBackground: true,
  });
  // await GLOBAL.browserPuppeteer?.close();
  // await browser.close();
}

async function convertWMFtoPNG(wmfBase64, outputPath) {
  return new Promise((resolve, reject) => {
    // Tạo tên tệp tạm thời cho WMF và PNG
    const wmfFilePath = `${outputPath}.wmf`;
    const pngFilePath = `${outputPath}.png`;

    // Ghi dữ liệu WMF vào tệp tạm thời
    fs.writeFileSync(wmfFilePath, Buffer.from(wmfBase64, "base64"));
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
      const pngBase64 = fs.readFileSync(pngFilePath, { encoding: "base64" });
      // Xóa tệp tạm thời
      fs.unlinkSync(wmfFilePath);
      fs.unlinkSync(pngFilePath);
      resolve(pngBase64);
    });
  });
}

function addPrefixToOlLi(str, index) {
  if (str.startsWith("<ol><li>")) {
    return str.replace(/^<ol><li>/, `<p><strong>Câu ${index}: </strong>`);
  }
  if (!str.endsWith("</p>") && !str.endsWith("<table><tr><td>")) {
    return `<table><tr><td>${str}`;
  }
  return str;
}

async function convertToPDF(event, inputFilePath) {
  const data = loadData();
  const styleSplit = data?.styleSplit || "Câu";
  try {
    const value = await mammoth.convertToHtml({ path: inputFilePath });

    const fileName = store.get("fileName") || "";
    let pdfPaths = [];
    // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<p>Câu|<ol><li>)/).map((str, index) => addPrefixToOlLi(str, index + 1));;
    // let htmlContents = value?.value?.split(/(?=<p><strong>Câu|<strong>Câu|<p>Câu|<ol><li>)/).filter(item => item.startsWith('<p><strong>Câu') || item.startsWith('<p><strong>Câu') || item.startsWith('<p>Câu') || item.startsWith('<ol><li>'));
    let htmlContents = value?.value?.split(
      new RegExp(
        `(?=<p><strong>${styleSplit}|<p>${styleSplit}|<p>${styleSplit.toUpperCase()}|<p>${styleSplit.toLowerCase()}|<ol><li>)`
      )
    );
    let htmlContentsReplace = htmlContents.map((str, index) =>
      addPrefixToOlLi(str, index + 1)
    );

    let pdfPromises = [];

    if (
      (htmlContentsReplace.length > 1 &&
        !htmlContentsReplace[0].startsWith(`<p><strong>${styleSplit}`)) ||
      htmlContentsReplace[0].startsWith(`<p>${styleSplit}`)
    ) {
      let newHtmlContents = [
        htmlContentsReplace[0] + htmlContentsReplace[1],
        ...htmlContentsReplace.slice(2),
      ];
      for (let i = 0; i < newHtmlContents?.length; i++) {
        const paragraph = newHtmlContents[i];
        // Tạo tệp PDF cho câu hỏi
        const pdfFilePath = `${styleSplit}_${i + 1}_${fileName}.pdf`;
        pdfPromises.push(createPdfFromHtml(paragraph, pdfFilePath));
        pdfPaths.push(pdfFilePath);
      }
    } else {
      for (let i = 0; i < htmlContentsReplace?.length; i++) {
        const paragraph = htmlContentsReplace[i];
        // Tạo tệp PDF cho câu hỏi
        const pdfFilePath = `${styleSplit}_${i + 1}_${fileName}.pdf`;
        pdfPromises.push(createPdfFromHtml(paragraph, pdfFilePath));
        pdfPaths.push(pdfFilePath);
      }
    }

    await Promise.all(pdfPromises);
    // Xử lý yêu cầu lấy danh sách PDF từ renderer process
    event.sender.send("pdf-list", pdfPaths);
  } catch (error) {
    console.error("Lỗi khi chuyển đổi sang PDF:", error);
  }
}

module.exports = { registerEvents };
