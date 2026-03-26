const { ImapFlow } = require('imapflow');

async function run() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: 'crawler.carl1980@gmail.com',
      pass: '!Ibckeg1',
    },
    logger: {
      debug: () => {},
      info: (obj) => console.log('[INFO]', obj.msg || JSON.stringify(obj)),
      warn: (obj) => console.log('[WARN]', obj.msg || JSON.stringify(obj)),
      error: (obj) => console.log('[ERROR]', obj.msg || JSON.stringify(obj)),
    },
  });

  try {
    console.log('Connecting to Gmail IMAP...');
    await client.connect();
    console.log('Connected!');
    await client.logout();
  } catch (err) {
    console.error('IMAP Error:', err.message);
    if (err.responseText) console.log('Response:', err.responseText);
  }
}

run();
