const blockchainService = require('../services/blockchainService');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');

class ContractController {
  async getContractInfo(req, res) {
    try {
      const info = blockchainService.getContractInfo();
      
      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract information',
        message: error.message
      });
    }
  }

  async getContractStats(req, res) {
    try {
      const totalProposals = await Proposal.countDocuments();
      const activeProposals = await Proposal.countDocuments({ isActive: true });
      const totalVotes = await Vote.countDocuments();
      const uniqueVoters = await Vote.distinct('voterAddress');

      res.json({
        success: true,
        data: {
          totalProposals,
          activeProposals,
          totalVotes,
          uniqueVoters: uniqueVoters.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get contract statistics'
      });
    }
  }

  async getContractABI(req, res) {
    try {
      const abi = blockchainService.getContractABI();
      
      res.json({
        success: true,
        data: { abi }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get contract ABI'
      });
    }
  }

  async syncProposals(req, res) {
    try {
      const proposals = await blockchainService.getAllProposals();
      
      for (const proposal of proposals) {
        const existingProposal = await Proposal.findOne({ 
          proposalId: proposal.id 
        });

        if (!existingProposal) {
          const newProposal = new Proposal({
            proposalId: proposal.id,
            title: proposal.title,
            description: proposal.description,
            contractAddress: '0x1234567890123456789012345678901234567890',
            creator: proposal.creator,
            deadline: proposal.deadline,
            isActive: proposal.isActive,
            voteCount: proposal.voteCount,
            createdAt: new Date(proposal.createdAt * 1000)
          });

          await newProposal.save();
        }
      }

      res.json({
        success: true,
        message: 'Proposals synced successfully',
        data: {
          synced: proposals.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to sync proposals',
        message: error.message
      });
    }
  }

  async getContractHealth(req, res) {
    try {
      const isHealthy = await blockchainService.getContractInfo();
      
      res.json({
        success: true,
        data: {
          isHealthy: !!isHealthy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Contract health check failed'
      });
    }
  }
}

module.exports = new ContractController();