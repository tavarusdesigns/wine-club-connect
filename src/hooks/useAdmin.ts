import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PendingUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  is_approved: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "member";
  created_at: string;
}

interface MonthlyBonus {
  id: string;
  month: number;
  year: number;
  is_available: boolean;
  created_at: string;
  wines: BonusWine[];
}

interface BonusWine {
  id: string;
  bonus_id: string;
  name: string;
  vintage_year: number | null;
  region: string | null;
  notes: string | null;
  image_url: string | null;
  member_price: number | null;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [bonuses, setBonuses] = useState<MonthlyBonus[]>([]);

  // Check if current user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      setIsAdmin(data === true);
      setLoading(false);
    }

    checkAdmin();
  }, [user]);

  // Fetch pending users
  async function fetchPendingUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingUsers(data as PendingUser[]);
    }
  }

  // Fetch all users
  async function fetchAllUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllUsers(data as PendingUser[]);
    }
  }

  // Fetch user roles
  async function fetchUserRoles() {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUserRoles(data as UserRole[]);
    }
  }

  // Approve user
  async function approveUser(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("user_id", userId);

    if (!error) {
      await fetchPendingUsers();
      await fetchAllUsers();
    }
    return { error };
  }

  // Reject user (delete profile)
  async function rejectUser(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (!error) {
      await fetchPendingUsers();
      await fetchAllUsers();
    }
    return { error };
  }

  // Assign role
  async function assignRole(userId: string, role: "admin" | "member") {
    // First remove existing role if any
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (!error) {
      await fetchUserRoles();
    }
    return { error };
  }

  // Remove role
  async function removeRole(userId: string) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (!error) {
      await fetchUserRoles();
    }
    return { error };
  }

  // Fetch bonuses with wines
  async function fetchBonuses() {
    const { data: bonusData, error: bonusError } = await supabase
      .from("monthly_wine_bonuses")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (bonusError || !bonusData) {
      return;
    }

    const { data: wineData, error: wineError } = await supabase
      .from("bonus_wines")
      .select("*");

    const winesMap = new Map<string, BonusWine[]>();
    if (wineData) {
      wineData.forEach((wine) => {
        const existing = winesMap.get(wine.bonus_id) || [];
        winesMap.set(wine.bonus_id, [...existing, wine as BonusWine]);
      });
    }

    const bonusesWithWines: MonthlyBonus[] = bonusData.map((bonus) => ({
      ...bonus,
      wines: winesMap.get(bonus.id) || [],
    }));

    setBonuses(bonusesWithWines);
  }

  // Create bonus
  async function createBonus(month: number, year: number) {
    const { data, error } = await supabase
      .from("monthly_wine_bonuses")
      .insert({ month, year })
      .select()
      .single();

    if (!error) {
      await fetchBonuses();
    }
    return { data, error };
  }

  // Update bonus availability
  async function updateBonusAvailability(bonusId: string, isAvailable: boolean) {
    const { error } = await supabase
      .from("monthly_wine_bonuses")
      .update({ is_available: isAvailable })
      .eq("id", bonusId);

    if (!error) {
      await fetchBonuses();
    }
    return { error };
  }

  // Delete bonus
  async function deleteBonus(bonusId: string) {
    const { error } = await supabase
      .from("monthly_wine_bonuses")
      .delete()
      .eq("id", bonusId);

    if (!error) {
      await fetchBonuses();
    }
    return { error };
  }

  // Add wine to bonus
  async function addWineToBonus(
    bonusId: string,
    wine: { name: string; vintage_year?: number; region?: string; notes?: string; image_url?: string; member_price?: number }
  ) {
    const { error } = await supabase
      .from("bonus_wines")
      .insert({ bonus_id: bonusId, ...wine });

    if (!error) {
      await fetchBonuses();
    }
    return { error };
  }

  // Remove wine from bonus
  async function removeWineFromBonus(wineId: string) {
    const { error } = await supabase
      .from("bonus_wines")
      .delete()
      .eq("id", wineId);

    if (!error) {
      await fetchBonuses();
    }
    return { error };
  }

  async function updateUserContact(userId: string, updates: { phone?: string | null; referred_by?: string | null }) {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    if (!error) {
      await fetchPendingUsers();
      await fetchAllUsers();
    }
    return { error };
  }

  return {
    isAdmin,
    loading,
    pendingUsers,
    allUsers,
    userRoles,
    bonuses,
    fetchPendingUsers,
    fetchAllUsers,
    fetchUserRoles,
    fetchBonuses,
    approveUser,
    rejectUser,
    assignRole,
    removeRole,
    createBonus,
    updateBonusAvailability,
    deleteBonus,
    addWineToBonus,
    removeWineFromBonus,
    updateUserContact,
  };
}
