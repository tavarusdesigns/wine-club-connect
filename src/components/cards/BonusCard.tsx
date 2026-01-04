import { Gift, Wine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface BonusWine {
  name: string;
  year: number;
  region: string;
  notes: string;
  image_url?: string;
  member_price?: number;
}

interface BonusCardProps { 
  month: string;
  year: number;
  wines: BonusWine[];
  isAvailable: boolean;
  onClaim?: () => void;
}

const BonusCard = ({ month, year, wines, isAvailable, onClaim }: BonusCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 wine-gradient opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/20" />
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="w-24 h-24 text-gold" />
      </div>

      <div className="relative p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <Gift className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xs text-primary-foreground/70">Wines of the Month</p>
            <p className="text-lg font-serif font-semibold text-primary-foreground">
              {month} {year}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {wines.map((wine, index) => (
            <div key={index} className="glass-card rounded-xl p-4 bg-background/10 backdrop-blur-sm border-primary-foreground/10">
              <div className="flex items-start gap-3">
                {wine.image_url ? (
                  <img
                    src={wine.image_url}
                    alt={wine.name}
                    className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center flex-shrink-0">
                    <Wine className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-base font-semibold text-primary-foreground">
                    {wine.name}
                  </h4>
                  <p className="text-sm text-primary-foreground/70">
                    {wine.year} • {wine.region}
                  </p>
                  {wine.member_price && (
                    <p className="text-sm font-medium text-gold mt-1">
                      Member Price: ${wine.member_price.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-primary-foreground/60 mt-1 line-clamp-2">
                    {wine.notes}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isAvailable && (
          <div className="space-y-2">
            <p className="text-xs text-primary-foreground/70 text-center">
              Pick up at Cabernet Steakhouse
            </p>
            <Button
              variant="gold"
              className="w-full"
              onClick={onClaim}
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim Your Wines
            </Button>
          </div>
        )}

        {!isAvailable && (
          <div className="text-center py-2">
            <p className="text-sm text-primary-foreground/60">
              Already claimed ✓
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BonusCard;
