import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, UserCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { format } from "date-fns";

const PendingUsersTab = () => {
  const { pendingUsers, fetchPendingUsers, approveUser, rejectUser } = useAdmin();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string, name: string) => {
    const { error } = await approveUser(userId);
    if (error) {
      toast.error("Failed to approve user");
    } else {
      toast.success(`${name || "User"} has been approved`);
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const { error } = await rejectUser(userId);
    if (error) {
      toast.error("Failed to reject user");
    } else {
      toast.success(`${name || "User"} has been rejected`);
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <Card className="glass-card border-border/30">
        <CardContent className="py-12 text-center">
          <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No pending approval requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pendingUsers.map((user, index) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown User";
        
        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-card border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <UserCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{fullName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(user.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleReject(user.user_id, fullName)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => handleApprove(user.user_id, fullName)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PendingUsersTab;
