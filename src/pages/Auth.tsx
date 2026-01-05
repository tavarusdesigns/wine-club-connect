import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wine, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const phoneSchema = z
  .string()
  .min(10, "Please enter a valid phone number")
  .refine((val) => (val.match(/\d/g) || []).length >= 10, "Please enter a valid phone number");

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({});
  
  const { signIn, signUp, user, isApproved, loading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect appropriately once profile state is known
    if (user) {
      if (loading || profile === null) return; // wait until profile is loaded or explicitly null
      if (!isApproved) {
        navigate("/pending-approval");
      } else {
        navigate("/");
      }
    }
  }, [user, isApproved, loading, profile, navigate]);

  const normalizePhone = (input: string) => {
    const digits = (input.match(/\d/g) || []).join("");
    if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
    if (digits.length === 10) return "+1" + digits;
    return digits ? "+" + digits : "";
  };

  const formatPhonePretty = (input: string) => {
    const digits = (input.match(/\d/g) || []).join("");
    const parts = [digits.slice(0,3), digits.slice(3,6), digits.slice(6,10)];
    if (digits.length <= 3) return parts[0];
    if (digits.length <= 6) return `(${parts[0]}) ${parts[1]}`.trim();
    return `(${parts[0]}) ${parts[1]}-${parts[2]}`.trim();
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; phone?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (isSignUp) {
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, firstName, lastName, normalizePhone(phone) || null, referredBy || null);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Please check your email to confirm your account.", {
            description: "Once confirmed, your membership will be reviewed.",
          });
          navigate("/pending-approval");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative overflow-hidden">
        <img
          src="https://studio.pinotspalette.com/naperville/images/nap-wineglasses-fullsize.jpg"
          alt="Background wine glasses"
          className="absolute inset-0 w-full h-full object-cover object-[50%_30%] sm:object-[50%_25%] md:object-center opacity-20 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/10" />
        
        <div className="relative px-6 pt-16 pb-12 safe-area-pt text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="inline-flex items-center rounded-md bg-black/85 dark:bg-black px-3 py-2 shadow-md ring-1 ring-white/20">
              <img src="/logo.png" alt="Cabernet Wine Club" className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto" />
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

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-2">
            {isSignUp ? "Join the Club" : "Welcome Back"}
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            {isSignUp
              ? "Create your member account"
              : "Sign in to access your membership"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
           {isSignUp && (
             <>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2">
                   <Label htmlFor="firstName">First Name</Label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="firstName"
                       value={firstName}
                       onChange={(e) => setFirstName(e.target.value)}
                       placeholder="John"
                       className="pl-10 bg-secondary border-border"
                       required={isSignUp}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="lastName">Last Name</Label>
                   <Input
                     id="lastName"
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                     placeholder="Doe"
                     className="bg-secondary border-border"
                     required={isSignUp}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 gap-3">
                 <div className="space-y-2">
                   <Label htmlFor="phone">Mobile Phone #</Label>
                   <Input
                     id="phone"
                     type="tel"
                     value={phone}
                     onChange={(e) => setPhone(formatPhonePretty(e.target.value))}
                     placeholder="(555) 555-5555"
                     className="bg-secondary border-border"
                     inputMode="tel"
                     required
                   />
                   {errors.phone && (
                     <p className="text-sm text-destructive">{errors.phone}</p>
                   )}
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="referredBy">Referred By</Label>
                   <Input
                     id="referredBy"
                     value={referredBy}
                     onChange={(e) => setReferredBy(e.target.value)}
                     placeholder="e.g., Friend's name or source"
                     className="bg-secondary border-border"
                   />
                 </div>
               </div>
             </>
           )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="your@email.com"
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="••••••••"
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp
                ? "Already a member? Sign in"
                : "Not a member yet? Join now"}
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center">
            <img
              src="https://www.cabernetsteakhouse.com/wp-content/uploads/2026/01/Cabernet-Wine-Club-Logo-Official-1.png"
              alt="Cabernet Wine Club"
              className="w-auto h-[72px] sm:h-24 md:h-[120px] lg:h-[144px] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
      {/* Footer */}
      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-5xl mx-auto px-5 py-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2026 Cabernet Steakhouse. All Rights Reserved. Developed by The Graphix Guru LLC.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
