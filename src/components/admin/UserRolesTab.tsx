import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Shield, Crown, Edit3, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

const UserRolesTab = () => {
  const { allUsers, userRoles, fetchAllUsers, fetchUserRoles, assignRole, removeRole, updateUserContact } = useAdmin();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAllUsers();
    fetchUserRoles();
  }, []);

  // Map user roles by user_id
  const rolesByUserId = userRoles.reduce((acc, role) => {
    acc[role.user_id] = role.role;
    return acc;
  }, {} as Record<string, string>);

  const handleRoleChange = async (userId: string, role: string) => {
    if (role === "none") {
      const { error } = await removeRole(userId);
      if (error) {
        toast.error("Failed to remove role");
      } else {
        toast.success("Role removed");
      }
    } else {
      const { error } = await assignRole(userId, role as "admin" | "member");
      if (error) {
        toast.error("Failed to assign role");
      } else {
        toast.success(`Role updated to ${role}`);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-gold" />;
      case "member":
        return <Shield className="w-4 h-4 text-wine-light" />;
      default:
        return null;
    }
  };

  if (allUsers.length === 0) {
    return (
      <Card className="glass-card border-border/30">
        <CardContent className="py-12 text-center">
          <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {allUsers.map((user, index) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown User";
        const currentRole = rolesByUserId[user.user_id] || "none";

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
                      {getRoleIcon(currentRole) || <UserCircle className="w-6 h-6 text-muted-foreground" />}
                    </div>
                   <div className="min-w-0">
                     <p className="font-medium text-foreground truncate">{fullName}</p>
                     <p className="text-xs text-muted-foreground">
                       {user.is_approved ? "Approved" : "Pending approval"}
                     </p>
                     <div className="text-xs text-muted-foreground mt-1 truncate">Phone: {user.phone || "—"}</div>
                     {user.referred_by ? (
                       <div className="text-xs text-muted-foreground truncate">Referred By: {user.referred_by}</div>
                     ) : null}
                   </div>
                  </div>
                  <Select
                    value={currentRole}
                    onValueChange={(value) => handleRoleChange(user.user_id, value)}
                  >
                    <SelectTrigger className="w-32 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default UserRolesTab;
