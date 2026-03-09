

## Correctif : Container info stream + traductions manquantes

### 1. FullScreenPlayer — container info vide

Actuellement (lignes 300-320), si `codec`, `bitrate` et `language` sont tous vides/nuls, le container `bg-accent/50` s'affiche vide. Il faut ajouter un fallback affichant un message type "Aucune info relayee par le stream ou Radio Browser" sur une seule ligne centree.

De plus, les labels "Codec", "Bitrate" et "Langue" sont en dur en francais. Ils doivent utiliser `t()`.

**Modification dans `FullScreenPlayer.tsx`** (lignes 300-320) :

```tsx
{/* Codec / Bitrate / Language info */}
<div className="grid grid-cols-3 gap-3 py-4 px-4 rounded-xl bg-accent/50">
  {(!currentStation.codec && !(currentStation.bitrate > 0) && !currentStation.language) ? (
    <p className="col-span-3 text-xs text-muted-foreground text-center">
      {t("player.noStreamInfo")}
    </p>
  ) : (
    <>
      {currentStation.codec && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{t("player.codec")}</p>
          <p className="text-sm font-semibold text-foreground">{currentStation.codec}</p>
        </div>
      )}
      {currentStation.bitrate > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{t("player.bitrate")}</p>
          <p className="text-sm font-semibold text-foreground">{currentStation.bitrate} kbps</p>
        </div>
      )}
      {currentStation.language && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{t("player.language")}</p>
          <p className="text-sm font-semibold text-foreground">{currentStation.language}</p>
        </div>
      )}
    </>
  )}
</div>
```

### 2. Nouvelles cles de traduction dans `translations.ts`

Ajouter dans les 5 langues :

| Cle | FR | EN | ES | DE | JA |
|---|---|---|---|---|---|
| `player.codec` | Codec | Codec | Códec | Codec | コーデック |
| `player.bitrate` | Débit | Bitrate | Bitrate | Bitrate | ビットレート |
| `player.language` | Langue | Language | Idioma | Sprache | 言語 |
| `player.noStreamInfo` | Aucune info relayée par le stream ou Radio Browser | No info provided by the stream or Radio Browser | Sin información del stream o Radio Browser | Keine Info vom Stream oder Radio Browser | ストリームまたはRadio Browserからの情報なし |

### Fichiers modifies
- `src/components/FullScreenPlayer.tsx` : fallback + labels traduits
- `src/i18n/translations.ts` : 4 nouvelles cles x 5 langues

