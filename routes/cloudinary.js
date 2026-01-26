const { Router } = require('express');
const { get_signature } = require('../controllers/cloudinary');

const router = Router();

router.post('/signature', get_signature);

module.exports = router;
