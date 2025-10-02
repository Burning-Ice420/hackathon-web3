const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    required: true,
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
  gasUsed: {
    type: Number,
    required: true
  },
  gasPrice: {
    type: String,
    required: true
  },
  voterAddress: {
    type: String,
    required: true,
    index: true
  },
  voterBalance: {
    type: String,
    default: '0'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    sparse: true
  },
  userAgent: {
    type: String,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  verificationHash: {
    type: String,
    sparse: true
  },
  sessionId: {
    type: String,
    sparse: true
  },
  referrer: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

voteSchema.index({ contractAddress: 1, proposalId: 1 });
voteSchema.index({ voterAddress: 1, proposalId: 1 });
voteSchema.index({ contractAddress: 1, voterAddress: 1 });
voteSchema.index({ timestamp: -1 });
voteSchema.index({ isVerified: 1, timestamp: -1 });

voteSchema.index({ 
  contractAddress: 1, 
  proposalId: 1, 
  voterAddress: 1 
}, { unique: true });

voteSchema.statics.getVotesForProposal = function(contractAddress, proposalId) {
  return this.find({ 
    contractAddress, 
    proposalId 
  })
  .sort({ timestamp: -1 })
  .lean();
};

voteSchema.statics.getVotesByVoter = function(voterAddress, contractAddress = null) {
  const query = { voterAddress };
  if (contractAddress) {
    query.contractAddress = contractAddress;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .lean();
};

voteSchema.statics.hasUserVoted = function(contractAddress, proposalId, voterAddress) {
  return this.findOne({ 
    contractAddress, 
    proposalId, 
    voterAddress 
  }).lean();
};

voteSchema.statics.getVotingStats = function(contractAddress = null) {
  const matchStage = contractAddress ? { contractAddress } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$proposalId',
        voteCount: { $sum: 1 },
        uniqueVoters: { $addToSet: '$voterAddress' },
        totalGasUsed: { $sum: '$gasUsed' },
        avgGasPrice: { $avg: { $toDouble: '$gasPrice' } }
      }
    },
    {
      $project: {
        proposalId: '$_id',
        voteCount: 1,
        uniqueVoterCount: { $size: '$uniqueVoters' },
        totalGasUsed: 1,
        avgGasPrice: 1,
        _id: 0
      }
    }
  ]);
};

voteSchema.methods.verify = function() {
  this.isVerified = true;
  this.verificationHash = this._id.toString();
  return this.save();
};

voteSchema.methods.getSummary = function() {
  return {
    proposalId: this.proposalId,
    voterAddress: this.voterAddress,
    timestamp: this.timestamp,
    isVerified: this.isVerified,
    gasUsed: this.gasUsed
  };
};

module.exports = mongoose.model('Vote', voteSchema);