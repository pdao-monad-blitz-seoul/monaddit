use alloy::sol;

// Define contract ABIs using sol! macro
sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    MdtToken,
    r#"[
        function balanceOf(address owner) view returns (uint256)
        function transfer(address to, uint256 amount) returns (bool)
        function approve(address spender, uint256 amount) returns (bool)
        function mint(address to, uint256 amount)
        function burn(uint256 amount)
        event Transfer(address indexed from, address indexed to, uint256 value)
        event Approval(address indexed owner, address indexed spender, uint256 value)
    ]"#
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ContentRegistry,
    r#"[
        function publish(bytes32 contentHash, string calldata uri) returns (uint256 contentId)
        function challenge(uint256 contentId, uint8 reason, string calldata evidence)
        function resolve(uint256 contentId, bool guilty)
        function withdrawBond(uint256 contentId)
        function getContent(uint256 contentId) view returns (address author, bytes32 contentHash, string memory uri, uint256 bond, uint256 publishedAt, uint256 lockUntil, uint8 status)
        function canWithdrawBond(uint256 contentId) view returns (bool)
        
        event ContentPublished(uint256 indexed contentId, address indexed author, bytes32 contentHash)
        event ContentChallenged(uint256 indexed contentId, address indexed challenger, uint8 reason)
        event ChallengeResolved(uint256 indexed contentId, bool guilty, uint256 slashedAmount)
        event BondWithdrawn(uint256 indexed contentId, address indexed author, uint256 amount)
    ]"#
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    StakingVault,
    r#"[
        function deposit(uint256 amount)
        function withdraw(uint256 amount)
        function getStakeInfo(address user) view returns (uint256 totalAmount, uint256 available, uint256 locked, uint256 stakedAt, uint256 stakeAge)
        function isEligibleStaker(address user) view returns (bool)
        
        event Deposited(address indexed user, uint256 amount)
        event Withdrawn(address indexed user, uint256 amount)
        event BondReserved(address indexed user, bytes32 indexed contentId, uint256 amount)
        event BondReleased(address indexed user, bytes32 indexed contentId, uint256 amount)
        event Slashed(address indexed user, uint256 amount, string reason)
    ]"#
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ReputationSBT,
    r#"[
        function mint(address to) returns (uint256)
        function getReputation(address user) view returns (uint256 karma, uint256 disputeRate)
        function getReputationMultiplier(address user) view returns (uint256)
        function isGoodStanding(address user) view returns (bool)
        
        event SBTMinted(address indexed user, uint256 tokenId)
        event ReputationUpdated(address indexed user, uint256 karma, uint256 disputeRate)
        event KarmaChanged(address indexed user, int256 change, string reason)
    ]"#
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ModerationGame,
    r#"[
        function registerAsJuror()
        function commitVote(uint256 disputeId, bytes32 commitment)
        function revealVote(uint256 disputeId, bool vote, bytes32 salt)
        function getDispute(uint256 disputeId) view returns (uint256 contentId, address challenger, uint8 status, uint256 guiltyVotes, uint256 notGuiltyVotes, address[] memory selectedJurors)
        
        event DisputeInitialized(uint256 indexed disputeId, uint256 indexed contentId, address indexed challenger)
        event JurySelected(uint256 indexed disputeId, address[] jurors)
        event VoteCommitted(uint256 indexed disputeId, address indexed juror)
        event VoteRevealed(uint256 indexed disputeId, address indexed juror, bool vote)
        event DisputeResolved(uint256 indexed disputeId, bool guilty, uint256 guiltyVotes, uint256 notGuiltyVotes)
    ]"#
);

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    StakingRewards,
    r#"[
        function accrue(uint256 amount)
        function checkpoint()
        function claim() returns (uint256)
        function getPendingRewards(address user) view returns (uint256)
        function isEligible(address user) view returns (bool)
        
        event RewardsAccrued(uint256 amount, uint256 totalAccumulated)
        event EpochFinalized(uint256 indexed epochId, uint256 totalRewards, uint256 totalShares)
        event RewardsClaimed(address indexed user, uint256 amount, uint256 epochId)
    ]"#
);