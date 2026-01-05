const webpush = require('web-push');

// Generar VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (VAPID_PRIVATE_KEY):');
console.log(vapidKeys.privateKey);
console.log('\nSubject (VAPID_SUBJECT - use your email or app URL):');
console.log('mailto:admin@oxxo.com');
console.log('\n=== Add these to your .env.local file ===\n');




