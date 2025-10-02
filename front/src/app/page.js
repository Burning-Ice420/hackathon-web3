'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProposalCard from '../components/ProposalCard';
import { getAllProposals, voteOnProposal, listenToEvents, removeEventListeners } from '../lib/ethers';

/**
 * Home page displaying all proposals and voting functionality
 */
export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load proposals on component mount
  useEffect(() => {
    loadProposals();
  }, []);

  // Set up event listeners when connected
  useEffect(() => {
    if (isConnected) {
      listenToEvents((eventType, data) => {
        console.log('Contract event:', eventType, data);
        // Reload proposals when new events occur
        loadProposals();
      });
    }

    return () => {
      removeEventListeners();
    };
  }, [isConnected]);

  // Load all proposals from the contract
  const loadProposals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allProposals = await getAllProposals();
      setProposals(allProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setError('Failed to load proposals. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet connection
  const handleConnect = (web3Data) => {
    setIsConnected(true);
    setUserAddress(web3Data.address);
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    setIsConnected(false);
    setUserAddress('');
    removeEventListeners();
  };

  // Handle voting on a proposal
  const handleVote = async (proposalId) => {
    try {
      await voteOnProposal(proposalId);
      // Reload proposals to get updated vote counts
      await loadProposals();
    } catch (error) {
      console.error('Vote failed:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navbar 
        isConnected={isConnected}
        address={userAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Decentralized Voting System
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Participate in decentralized governance by voting on proposals. 
            Each address can vote once per proposal, and all votes are recorded on the blockchain.
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-amber-100 font-medium">
                Please connect your wallet to vote on proposals
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 border-r-purple-400"></div>
            <span className="ml-3 text-gray-300 font-medium">Loading proposals...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-pink-400 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-100 font-medium">{error}</span>
            </div>
            <button
              onClick={loadProposals}
              className="mt-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Proposals List */}
        {!isLoading && !error && (
          <div>
            {proposals.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-200 mb-4">No proposals</h3>
                <p className="text-gray-400 mb-10 text-lg">
                  No proposals have been created yet.
                </p>
                <div>
                  <a
                    href="/create"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Create First Proposal
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Active Proposals ({proposals.length})
                  </h2>
                  <button
                    onClick={loadProposals}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Refresh
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {proposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id || proposal.proposalId}
                      proposal={proposal}
                      isConnected={isConnected}
                      userAddress={userAddress}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 text-center">
          <p className="text-gray-400 text-sm">Built with Next.js, Ethers.js, and Solidity</p>
        </footer>
      </main>
    </div>
  );
}
