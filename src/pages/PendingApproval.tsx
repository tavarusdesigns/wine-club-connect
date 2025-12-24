import { motion } from "framer-motion";
import { Wine, Clock, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PendingApproval = () => {
  const { signOut, user, refreshProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleCheckStatus = async () => {
    await refreshProfile();
    toast.info("Checking your approval status...");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 wine-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/10" />
        
        <div className="relative px-6 pt-16 pb-12 safe-area-pt text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-lg">
              <Wine className="w-10 h-10 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-primary-foreground">
                Cabernet Steakhouse
              </h1>
              <p className="text-primary-foreground/70 text-sm mt-1">
                Wine Club
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-sm mx-auto text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-gold" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
              Membership Pending
            </h2>
            <p className="text-muted-foreground">
              Thank you for signing up! Your membership application is being reviewed by our team.
            </p>
          </div>

          <div className="glass-card rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Signed up as</p>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You'll receive an email notification once your membership is approved. 
            This typically takes 1-2 business days.
          </p>

          <div className="space-y-3">
            <Button
              variant="gold"
              className="w-full"
              onClick={handleCheckStatus}
            >
              Check Approval Status
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;