const Vote = require('../models/Vote');
const Proposal = require('../models/Proposal');
const blockchainService = require('../services/blockchainService');

class VoteController {
  async castVote(req, res) {
    try {
      const { proposalId, voterAddress } = req.body;
      
      if (!proposalId || !voterAddress) {
        return res.status(400).json({
          success: false,
          error: 'Proposal ID and voter address are required'
        });
      }

      const proposal = await Proposal.findOne({ 
        proposalId: parseInt(proposalId),
        isActive: true 
      });
      
      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found or not active'
        });
      }

      const existingVote = await Vote.findOne({
        proposalId: parseInt(proposalId),
        voterAddress: voterAddress.toLowerCase()
      });

      if (existingVote) {
        return res.status(400).json({
          success: false,
          error: 'User has already voted on this proposal'
        });
      }

      const hasVotedOnChain = await blockchainService.hasUserVoted(proposalId, voterAddress);
      if (hasVotedOnChain) {
        return res.status(400).json({
          success: false,
          error: 'User has already voted on this proposal on the blockchain'
        });
      }

      const result = await blockchainService.voteOnProposal(proposalId, voterAddress);

      const vote = new Vote({
        proposalId: parseInt(proposalId),
        voterAddress: voterAddress.toLowerCase(),
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: new Date(),
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: parseInt(result.gasUsed),
        gasPrice: '20000000000'
      });

      await vote.save();

      await Proposal.findOneAndUpdate(
        { proposalId: parseInt(proposalId) },
        { $inc: { voteCount: 1 } }
      );

      res.status(201).json({
        success: true,
        data: {
          proposalId: parseInt(proposalId),
          voterAddress: voterAddress.toLowerCase(),
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed
        },
        message: 'Vote cast successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to cast vote',
        message: error.message
      });
    }
  }

  async checkUserVote(req, res) {
    try {
      const { proposalId, voterAddress } = req.query;

      if (!proposalId || !voterAddress) {
        return res.status(400).json({
          success: false,
          error: 'Proposal ID and voter address are required'
        });
      }

      const vote = await Vote.findOne({
        proposalId: parseInt(proposalId),
        voterAddress: voterAddress.toLowerCase()
      });

      res.json({
        success: true,
        data: {
          hasVoted: !!vote,
          vote: vote || null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check vote status'
      });
    }
  }

  async getVotesForProposal(req, res) {
    try {
      const { proposalId } = req.params;

      const votes = await Vote.find({ proposalId: parseInt(proposalId) })
        .sort({ timestamp: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          proposalId: parseInt(proposalId),
          votes,
          count: votes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get votes for proposal'
      });
    }
  }

  async getVotesByVoter(req, res) {
    try {
      const { voterAddress } = req.params;

      const votes = await Vote.find({ 
        voterAddress: voterAddress.toLowerCase() 
      })
        .sort({ timestamp: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          voterAddress: voterAddress.toLowerCase(),
          votes,
          count: votes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get votes by voter'
      });
    }
  }

  async checkVoteStatus(req, res) {
    try {
      const { proposalId, voterAddress } = req.params;

      const vote = await Vote.findOne({
        proposalId: parseInt(proposalId),
        voterAddress: voterAddress.toLowerCase()
      });

      res.json({
        success: true,
        data: {
          hasVoted: !!vote,
          vote: vote || null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check vote status'
      });
    }
  }

  async getVotingStats(req, res) {
    try {
      const stats = await Vote.aggregate([
        {
          $group: {
            _id: null,
            totalVotes: { $sum: 1 },
            uniqueVoters: { $addToSet: '$voterAddress' },
            totalGasUsed: { $sum: '$gasUsed' }
          }
        },
        {
          $project: {
            _id: 0,
            totalVotes: 1,
            uniqueVoterCount: { $size: '$uniqueVoters' },
            totalGasUsed: 1
          }
        }
      ]);

      res.json({
        success: true,
        data: stats[0] || {
          totalVotes: 0,
          uniqueVoterCount: 0,
          totalGasUsed: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get voting statistics'
      });
    }
  }

  async getRecentVotes(req, res) {
    try {
      const { limit = 10 } = req.query;

      const votes = await Vote.find({})
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data: {
          votes,
          count: votes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get recent votes'
      });
    }
  }


  async getVoteAnalytics(req, res) {
    try {
      const { contractAddress, timeRange = '7d' } = req.query;
      
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const matchStage = {
        timestamp: { $gte: startDate }
      };
      if (contractAddress) matchStage.contractAddress = contractAddress;

      const analytics = await Vote.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            votes: { $sum: 1 },
            uniqueVoters: { $addToSet: '$voterAddress' },
            totalGasUsed: { $sum: { $toInt: '$gasUsed' } }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          timeRange,
          analytics: analytics.map(item => ({
            date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
            votes: item.votes,
            uniqueVoters: item.uniqueVoters.length,
            totalGasUsed: item.totalGasUsed
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get vote analytics'
      });
    }
  }

  async verifyVote(req, res) {
    try {
      const { voteId } = req.params;

      const vote = await Vote.findById(voteId);
      if (!vote) {
        return res.status(404).json({
          success: false,
          error: 'Vote not found'
        });
      }

      vote.isVerified = true;
      vote.verificationHash = vote._id.toString();
      await vote.save();

      res.json({
        success: true,
        data: vote.getSummary(),
        message: 'Vote verified successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to verify vote'
      });
    }
  }
}

module.exports = new VoteController();