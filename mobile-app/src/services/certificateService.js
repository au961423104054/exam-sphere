import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

/**
 * Builds a certificate HTML template adhering to ExamSphere brand guidelines.
 */
export const buildCertificateHtml = ({
  candidateName = 'Alex Student',
  examTitle = 'Full-Stack MERN Architecture Assessment',
  score = 85,
  totalMarks = 100,
  percentage = '85.0%',
  grade = 'Grade A - Distinction',
  issueDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  certificateId = `ES-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  organizationName = 'ExamSphere Global Academy',
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>ExamSphere Certificate of Achievement - ${candidateName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Cinzel:wght@600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #F8FAFC;
          color: #0F172A;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
        }

        .cert-container {
          width: 820px;
          min-height: 580px;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 40px 48px;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 12px double #4F46E5;
          outline: 2px solid #E0E7FF;
          outline-offset: -6px;
          overflow: hidden;
        }

        .corner-decoration {
          position: absolute;
          width: 70px;
          height: 70px;
          border: 4px solid #6366F1;
        }
        .top-left { top: 12px; left: 12px; border-right: none; border-bottom: none; }
        .top-right { top: 12px; right: 12px; border-left: none; border-bottom: none; }
        .bottom-left { bottom: 12px; left: 12px; border-right: none; border-top: none; }
        .bottom-right { bottom: 12px; right: 12px; border-left: none; border-top: none; }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 110px;
          font-weight: 900;
          color: rgba(79, 70, 229, 0.03);
          letter-spacing: 12px;
          pointer-events: none;
          z-index: 1;
        }

        .content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .header-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .brand-logo-badge {
          background: linear-gradient(135deg, #4F46E5, #312E81);
          color: #FFFFFF;
          font-weight: 800;
          font-size: 16px;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #312E81;
          letter-spacing: -0.5px;
        }

        .org-name {
          font-size: 12px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .cert-title {
          font-family: 'Cinzel', serif;
          font-size: 32px;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .subtitle {
          font-size: 13px;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }

        .candidate-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: #4F46E5;
          padding-bottom: 8px;
          border-bottom: 2px solid #CBD5E1;
          display: inline-block;
          min-width: 380px;
          margin-bottom: 18px;
        }

        .desc-text {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          max-width: 580px;
          margin: 0 auto 20px auto;
        }

        .exam-title-pill {
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          color: #3730A3;
          font-weight: 700;
          font-size: 15px;
          padding: 8px 24px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 24px;
        }

        .metrics-grid {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 28px;
        }

        .metric-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 20px;
          min-width: 120px;
        }

        .metric-label {
          font-size: 10px;
          color: #64748B;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
        }

        .metric-green { color: #10B981; }

        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #E2E8F0;
        }

        .sig-block {
          text-align: left;
        }

        .sig-line {
          font-family: 'Cinzel', cursive, serif;
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 4px;
        }

        .sig-title {
          font-size: 11px;
          color: #64748B;
          font-weight: 600;
          text-transform: uppercase;
        }

        .seal-badge {
          background: #FFFBEB;
          border: 2px dashed #F59E0B;
          color: #B45309;
          font-size: 11px;
          font-weight: 800;
          padding: 10px 14px;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.1;
        }

        .id-block {
          text-align: right;
        }

        .id-label {
          font-size: 10px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .id-val {
          font-family: monospace;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .verify-text {
          font-size: 10px;
          color: #10B981;
          font-weight: 700;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="corner-decoration top-left"></div>
        <div class="corner-decoration top-right"></div>
        <div class="corner-decoration bottom-left"></div>
        <div class="corner-decoration bottom-right"></div>
        <div class="watermark">EXAMSPHERE</div>

        <div class="content">
          <div class="header-brand">
            <div class="brand-logo-badge">ES</div>
            <div class="brand-name">ExamSphere</div>
          </div>
          <div class="org-name">${organizationName}</div>

          <div class="cert-title">Certificate of Achievement</div>
          <div class="subtitle">This credential certifies that</div>

          <div class="candidate-name">${candidateName}</div>

          <div class="desc-text">
            has demonstrated verified proficiency and successfully met the standardized proctored examination standards for:
          </div>

          <div class="exam-title-pill">${examTitle}</div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Score Earned</div>
              <div class="metric-value metric-green">${score} / ${totalMarks}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Performance</div>
              <div class="metric-value">${percentage}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Classification</div>
              <div class="metric-value">${grade}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Integrity Status</div>
              <div class="metric-value metric-green">Verified ✓</div>
            </div>
          </div>

          <div class="footer-row">
            <div class="sig-block">
              <div class="sig-line">Dr. Ronald Sterling</div>
              <div class="sig-title">Director of Academic Certification</div>
              <div class="sig-title">ExamSphere Examination Board</div>
            </div>

            <div class="seal-badge">
              <span>★ OFFICIAL ★</span>
              <span>VERIFIED</span>
            </div>

            <div class="id-block">
              <div class="id-label">Issue Date</div>
              <div class="id-val">${issueDate}</div>
              <div class="id-label" style="margin-top: 6px;">Certificate ID</div>
              <div class="id-val">${certificateId}</div>
              <div class="verify-text">Authenticity Digitally Signed</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates the certificate PDF and triggers native sharing or web download.
 */
export const downloadAndShareCertificate = async (certificateData) => {
  try {
    const html = buildCertificateHtml(certificateData);

    // On Web platform: print / save dialog
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return { success: true, method: 'web_print' };
    }

    // On iOS & Android: generate local PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `ExamSphere Certificate - ${certificateData.candidateName || 'Candidate'}`,
        UTI: 'com.adobe.pdf',
      });
      return { success: true, uri, method: 'sharing' };
    } else {
      Alert.alert(
        'Certificate Generated',
        `Your certificate PDF has been created successfully at:\n${uri}`
      );
      return { success: true, uri, method: 'local_file' };
    }
  } catch (error) {
    console.warn('[Certificate Service] Generation failed:', error);
    Alert.alert('Download Error', 'Unable to generate certificate PDF. Please try again.');
    return { success: false, error };
  }
};
