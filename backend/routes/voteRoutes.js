const express = require('express');
const voteController = require('../controllers/voteController');
const { validateVote, validateVoteId } = require('../middleware/validation');

const router = express.Router();

router.get('/stats', voteController.getVotingStats);
router.get('/recent', voteController.getRecentVotes);
router.get('/analytics', voteController.getVoteAnalytics);
router.get('/proposal/:proposalId', voteController.getVotesForProposal);
router.get('/voter/:voterAddress', voteController.getVotesByVoter);
router.get('/status/:proposalId/:voterAddress', voteController.checkVoteStatus);
router.get('/check', voteController.checkUserVote);
router.post('/', validateVote, voteController.castVote);
router.put('/:voteId/verify', validateVoteId, voteController.verifyVote);

module.exports = router;