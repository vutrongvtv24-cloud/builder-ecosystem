"use client";

import { Feed } from "@/components/feed/Feed";
import { LandingPage } from "@/components/landing/LandingPage";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function Home() {
  const { user, loading } = useSupabaseAuth();

  if (loading) return null; // Or a subtle loading spinner

  if (!user) {
    return <LandingPage />;
  }

  return <Feed />;
}
