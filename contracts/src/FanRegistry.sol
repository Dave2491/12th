// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FanRegistry
 * @notice Stores fan profiles and matchday check-ins onchain for Twelfth.
 *         Deployed on X Layer. Each wallet can register once and check in
 *         once per fixture. Streaks and points are tracked here transparently.
 */
contract FanRegistry {
    struct FanProfile {
        string countryCode;   // ISO 3166-1 alpha-2, e.g. "BR"
        uint32 totalPoints;
        uint16 checkInStreak;
        uint16 longestStreak;
        uint32 lastFixtureId; // fixture checked into most recently
        bool registered;
    }

    // wallet => profile
    mapping(address => FanProfile) public profiles;

    // wallet => fixtureId => checked in
    mapping(address => mapping(uint32 => bool)) public hasCheckedIn;

    // countryCode => total squad points
    mapping(string => uint256) public countryPoints;

    // countryCode => fan count
    mapping(string => uint256) public countryFanCount;

    uint32 public constant CHECKIN_POINTS = 100;

    event FanRegistered(address indexed fan, string countryCode);
    event CheckedIn(address indexed fan, uint32 fixtureId, uint32 pointsEarned, uint16 newStreak);
    event PointsAwarded(address indexed fan, uint32 points, string reason);

    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyCheckedIn();

    /**
     * @notice Register as a fan and pick a national squad.
     * @param countryCode ISO 3166-1 alpha-2 country code.
     */
    function registerFan(string calldata countryCode) external {
        if (profiles[msg.sender].registered) revert AlreadyRegistered();

        profiles[msg.sender] = FanProfile({
            countryCode: countryCode,
            totalPoints: 0,
            checkInStreak: 0,
            longestStreak: 0,
            lastFixtureId: 0,
            registered: true
        });

        countryFanCount[countryCode]++;

        emit FanRegistered(msg.sender, countryCode);
    }

    /**
     * @notice Check in for a matchday fixture. One check-in per fixture per wallet.
     * @param fixtureId Unique fixture identifier from the off-chain data source.
     */
    function checkIn(uint32 fixtureId) external {
        FanProfile storage profile = profiles[msg.sender];
        if (!profile.registered) revert NotRegistered();
        if (hasCheckedIn[msg.sender][fixtureId]) revert AlreadyCheckedIn();

        hasCheckedIn[msg.sender][fixtureId] = true;

        // Streak logic: consecutive fixture IDs increment streak
        if (profile.lastFixtureId == fixtureId - 1) {
            profile.checkInStreak++;
        } else {
            profile.checkInStreak = 1;
        }

        if (profile.checkInStreak > profile.longestStreak) {
            profile.longestStreak = profile.checkInStreak;
        }

        profile.lastFixtureId = fixtureId;

        // Bonus points for streaks
        uint32 points = CHECKIN_POINTS;
        if (profile.checkInStreak >= 7) points += 50;
        else if (profile.checkInStreak >= 3) points += 25;

        profile.totalPoints += points;
        countryPoints[profile.countryCode] += points;

        emit CheckedIn(msg.sender, fixtureId, points, profile.checkInStreak);
    }

    /**
     * @notice Award bonus points for quest completions (called by trusted backend).
     * @param fan Wallet address to award points to.
     * @param points Amount of points to add.
     * @param reason Short human-readable reason, e.g. "predict_winner".
     */
    function awardPoints(
        address fan,
        uint32 points,
        string calldata reason
    ) external onlyOwner {
        FanProfile storage profile = profiles[fan];
        if (!profile.registered) revert NotRegistered();

        profile.totalPoints += points;
        countryPoints[profile.countryCode] += points;

        emit PointsAwarded(fan, points, reason);
    }

    // ── Access Control ──────────────────────────────────────────────────────

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function getProfile(address fan) external view returns (FanProfile memory) {
        return profiles[fan];
    }

    function isRegistered(address fan) external view returns (bool) {
        return profiles[fan].registered;
    }
}
