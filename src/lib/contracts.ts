export const FAN_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_FAN_REGISTRY_ADDRESS ?? "") as `0x${string}`;
export const FAN_BADGE_ADDRESS = (process.env.NEXT_PUBLIC_FAN_BADGE_ADDRESS ?? "") as `0x${string}`;

export const TX_EXPLORER_BASE = "https://www.okx.com/web3/explorer/xlayer-test/tx";

export const FAN_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "string", name: "countryCode", type: "string" }],
    name: "registerFan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "fixtureId", type: "uint32" }],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "fan", type: "address" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "AlreadyRegistered", type: "error" },
  { inputs: [], name: "AlreadyCheckedIn", type: "error" },
  { inputs: [], name: "NotRegistered", type: "error" },
] as const;

export const FAN_BADGE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to",        type: "address" },
      { internalType: "uint256", name: "id",         type: "uint256" },
      { internalType: "string",  name: "badgeType",  type: "string"  },
    ],
    name: "mintBadge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "fan", type: "address" }],
    name: "badgesOf",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
