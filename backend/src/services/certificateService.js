const PDFDocument = require('pdfkit');

/**
 * Generate a PDF certificate buffer for a passing candidate submission
 * @param {Object} params - { submission, exam, student }
 * @returns {Promise<Buffer>}
 */
const generateCertificatePDF = ({ submission, exam, student }) => {
  return new Promise((resolve, reject) => {
    try {
      // Landscape A4 certificate
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40
      });

      const buffers = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;

      // Decorative Borders
      // Outer border
      doc.lineWidth(4)
        .strokeColor('#4F46E5')
        .rect(20, 20, width - 40, height - 40)
        .stroke();

      // Inner thin border
      doc.lineWidth(1)
        .strokeColor('#9CA3AF')
        .rect(26, 26, width - 52, height - 52)
        .stroke();

      // Header Brand
      doc.font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#4F46E5')
        .text('EXAMSPHERE ASSESSMENTS', 0, 60, { align: 'center', characterSpacing: 2 });

      // Title
      doc.font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#1F2937')
        .text('CERTIFICATE OF ACHIEVEMENT', 0, 95, { align: 'center', characterSpacing: 1 });

      // Horizontal Divider
      doc.moveTo(width / 2 - 120, 135)
        .lineTo(width / 2 + 120, 135)
        .lineWidth(2)
        .strokeColor('#6366F1')
        .stroke();

      // Subtitle
      doc.font('Helvetica')
        .fontSize(14)
        .fillColor('#4B5563')
        .text('This is proudly presented to', 0, 160, { align: 'center' });

      // Candidate Name
      const studentName = student.name || 'Candidate';
      doc.font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#111827')
        .text(studentName, 0, 190, { align: 'center' });

      // Description
      doc.font('Helvetica')
        .fontSize(13)
        .fillColor('#4B5563')
        .text('for successfully demonstrating competency and passing the examination', 0, 235, { align: 'center' });

      // Exam Title
      const examTitle = exam.title || 'Online Examination';
      doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#4338CA')
        .text(`"${examTitle}"`, 0, 265, { align: 'center' });

      // Score and Completion Date
      const score = submission.score || 0;
      const totalMarks = exam.totalMarks || 100;
      const completionDate = submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#374151')
        .text(`Score Achieved: ${score} / ${totalMarks} Marks    |    Issued on: ${completionDate}`, 0, 310, {
          align: 'center'
        });

      // Verification ID & Footer
      const certId = `EXS-${submission._id.toString().toUpperCase()}`;
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#9CA3AF')
        .text(`Certificate Verification ID: ${certId}`, 50, height - 70, { align: 'left' });

      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#4F46E5')
        .text('Verified by ExamSphere Integrity Engine', width - 300, height - 70, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateCertificatePDF
};
