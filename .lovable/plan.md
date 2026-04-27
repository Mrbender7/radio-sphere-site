# Suivi Umami "Station Played" avec délai anti-zapping de 30s

## Objectif
Envoyer l'événement Umami `station-played` uniquement quand une station est écoutée **30 secondes en continu**, afin de préserver le quota mensuel de Umami Cloud (gratuit) en n'enregistrant pas les zappeurs.

## Comportement
- Quand une station démarre (transition vers `isPlaying = true` avec une station donnée), on arme un minuteur de 30 s.
- Si pendant ces 30 s :
  - l'utilisateur **change de station**,
  - met **en pause** (manuel ou via lock screen / cast),
  - le **flux meurt / erreur SSL / stalled** sans reprise,
  - l'utilisateur **ferme l'onglet** ou met l'app en arrière-plan suffisamment longtemps pour que la lecture s'arrête,
  → le minuteur est annulé, **aucun event n'est envoyé**.
- Au bout de 30 s continues, on appelle `window.umami.track("station-played", { name, genre, country })` **une seule fois** pour cette session de lecture.
- Une seconde session sur la même station (après pause/reprise) → nouveau minuteur, nouveau comptage (sinon on sous-estime les vraies écoutes).

## Détails techniques

### Fichier : nouvel utilitaire `src/utils/umamiTracking.ts`
Petit helper qui :
- vérifie que `window.umami?.track` existe (sinon noop, important pour Brave / bloqueurs / WebViews),
- enveloppe l'appel dans un `try/catch` (cohérent avec la politique safeStorage / WebView hardening),
- expose `trackStationPlayed(station)` qui envoie `{ name, genre, country }` avec `genre = station.tags?.[0] ?? "unknown"` (premier tag, en minuscules, tronqué à ~40 chars pour rester lisible dans Umami).

### Fichier : `src/contexts/PlayerContext.tsx`
Ajouter un mécanisme de minuteur attaché au cycle de vie de la lecture :

1. Nouveaux refs :
   ```ts
   const playTrackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const trackedStationUuidRef = useRef<string | null>(null); // évite double-envoi pour la même session
   ```

2. Helpers internes :
   - `armPlayTracking(station)` : annule tout minuteur précédent puis `setTimeout(() => trackStationPlayed(station), 30_000)`. Mémorise `station.stationuuid` dans une variable locale capturée pour comparer au moment du tir.
   - `cancelPlayTracking()` : `clearTimeout` + reset ref.

3. Points d'appel :
   - **Armer** dans `playInternal` juste après que la lecture a effectivement démarré (dans le `.then()` du `audio.play()` qui passe `isPlaying = true`, là où `retryCountRef.current = 0` est mis à 0 — c'est l'équivalent du moment "lecture confirmée"). Avant d'armer, on annule le précédent (changement de station).
   - **Annuler** dans :
     - `handlePause` (pause manuelle, lock screen, cast toggle pause),
     - `handleError` (erreur de stream / SSL),
     - le bloc qui marque `streamDeadRef.current = true`,
     - le `cleanup` du `useEffect` principal (démontage / fermeture d'onglet : React appelle le cleanup, et de toute façon le timer mourra avec la page),
     - au début de `playInternal` quand on lance une **nouvelle** station (changement = annulation de l'ancien + armement du nouveau).

4. Pas de modification du `reloadStream` : si le flux est récupéré silencieusement (heartbeat / stalled retry), on **garde** le minuteur en cours puisque l'utilisateur n'a pas zappé. C'est le comportement souhaité (sinon les flux fragiles ne seraient jamais comptabilisés).

### Aucun changement
- `index.html` : Umami est déjà chargé.
- Pas de nouveau `data-umami-event` à ajouter sur des boutons : ce suivi est piloté par le contexte audio, pas par un clic.
- CSP : `cloud.umami.is` est déjà autorisé.

## Données envoyées à Umami
```
event: "station-played"
data: {
  name: "Radio Nova",
  genre: "jazz",        // premier tag, ou "unknown"
  country: "FR"
}
```
Volume estimé : ≪ que les pageviews actuels grâce au filtre 30 s → quota préservé.

## Hors scope
- Pas de batching / dédup côté serveur.
- Pas de tracking de la durée totale d'écoute (seul l'événement "écoute qualifiée" est compté).
- Pas de modifications UI / traduction.
