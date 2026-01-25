require('dotenv').config();

const mongoose = require('mongoose');
const compression = require('compression');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(compression());

// ✅ CORS global (suficiente)
app.use(cors());

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_DB).then(() => {
  console.log('DB Online');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'welcome.html'));
});

app.use('/api/collections', require('./routes/collections'));
app.use('/api/assets', require('./routes/assets'));

app.use((req, res) => {
  res.status(404);
  if (req.accepts(['html', 'json']) === 'html') {
    return res.sendFile(path.resolve(process.cwd(), 'templates', '404.html'));
  }
  return res.json({
    status: false,
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method,
  });
});

app.listen(port, () => {
  console.log('Servidor corriendo Puerto: ' + port);
});
