import { useState, useEffect } from 'react';
import VoteButton from './VoteButton';

/**
 * ProposalCard component to display individual proposals
 */
const ProposalCard = ({ proposal, isConnected, userAddress, onVote }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [isCheckingVote, setIsCheckingVote] = useState(true);


  // Check if user has already voted on this proposal
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (isConnected && userAddress && (proposal.id || proposal.proposalId)) {
        try {
          const { hasAddressVoted } = await import('../lib/ethers');
          const proposalId = proposal.id || proposal.proposalId;
          const voted = await hasAddressVoted(proposalId, userAddress);
          setHasVoted(voted);
        } catch (error) {
          console.error('Error checking vote status:', error);
        } finally {
          setIsCheckingVote(false);
        }
      } else {
        setIsCheckingVote(false);
      }
    };

    checkVoteStatus();
  }, [isConnected, userAddress, proposal.id, proposal.proposalId]);

  // Handle vote action
  const handleVote = async () => {
    try {
      const proposalId = proposal.id || proposal.proposalId;
      await onVote(proposalId);
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 hover:bg-gray-800/70 transition-all duration-300 shadow-xl hover:shadow-2xl h-full flex flex-col">
      {/* Proposal Header */}
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">
              {proposal.title}
            </h3>
            <p className="text-gray-400 text-sm font-medium">
              Proposal ID: #{proposal.id || proposal.proposalId}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
            {proposal.voteCount} votes
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Status: {proposal.exists ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Proposal Description */}
      <div className="mb-6 flex-1">
        <p className="text-gray-300 leading-relaxed text-sm line-clamp-4">
          {proposal.description}
        </p>
      </div>

      {/* Vote Section */}
      <div className="mt-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center">
            {isCheckingVote ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-blue-400 border-r-purple-400"></div>
                <span className="text-sm text-gray-400 font-medium">Checking vote status...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center space-x-3 bg-green-500/20 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold text-green-400">You have voted</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 font-medium text-center">
                {isConnected ? 'You can vote on this proposal' : 'Connect wallet to vote'}
              </span>
            )}
          </div>

          {/* Vote Button */}
          <div className="flex justify-center">
            <VoteButton
              proposalId={proposal.id || proposal.proposalId}
              hasVoted={hasVoted}
              isConnected={isConnected}
              onVote={handleVote}
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="text-center text-xs text-gray-400">
          <span className="font-medium">Created by: Contract Owner</span>
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
