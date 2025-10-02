const express = require('express');
const proposalController = require('../controllers/proposalController');
const { validateProposal, validateProposalId } = require('../middleware/validation');

const router = express.Router();

router.get('/', proposalController.getAllProposals);
router.get('/active', proposalController.getActiveProposals);
router.get('/analytics', proposalController.getProposalAnalytics);
router.get('/:proposalId', proposalController.getProposalById);
router.get('/:proposalId/stats', proposalController.getProposalStats);
router.post('/', validateProposal, proposalController.createProposal);
router.put('/:proposalId', validateProposalId, proposalController.updateProposal);
router.delete('/:proposalId', validateProposalId, proposalController.deleteProposal);

module.exports = router;