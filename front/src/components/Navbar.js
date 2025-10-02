import { useState, useEffect } from 'react';
import { connectWallet, initializeWeb3 } from '../lib/ethers';

/**
 * Navbar component with wallet connection functionality
 */
const Navbar = ({ isConnected, address, onConnect, onDisconnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const web3Data = await initializeWeb3();
            onConnect(web3Data);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, [onConnect]);

  // Handle wallet connection
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const web3Data = await connectWallet();
      onConnect(web3Data);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    onDisconnect();
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Decentralized Voting DApp
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="/" 
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              Home
            </a>
            <a 
              href="/create" 
              className="text-gray-300 hover:text-purple-400 transition-colors duration-200 font-medium"
            >
              Create Proposal
            </a>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-200">
                    {formatAddress(address)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-blue-400 transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a 
              href="/" 
              className="block px-3 py-2 text-gray-300 hover:text-blue-400 transition-colors duration-200 font-medium"
            >
              Home
            </a>
            <a 
              href="/create" 
              className="block px-3 py-2 text-gray-300 hover:text-purple-400 transition-colors duration-200 font-medium"
            >
              Create Proposal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
