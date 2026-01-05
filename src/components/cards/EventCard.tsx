import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  spotsLeft?: number;
  image?: string;
  onRegister: () => void;
}

const EventCard = ({
  title,
  date,
  time,
  location,
  spotsLeft,
  image,
  onRegister,
}: EventCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="relative h-40">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-xl font-semibold text-foreground line-clamp-2">
            {title}
          </h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4 text-gold" />
          <span>{date} • {time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 text-gold" />
          <span className="line-clamp-1">{location}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-wine-light" />
            <span className="text-wine-light font-medium">
              {typeof spotsLeft === "number" ? `${spotsLeft} spots left` : "Tickets available"}
            </span>
          </div>
          <Button variant="gold" size="sm" onClick={onRegister}>
            Register
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
