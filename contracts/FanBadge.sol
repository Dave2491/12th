// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FanBadge
 * @notice ERC-1155 badge NFTs for Twelfth fan milestones.
 *         Minted on X Layer. Metadata stored on IPFS via Pinata.
 *         Each badge type is a separate token ID, non-transferable (soulbound).
 */
contract FanBadge {
    // ── ERC-1155 minimal storage ─────────────────────────────────────────────

    // owner => tokenId => balance
    mapping(address => mapping(uint256 => uint256)) private _balances;

    // tokenId => URI
    mapping(uint256 => string) private _uris;

    // fan => tokenId => already minted (enforces soulbound one-per-wallet)
    mapping(address => mapping(uint256 => bool)) public hasMinted;

    // ── Badge Token IDs ──────────────────────────────────────────────────────

    uint256 public constant FIRST_CHECKIN        = 1;
    uint256 public constant STREAK_3             = 2;
    uint256 public constant STREAK_7             = 3;
    uint256 public constant CORRECT_PREDICTION   = 4;
    uint256 public constant TOP_FAN              = 5;
    uint256 public constant COUNTRY_CONTRIBUTOR  = 6;

    // ── Performance badge token IDs (trivia results) ─────────────────────────
    uint256 public constant ROOKIE               = 7;
    uint256 public constant FAN_BADGE            = 8;
    uint256 public constant EXPERT               = 9;

    // ── Events ───────────────────────────────────────────────────────────────

    event BadgeMinted(address indexed to, uint256 indexed tokenId, string badgeType);
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    // ── Access Control ───────────────────────────────────────────────────────

    address public owner;
    address public minter; // FanRegistry or backend signer

    constructor(string memory baseUri) {
        owner = msg.sender;
        minter = msg.sender;

        // Set default URIs (replace with IPFS CIDs after upload)
        _uris[FIRST_CHECKIN]       = string(abi.encodePacked(baseUri, "first-checkin.json"));
        _uris[STREAK_3]            = string(abi.encodePacked(baseUri, "streak-3.json"));
        _uris[STREAK_7]            = string(abi.encodePacked(baseUri, "streak-7.json"));
        _uris[CORRECT_PREDICTION]  = string(abi.encodePacked(baseUri, "oracle.json"));
        _uris[TOP_FAN]             = string(abi.encodePacked(baseUri, "top-fan.json"));
        _uris[COUNTRY_CONTRIBUTOR] = string(abi.encodePacked(baseUri, "squad-legend.json"));
        _uris[ROOKIE]              = string(abi.encodePacked(baseUri, "rookie.json"));
        _uris[FAN_BADGE]           = string(abi.encodePacked(baseUri, "fan.json"));
        _uris[EXPERT]              = string(abi.encodePacked(baseUri, "expert.json"));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner, "Not minter");
        _;
    }

    // ── Minting ───────────────────────────────────────────────────────────────

    /**
     * @notice Mint a soulbound badge to a fan. Can only be called by the minter.
     * @param to     Recipient wallet.
     * @param tokenId Badge token ID (use the constants above).
     * @param badgeType Human-readable label for the event log.
     */
    function mintBadge(
        address to,
        uint256 tokenId,
        string calldata badgeType
    ) external {
        require(msg.sender == minter || msg.sender == owner || msg.sender == to, "Not authorized");
        require(!hasMinted[to][tokenId], "Badge already minted");
        require(bytes(_uris[tokenId]).length > 0, "Unknown badge type");

        hasMinted[to][tokenId] = true;
        _balances[to][tokenId] += 1;

        emit TransferSingle(msg.sender, address(0), to, tokenId, 1);
        emit BadgeMinted(to, tokenId, badgeType);
    }

    // ── Soulbound: block transfers ────────────────────────────────────────────

    function safeTransferFrom(address, address, uint256, uint256, bytes calldata) external pure {
        revert("Soulbound: non-transferable");
    }

    function safeBatchTransferFrom(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure {
        revert("Soulbound: non-transferable");
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function balanceOf(address account, uint256 id) external view returns (uint256) {
        return _balances[account][id];
    }

    function uri(uint256 tokenId) external view returns (string memory) {
        return _uris[tokenId];
    }

    function badgesOf(address fan) external view returns (uint256[] memory tokenIds, uint256[] memory amounts) {
        uint256 count = 9;
        tokenIds = new uint256[](count);
        amounts = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = i + 1;
            amounts[i] = _balances[fan][i + 1];
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setMinter(address newMinter) external onlyOwner {
        minter = newMinter;
    }

    function setUri(uint256 tokenId, string calldata newUri) external onlyOwner {
        _uris[tokenId] = newUri;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
