const { Router } = require('express');
const collection = require('../controllers/collection');

const router = Router();

router.get('/', collection.getResources);
router.get('/webScrapping', collection.webScrapping);

module.exports = router;
