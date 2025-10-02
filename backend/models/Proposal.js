const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  contractAddress: {
    type: String,
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  creator: {
    type: String,
    required: true,
    index: true
  },
  deadline: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  voters: [{
    type: String,
    lowercase: true
  }],
  gasUsed: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

proposalSchema.index({ contractAddress: 1, proposalId: 1 });
proposalSchema.index({ creator: 1, createdAt: -1 });
proposalSchema.index({ isActive: 1, createdAt: -1 });
proposalSchema.index({ voteCount: -1 });
proposalSchema.index({ deadline: 1, isActive: 1 });

proposalSchema.virtual('isExpired').get(function() {
  if (this.deadline === 0) return false;
  return Date.now() / 1000 > this.deadline;
});

proposalSchema.virtual('timeRemaining').get(function() {
  if (this.deadline === 0) return null;
  const remaining = this.deadline - Date.now() / 1000;
  return remaining > 0 ? remaining : 0;
});

proposalSchema.statics.getActiveProposals = function(contractAddress = null) {
  const query = { isActive: true };
  if (contractAddress) query.contractAddress = contractAddress;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .lean();
};

proposalSchema.statics.getProposalsByCreator = function(creator, contractAddress = null) {
  const query = { creator };
  if (contractAddress) query.contractAddress = contractAddress;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .lean();
};

proposalSchema.statics.getTopProposals = function(limit = 10, contractAddress = null) {
  const query = {};
  if (contractAddress) query.contractAddress = contractAddress;
  
  return this.find(query)
    .sort({ voteCount: -1 })
    .limit(limit)
    .lean();
};

proposalSchema.methods.addVote = function(voterAddress) {
  if (!this.voters.includes(voterAddress.toLowerCase())) {
    this.voters.push(voterAddress.toLowerCase());
    this.voteCount++;
  }
  return this.save();
};

proposalSchema.methods.removeVote = function(voterAddress) {
  const index = this.voters.indexOf(voterAddress.toLowerCase());
  if (index > -1) {
    this.voters.splice(index, 1);
    this.voteCount = Math.max(0, this.voteCount - 1);
  }
  return this.save();
};

proposalSchema.methods.close = function() {
  this.isActive = false;
  return this.save();
};

proposalSchema.methods.getSummary = function() {
  return {
    proposalId: this.proposalId,
    title: this.title,
    description: this.description,
    voteCount: this.voteCount,
    isActive: this.isActive,
    isExpired: this.isExpired,
    timeRemaining: this.timeRemaining,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Proposal', proposalSchema);