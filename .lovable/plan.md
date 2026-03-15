

# Plan : Quota Découverte TBM (Mobile Web)

## Concept

Un hook `useTBMQuota` gère un quota de 10 min/jour d'écoute TBM hors-live sur navigateur mobile. Le quota se réinitialise chaque jour. Une notification apparaît à 8 min, et une modale bloquante s'affiche à 10 min.

## Fichiers

### 1. `src/hooks/useTBMQuota.ts` (nouveau)

- Détection mobile via `useIsMobile()`
- localStorage clé `radiosphere_tbm_quota` : `{ date: "YYYY-MM-DD", usedSeconds: number }`
- Expose : `{ canUseTBM: boolean, usedSeconds: number, maxSeconds: number, isWarning: boolean, trackUsage: () => void, resetDaily: () => void }`
- `trackUsage()` appelé chaque seconde quand l'utilisateur est en mode seek (pas live) — incrémente `usedSeconds` et persiste
- `isWarning` = true quand `usedSeconds >= 480` (8 min)
- `canUseTBM` = false quand `usedSeconds >= 600` (10 min)
- Sur desktop : toujours `canUseTBM = true`, pas de tracking

### 2. `src/components/TBMQuotaModal.tsx` (nouveau)

- Modale premium (thème sombre, backdrop-blur) avec :
  - Titre : traduction `tbmQuota.title` ("Envie de remonter le temps sans limite ?")
  - Texte explicatif : traduction `tbmQuota.description`
  - Bouton CTA "Télécharger sur Google Play" (placeholder `#`)
  - Bouton "Continuer en direct" → appelle `returnToLive()` et ferme
- Props : `open`, `onClose`, `onReturnToLive`

### 3. `src/components/TimebackMachine.tsx` (modifié)

- Import `useTBMQuota`
- Appeler `trackUsage()` via un `useEffect` avec interval 1s quand `!isLive`
- Avant `seekBack()` et `handleRewind()` : vérifier `canUseTBM`, sinon afficher la modale
- Quand `isWarning` passe à true : afficher un toast discret (une seule fois)
- Rendre `<TBMQuotaModal>` conditionnel

### 4. `src/i18n/translations.ts` (modifié)

Ajouter dans les 5 langues :
- `tbmQuota.title` : "Envie de remonter le temps sans limite ?"
- `tbmQuota.description` : "Sur le web mobile, la TimeBack Machine est limitée à 10 min/jour pour garantir la stabilité. Téléchargez l'application Radio Sphere pour une écoute illimitée et une qualité HD."
- `tbmQuota.cta` : "Télécharger sur Google Play"
- `tbmQuota.continueLive` : "Continuer en direct"
- `tbmQuota.warning` : "Profitez de la TimeBack Machine en illimité sur notre application !"

## Flux utilisateur

1. L'utilisateur mobile ouvre la TBM et rembobine → le compteur tourne
2. À 8 min : toast discret d'avertissement
3. À 10 min : toute tentative de seek affiche la modale
4. "Continuer en direct" → `returnToLive()` + ferme modale
5. Le lendemain : quota réinitialisé automatiquement (nouvelle date)
6. Desktop : aucune restriction

