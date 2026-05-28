import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import {
  apiError,
  deriveFanRank,
  getFanByWallet,
  incrementCountryPoints,
  normalizeWallet,
  serverSupabase,
} from "@/lib/server-api";
import { xLayerTestnet } from "@/lib/chains";

const FAN_REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_FAN_REGISTRY_ADDRESS ?? ""
) as `0x${string}`;

const GET_PROFILE_ABI = [
  {
    inputs: [{ internalType: "address", name: "fan", type: "address" }],
    name: "getProfile",
    outputs: [
      {
        components: [
          { internalType: "string", name: "countryCode",   type: "string"  },
          { internalType: "uint32", name: "totalPoints",   type: "uint32"  },
          { internalType: "uint16", name: "checkInStreak", type: "uint16"  },
          { internalType: "uint16", name: "longestStreak", type: "uint16"  },
          { internalType: "uint32", name: "lastFixtureId", type: "uint32"  },
          { internalType: "bool",   name: "registered",    type: "bool"    },
        ],
        internalType: "struct FanRegistry.FanProfile",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    if (!walletAddress) return apiError("walletAddress is required.");

    // 1. Already in Supabase — nothing to do
    const existing = await getFanByWallet(walletAddress);
    if (existing) return NextResponse.json({ created: false, profile: existing });

    // 2. Read onchain profile
    if (!FAN_REGISTRY_ADDRESS) {
      return apiError("Contract address not configured.", 500);
    }

    const client = createPublicClient({
      chain: xLayerTestnet,
      transport: http(),
    });

    const onchain = await client.readContract({
      address: FAN_REGISTRY_ADDRESS,
      abi: GET_PROFILE_ABI,
      functionName: "getProfile",
      args: [walletAddress as `0x${string}`],
    });

    if (!onchain.registered) {
      return apiError("Wallet is not registered onchain.", 404);
    }

    const { countryCode } = onchain;
    if (!countryCode) {
      return apiError("Onchain profile is missing country code.", 500);
    }

    // 3. Insert minimal row derived from onchain data
    const { data: profile, error } = await serverSupabase
      .from("fan_profiles")
      .insert({
        wallet_address: walletAddress,
        country_code: countryCode,
        total_points: 0,
        check_in_streak: 0,
        longest_streak: 0,
        badge_count: 0,
        prediction_streak: 0,
        fan_rank: deriveFanRank(0),
      })
      .select("*")
      .single();

    if (error) throw error;

    await incrementCountryPoints(countryCode, 0, 1);

    return NextResponse.json({ created: true, profile }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sync-profile failed", error);
    return apiError("Unable to sync profile.", 500);
  }
}
