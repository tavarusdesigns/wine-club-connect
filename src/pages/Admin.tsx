import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Wine, UserCheck, ArrowLeft, ShoppingCart, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import PendingUsersTab from "@/components/admin/PendingUsersTab";
import UserRolesTab from "@/components/admin/UserRolesTab";
import WineBonusesTab from "@/components/admin/WineBonusesTab";
import WineOrdersTab from "@/components/admin/WineOrdersTab";
import NotificationsTab from "@/components/admin/NotificationsTab";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-12 pb-6 safe-area-pt max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full wine-gradient flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage users and Wines of the Month
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="bonuses" className="flex items-center gap-2">
                <Wine className="w-4 h-4" />
                <span className="hidden sm:inline">Wines of Month</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <PendingUsersTab />
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <UserRolesTab />
            </TabsContent>

            <TabsContent value="bonuses" className="mt-4">
              <WineBonusesTab />
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <WineOrdersTab />
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
