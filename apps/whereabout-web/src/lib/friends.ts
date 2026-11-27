"use client";

import { authClient } from "./auth";

// Travel companions (#96): a request from an invite link, accepted by the other person.
export interface Companion {
  id: string;
  displayName: string | null;
  avatarPath: string | null;
}

export interface FriendRequest {
  id: string;
  displayName: string | null;
  direction: "incoming" | "outgoing";
}

export async function fetchCompanions(profileId: string): Promise<Companion[] | null> {
  const { data, error } = await authClient().rpc("get_companions", { p_id: profileId });
  if (error) return null;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    displayName: r.display_name as string | null,
    avatarPath: r.avatar_path as string | null,
  }));
}

export async function fetchFriendRequests(): Promise<FriendRequest[] | null> {
  const { data, error } = await authClient().rpc("get_friend_requests");
  if (error) return null;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    displayName: r.display_name as string | null,
    direction: r.direction as FriendRequest["direction"],
  }));
}

// Each returns false on failure.
export async function sendFriendRequest(userId: string, toId: string): Promise<boolean> {
  const { error } = await authClient().from("friendships").insert({ requester_id: userId, addressee_id: toId });
  return !error;
}

export async function acceptFriendRequest(fromId: string): Promise<boolean> {
  const { error } = await authClient().from("friendships").update({ status: "accepted" }).eq("requester_id", fromId);
  return !error;
}

// Decline, cancel, or remove: whichever direction the row is.
export async function removeFriendship(userId: string, otherId: string): Promise<boolean> {
  const { error } = await authClient()
    .from("friendships")
    .delete()
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`);
  return !error;
}

export const initialOf = (name: string | null) => (name?.trim()[0] ?? "?").toUpperCase();
