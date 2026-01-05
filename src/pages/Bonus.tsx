import { motion } from "framer-motion";
import { Gift, Sparkles, Wine, Crown, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import BonusCard from "@/components/cards/BonusCard";
import { toast } from "sonner";
import { useWineBonuses } from "@/hooks/useWineBonuses";

const Bonus = () => {
  const { bonuses, isLoading, getMonthName, totalClaimed } = useWineBonuses();

  // Members no longer claim; admin marks pickup in admin dashboard.

  const availableBonuses = bonuses.filter(b => b.is_available && !b.isClaimed);
  const claimedBonuses = bonuses.filter(b => b.isClaimed || !b.is_available);

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6 safe-area-pt">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Wines of the Month
            </h1>
            <p className="text-muted-foreground mt-1">
              Two exclusive wines each month • Pickup at Cabernet Steakhouse
            </p>
          </div>

          {/* Membership Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 opacity-10">
              <Sparkles className="w-32 h-32 text-gold" />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membership Status</p>
                <p className="text-xl font-serif font-bold text-gold">
                  Reserva Member
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  2 wines per month included
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <Gift className="w-6 h-6 mx-auto mb-2 text-gold" />
              <p className="text-2xl font-bold text-foreground">{totalClaimed}</p>
              <p className="text-xs text-muted-foreground">Total Claimed</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <Wine className="w-6 h-6 mx-auto mb-2 text-wine-light" />
              <p className="text-2xl font-bold text-foreground">${totalClaimed * 200}</p>
              <p className="text-xs text-muted-foreground">Value Received</p>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Available Bonuses */}
              {availableBonuses.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    Available Now
                  </h2>
                  {availableBonuses.map((bonus, index) => {
                    const monthName = getMonthName(bonus.month);
                    return (
                      <motion.div
                        key={bonus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <BonusCard
                          month={monthName}
                          year={bonus.year}
                          wines={bonus.wines.map(w => ({
                            name: w.name,
                            year: w.vintage_year || 0,
                            region: w.region || "",
                            notes: w.notes || "",
                            image_url: w.image_url || undefined,
                            member_price: w.member_price || undefined,
                          }))}
                          isAvailable
                          pickedUp={bonus.isPickedUp}
                          pickedUpAt={bonus.received_at || null}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Claimed / Past Bonuses */}
              {claimedBonuses.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-serif text-lg font-semibold text-muted-foreground">
                    Previously Claimed
                  </h2>
                  {claimedBonuses.map((bonus, index) => {
                    const monthName = getMonthName(bonus.month);
                    return (
                      <motion.div
                        key={bonus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <BonusCard
                          month={monthName}
                          year={bonus.year}
                          wines={bonus.wines.map(w => ({
                            name: w.name,
                            year: w.vintage_year || 0,
                            region: w.region || "",
                            notes: w.notes || "",
                            image_url: w.image_url || undefined,
                            member_price: w.member_price || undefined,
                          }))}
                          isAvailable={false}
                          pickedUp={bonus.isPickedUp}
                          pickedUpAt={bonus.received_at || null}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {bonuses.length === 0 && (
                <div className="text-center py-12">
                  <Wine className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No wine bonuses available yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Check back soon for new selections
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Bonus;
