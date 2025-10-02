const express = require('express');
const contractController = require('../controllers/contractController');

const router = express.Router();

router.get('/info', contractController.getContractInfo);
router.get('/stats', contractController.getContractStats);
router.get('/abi', contractController.getContractABI);
router.get('/health', contractController.getContractHealth);
router.post('/sync', contractController.syncProposals);

module.exports = router;