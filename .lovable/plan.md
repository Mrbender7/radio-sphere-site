
# Fix du crash lors du changement rapide de station apres une erreur

## Probleme

Quand une station produit une "erreur de flux" et que l'utilisateur clique immediatement sur une autre station, l'app crash. La cause : les anciens event listeners (`canplay`, `error`) de la station precedente restent attaches a l'element audio global. Quand la nouvelle station declenche ces memes evenements, les anciens callbacks interferent et provoquent des erreurs non gerees.

## Solution

Nettoyer systematiquement les anciens listeners avant d'en attacher de nouveaux dans la fonction `play()`, et envelopper l'ensemble dans un `try...catch` pour eviter tout crash non gere.

## Detail technique

**Fichier** : `src/contexts/PlayerContext.tsx`

### Modifications dans la fonction `play()` (ligne 296)

1. **Stocker les references des listeners** dans des refs (`canplayRef`, `timeoutRef`) pour pouvoir les supprimer proprement lors du prochain appel a `play()`.

2. **Nettoyer les anciens listeners au debut de `play()`** : avant de configurer la nouvelle station, retirer les eventuels `canplay` listeners orphelins et annuler le timeout precedent.

3. **Envelopper tout le corps de `play()` dans un `try...catch`** pour capturer toute erreur inattendue et afficher un toast au lieu de crasher.

4. **Retirer le listener `error` global avant de le re-attacher** pour eviter les doublons apres plusieurs appels successifs.

Concretement :

- Ajouter deux refs : `pendingCanplayRef` et `pendingTimeoutRef` pour stocker les references des listeners/timeouts actifs.
- Au debut de `play()` : supprimer l'ancien canplay listener via la ref, et `clearTimeout` l'ancien timeout.
- Apres avoir attache les nouveaux listeners, stocker leurs references dans les refs.
- Entourer le tout d'un `try...catch` avec un toast d'erreur en fallback.

Un seul fichier modifie, aucune dependance ajoutee.
