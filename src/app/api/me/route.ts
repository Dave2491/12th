import { NextRequest, NextResponse } from "next/server";
import { apiError, getFanByWallet, normalizeWallet } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = normalizeWallet(request.nextUrl.searchParams.get("walletAddress"));
    if (!walletAddress) return apiError("walletAddress is required.");

    const profile = await getFanByWallet(walletAddress);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET /api/me failed", error);
    return apiError("Unable to load profile.", 500);
  }
}
