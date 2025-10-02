const validateProposal = (req, res, next) => {
  const { title, description, deadline } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      error: 'Title and description are required'
    });
  }

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Title must be a non-empty string'
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Title must be less than 200 characters'
    });
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Description must be a non-empty string'
    });
  }

  if (description.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'Description must be less than 2000 characters'
    });
  }

  if (deadline && (typeof deadline !== 'number' || deadline < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Deadline must be a positive number'
    });
  }

  next();
};

const validateVote = (req, res, next) => {
  const { proposalId, voterAddress } = req.body;

  if (!proposalId || !voterAddress) {
    return res.status(400).json({
      success: false,
      error: 'Proposal ID and voter address are required'
    });
  }

  if (typeof proposalId !== 'number' && !Number.isInteger(parseInt(proposalId))) {
    return res.status(400).json({
      success: false,
      error: 'Proposal ID must be a valid number'
    });
  }

  if (typeof voterAddress !== 'string' || !voterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Voter address must be a valid Ethereum address'
    });
  }

  next();
};

const validateProposalId = (req, res, next) => {
  const { proposalId } = req.params;

  if (!proposalId || !Number.isInteger(parseInt(proposalId))) {
    return res.status(400).json({
      success: false,
      error: 'Valid proposal ID is required'
    });
  }

  next();
};

const validateVoteId = (req, res, next) => {
  const { voteId } = req.params;

  if (!voteId || !voteId.match(/^[a-fA-F0-9]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Valid vote ID is required'
    });
  }

  next();
};

module.exports = {
  validateProposal,
  validateVote,
  validateProposalId,
  validateVoteId
};