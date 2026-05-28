"use client";

import { useState, useEffect } from "react";
import { getProfile } from "@/lib/db";
import type { Database } from "@/types/database";

type FanProfileRow = Database["public"]["Tables"]["fan_profiles"]["Row"];

type Result = {
  profile: FanProfileRow | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useProfile(address: string | undefined): Result {
  const [profile, setProfile] = useState<FanProfileRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    getProfile(address)
      .then((p) => setProfile(p))
      .catch((e) => setError(e.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [address, tick]);

  return { profile, loading, error, refetch: () => setTick((t) => t + 1) };
}
