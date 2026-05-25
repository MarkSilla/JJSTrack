export const getEnv = (key) => String(process.env[key] || '').trim();

export const getEmailConfig = () => {
  const emailUser = getEnv('SMTP_USER') || getEnv('EMAIL_USER');
  const emailPass = (getEnv('SMTP_PASS') || getEnv('EMAIL_PASS')).replace(/\s+/g, '');
  const emailFrom = getEnv('EMAIL_FROM') || emailUser;
  const smtpHost = getEnv('SMTP_HOST');
  const smtpPort = Number(getEnv('SMTP_PORT') || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

  const transport = smtpHost
    ? {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        pool: true,
        maxConnections: 1,
      }
    : {
        service: 'gmail',
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        pool: true,
        maxConnections: 1,
      };

  return {
    emailUser,
    emailPass,
    emailFrom,
    transport,
  };
};
