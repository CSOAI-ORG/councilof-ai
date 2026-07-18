/**
 * Certificate PDF Generator V2
 * 
 * Generates professional PDF certificates using the modern template image
 * with overlaid student data, QR codes, and CSOAI branding
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CertificateDataV2 {
  certificateId: string;
  studentName: string;
  courseName: string;
  framework: string;
  completionDate: Date;
  verificationUrl: string;
}

export async function generateCertificatePDFV2(data: CertificateDataV2): Promise<Buffer> {
  try {
    // Load the certificate template
    const templatePath = path.join(process.cwd(), 'client/public/certificate-modern.png');
    const template = await loadImage(templatePath);

    // Create canvas with template dimensions
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    // Draw template
    ctx.drawImage(template, 0, 0);

    // Configure text rendering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Student Name (large, elegant)
    ctx.font = 'italic 72px serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(data.studentName, canvas.width / 2, canvas.height * 0.42);

    // Course Name
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#1f2937';
    const courseText = `For successfully completing ${data.courseName}`;
    ctx.fillText(courseText, canvas.width / 2, canvas.height * 0.58);

    // Completion Date
    const formattedDate = data.completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(`Completion Date: ${formattedDate}`, canvas.width * 0.12, canvas.height * 0.72);

    // Certificate ID
    ctx.textAlign = 'right';
    ctx.fillText(`Certificate ID: ${data.certificateId}`, canvas.width * 0.88, canvas.height * 0.72);

    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(data.verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    const qrCodeImage = await loadImage(qrCodeDataURL);
    
    // Draw QR code (bottom right)
    const qrSize = 150;
    ctx.drawImage(qrCodeImage, canvas.width * 0.85, canvas.height * 0.78, qrSize, qrSize);

    // Convert canvas to PNG buffer
    const pngBuffer = canvas.toBuffer('image/png');

    // Create PDF from PNG
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([canvas.width, canvas.height]);
    
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    // Add metadata
    pdfDoc.setTitle(`CSOAI Certificate - ${data.studentName}`);
    pdfDoc.setSubject(`Certificate of Completion for ${data.courseName}`);
    pdfDoc.setAuthor('CSOAI - Certified Safety Oversight AI');
    pdfDoc.setCreator('CSOAI Platform');
    pdfDoc.setProducer('CSOAI Certificate Generator V2');
    pdfDoc.setKeywords(['AI Safety', 'Certification', 'CSOAI', data.framework]);
    pdfDoc.setCreationDate(new Date());

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
