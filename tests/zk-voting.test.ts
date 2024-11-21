import { describe, it, beforeEach, expect, vi } from 'vitest';

// Simulated contract state
let voters: Map<string, boolean>;
let votes: Map<string, number>;
let voteHashes: Map<string, boolean>;
let totalVotes: number;
let votingOpen: boolean;
let contractOwner: string;

// Simulated contract functions
function registerVoter(sender: string): { success: boolean; error?: string } {
  if (voters.has(sender)) {
    return { success: false, error: "Already registered" };
  }
  voters.set(sender, true);
  return { success: true };
}

function submitVote(sender: string, voteHash: string): { success: boolean; error?: string } {
  if (!votingOpen) {
    return { success: false, error: "Voting is closed" };
  }
  if (!voters.get(sender)) {
    return { success: false, error: "Not registered" };
  }
  if (votes.has(sender)) {
    return { success: false, error: "Already voted" };
  }
  votes.set(sender, 1);
  voteHashes.set(voteHash, true);
  totalVotes++;
  return { success: true };
}

function verifyVote(voteHash: string): boolean {
  return voteHashes.get(voteHash) || false;
}

function getTotalVotes(): number {
  return totalVotes;
}

function closeVoting(sender: string): { success: boolean; error?: string } {
  if (sender !== contractOwner) {
    return { success: false, error: "Not authorized" };
  }
  votingOpen = false;
  return { success: true };
}

function isVotingOpen(): boolean {
  return votingOpen;
}

describe('ZK Voting Contract', () => {
  beforeEach(() => {
    voters = new Map();
    votes = new Map();
    voteHashes = new Map();
    totalVotes = 0;
    votingOpen = true;
    contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  });
  
  it('should allow a voter to register', () => {
    const result = registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result.success).toBe(true);
  });
  
  it('should not allow a voter to register twice', () => {
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Already registered");
  });
  
  it('should allow a registered voter to submit a vote', () => {
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(result.success).toBe(true);
  });
  
  it('should not allow an unregistered voter to submit a vote', () => {
    const result = submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not registered");
  });
  
  it('should not allow a voter to vote twice', () => {
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const result = submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Already voted");
  });
  
  it('should correctly verify a submitted vote', () => {
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const result = verifyVote('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(result).toBe(true);
  });
  
  it('should correctly count total votes', () => {
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const totalVotes = getTotalVotes();
    expect(totalVotes).toBe(1);
  });
  
  it('should allow closing the voting by the contract owner', () => {
    const result = closeVoting(contractOwner);
    expect(result.success).toBe(true);
  });
  
  it('should not allow closing the voting by non-owner', () => {
    const result = closeVoting('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authorized");
  });
  
  it('should not allow voting after closing', () => {
    closeVoting(contractOwner);
    registerVoter('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = submitVote('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Voting is closed");
  });
  
  it('should correctly report if voting is open', () => {
    expect(isVotingOpen()).toBe(true);
    closeVoting(contractOwner);
    expect(isVotingOpen()).toBe(false);
  });
});

