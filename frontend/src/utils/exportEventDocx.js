import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel } from 'docx';

async function getImageBufferFromBase64(base64) {
  // Remove header if present
  const base64Data = base64.split(',')[1];
  const response = await fetch(base64);
  const blob = await response.blob();
  return await blob.arrayBuffer();
}

export async function exportEventToDocx(event, eventId = '') {
  const docChildren = [
    new Paragraph({ text: '項目資訊', heading: HeadingLevel.TITLE }),
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('房屋')] }),
            new TableCell({ children: [new Paragraph(event.house_id || '')] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('舊房屋')] }),
            new TableCell({ children: [new Paragraph(event.old_house_id || '')] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('單位')] }),
            new TableCell({ children: [new Paragraph(event.flat || '')] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('客戶')] }),
            new TableCell({ children: [new Paragraph(event.customer_name || '')] }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '問題列表', heading: HeadingLevel.HEADING_1 }),
  ];

  for (const [idx, problem] of (event.problems || []).entries()) {
    docChildren.push(new Paragraph({ text: `問題 #${idx + 1}`, heading: HeadingLevel.HEADING_2 }));
    docChildren.push(new Paragraph({ text: `描述: ${problem.description || ''}` }));
    docChildren.push(new Paragraph({ text: `分類: ${problem.category || ''}` }));
    docChildren.push(new Paragraph({ text: `重要: ${problem.important ? '是' : '否'}` }));
    docChildren.push(new Paragraph({ text: `時間: ${problem.created_at || ''}` }));
    if (problem.image && problem.image.length > 0) {
      for (const img of problem.image.slice(0, 4)) {
        if (img.startsWith('data:image')) {
          try {
            const buffer = await getImageBufferFromBase64(img);
            // Use docx.ImageRun for image embedding
            const { ImageRun } = await import('docx');
            docChildren.push(new ImageRun({ data: buffer, transformation: { width: 200, height: 200 } }));
          } catch {
            docChildren.push(new Paragraph('圖片載入失敗'));
          }
        } else {
          docChildren.push(new Paragraph('圖片載入失敗'));
        }
      }
    }
    docChildren.push(new Paragraph(''));
  }

  const doc = new Document({
    sections: [
      {
        children: docChildren,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `event_${eventId || ''}.docx`);
}
