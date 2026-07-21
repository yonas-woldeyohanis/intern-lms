const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Streams the given rows as an .xlsx workbook directly to the HTTP response.
 * `columns` is [{ header, key, width }] in ExcelJS format.
 */
async function sendExcel(res, { filename, title, columns, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BMVEI Library Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.substring(0, 31));
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3D5C' } };
  sheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; });
  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Streams the given rows as a simple tabular PDF report directly to the
 * HTTP response.
 */
function sendPdf(res, { filename, title, columns, rows, orgName = 'Bishoftu Motor Vehicle Engineering Industry' }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(16).fillColor('#0F3D5C').text(orgName, { align: 'center' });
  doc.fontSize(12).fillColor('#333').text(title, { align: 'center' });
  doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;
  let y = doc.y;

  doc.fontSize(9).fillColor('#fff');
  doc.rect(doc.page.margins.left, y, pageWidth, 20).fill('#0F3D5C');
  columns.forEach((col, i) => {
    doc.fillColor('#fff').text(col.header, doc.page.margins.left + i * colWidth + 4, y + 5, { width: colWidth - 8 });
  });
  y += 20;

  doc.fontSize(8);
  rows.forEach((row, idx) => {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (idx % 2 === 0) {
      doc.rect(doc.page.margins.left, y, pageWidth, 18).fill('#F3F6F8');
    }
    columns.forEach((col, i) => {
      const value = row[col.key] === null || row[col.key] === undefined ? '' : String(row[col.key]);
      doc.fillColor('#222').text(value, doc.page.margins.left + i * colWidth + 4, y + 4, { width: colWidth - 8 });
    });
    y += 18;
  });

  doc.end();
}

module.exports = { sendExcel, sendPdf };
