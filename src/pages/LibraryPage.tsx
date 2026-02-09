import { RadioStation } from "@/types/radio";
import { StationCard } from "@/components/StationCard";
import { Heart } from "lucide-react";

interface LibraryPageProps {
  favorites: RadioStation[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (station: RadioStation) => void;
}

export function LibraryPage({ favorites, isFavorite, onToggleFavorite }: LibraryPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <h1 className="text-2xl font-bold mt-6 mb-4">Bibliothèque</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Aucun favori</h2>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Appuyez sur le cœur d'une station pour l'ajouter à vos favoris
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {favorites.map(s => (
            <StationCard key={s.id} station={s} compact isFavorite={isFavorite(s.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
