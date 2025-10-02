/**
 * Mock Blockchain Service
 * Simulates blockchain interactions for local development without real ETH
 */

class MockBlockchainService {
  constructor() {
    this.contractAddress = '0x1234567890123456789012345678901234567890';
    this.owner = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    this.proposals = new Map();
    this.proposalCount = 0;
    this.votes = new Map(); // proposalId -> Set of voter addresses
  }

  /**
   * Get contract information
   */
  getContractInfo() {
    return {
      address: this.contractAddress,
      owner: this.owner,
      isInitialized: true,
      isMock: true
    };
  }

  /**
   * Create a new proposal (mock)
   */
  async createProposal(title, description, deadline = 0) {
    try {
      this.proposalCount++;
      const proposalId = this.proposalCount;
      
      const proposal = {
        id: proposalId,
        title,
        description,
        voteCount: 0,
        creator: this.owner,
        createdAt: Math.floor(Date.now() / 1000),
        deadline,
        isActive: true
      };

      this.proposals.set(proposalId, proposal);
      this.votes.set(proposalId, new Set());

      console.log(`✅ Mock proposal created: ${title}`);
      
      return {
        proposalId,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: 12345 + proposalId,
        gasUsed: 100000 + Math.floor(Math.random() * 50000)
      };
    } catch (error) {
      console.error('❌ Mock create proposal error:', error);
      throw error;
    }
  }

  /**
   * Vote on a proposal (mock)
   */
  async vote(proposalId, voterAddress) {
    try {
      if (!this.proposals.has(proposalId)) {
        throw new Error('Proposal does not exist');
      }

      const proposal = this.proposals.get(proposalId);
      if (!proposal.isActive) {
        throw new Error('Proposal is not active');
      }

      const voterSet = this.votes.get(proposalId);
      if (voterSet.has(voterAddress)) {
        throw new Error('Already voted on this proposal');
      }

      // Add vote
      voterSet.add(voterAddress);
      proposal.voteCount++;

      console.log(`✅ Mock vote cast: ${voterAddress} voted on proposal ${proposalId}`);
      
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: 12345 + proposalId,
        gasUsed: 50000 + Math.floor(Math.random() * 20000)
      };
    } catch (error) {
      console.error('❌ Mock vote error:', error);
      throw error;
    }
  }

  /**
   * Get all proposals (mock)
   */
  async getAllProposals() {
    try {
      const proposals = [];
      for (const [id, proposal] of this.proposals) {
        proposals.push({
          proposalId: id,
          title: proposal.title,
          description: proposal.description,
          voteCount: proposal.voteCount,
          creator: proposal.creator,
          createdAt: proposal.createdAt,
          deadline: proposal.deadline,
          isActive: proposal.isActive
        });
      }
      return proposals;
    } catch (error) {
      console.error('❌ Mock get proposals error:', error);
      throw error;
    }
  }

  /**
   * Get proposal by ID (mock)
   */
  async getProposal(proposalId) {
    try {
      if (!this.proposals.has(proposalId)) {
        throw new Error('Proposal does not exist');
      }

      const proposal = this.proposals.get(proposalId);
      return {
        proposalId,
        title: proposal.title,
        description: proposal.description,
        voteCount: proposal.voteCount,
        creator: proposal.creator,
        createdAt: proposal.createdAt,
        deadline: proposal.deadline,
        isActive: proposal.isActive
      };
    } catch (error) {
      console.error('❌ Mock get proposal error:', error);
      throw error;
    }
  }

  /**
   * Check if user has voted (mock)
   */
  async hasUserVoted(proposalId, voterAddress) {
    try {
      if (!this.votes.has(proposalId)) {
        return false;
      }
      return this.votes.get(proposalId).has(voterAddress);
    } catch (error) {
      console.error('❌ Mock has voted error:', error);
      return false;
    }
  }

  /**
   * Get contract owner (mock)
   */
  async getOwner() {
    return this.owner;
  }

  /**
   * Sync proposals (mock - just returns current state)
   */
  async syncProposals() {
    try {
      const proposals = await this.getAllProposals();
      return {
        created: proposals.length,
        updated: 0,
        proposals
      };
    } catch (error) {
      console.error('❌ Mock sync error:', error);
      throw error;
    }
  }

  /**
   * Get winning proposal (mock)
   */
  async getWinningProposal() {
    try {
      let winningProposal = null;
      let maxVotes = 0;

      for (const [id, proposal] of this.proposals) {
        if (proposal.isActive && proposal.voteCount > maxVotes) {
          maxVotes = proposal.voteCount;
          winningProposal = proposal;
        }
      }

      return winningProposal;
    } catch (error) {
      console.error('❌ Mock get winning proposal error:', error);
      throw error;
    }
  }
}

module.exports = new MockBlockchainService();
