import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Shield, Crown, Edit3, Save, X, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface EditFormData {
  first_name: string;
  last_name: string;
  phone: string;
  membership_tier: string;
  is_approved: boolean;
}

const UserRolesTab = () => {
  const { allUsers, userRoles, fetchAllUsers, fetchUserRoles, assignRole, removeRole, updateProfile } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    membership_tier: "standard",
    is_approved: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllUsers();
    fetchUserRoles();
  }, []);

  // Map user roles by user_id
  const rolesByUserId = userRoles.reduce((acc, role) => {
    acc[role.user_id] = role.role;
    return acc;
  }, {} as Record<string, string>);

  // Filter users by search query
  const filteredUsers = allUsers.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase();
    const phone = user.phone?.toLowerCase() || "";
    return fullName.includes(query) || phone.includes(query);
  });

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

  const handleEditClick = (user: typeof allUsers[0]) => {
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      membership_tier: "standard",
      is_approved: user.is_approved,
    });
    setEditingUser(user.user_id);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error } = await updateProfile(editingUser, {
      first_name: editForm.first_name || null,
      last_name: editForm.last_name || null,
      phone: editForm.phone || null,
      membership_tier: editForm.membership_tier || null,
      is_approved: editForm.is_approved,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to update member");
    } else {
      toast.success("Member updated successfully");
      setEditingUser(null);
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {allUsers.length} members
      </p>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.map((user, index) => {
          const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown User";
          const currentRole = rolesByUserId[user.user_id] || "none";

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="glass-card border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        {getRoleIcon(currentRole) || <UserCircle className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.is_approved ? "Approved" : "Pending approval"}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          Phone: {user.phone || "—"}
                        </div>
                        {user.referred_by ? (
                          <div className="text-xs text-muted-foreground truncate">
                            Referred By: {user.referred_by}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                        className="shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Select
                        value={currentRole}
                        onValueChange={(value) => handleRoleChange(user.user_id, value)}
                      >
                        <SelectTrigger className="w-28 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No role</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {filteredUsers.length === 0 && (
          <Card className="glass-card border-border/30">
            <CardContent className="py-8 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No members match your search</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership_tier">Membership Tier</Label>
              <Select
                value={editForm.membership_tier}
                onValueChange={(value) => setEditForm({ ...editForm, membership_tier: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_approved"
                checked={editForm.is_approved}
                onChange={(e) => setEditForm({ ...editForm, is_approved: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="is_approved">Approved Member</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-wine hover:bg-wine-dark"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRolesTab;
