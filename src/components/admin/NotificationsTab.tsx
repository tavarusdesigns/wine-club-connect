import { useState, useEffect } from "react";
import { Bell, Send, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

const NotificationsTab = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name")
        .eq("is_approved", true)
        .order("last_name", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load members");
      } else {
        setMembers(data || []);
      }
      setIsLoading(false);
    };

    fetchMembers();
  }, []);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in title and message");
      return;
    }

    if (targetType === "specific" && selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title,
          message,
          type,
          sendToAll: targetType === "all",
          targetUserIds: targetType === "specific" ? selectedMembers : undefined,
        },
      });

      if (error) throw error;

      toast.success(
        targetType === "all"
          ? "Notification sent to all members!"
          : `Notification sent to ${selectedMembers.length} member(s)!`
      );

      // Reset form
      setTitle("");
      setMessage("");
      setType("general");
      setSelectedMembers([]);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const notificationTypes = [
    { value: "general", label: "General", icon: "🔔" },
    { value: "new_event", label: "New Event", icon: "📅" },
    { value: "order_status", label: "Order Update", icon: "📦" },
    { value: "bonus_reminder", label: "Wines of the Month", icon: "🎁" },
  ];

  const getMemberName = (member: Profile) => {
    if (member.first_name && member.last_name) {
      return `${member.last_name}, ${member.first_name}`;
    }
    return member.first_name || member.last_name || "Unknown Member";
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Target Selection */}
          <div className="space-y-3">
            <Label>Send To</Label>
            <RadioGroup
              value={targetType}
              onValueChange={(value) => setTargetType(value as "all" | "specific")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  All Members
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Specific Members
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Member Selection */}
          {targetType === "specific" && (
            <div className="space-y-3">
              <Label>Select Members ({selectedMembers.length} selected)</Label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Loading members...</p>
                ) : members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No approved members found</p>
                ) : (
                  members.map(member => (
                    <div
                      key={member.user_id}
                      className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded"
                    >
                      <Checkbox
                        id={member.user_id}
                        checked={selectedMembers.includes(member.user_id)}
                        onCheckedChange={() => handleMemberToggle(member.user_id)}
                      />
                      <Label
                        htmlFor={member.user_id}
                        className="cursor-pointer flex-1"
                      >
                        {getMemberName(member)}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendNotification}
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Notification
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;