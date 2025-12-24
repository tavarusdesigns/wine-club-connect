import { motion } from "framer-motion";
import { Gift, Sparkles, Wine, Crown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import BonusCard from "@/components/cards/BonusCard";
import { toast } from "sonner";

const mockBonuses = [
  {
    month: "December",
    year: 2025,
    wines: [
      {
        name: "2020 Penfolds Grange Shiraz",
        year: 2020,
        region: "South Australia",
        notes: "Rich and full-bodied with notes of dark plum, chocolate, and spice.",
      },
      {
        name: "2021 Château Margaux",
        year: 2021,
        region: "Bordeaux, France",
        notes: "Elegant with cassis, violet, and silky tannins.",
      },
    ],
    isAvailable: true,
  },
  {
    month: "November",
    year: 2025,
    wines: [
      {
        name: "2019 Sassicaia",
        year: 2019,
        region: "Tuscany, Italy",
        notes: "Complex with blackcurrant, cedar, and Mediterranean herbs.",
      },
      {
        name: "2020 Opus One",
        year: 2020,
        region: "Napa Valley, USA",
        notes: "Luxurious blend of cassis, mocha, and fine oak.",
      },
    ],
    isAvailable: false,
  },
  {
    month: "October",
    year: 2025,
    wines: [
      {
        name: "2021 Krug Grande Cuvée",
        year: 2021,
        region: "Champagne, France",
        notes: "Brioche, citrus, and almond notes. Perfect celebration wine.",
      },
      {
        name: "2020 Dom Pérignon",
        year: 2020,
        region: "Champagne, France",
        notes: "Toasted hazelnut, white flowers, and creamy finish.",
      },
    ],
    isAvailable: false,
  },
];

const Bonus = () => {
  const handleClaim = (month: string) => {
    toast.success(`Bonus claimed!`, {
      description: `Your ${month} bonus wine has been added to your next pickup.`,
    });
  };

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
              Two exclusive wines each month
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
                  Premium Member
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
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Total Claimed</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <Wine className="w-6 h-6 mx-auto mb-2 text-wine-light" />
              <p className="text-2xl font-bold text-foreground">$2,400</p>
              <p className="text-xs text-muted-foreground">Value Received</p>
            </motion.div>
          </div>

          {/* Current Month Bonus */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              Available Now
            </h2>
            {mockBonuses
              .filter((b) => b.isAvailable)
              .map((bonus, index) => (
                <motion.div
                  key={bonus.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <BonusCard
                    {...bonus}
                    onClaim={() => handleClaim(bonus.month)}
                  />
                </motion.div>
              ))}
          </div>

          {/* Past Bonuses */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-muted-foreground">
              Previously Claimed
            </h2>
            {mockBonuses
              .filter((b) => !b.isAvailable)
              .map((bonus, index) => (
                <motion.div
                  key={bonus.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <BonusCard {...bonus} />
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Bonus;
