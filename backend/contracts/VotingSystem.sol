// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VotingSystem
 * @dev A decentralized voting system contract
 * @author Your Name
 */
contract VotingSystem {
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        string description,
        address indexed creator,
        uint256 timestamp
    );
    
    event VoteCasted(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 timestamp
    );
    
    event ProposalClosed(
        uint256 indexed proposalId,
        uint256 finalVoteCount,
        uint256 timestamp
    );

    // Structs
    struct Proposal {
        string title;
        string description;
        uint256 voteCount;
        address creator;
        uint256 createdAt;
        uint256 deadline;
        bool isActive;
        mapping(address => bool) hasVoted;
    }

    // State variables
    address public owner;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public authorizedVoters; // Optional: restrict voting to specific addresses
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Proposal does not exist");
        _;
    }
    
    modifier isActiveProposal(uint256 _proposalId) {
        require(proposals[_proposalId].isActive, "Proposal is not active");
        _;
    }
    
    modifier hasNotVoted(uint256 _proposalId) {
        require(!proposals[_proposalId].hasVoted[msg.sender], "Already voted on this proposal");
        _;
    }
    
    modifier notExpired(uint256 _proposalId) {
        require(
            proposals[_proposalId].deadline == 0 || 
            block.timestamp <= proposals[_proposalId].deadline,
            "Proposal has expired"
        );
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        proposalCount = 0;
    }

    /**
     * @dev Create a new proposal (only owner)
     * @param _title Title of the proposal
     * @param _description Description of the proposal
     * @param _deadline Optional deadline timestamp (0 for no deadline)
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_deadline == 0 || _deadline > block.timestamp, "Invalid deadline");
        
        proposalCount++;
        uint256 newProposalId = proposalCount;
        
        Proposal storage newProposal = proposals[newProposalId];
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.voteCount = 0;
        newProposal.creator = msg.sender;
        newProposal.createdAt = block.timestamp;
        newProposal.deadline = _deadline;
        newProposal.isActive = true;
        
        emit ProposalCreated(
            newProposalId,
            _title,
            _description,
            msg.sender,
            block.timestamp
        );
        
        return newProposalId;
    }

    /**
     * @dev Vote on a proposal
     * @param _proposalId ID of the proposal to vote on
     */
    function vote(uint256 _proposalId) 
        external 
        proposalExists(_proposalId)
        isActiveProposal(_proposalId)
        hasNotVoted(_proposalId)
        notExpired(_proposalId)
    {
        proposals[_proposalId].hasVoted[msg.sender] = true;
        proposals[_proposalId].voteCount++;
        
        emit VoteCasted(_proposalId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get proposal details
     * @param _proposalId ID of the proposal
     * @return title Title of the proposal
     * @return description Description of the proposal
     * @return voteCount Current vote count
     * @return creator Address of the proposal creator
     * @return createdAt Timestamp when proposal was created
     * @return deadline Deadline timestamp (0 if no deadline)
     * @return isActive Whether the proposal is active
     */
    function getProposal(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            string memory title,
            string memory description,
            uint256 voteCount,
            address creator,
            uint256 createdAt,
            uint256 deadline,
            bool isActive
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.voteCount,
            proposal.creator,
            proposal.createdAt,
            proposal.deadline,
            proposal.isActive
        );
    }

    /**
     * @dev Get all proposals with their details
     * @return proposalIds Array of proposal IDs
     * @return titles Array of proposal titles
     * @return descriptions Array of proposal descriptions
     * @return voteCounts Array of vote counts
     * @return creators Array of creator addresses
     * @return createdAts Array of creation timestamps
     * @return deadlines Array of deadline timestamps
     * @return isActives Array of active status
     */
    function getAllProposals()
        external
        view
        returns (
            uint256[] memory proposalIds,
            string[] memory titles,
            string[] memory descriptions,
            uint256[] memory voteCounts,
            address[] memory creators,
            uint256[] memory createdAts,
            uint256[] memory deadlines,
            bool[] memory isActives
        )
    {
        uint256 totalProposals = proposalCount;
        
        proposalIds = new uint256[](totalProposals);
        titles = new string[](totalProposals);
        descriptions = new string[](totalProposals);
        voteCounts = new uint256[](totalProposals);
        creators = new address[](totalProposals);
        createdAts = new uint256[](totalProposals);
        deadlines = new uint256[](totalProposals);
        isActives = new bool[](totalProposals);
        
        for (uint256 i = 1; i <= totalProposals; i++) {
            Proposal storage proposal = proposals[i];
            proposalIds[i - 1] = i;
            titles[i - 1] = proposal.title;
            descriptions[i - 1] = proposal.description;
            voteCounts[i - 1] = proposal.voteCount;
            creators[i - 1] = proposal.creator;
            createdAts[i - 1] = proposal.createdAt;
            deadlines[i - 1] = proposal.deadline;
            isActives[i - 1] = proposal.isActive;
        }
    }

    /**
     * @dev Check if a user has voted on a specific proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter
     * @return hasVoted Whether the user has voted
     */
    function hasUserVoted(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (bool hasVoted)
    {
        return proposals[_proposalId].hasVoted[_voter];
    }

    /**
     * @dev Close a proposal (only owner)
     * @param _proposalId ID of the proposal to close
     */
    function closeProposal(uint256 _proposalId)
        external
        onlyOwner
        proposalExists(_proposalId)
        isActiveProposal(_proposalId)
    {
        proposals[_proposalId].isActive = false;
        
        emit ProposalClosed(
            _proposalId,
            proposals[_proposalId].voteCount,
            block.timestamp
        );
    }

    /**
     * @dev Get the total number of proposals
     * @return count Total number of proposals
     */
    function getProposalCount() external view returns (uint256 count) {
        return proposalCount;
    }

    /**
     * @dev Get the winning proposal (highest vote count)
     * @return winningProposalId ID of the winning proposal
     * @return maxVotes Highest vote count
     */
    function getWinningProposal()
        external
        view
        returns (uint256 winningProposalId, uint256 maxVotes)
    {
        uint256 maxVoteCount = 0;
        uint256 winningId = 0;
        
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].isActive && proposals[i].voteCount > maxVoteCount) {
                maxVoteCount = proposals[i].voteCount;
                winningId = i;
            }
        }
        
        return (winningId, maxVoteCount);
    }

    /**
     * @dev Check if a proposal has expired
     * @param _proposalId ID of the proposal
     * @return isExpired Whether the proposal has expired
     */
    function isProposalExpired(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (bool isExpired)
    {
        Proposal storage proposal = proposals[_proposalId];
        return proposal.deadline > 0 && block.timestamp > proposal.deadline;
    }

    /**
     * @dev Get proposal statistics
     * @param _proposalId ID of the proposal
     * @return totalVotes Total number of votes
     * @return isExpired Whether the proposal has expired
     * @return timeRemaining Time remaining until deadline (0 if no deadline or expired)
     */
    function getProposalStats(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            uint256 totalVotes,
            bool isExpired,
            uint256 timeRemaining
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        bool expired = proposal.deadline > 0 && block.timestamp > proposal.deadline;
        uint256 remaining = 0;
        
        if (proposal.deadline > 0 && !expired) {
            remaining = proposal.deadline - block.timestamp;
        }
        
        return (proposal.voteCount, expired, remaining);
    }

    /**
     * @dev Transfer ownership (only owner)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }

    /**
     * @dev Authorize a voter (only owner)
     * @param _voter Address to authorize
     */
    function authorizeVoter(address _voter) external onlyOwner {
        authorizedVoters[_voter] = true;
    }

    /**
     * @dev Revoke voter authorization (only owner)
     * @param _voter Address to revoke authorization
     */
    function revokeVoterAuthorization(address _voter) external onlyOwner {
        authorizedVoters[_voter] = false;
    }
}
