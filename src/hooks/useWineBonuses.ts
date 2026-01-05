import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BonusWine {
  id: string;
  name: string;
  vintage_year: number | null;
  region: string | null;
  notes: string | null;
  image_url: string | null;
  member_price: number | null;
}

interface MonthlyBonus {
  id: string;
  month: number;
  year: number;
  is_available: boolean;
  wines: BonusWine[];
  isClaimed: boolean;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const useWineBonuses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bonuses = [], isLoading } = useQuery({
    queryKey: ["wine-bonuses", user?.id],
    queryFn: async () => {
      // Fetch all bonuses with their wines
      const { data: bonusData, error: bonusError } = await supabase
        .from("monthly_wine_bonuses")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (bonusError) throw bonusError;

      // Fetch wines for all bonuses
      const { data: winesData, error: winesError } = await supabase
        .from("bonus_wines")
        .select("*");

      if (winesError) throw winesError;

      // Fetch user's claims including pickup status
      let userClaimsMap: Record<string, { received_at: string | null }> = {};
      if (user) {
        const { data: claimsData } = await supabase
          .from("user_bonus_claims")
          .select("bonus_id, received_at")
          .eq("user_id", user.id);
        (claimsData || []).forEach((c: any) => {
          userClaimsMap[c.bonus_id] = { received_at: c.received_at };
        });
      }

      // Map bonuses with their wines and claim/pickup status
      return bonusData.map((bonus: any) => {
        const claim = userClaimsMap[bonus.id];
        const received_at = claim?.received_at ?? null;
        return {
          id: bonus.id,
          month: bonus.month,
          year: bonus.year,
          is_available: bonus.is_available,
          wines: (winesData || []).filter((w: any) => w.bonus_id === bonus.id),
          isClaimed: !!claim,
          received_at,
          isPickedUp: !!received_at,
        } as MonthlyBonus;
      }) as MonthlyBonus[];
    },
    enabled: !!user,
  });

  const claimBonus = useMutation({
    mutationFn: async (bonusId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_bonus_claims")
        .insert({ bonus_id: bonusId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wine-bonuses"] });
    },
  });

  // Helper to get month name
  const getMonthName = (monthNum: number) => monthNames[monthNum - 1] || "";

  // Stats
  const totalClaimed = bonuses.filter(b => b.isClaimed).length;

  return {
    bonuses,
    isLoading,
    claimBonus,
    getMonthName,
    totalClaimed,
  };
};
