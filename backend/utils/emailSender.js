import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { URL } from 'node:url';
import nodemailer from 'nodemailer';
import { getEmailConfig } from './emailConfig.js';

const isRemotePath = (value) => /^https?:\/\//i.test(String(value || ''));

const getAttachmentFilename = (attachment) => {
  if (attachment.filename) return attachment.filename;
  if (attachment.path && !isRemotePath(attachment.path)) return path.basename(attachment.path);
  return undefined;
};

const toBase64Content = (content) => {
  if (Buffer.isBuffer(content)) return content.toString('base64');
  return String(content || '');
};

const normalizeResendAttachment = (attachment) => {
  const normalized = {
    filename: getAttachmentFilename(attachment),
  };

  if (attachment.cid) {
    normalized.contentId = attachment.cid;
  }

  if (attachment.content) {
    normalized.content = toBase64Content(attachment.content);
  } else if (attachment.path) {
    if (isRemotePath(attachment.path)) {
      normalized.path = attachment.path;
    } else {
      normalized.content = fs.readFileSync(attachment.path).toString('base64');
    }
  }

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined && value !== '')
  );
};

const buildResendPayload = (mailOptions) => {
  const payload = {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
  };

  if (mailOptions.html) payload.html = mailOptions.html;
  if (mailOptions.text) payload.text = mailOptions.text;

  if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
    payload.attachments = mailOptions.attachments.map(normalizeResendAttachment);
  }

  return payload;
};

const parseResponseBody = (body) => {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return { message: body };
  }
};

const postJson = (urlString, payload, headers = {}) => new Promise((resolve, reject) => {
  const target = new URL(urlString);

  if (target.protocol !== 'https:') {
    reject(new Error('Resend API URL must use https'));
    return;
  }

  const requestBody = JSON.stringify(payload);
  const request = https.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        ...headers,
      },
    },
    (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        const parsedBody = parseResponseBody(body);
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          body: parsedBody,
        });
      });
    }
  );

  request.on('error', reject);
  request.setTimeout(Number(process.env.EMAIL_SEND_TIMEOUT_MS || 30000), () => {
    request.destroy(new Error('Resend email request timed out'));
  });
  request.write(requestBody);
  request.end();
});

const sendResendEmail = async (mailOptions, config) => {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER is set to resend');
  }

  if (!config.emailFrom) {
    throw new Error('Email sender is required. Set EMAIL_FROM or RESEND_FROM.');
  }

  const response = await postJson(
    config.resendApiUrl,
    buildResendPayload(mailOptions),
    { Authorization: `Bearer ${config.resendApiKey}` }
  );

  if (!response.ok) {
    const message = response.body?.message || response.body?.error || 'Resend email request failed';
    const error = new Error(message);
    error.provider = 'resend';
    error.statusCode = response.statusCode;
    error.response = response.body;
    throw error;
  }

  return {
    provider: 'resend',
    messageId: response.body?.id,
    id: response.body?.id,
  };
};

const sendSmtpEmail = async (mailOptions, config) => {
  const transporter = nodemailer.createTransport(config.transport);

  try {
    return await transporter.sendMail(mailOptions);
  } finally {
    transporter.close();
  }
};

export const sendEmail = async (mailOptions) => {
  const config = getEmailConfig();

  if (config.provider === 'resend') {
    return sendResendEmail(mailOptions, config);
  }

  return sendSmtpEmail(mailOptions, config);
};

export const verifyEmailConnection = async () => {
  const config = getEmailConfig();

  if (config.provider === 'resend') {
    if (!config.resendApiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER is set to resend');
    }

    if (!config.emailFrom) {
      throw new Error('EMAIL_FROM or RESEND_FROM is required when using Resend');
    }

    return {
      provider: 'resend',
      emailFrom: config.emailFrom,
    };
  }

  if (!config.emailUser || !config.emailPass) {
    throw new Error('Email config missing. Set EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport(config.transport);

  try {
    await transporter.verify();
    return {
      provider: 'smtp',
      emailUser: config.emailUser,
      emailFrom: config.emailFrom,
    };
  } finally {
    transporter.close();
  }
};
