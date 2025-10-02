const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const blockchainService = require('../services/blockchainService');

class ProposalController {
  async getAllProposals(req, res) {
    try {
      const { contractAddress, active, limit = 50, page = 1 } = req.query;
      
      const query = {};
      if (contractAddress) query.contractAddress = contractAddress;
      if (active !== undefined) query.isActive = active === 'true';
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const proposals = await Proposal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Proposal.countDocuments(query);

      res.json({
        success: true,
        data: {
          proposals,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get proposals'
      });
    }
  }

  async getProposalById(req, res) {
    try {
      const { proposalId } = req.params;

      const proposal = await Proposal.findOne({ 
        proposalId: parseInt(proposalId) 
      }).lean();

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
      }

      const votes = await Vote.find({ 
        proposalId: parseInt(proposalId) 
      }).lean();

      res.json({
        success: true,
        data: {
          proposal,
          votes,
          voteCount: votes.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get proposal'
      });
    }
  }

  async createProposal(req, res) {
    try {
      const { title, description, deadline } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Title and description are required'
        });
      }

      const result = await blockchainService.createProposal(
        title, 
        description, 
        deadline || 0
      );

      const proposal = new Proposal({
        proposalId: result.proposalId,
        title,
        description,
        contractAddress: '0x1234567890123456789012345678901234567890',
        creator: '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109',
        deadline: deadline || 0,
        isActive: true,
        voteCount: 0,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      });

      await proposal.save();

      res.status(201).json({
        success: true,
        data: {
          proposalId: result.proposalId,
          title,
          description,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed
        },
        message: 'Proposal created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create proposal',
        message: error.message
      });
    }
  }

  async updateProposal(req, res) {
    try {
      const { proposalId } = req.params;
      const { title, description, isActive } = req.body;

      const proposal = await Proposal.findOne({ 
        proposalId: parseInt(proposalId) 
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
      }

      if (title) proposal.title = title;
      if (description) proposal.description = description;
      if (isActive !== undefined) proposal.isActive = isActive;

      await proposal.save();

      res.json({
        success: true,
        data: proposal,
        message: 'Proposal updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update proposal'
      });
    }
  }

  async deleteProposal(req, res) {
    try {
      const { proposalId } = req.params;

      const proposal = await Proposal.findOne({ 
        proposalId: parseInt(proposalId) 
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
      }

      await Proposal.deleteOne({ proposalId: parseInt(proposalId) });
      await Vote.deleteMany({ proposalId: parseInt(proposalId) });

      res.json({
        success: true,
        message: 'Proposal deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete proposal'
      });
    }
  }

  async getProposalStats(req, res) {
    try {
      const { proposalId } = req.params;

      const proposal = await Proposal.findOne({ 
        proposalId: parseInt(proposalId) 
      }).lean();

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposal not found'
        });
      }

      const votes = await Vote.find({ 
        proposalId: parseInt(proposalId) 
      }).lean();

      const uniqueVoters = [...new Set(votes.map(vote => vote.voterAddress))];

      res.json({
        success: true,
        data: {
          proposalId: parseInt(proposalId),
          totalVotes: votes.length,
          uniqueVoters: uniqueVoters.length,
          voters: uniqueVoters,
          isActive: proposal.isActive,
          createdAt: proposal.createdAt,
          deadline: proposal.deadline
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get proposal stats'
      });
    }
  }

  async getActiveProposals(req, res) {
    try {
      const proposals = await Proposal.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          proposals,
          count: proposals.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get active proposals'
      });
    }
  }

  async getProposalAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
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

      const analytics = await Proposal.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            proposals: { $sum: 1 },
            totalVotes: { $sum: '$voteCount' }
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
            proposals: item.proposals,
            totalVotes: item.totalVotes
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get proposal analytics'
      });
    }
  }
}

module.exports = new ProposalController();