

## Analyse de la situation actuelle

### Achat Premium
Sur Android natif, le bouton d'achat dans `PremiumPage.tsx` appelle `BillingPlugin.purchasePremium()` qui lance le flux Google Play Billing pour le produit "premium_lifetime". C'est fonctionnel sur l'APK Android avec le BillingClient Java configuré. Sur le web (preview Lovable), c'est un simple toggle pour les tests.

Le flux d'achat est donc **déjà en place** côté natif via Google Play. La page `PremiumPage` avec le bouton "Acheter" et "Restaurer les achats" est opérationnelle.

### Problème : le code de déverrouillage est visible
Actuellement, la section Premium dans les Réglages affiche **en permanence** le champ mot de passe avec l'icône clé et le bouton de déverrouillage. N'importe quel utilisateur peut le voir et tenter de deviner le code. Ce n'est pas discret du tout.

---

## Plan : Easter egg "7 clics sur la version"

### Principe
- Supprimer le champ mot de passe visible dans la section Premium des Réglages
- Ajouter un compteur de clics sur le texte de version ("Radio Sphere v1.1") en bas de la page
- Au 7ème clic, ouvrir un Dialog avec un champ mot de passe
- Si l'utilisateur tape "TESTPREMIUM007", le premium est déverrouillé
- Garder le bouton "Verrouiller Premium" visible uniquement quand le premium est actif (pour les testeurs)

### Modifications

**`src/pages/SettingsPage.tsx`** :
1. Ajouter un state `tapCount` et un state `showSecretDialog` 
2. Sur le `<p>` de version (ligne 648), ajouter un `onClick` qui incrémente `tapCount`. Quand `tapCount >= 7`, ouvrir le dialog et reset le compteur
3. Supprimer les lignes 458-520 (la section unlock/lock avec KeyRound, Input et boutons) et ne garder que le bouton "Verrouiller" si `isPremium` est true (pour que les testeurs puissent revenir en arrière)
4. Ajouter un `Dialog` secret avec un champ mot de passe et un bouton de validation

Le bouton "Restaurer les achats" (lignes 522-546) reste tel quel dans la section Premium.

### Fichiers modifiés
- `src/pages/SettingsPage.tsx` — easter egg + suppression du champ visible

