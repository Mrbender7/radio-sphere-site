

# Timeback Machine - Plan de refonte

## Concept

Remplacer le système actuel (barre de seek-back + bouton REC dans le fullplayer) par un écran dédié "Timeback Machine" avec une esthétique lecteur cassette rétro.

## Changements sur le FullScreenPlayer

**Supprimer** du fullscreen player :
- La barre de seek-back (Slider timeline, lignes 298-339)
- Le bouton REC inline (lignes 245-261)
- Le compteur de recording inline (lignes 272-279)
- L'affichage de la CassetteAnimation dans le fullplayer (lignes 190-199)

**Conserver** :
- Le badge "EN DIRECT" vert avec animation pulse (déjà présent)

**Ajouter** :
- Un bouton animé "Timeback Machine" qui apparaît quand `bufferAvailable` est true, placé à côté ou sous le badge EN DIRECT
- Style rétro : icône cassette animée, label "Retour dans le passé" / "Back in Time" etc.
- Le bouton ouvre le nouvel écran TBM

## Nouvel écran : TimebackMachine.tsx

Écran plein écran (z-index au-dessus du fullplayer) avec :

### Header
- Bouton retour (chevron down) pour fermer
- Titre "Timeback Machine" en style rétro

### Grande cassette audio
- Réutilisation et agrandissement de `CassetteAnimation` (passer de w-56 à ~w-72/w-80)
- Label sur la cassette : nom de la station (au lieu de "RadioSphere REC")
- Logo de la station au centre de la cassette avec un filtre sépia/vieilli (CSS `sepia`, `brightness`, grain overlay)
- Les bobines tournent quand on lit le buffer ou enregistre

### Boutons transport rétro (sous la cassette)
Boutons style lecteur K7 vintage avec effet 3D pressé :
- **⏪ Rewind** : recule de 15s dans le buffer (appel `seekBack(currentOffset + 15)`)
- **▶️ Play/Pause** : lecture/pause du flux (ou du buffer si pas en live)
- **⏹ Stop** : arrête l'enregistrement si actif, sinon retour au live
- **⏺ Record** : démarre/arrête l'enregistrement (premium only)
- **⏩ Forward** : avance de 15s vers le live (appel `seekBack(currentOffset - 15)`)

### Barre de progression du buffer
- Barre horizontale montrant les chunks buffered (0 → bufferSeconds)
- Marqueur de position courante avec affichage du temps
- Si recording actif : zone colorée en rouge sur la portion enregistrée
- Label temps à gauche (début buffer) et "LIVE" à droite

### Footer
- Bouton "Retour au direct" pour revenir en live et fermer

## Fichiers à modifier/créer

1. **Créer `src/components/TimebackMachine.tsx`** — Nouvel écran complet
2. **Modifier `src/components/CassetteAnimation.tsx`** — Agrandir, ajouter props pour nom station + logo + mode idle/playing/recording
3. **Modifier `src/components/FullScreenPlayer.tsx`** — Supprimer seek bar + REC, ajouter bouton TBM
4. **Modifier `src/index.css`** — Ajouter animations (tape-wobble, boutons 3D pressés, filtre vintage)
5. **Modifier `src/i18n/translations.ts`** — Ajouter clés TBM dans les 5 langues

## Détail technique

- Le `StreamBufferContext` reste inchangé — toute la logique existante (seekBack, startRecording, stopRecording, returnToLive) est réutilisée telle quelle
- L'écran TBM est un state boolean dans `FullScreenPlayer` (`showTimeback`)
- Les boutons rewind/forward appellent `seekBack()` avec des offsets calculés depuis `currentSeekOffsetSeconds`
- La barre de progression utilise `bufferSeconds` et `currentSeekOffsetSeconds` pour le positionnement
- L'export sheet après arrêt d'enregistrement reste identique (déjà dans FullScreenPlayer)

## Traductions à ajouter (clés)
- `player.timebackMachine` : "Timeback Machine"
- `player.backInTime` : "Retour dans le passé" / "Back in Time" / etc.
- `player.rewind` / `player.forward` : labels accessibilité

