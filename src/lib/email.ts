import nodemailer from 'nodemailer';

// Environment-configurable SMTP (defaults to Ethereal for free testing)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || 'test@ethereal.email',
    pass: process.env.EMAIL_PASS || 'testpass',
  },
});

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailParams) {
  try {
    const info = await transporter.sendMail({
      from: '"Healthcare Appointment Manager" <noreply@healthcare.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email] Message sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error);
    throw error;
  }
}

const themeColor = '#12A594';

export async function sendBookingConfirmation({ patientName, patientEmail, doctorName, specialization, date, time }: any) {
  const subject = `Appointment Confirmed with Dr. ${doctorName}`;
  const text = `Hi ${patientName}, your appointment with Dr. ${doctorName} (${specialization}) is confirmed for ${date} at ${time}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 10px;">Appointment Confirmed</h2>
      <p>Hi ${patientName},</p>
      <p>Your appointment has been successfully scheduled.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName} (${specialization})</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <h3>What happens next?</h3>
      <ul>
        <li>Your doctor will review your symptoms before you arrive.</li>
        <li>You'll receive a reminder 24 hours before your appointment.</li>
      </ul>
      <p>Thank you for choosing our platform.</p>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, text, html });
}

export async function sendCancellationNotice({ patientName, patientEmail, doctorName, date, reason }: any) {
  const subject = `Appointment Cancelled - Dr. ${doctorName}`;
  const text = `Hi ${patientName}, your appointment on ${date} has been cancelled. Reason: ${reason}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #eab308; border-bottom: 2px solid #eab308; padding-bottom: 10px;">Appointment Cancelled</h2>
      <p>Hi ${patientName},</p>
      <p>We're sorry to inform you that your appointment with Dr. ${doctorName} on ${date} has been cancelled.</p>
      <div style="background-color: #fefce8; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #eab308;">
        <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p><strong>Please visit our platform to reschedule your appointment.</strong></p>
      <p>We apologize for any inconvenience.</p>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, text, html });
}

export async function sendMedicationReminder({ patientName, patientEmail, medications }: any) {
  const subject = `Medication Reminder`;
  const text = `Hi ${patientName}, this is a reminder to take your medications.`;
  
  const medRows = medications.map((med: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${med.medicationName}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.dosage}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.frequency}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${med.instructions}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 10px;">Medication Reminder</h2>
      <p>Hi ${patientName},</p>
      <p>This is a friendly reminder for your prescribed medications:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f9f9f9; text-align: left;">
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Medication</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Dosage</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Frequency</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medRows}
        </tbody>
      </table>
      <p>Stay healthy!</p>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, text, html });
}

export async function sendAppointmentReminder({ patientName, patientEmail, doctorName, date, time }: any) {
  const subject = `Reminder: Appointment with Dr. ${doctorName} tomorrow`;
  const text = `Hi ${patientName}, your appointment is tomorrow at ${time}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: ${themeColor}; border-bottom: 2px solid ${themeColor}; padding-bottom: 10px;">Appointment Reminder</h2>
      <p>Hi ${patientName},</p>
      <p>This is a reminder that <strong>Your appointment is tomorrow</strong>.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <h3>Preparation tips:</h3>
      <ul>
        <li>Please arrive 10 minutes early.</li>
        <li>Bring any previous medical records or test results.</li>
        <li>Keep a list of your current medications ready.</li>
      </ul>
      <p>See you soon!</p>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, text, html });
}
