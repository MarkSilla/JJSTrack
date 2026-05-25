import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { getEmailConfig } from './emailConfig.js';

dotenv.config();

const { emailUser, emailFrom, transport } = getEmailConfig();

if (!emailUser || !transport.auth?.pass) {
  console.error('Email config missing. Set EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS.');
  process.exit(1);
}

const transporter = nodemailer.createTransport(transport);

try {
  await transporter.verify();
  console.log('Email config OK');
  console.log(`User: ${emailUser}`);
  console.log(`From: ${emailFrom}`);
} catch (error) {
  console.error('Email config failed:', {
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
    message: error.message,
  });
  process.exit(1);
}
