const { ethers } = require('ethers');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');

const mockBlockchainService = {
  contractAddress: '0x1234567890123456789012345678901234567890',
  owner: '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109',
  proposals: new Map(),
  proposalCount: 0,
  votes: new Map(),

  getContractInfo() {
    return {
      address: this.contractAddress,
      owner: this.owner,
      isInitialized: true,
      isMock: true
    };
  },

  async createProposal(title, description, deadline = 0) {
    this.proposalCount++;
    const proposalId = this.proposalCount + Math.floor(Math.random() * 1000);
    
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
    
    return {
      proposalId,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: 12345 + proposalId,
      gasUsed: 100000 + Math.floor(Math.random() * 50000)
    };
  },

  async vote(proposalId, voterAddress) {
    if (!this.proposals.has(proposalId)) {
      this.proposals.set(proposalId, {
        id: proposalId,
        title: `Proposal ${proposalId}`,
        description: 'Proposal loaded from database',
        voteCount: 0,
        creator: this.owner,
        createdAt: Math.floor(Date.now() / 1000),
        deadline: 0,
        isActive: true
      });
      this.votes.set(proposalId, new Set());
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal.isActive) {
      throw new Error('Proposal is not active');
    }

    const voterSet = this.votes.get(proposalId);
    if (voterSet.has(voterAddress)) {
      throw new Error('Already voted on this proposal');
    }

    voterSet.add(voterAddress);
    proposal.voteCount++;
    
    return {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: 12345 + proposalId,
      gasUsed: 50000 + Math.floor(Math.random() * 20000)
    };
  },

  async getAllProposals() {
    const proposals = [];
    for (const [id, proposal] of this.proposals) {
      proposals.push({
        id: proposal.id,
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
  },

  async hasUserVoted(proposalId, voterAddress) {
    const voterSet = this.votes.get(proposalId);
    return voterSet ? voterSet.has(voterAddress) : false;
  },

  async getProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    return proposal;
  }
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.useMock = true;
  }

  async initialize(provider, signer, contractAddress) {
    this.provider = provider;
    this.signer = signer;
    this.contractAddress = contractAddress;
    this.useMock = false;

    if (this.contractAddress) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.getContractABI(),
        this.signer
      );
    }
  }

  getContractABI() {
    return [
      "event ProposalCreated(uint256 indexed proposalId, string title, string description, address indexed creator, uint256 timestamp)",
      "event VoteCasted(uint256 indexed proposalId, address indexed voter, uint256 timestamp)",
      "event ProposalClosed(uint256 indexed proposalId, uint256 finalVoteCount, uint256 timestamp)",
      "function createProposal(string memory _title, string memory _description, uint256 _deadline) external returns (uint256)",
      "function vote(uint256 _proposalId) external",
      "function getProposal(uint256 _proposalId) external view returns (string memory title, string memory description, uint256 voteCount, address creator, uint256 createdAt, uint256 deadline, bool isActive)",
      "function getAllProposals() external view returns (uint256[] memory proposalIds, string[] memory titles, string[] memory descriptions, uint256[] memory voteCounts, address[] memory creators, uint256[] memory createdAts, uint256[] memory deadlines, bool[] memory isActives)",
      "function hasUserVoted(uint256 _proposalId, address _voter) external view returns (bool hasVoted)",
      "function closeProposal(uint256 _proposalId) external",
      "function getProposalCount() external view returns (uint256 count)",
      "function getWinningProposal() external view returns (uint256 winningProposalId, uint256 maxVotes)",
      "function isProposalExpired(uint256 _proposalId) external view returns (bool isExpired)",
      "function getProposalStats(uint256 _proposalId) external view returns (uint256 totalVotes, bool isExpired, uint256 timeRemaining)",
      "function transferOwnership(address _newOwner) external",
      "function authorizeVoter(address _voter) external",
      "function revokeVoterAuthorization(address _voter) external"
    ];
  }

  async createProposal(title, description, deadline = 0) {
    try {
      if (this.useMock) {
        return await mockBlockchainService.createProposal(title, description, deadline);
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.createProposal(title, description, deadline);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'ProposalCreated';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('ProposalCreated event not found');
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      const proposalId = parsedEvent.args.proposalId.toNumber();

      return {
        proposalId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw error;
    }
  }

  async voteOnProposal(proposalId, voterAddress) {
    try {
      if (this.useMock) {
        return await mockBlockchainService.vote(proposalId, voterAddress);
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.vote(proposalId);
      const receipt = await tx.wait();

      const vote = new Vote({
        proposalId,
        contractAddress: this.contractAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        voterAddress
      });

      await vote.save();

      await Proposal.findOneAndUpdate(
        { contractAddress: this.contractAddress, proposalId },
        { $inc: { voteCount: 1 }, $addToSet: { voters: voterAddress } }
      );

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllProposals() {
    try {
      if (this.useMock) {
        return await mockBlockchainService.getAllProposals();
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [proposalIds, titles, descriptions, voteCounts, creators, createdAts, deadlines, isActives] = await this.contract.getAllProposals();

      const proposals = [];
      for (let i = 0; i < proposalIds.length; i++) {
        proposals.push({
          id: proposalIds[i].toNumber(),
          title: titles[i],
          description: descriptions[i],
          voteCount: voteCounts[i].toNumber(),
          creator: creators[i],
          createdAt: createdAts[i].toNumber(),
          deadline: deadlines[i].toNumber(),
          isActive: isActives[i]
        });
      }

      return proposals;
    } catch (error) {
      throw error;
    }
  }

  async hasUserVoted(proposalId, voterAddress) {
    try {
      if (this.useMock) {
        return await mockBlockchainService.hasUserVoted(proposalId, voterAddress);
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      return await this.contract.hasUserVoted(proposalId, voterAddress);
    } catch (error) {
      throw error;
    }
  }

  async getProposal(proposalId) {
    try {
      if (this.useMock) {
        return await mockBlockchainService.getProposal(proposalId);
      }

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const proposal = await this.contract.getProposal(proposalId);
      return {
        id: proposalId,
        title: proposal.title,
        description: proposal.description,
        voteCount: Number(proposal.voteCount)
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BlockchainService();