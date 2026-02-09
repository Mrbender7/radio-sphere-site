import { Home, Search, Heart, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "search", label: "Recherche", icon: Search },
  { id: "library", label: "Favoris", icon: Heart },
  { id: "premium", label: "Premium", icon: Crown },
] as const;

export type TabId = (typeof tabs)[number]["id"];

export function BottomNav({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  return (
    <nav className="flex items-center justify-around bg-secondary/60 backdrop-blur-lg border-t border-border px-2 py-1 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors min-w-[60px]",
            activeTab === id ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
