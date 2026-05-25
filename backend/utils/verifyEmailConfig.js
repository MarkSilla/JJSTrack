import { getEmailConfig } from './emailConfig.js';
import { verifyEmailConnection } from './emailSender.js';

const { provider, emailFrom } = getEmailConfig();

try {
  const result = await verifyEmailConnection();
  console.log('Email config OK');
  console.log(`Provider: ${provider}`);
  console.log(`From: ${emailFrom}`);
  if (result.emailUser) {
    console.log(`User: ${result.emailUser}`);
  }
} catch (error) {
  console.error('Email config failed:', {
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
    statusCode: error.statusCode,
    message: error.message,
  });
  process.exit(1);
}
