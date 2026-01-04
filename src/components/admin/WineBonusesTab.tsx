import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wine, Plus, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WineBonusesTab = () => {
  const {
    bonuses,
    fetchBonuses,
    createBonus,
    updateBonusAvailability,
    deleteBonus,
    addWineToBonus,
    removeWineFromBonus,
  } = useAdmin();

  const [newBonusMonth, setNewBonusMonth] = useState<string>("");
  const [newBonusYear, setNewBonusYear] = useState<string>(new Date().getFullYear().toString());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addWineDialogOpen, setAddWineDialogOpen] = useState<string | null>(null);
  const [newWine, setNewWine] = useState({
    name: "",
    vintage_year: "",
    region: "",
    notes: "",
    image_url: "",
    member_price: "",
  });

  useEffect(() => {
    fetchBonuses();
  }, []);

  const handleCreateBonus = async () => {
    if (!newBonusMonth || !newBonusYear) {
      toast.error("Please select month and year");
      return;
    }

    const { error } = await createBonus(parseInt(newBonusMonth), parseInt(newBonusYear));
    if (error) {
      toast.error("Failed to create bonus");
    } else {
      toast.success("Bonus created");
      setCreateDialogOpen(false);
      setNewBonusMonth("");
    }
  };

  const handleToggleAvailability = async (bonusId: string, currentValue: boolean) => {
    const { error } = await updateBonusAvailability(bonusId, !currentValue);
    if (error) {
      toast.error("Failed to update availability");
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    const { error } = await deleteBonus(bonusId);
    if (error) {
      toast.error("Failed to delete bonus");
    } else {
      toast.success("Bonus deleted");
    }
  };

  const handleAddWine = async (bonusId: string) => {
    if (!newWine.name.trim()) {
      toast.error("Wine name is required");
      return;
    }

    const { error } = await addWineToBonus(bonusId, {
      name: newWine.name,
      vintage_year: newWine.vintage_year ? parseInt(newWine.vintage_year) : undefined,
      region: newWine.region || undefined,
      notes: newWine.notes || undefined,
      image_url: newWine.image_url || undefined,
      member_price: newWine.member_price ? parseFloat(newWine.member_price) : undefined,
    });

    if (error) {
      toast.error("Failed to add wine");
    } else {
      toast.success("Wine added");
      setAddWineDialogOpen(null);
      setNewWine({ name: "", vintage_year: "", region: "", notes: "", image_url: "", member_price: "" });
    }
  };

  const handleRemoveWine = async (wineId: string) => {
    const { error } = await removeWineFromBonus(wineId);
    if (error) {
      toast.error("Failed to remove wine");
    } else {
      toast.success("Wine removed");
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 1);

  return (
    <div className="space-y-4">
      {/* Create Bonus Button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="gold" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Monthly Bonus
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Create Monthly Bonus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={newBonusMonth} onValueChange={setNewBonusMonth}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={newBonusYear} onValueChange={setNewBonusYear}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateBonus} className="w-full" variant="gold">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bonuses List */}
      {bonuses.length === 0 ? (
        <Card className="glass-card border-border/30">
          <CardContent className="py-12 text-center">
            <Wine className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No bonuses created yet</p>
          </CardContent>
        </Card>
      ) : (
        bonuses.map((bonus, index) => (
          <motion.div
            key={bonus.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-card border-border/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" />
                    {MONTHS[bonus.month - 1]} {bonus.year}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {bonus.is_available ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={bonus.is_available}
                        onCheckedChange={() => handleToggleAvailability(bonus.id, bonus.is_available)}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteBonus(bonus.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Wines */}
                {bonus.wines.map((wine) => (
                  <div
                    key={wine.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {wine.image_url ? (
                        <img
                          src={wine.image_url}
                          alt={wine.name}
                          className="w-12 h-16 object-cover rounded shrink-0"
                        />
                      ) : (
                        <Wine className="w-5 h-5 text-wine-light shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{wine.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {wine.vintage_year && `${wine.vintage_year}`}
                          {wine.vintage_year && wine.region && " • "}
                          {wine.region}
                        </p>
                        {wine.member_price && (
                          <p className="text-sm text-gold font-medium">
                            Member Price: ${wine.member_price.toFixed(2)}
                          </p>
                        )}
                        {wine.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {wine.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveWine(wine.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Wine Button */}
                <Dialog
                  open={addWineDialogOpen === bonus.id}
                  onOpenChange={(open) => setAddWineDialogOpen(open ? bonus.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-dashed">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Wine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Add Wine to {MONTHS[bonus.month - 1]} {bonus.year}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Wine Name *</Label>
                        <Input
                          value={newWine.name}
                          onChange={(e) => setNewWine({ ...newWine, name: e.target.value })}
                          placeholder="e.g., 2020 Penfolds Grange Shiraz"
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Vintage Year</Label>
                          <Input
                            type="number"
                            value={newWine.vintage_year}
                            onChange={(e) => setNewWine({ ...newWine, vintage_year: e.target.value })}
                            placeholder="2020"
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Region</Label>
                          <Input
                            value={newWine.region}
                            onChange={(e) => setNewWine({ ...newWine, region: e.target.value })}
                            placeholder="e.g., Bordeaux, France"
                            className="bg-secondary border-border"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tasting Notes</Label>
                        <Textarea
                          value={newWine.notes}
                          onChange={(e) => setNewWine({ ...newWine, notes: e.target.value })}
                          placeholder="Describe the wine's flavors and characteristics..."
                          className="bg-secondary border-border"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                          value={newWine.image_url}
                          onChange={(e) => setNewWine({ ...newWine, image_url: e.target.value })}
                          placeholder="https://example.com/wine-image.jpg"
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Wine Member Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newWine.member_price}
                          onChange={(e) => setNewWine({ ...newWine, member_price: e.target.value })}
                          placeholder="99.99"
                          className="bg-secondary border-border"
                        />
                      </div>
                      <Button onClick={() => handleAddWine(bonus.id)} className="w-full" variant="gold">
                        Add Wine
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            
          </motion.div>
        ))
      )}
    </div>
  );
};

export default WineBonusesTab;
