import { useState } from 'react';

/**
 * VoteButton component for handling vote actions
 */
const VoteButton = ({ proposalId, hasVoted, isConnected, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);

  // Handle vote button click
  const handleVote = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }

    if (hasVoted) {
      alert('You have already voted on this proposal');
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      await onVote(proposalId);
      // Success feedback will be handled by parent component
    } catch (error) {
      console.error('Vote failed:', error);
      setError(error.message || 'Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Determine button state and styling
  const getButtonState = () => {
    if (!isConnected) {
      return {
        text: 'Connect Wallet',
        disabled: true,
        className: 'bg-gray-600 text-gray-400 cursor-not-allowed'
      };
    }

    if (hasVoted) {
      return {
        text: 'Voted',
        disabled: true,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-not-allowed'
      };
    }

    if (isVoting) {
      return {
        text: 'Voting...',
        disabled: true,
        className: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-not-allowed'
      };
    }

    return {
      text: 'Vote',
      disabled: false,
      className: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={handleVote}
        disabled={buttonState.disabled}
        className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${buttonState.className} ${
          !buttonState.disabled ? 'hover:scale-105' : ''
        }`}
      >
        {isVoting && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {buttonState.text}
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-xs text-center max-w-xs font-medium">
          {error}
        </div>
      )}

      {/* Success Message (if needed) */}
      {hasVoted && !isVoting && (
        <div className="text-green-400 text-xs text-center font-bold">
          ✓ Vote recorded successfully
        </div>
      )}
    </div>
  );
};

export default VoteButton;
