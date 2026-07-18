/**
 * Certificate PDF Generator
 * 
 * Generates professional PDF certificates with QR codes for verification
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface CertificateData {
  certificateId: string;
  studentName: string;
  courseName: string;
  framework: string;
  completionDate: Date;
  verificationUrl: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Collect PDF data in buffer
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(data.verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#1e3a8a', // Dark blue
          light: '#ffffff',
        },
      });

      // Extract base64 data from data URL
      const qrCodeBase64 = qrCodeDataURL.split(',')[1];
      const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');

      // Certificate background and border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3)
        .stroke('#1e3a8a');

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(1)
        .stroke('#3b82f6');

      // Header
      doc.fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('CERTIFICATE OF COMPLETION', 60, 80, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Subtitle
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('This certifies that', 60, 140, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Student name
      doc.fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(data.studentName, 60, 170, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Completion text
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('has successfully completed the training course', 60, 220, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Course name
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text(data.courseName, 60, 250, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Framework badge
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(doc.page.width / 2 - 80, 295, 160, 30)
        .fill('#3b82f6')
        .fillColor('#ffffff')
        .text(data.framework, doc.page.width / 2 - 80, 303, {
          align: 'center',
          width: 160,
        });

      // Date
      const formattedDate = data.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Issued on ${formattedDate}`, 60, 350, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // QR Code
      doc.image(qrCodeBuffer, doc.page.width / 2 - 60, 390, {
        width: 120,
        height: 120,
      });

      // QR Code label
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Scan to verify', doc.page.width / 2 - 60, 520, {
          align: 'center',
          width: 120,
        });

      // Certificate ID
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(`Certificate ID: ${data.certificateId}`, 60, doc.page.height - 70, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Footer branding
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('COAI Dashboard', 60, doc.page.height - 50, {
          align: 'center',
          width: doc.page.width - 120,
        });

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('AI Safety Training & Certification', 60, doc.page.height - 35, {
          align: 'center',
          width: doc.page.width - 120,
        });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
