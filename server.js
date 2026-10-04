require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('./db');

const app = express();
app.set('trust proxy', 1); // مهم عند التشغيل خلف Nginx أو استضافة
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null,
    },
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/files', require('./routes/files'));
app.use('/api', (req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ في الخادم' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('الخادم يعمل على http://localhost:' + port));
