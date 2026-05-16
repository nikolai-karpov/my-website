const fetch = require('node-fetch');
fetch('site-components/header.html').then(r => r.ok ? r.text() : Promise.reject()).then(html => { console.log('Контент получен'); process.exit(0); }).catch(err => { console.error('Ошибка:', err.message); process.exit(1); });
