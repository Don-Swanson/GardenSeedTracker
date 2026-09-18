import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const EmailProvider = require('next-auth/providers/email').default

test('NextAuth email provider sends its verification message with patched Nodemailer', { timeout: 15000 }, async () => {
  let message = ''
  const sockets = new Set()
  const smtp = createServer(socket => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.setEncoding('utf8')
    socket.write('220 localhost test SMTP\r\n')
    let input = '', data = false
    socket.on('data', chunk => {
      input += chunk
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n')
        const line = input.slice(0, end)
        input = input.slice(end + 2)
        if (data) {
          if (line === '.') { data = false; socket.write('250 accepted\r\n') }
          else message += line + '\n'
        } else if (/^EHLO|^HELO/.test(line)) socket.write('250-localhost\r\n250 HELP\r\n')
        else if (line === 'DATA') { data = true; socket.write('354 end with dot\r\n') }
        else if (line === 'QUIT') socket.end('221 goodbye\r\n')
        else socket.write('250 OK\r\n')
      }
    })
  })
  smtp.listen(0, '127.0.0.1')
  await once(smtp, 'listening')
  try {
    const provider = EmailProvider({})
    await provider.sendVerificationRequest({
      identifier: 'gardener@example.test', url: 'https://gst.example.test/auth/verify?token=synthetic', theme: {},
      provider: { ...provider, from: 'GST <login@example.test>', server: { host: '127.0.0.1', port: smtp.address().port, secure: false, ignoreTLS: true, connectionTimeout: 5000, socketTimeout: 5000 } },
    })
    assert.match(message, /To: gardener@example\.test/)
    assert.match(message, /Subject: Sign in to gst\.example\.test/)
    assert.match(message, /token=3Dsynthetic|token=synthetic/)
  } finally {
    for (const socket of sockets) socket.destroy()
    await new Promise(resolve => smtp.close(resolve))
  }
})
