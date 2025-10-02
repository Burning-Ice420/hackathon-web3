'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { createProposal, initializeWeb3 } from '../../lib/ethers';

export default function CreateProposal() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check connection and ownership on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Check wallet connection and ownership
  const checkConnection = async () => {
    try {
      // In mock mode, simulate connection
      const web3Data = await initializeWeb3();
      setIsConnected(true);
      setUserAddress(web3Data.address);
      
      // Check if current user is the contract owner
      if (web3Data.contract) {
        const owner = await web3Data.contract.owner();
        setIsOwner(owner.toLowerCase() === web3Data.address.toLowerCase());
      } else {
        // Mock mode - check against hardcoded owner
        const mockOwner = '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109';
        setIsOwner(mockOwner.toLowerCase() === web3Data.address.toLowerCase());
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  // Handle wallet connection
  const handleConnect = (web3Data) => {
    setIsConnected(true);
    setUserAddress(web3Data.address);
    
    // Check ownership after connection
    checkOwnership(web3Data.contract);
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    setIsConnected(false);
    setUserAddress('');
    setIsOwner(false);
  };

  // Check if connected user is the contract owner
  const checkOwnership = async (contract) => {
    try {
      if (contract) {
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
      } else {
        // Mock mode - check against hardcoded owner
        const mockOwner = '0x032A5B47fFF1DdcB44F490d61e3BE4f6827BA109';
        setIsOwner(mockOwner.toLowerCase() === userAddress.toLowerCase());
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
      setIsOwner(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isOwner) {
      setError('Only the contract owner can create proposals');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createProposal(formData.title.trim(), formData.description.trim());
      setSuccess(true);
      setFormData({ title: '', description: '' });
      
      // Redirect to home page after successful creation
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error creating proposal:', error);
      setError(error.message || 'Failed to create proposal. Please try again.');
    } finally {
      setIsCreating(false);
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Create New Proposal
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Submit a new proposal for community voting and governance
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
                Please connect your wallet to create proposals
              </span>
            </div>
          </div>
        )}

        {/* Ownership Check */}
        {isConnected && !isOwner && (
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-pink-400 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="text-red-100 font-medium">
                  Only the contract owner can create proposals.
                </span>
                <p className="text-red-200 text-sm mt-1">
                  Your address: {userAddress}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mr-3 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-100 font-medium">
                Proposal created successfully! Redirecting to home page...
              </span>
            </div>
          </div>
        )}

        {/* Create Proposal Form */}
        {isConnected && isOwner && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-lg font-bold text-gray-200 mb-3">
                  Proposal Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a clear, concise title for your proposal"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                  disabled={isCreating}
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-lg font-bold text-gray-200 mb-3">
                  Proposal Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of your proposal, including its purpose, benefits, and any relevant details"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  required
                  disabled={isCreating}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-pink-400 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-red-100 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-3 border border-gray-600/50 rounded-xl text-gray-300 hover:bg-gray-700/50 transition-all duration-200 font-medium"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !formData.title.trim() || !formData.description.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold shadow-lg hover:shadow-xl"
                >
                  {isCreating && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isCreating ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-blue-300 mb-6">How it works</h3>
          <ul className="text-gray-300 space-y-3 text-lg">
            <li className="flex items-start">
              <span className="text-blue-400 mr-3">•</span>
              Only the contract owner can create new proposals
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-3">•</span>
              Each proposal will be visible to all users on the home page
            </li>
            <li className="flex items-start">
              <span className="text-pink-400 mr-3">•</span>
              Users can vote on proposals they haven't voted on yet
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-3">•</span>
              All votes are recorded on the blockchain and cannot be changed
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3">•</span>
              Vote counts are updated in real-time
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
