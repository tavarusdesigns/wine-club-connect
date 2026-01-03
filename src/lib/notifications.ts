import { supabase } from "@/integrations/supabase/client";

// Create notification for a new event
export const notifyNewEvent = async (eventTitle: string, eventDate: string) => {
  // Get all approved users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("is_approved", true);

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return;
  }

  // Create notifications for all approved users
  const notifications = profiles.map((profile) => ({
    user_id: profile.user_id,
    type: "new_event",
    title: "New Event Added",
    message: `A new event "${eventTitle}" has been scheduled for ${eventDate}. Don't miss it!`,
    related_id: null,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Error creating event notifications:", error);
  }
};

// Create bonus reminder notifications for users who haven't claimed
export const notifyBonusReminder = async (month: number, year: number) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[month - 1];

  // Get the bonus for this month
  const { data: bonus, error: bonusError } = await supabase
    .from("monthly_wine_bonuses")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .eq("is_available", true)
    .single();

  if (bonusError || !bonus) {
    console.error("No available bonus for this month:", bonusError);
    return;
  }

  // Get users who have claimed
  const { data: claims, error: claimsError } = await supabase
    .from("user_bonus_claims")
    .select("user_id")
    .eq("bonus_id", bonus.id);

  if (claimsError) {
    console.error("Error fetching claims:", claimsError);
    return;
  }

  const claimedUserIds = claims?.map((c) => c.user_id) || [];

  // Get all approved users who haven't claimed
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("is_approved", true);

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return;
  }

  const unclaimedProfiles = profiles.filter(
    (p) => !claimedUserIds.includes(p.user_id)
  );

  if (unclaimedProfiles.length === 0) {
    return;
  }

  // Create reminder notifications
  const notifications = unclaimedProfiles.map((profile) => ({
    user_id: profile.user_id,
    type: "bonus_reminder",
    title: "Wines of the Month Reminder",
    message: `Don't forget to pick up your ${monthName} Wines of the Month at Cabernet Steakhouse!`,
    related_id: bonus.id,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Error creating reminder notifications:", error);
  }
};
