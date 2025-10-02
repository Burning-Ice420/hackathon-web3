import { ethers } from 'ethers';
import axios from 'axios';
import contractAddress from '../../contract-address.json';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Contract configuration - will be loaded from backend or fallback
let CONTRACT_ADDRESS = contractAddress.address;

// Mock mode for local development
const MOCK_MODE = true;

// Contract ABI - this should match your compiled contract
const VOTING_SYSTEM_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "VoteCasted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "proposals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "createProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_proposalId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_proposalId",
        "type": "uint256"
      }
    ],
    "name": "getProposal",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProposals",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "voteCount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct VotingSystem.Proposal[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_proposalId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_voter",
        "type": "address"
      }
    ],
    "name": "hasAddressVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalProposals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract ABI
const CONTRACT_ABI = VOTING_SYSTEM_ABI;

// Web3 provider setup
let provider;
let signer;
let contract;

/**
 * Initialize Web3 connection
 */
export const initializeWeb3 = async () => {
  try {
    if (MOCK_MODE) {
      
      // Return mock data for local development
      return {
        provider: null,
        signer: null,
        contract: null,
        address: '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109' // Mock owner address
      };
    }

    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      
      // Get contract address from backend
      try {
        const contractInfo = await getContractInfo();
        if (contractInfo && contractInfo.address) {
          CONTRACT_ADDRESS = contractInfo.address;
          contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        } else {
          console.warn('Contract address not available from backend');
        }
      } catch (error) {
        console.warn('Could not fetch contract info from backend:', error);
      }
      
      return {
        provider,
        signer,
        contract,
        address: await signer.getAddress()
      };
    } else {
      throw new Error('MetaMask is not installed');
    }
  } catch (error) {
    console.error('Error initializing Web3:', error);
    throw error;
  }
};

/**
 * Connect to MetaMask wallet
 */
export const connectWallet = async () => {
  try {
    if (MOCK_MODE) {
      return await initializeWeb3();
    }

    if (typeof window.ethereum !== 'undefined') {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize Web3 after connection
      const web3Data = await initializeWeb3();
      
      // Update module-level variables
      provider = web3Data.provider;
      signer = web3Data.signer;
      contract = web3Data.contract;
      
      return web3Data;
    } else {
      throw new Error('MetaMask is not installed');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

/**
 * Get all proposals from backend API
 */
export const getAllProposals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/proposals`);
    return response.data.data.proposals;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};

/**
 * Get a specific proposal
 */
export const getProposal = async (proposalId) => {
  try {
    if (MOCK_MODE) {
      // In mock mode, get proposal from backend API instead
      const response = await axios.get(`${API_BASE_URL}/proposals/${proposalId}`);
      return response.data.data;
    }

    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    const proposal = await contract.getProposal(proposalId);
    return {
      id: proposalId,
      title: proposal.title,
      description: proposal.description,
      voteCount: Number(proposal.voteCount)
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

/**
 * Vote on a proposal via backend API
 */
export const voteOnProposal = async (proposalId) => {
  try {
    if (MOCK_MODE) {
      // In mock mode, just vote via backend API
      const response = await axios.post(`${API_BASE_URL}/votes`, {
        proposalId: parseInt(proposalId),
        voterAddress: '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109' // Mock address
      });
      return response.data.data;
    }

    if (!signer) {
      throw new Error('Wallet not connected');
    }

    const userAddress = await signer.getAddress();
    
    // Vote via blockchain
    if (contract) {
      const tx = await contract.vote(proposalId);
      await tx.wait();
    }

    // Also record in backend
    const response = await axios.post(`${API_BASE_URL}/votes`, {
      proposalId: parseInt(proposalId),
      voterAddress: userAddress
    });

    return response.data.data;
  } catch (error) {
    console.error('Error voting on proposal:', error);
    throw error;
  }
};

/**
 * Create a new proposal via backend API
 */
export const createProposal = async (title, description, deadline = null) => {
  try {
    if (MOCK_MODE) {
    }
    
    const response = await axios.post(`${API_BASE_URL}/proposals`, {
      title,
      description,
      deadline
    });

    return response.data.data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
};

/**
 * Check if an address has voted on a proposal
 */
export const hasAddressVoted = async (proposalId, address) => {
  try {
    if (MOCK_MODE) {
      // In mock mode, check via backend API
      const response = await axios.get(`${API_BASE_URL}/votes/check`, {
        params: { proposalId, voterAddress: address }
      });
      return response.data.data.hasVoted;
    }

    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    return await contract.hasAddressVoted(proposalId, address);
  } catch (error) {
    console.error('Error checking vote status:', error);
    throw error;
  }
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = () => {
  if (MOCK_MODE) {
    return true; // Always return true in mock mode
  }
  return !!signer;
};

/**
 * Listen to contract events
 */
export const listenToEvents = (callback) => {
  if (MOCK_MODE) {
    return;
  }

  if (!contract) {
    throw new Error('Contract not initialized');
  }
  
  // Listen to ProposalCreated events
  contract.on('ProposalCreated', (proposalId, title, description, event) => {
    callback('ProposalCreated', {
      proposalId: Number(proposalId),
      title,
      description,
      transactionHash: event.transactionHash
    });
  });
  
  // Listen to VoteCasted events
  contract.on('VoteCasted', (proposalId, voter, event) => {
    callback('VoteCasted', {
      proposalId: Number(proposalId),
      voter,
      transactionHash: event.transactionHash
    });
  });
};

/**
 * Remove event listeners
 */
export const removeEventListeners = () => {
  if (MOCK_MODE) {
    return;
  }

  if (contract) {
    contract.removeAllListeners();
  }
};

/**
 * Get contract information from backend
 */
export const getContractInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/contract/info`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching contract info:', error);
    return null;
  }
};

/**
 * Get proposal statistics
 */
export const getProposalStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/proposals/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching proposal stats:', error);
    return null;
  }
};

/**
 * Get voting statistics
 */
export const getVotingStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/votes/stats`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching voting stats:', error);
    return null;
  }
};

/**
 * Sync proposals from blockchain
 */
export const syncProposals = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/proposals/sync`);
    return response.data.data;
  } catch (error) {
    console.error('Error syncing proposals:', error);
    throw error;
  }
};

export default {
  initializeWeb3,
  connectWallet,
  getAllProposals,
  getProposal,
  voteOnProposal,
  createProposal,
  hasAddressVoted,
  isWalletConnected,
  listenToEvents,
  removeEventListeners
};
