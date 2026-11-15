import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { Course, Enrollment, Progress } from '../models.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();

router.get('/:courseId', requireAuth, allowRoles('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollmentExists = await Enrollment.exists({
      student: req.user.id,
      course: course.id,
    });

    if (!enrollmentExists) {
      return res.status(403).json({ message: 'Course enrollment required' });
    }

    const progress = await Progress.findOne({
      student: req.user.id,
      course: course.id,
    });

    const done = new Set((progress?.completedLessons || []).map(String));
    if (
      !course.lessons.length ||
      !course.lessons.every((l) => done.has(String(l._id)))
    ) {
      return res.status(400).json({
        message: 'Complete every lesson before requesting a certificate',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="learnlive-certificate-${course.id}.pdf"`
    );

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: true,
    });

    doc.pipe(res);

    const width = doc.page.width; // 841.89
    const height = doc.page.height; // 595.28

    // Background fill - crisp executive ivory
    doc.rect(0, 0, width, height).fill('#fafbfe');

    // Outer Frame - Deep Classic Navy
    doc.rect(20, 20, width - 40, height - 40)
      .lineWidth(6)
      .strokeColor('#0f172a')
      .stroke();

    // Inner Decorative Border - Warm Gold
    doc.rect(28, 28, width - 56, height - 56)
      .lineWidth(1.5)
      .strokeColor('#c59b27')
      .stroke();

    // Thin accent border
    doc.rect(32, 32, width - 64, height - 64)
      .lineWidth(0.5)
      .strokeColor('#d4af37')
      .stroke();

    // Corner Ornaments (Diamonds)
    const cornerOffset = 28;
    const drawCornerDiamond = (x, y) => {
      doc.save();
      doc.translate(x, y);
      doc.polygon([-6, 0], [0, -6], [6, 0], [0, 6])
        .fillAndStroke('#c59b27', '#0f172a');
      doc.restore();
    };

    drawCornerDiamond(cornerOffset, cornerOffset);
    drawCornerDiamond(width - cornerOffset, cornerOffset);
    drawCornerDiamond(cornerOffset, height - cornerOffset);
    drawCornerDiamond(width - cornerOffset, height - cornerOffset);

    // --- Header ---
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#c59b27')
      .text('★   ★   ★   L E A R N L I V E   A C A D E M Y   ★   ★   ★', 0, 52, {
        align: 'center',
        width: width,
      });

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text('GLOBAL E-LEARNING & VERIFIED CREDENTIALS', 0, 70, {
        align: 'center',
        width: width,
      });

    // Title
    doc.font('Times-Bold')
      .fontSize(32)
      .fillColor('#0f172a')
      .text('Certificate of Completion', 0, 96, {
        align: 'center',
        width: width,
      });

    // Decorative divider line
    const divWidth = 260;
    const divX = (width - divWidth) / 2;
    doc.moveTo(divX, 142)
      .lineTo(divX + divWidth, 142)
      .lineWidth(1)
      .strokeColor('#c59b27')
      .stroke();

    // Small center diamond on line
    doc.polygon(
      [width / 2 - 4, 142],
      [width / 2, 138],
      [width / 2 + 4, 142],
      [width / 2, 146]
    ).fill('#c59b27');

    // Recipient Prompt
    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#64748b')
      .text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 160, {
        align: 'center',
        width: width,
      });

    // Student Name
    const studentName = req.user.name || 'LearnLive Student';
    doc.font('Times-Bold')
      .fontSize(30)
      .fillColor('#0f172a')
      .text(studentName, 0, 185, {
        align: 'center',
        width: width,
      });

    // Name underline accent bar
    const nameBarW = 280;
    doc.moveTo((width - nameBarW) / 2, 226)
      .lineTo((width + nameBarW) / 2, 226)
      .lineWidth(1.5)
      .strokeColor('#d4af37')
      .stroke();

    // Purpose / Description
    doc.font('Helvetica')
      .fontSize(12)
      .fillColor('#475569')
      .text(
        'for successfully fulfilling all curriculum requirements and mastering',
        0,
        245,
        {
          align: 'center',
          width: width,
        }
      );

    // Course Name
    const courseTitle = course.title || 'Course of Study';
    doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#1e40af')
      .text(courseTitle, 60, 272, {
        align: 'center',
        width: width - 120,
      });

    doc.font('Helvetica')
      .fontSize(10.5)
      .fillColor('#64748b')
      .text(
        'A comprehensive self-paced specialization verified by practical evaluations and hands-on lessons.',
        0,
        310,
        {
          align: 'center',
          width: width,
        }
      );

    // --- Footer Section ---
    const footerY = 415;

    // 1. Left: Instructor Signature
    const instructorName = course.instructor?.name || 'LearnLive Faculty';
    const leftColX = 90;
    doc.moveTo(leftColX, footerY + 45)
      .lineTo(leftColX + 180, footerY + 45)
      .lineWidth(1)
      .strokeColor('#94a3b8')
      .stroke();

    doc.font('Times-Italic')
      .fontSize(16)
      .fillColor('#0f172a')
      .text(instructorName, leftColX, footerY + 24, {
        width: 180,
        align: 'center',
      });

    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1e293b')
      .text('Lead Instructor', leftColX, footerY + 52, {
        width: 180,
        align: 'center',
      });

    doc.font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748b')
      .text('LearnLive Academy Faculty', leftColX, footerY + 66, {
        width: 180,
        align: 'center',
      });

    // 2. Center: Gold Official Seal
    const sealCenterX = width / 2;
    const sealCenterY = footerY + 35;

    doc.circle(sealCenterX, sealCenterY, 36)
      .lineWidth(2)
      .strokeColor('#c59b27')
      .fillAndStroke('#fffbf0', '#c59b27');

    doc.circle(sealCenterX, sealCenterY, 31)
      .lineWidth(1)
      .strokeColor('#d4af37')
      .stroke();

    doc.circle(sealCenterX, sealCenterY, 28)
      .lineWidth(0.5)
      .strokeColor('#e2c262')
      .stroke();

    doc.font('Times-Bold')
      .fontSize(14)
      .fillColor('#c59b27')
      .text('★', sealCenterX - 7, sealCenterY - 18);

    doc.font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor('#854d0e')
      .text('OFFICIAL SEAL', sealCenterX - 35, sealCenterY - 2, {
        width: 70,
        align: 'center',
      });

    doc.font('Helvetica-Bold')
      .fontSize(6.5)
      .fillColor('#b45309')
      .text('VERIFIED', sealCenterX - 35, sealCenterY + 9, {
        width: 70,
        align: 'center',
      });

    // 3. Right: Platform Directorate & Issue Date
    const rightColX = width - 270;
    doc.moveTo(rightColX, footerY + 45)
      .lineTo(rightColX + 180, footerY + 45)
      .lineWidth(1)
      .strokeColor('#94a3b8')
      .stroke();

    doc.font('Times-Italic')
      .fontSize(16)
      .fillColor('#0f172a')
      .text('Academic Directorate', rightColX, footerY + 24, {
        width: 180,
        align: 'center',
      });

    const issueDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1e293b')
      .text(issueDate, rightColX, footerY + 52, {
        width: 180,
        align: 'center',
      });

    doc.font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748b')
      .text('Date of Conferment', rightColX, footerY + 66, {
        width: 180,
        align: 'center',
      });

    // Verification Code Bottom Bar
    const courseSuffix = String(course.id || course._id).slice(-6).toUpperCase();
    const userSuffix = String(req.user.id || req.user._id).slice(-4).toUpperCase();
    const certId = `LL-CERT-${courseSuffix}-${userSuffix}`;

    doc.font('Courier')
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(
        `Certificate ID: ${certId}  •  Verify at: https://learning-management-system-live-cla.vercel.app`,
        0,
        height - 38,
        {
          align: 'center',
          width: width,
        }
      );

    doc.end();
  } catch (error) {
    console.error('Certificate generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate certificate' });
    }
  }
});

export default router;
