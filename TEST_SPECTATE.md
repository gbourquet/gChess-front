# 🎥 Test du Mode Spectateur - Phase 7

## Prérequis

- Backend démarré sur `http://localhost:8080`
- Frontend démarré sur `http://localhost:4200`
- 2 joueurs en partie active

---

## 🎮 Scénario de Test Complet

### Étape 1: Créer une Partie (2 joueurs)

Si vous n'avez pas encore de partie en cours:

**Navigateur 1 - Joueur 1:**
1. Ouvrez `http://localhost:4200`
2. Connectez-vous avec `joueur1@test.com` / `Password123!`
3. Dashboard → "Trouver une partie"
4. "Rejoindre la file d'attente"

**Navigateur 2 - Joueur 2 (fenêtre privée):**
1. Ouvrez une fenêtre privée
2. Allez sur `http://localhost:4200`
3. Connectez-vous avec `joueur2@test.com` / `Password123!`
4. Dashboard → "Trouver une partie"
5. "Rejoindre la file d'attente"

**Résultat:** Les 2 joueurs sont en partie sur `/game/{gameId}`

### Étape 2: Notez le Game ID

Dans l'URL de la partie:
```
http://localhost:4200/game/01JDABCD1234EFGH5678IJKLMN
                           ↑
                    Copiez ce Game ID
```

**Exemple de Game ID:** `01JDABCD1234EFGH5678IJKLMN` (format ULID)

---

### Étape 3: Ouvrir le Mode Spectateur

**Navigateur 3 - Spectateur:**

#### Option A: Compte Existant
1. Ouvrez un 3ème navigateur (ou profil Chrome différent)
2. Allez sur `http://localhost:4200`
3. Connectez-vous avec un compte existant (par ex: `joueur3@test.com`)

#### Option B: Nouveau Compte
1. Inscrivez un nouveau compte: `spectateur1@test.com` / `Password123!`

#### Accès au Mode Spectateur
1. **Modifiez l'URL manuellement:**
   ```
   http://localhost:4200/game/{gameId}/spectate
   ```
   Remplacez `{gameId}` par le Game ID copié à l'étape 2

2. Appuyez sur **Entrée**

---

### Étape 4: Vérification du Mode Spectateur

**Ce que vous devriez voir:**

✅ **Badge "Mode Spectateur"** (violet, en haut)
```
┌────────────────────────────┐
│  🔵 Mode Spectateur        │
└────────────────────────────┘
```

✅ **Informations des 2 joueurs:**
- Joueur Blanc (en haut)
- Joueur Noir (en bas)
- Statut "En ligne" pour les deux

✅ **Échiquier:**
- Position actuelle de la partie
- Orientation: Blancs en bas (toujours)
- Bordure violette subtile autour du board
- **Pièces NON déplaçables** (curseur normal, pas de main)

✅ **Game Status:**
- "Au tour des Blancs" ou "Au tour des Noirs"
- Statut de la partie
- Chip coloré

✅ **Historique des coups:**
- Liste de tous les coups déjà joués
- Format: `1. e2-e4  e7-e5`

✅ **Bouton "Quitter le mode spectateur"** (en bas)

---

### Étape 5: Observer les Coups en Temps Réel

**Dans le navigateur 1 (Joueur Blanc):**
1. Jouez un coup (ex: `e2` → `e4`)

**Dans le navigateur 3 (Spectateur):**

**Résultats attendus:**
- ✅ Le coup s'affiche **instantanément** sur l'échiquier
- ✅ L'historique se met à jour: `1. e2-e4`
- ✅ Le statut change: "Au tour des Noirs"
- ✅ **Vous n'avez rien cliqué!** Tout est automatique

**Dans le navigateur 2 (Joueur Noir):**
1. Jouez un coup de réponse (ex: `e7` → `e5`)

**Dans le navigateur 3 (Spectateur):**
- ✅ Le coup du Noir apparaît aussi automatiquement
- ✅ Historique: `1. e2-e4  e7-e5`
- ✅ Statut: "Au tour des Blancs"

### Étape 6: Tester l'Impossibilité de Jouer

**Dans le navigateur 3 (Spectateur):**

1. **Essayez de cliquer** sur une pièce
   - ✅ Curseur normal (pas de main)
   - ✅ Rien ne se passe

2. **Essayez de glisser-déposer** une pièce
   - ✅ Impossible (draggable = false)
   - ✅ Aucune action

3. **Vérifiez la console** (F12)
   - ✅ Aucun message d'erreur
   - ✅ Messages `[Spectate]` visibles

---

### Étape 7: Observer les Événements de Connexion

**Dans le navigateur 1 ou 2 (un des joueurs):**
1. **Fermez l'onglet** (simuler une déconnexion)

**Dans le navigateur 3 (Spectateur):**

**Résultats attendus:**
- ✅ Après 2-3 secondes
- ✅ Indicateur du joueur passe à "Déconnecté"
- ✅ Icône: `signal_wifi_off`
- ✅ Chip rouge ou grisé

**Rouvrez l'onglet du joueur:**
1. Reconnectez-vous
2. Retournez sur `/game/{gameId}`

**Dans le navigateur 3 (Spectateur):**
- ✅ Indicateur repasse à "En ligne"
- ✅ Icône: `signal_wifi_4_bar`

---

### Étape 8: Multi-Spectateurs

**Testez avec plusieurs spectateurs:**

1. **Ouvrez un 4ème navigateur**
2. Connectez-vous avec `spectateur2@test.com`
3. Allez sur `/game/{gameId}/spectate`

**Résultat:**
- ✅ Les 2 spectateurs voient la même partie
- ✅ Les coups s'affichent sur les 2 en même temps
- ✅ Aucune interférence entre spectateurs

---

### Étape 9: Quitter le Mode Spectateur

**Dans le navigateur 3 (Spectateur):**

1. Cliquez sur **"Quitter le mode spectateur"**

**Résultats attendus:**
- ✅ Redirection vers `/dashboard`
- ✅ WebSocket fermé proprement
- ✅ Pas d'erreur dans la console

**Vérification:**
- Les joueurs continuent leur partie normalement
- Le spectateur peut se reconnecter à tout moment

---

## 🔍 Vérifications Console (F12)

### Messages Attendus

Lors de la connexion au mode spectateur:
```
[Spectate] Connecting to game: 01JDABCD1234EFGH5678IJKLMN
[Spectate] Connecting to spectate WebSocket: ws://localhost:8080/ws/game/.../spectate
[Spectate] Game state sync received: {...}
```

Lors de la réception d'un coup:
```
[Spectate] Move executed: {move: {...}, newPositionFen: "...", ...}
```

Lors de la déconnexion d'un joueur:
```
[Spectate] Player disconnected: 01JDPLAYER123...
```

### Erreurs Potentielles

❌ **WebSocket connection failed**
- Vérifiez que le backend est démarré
- Vérifiez que l'endpoint `/ws/game/{gameId}/spectate` existe

❌ **Cannot connect: No token found**
- Déconnectez-vous et reconnectez-vous
- Vérifiez que le JWT est bien stocké

❌ **Game not found**
- Vérifiez que le Game ID est correct
- Vérifiez que la partie existe toujours

---

## ✅ Checklist de Test

### Interface
- [ ] Badge "Mode Spectateur" visible
- [ ] Informations des 2 joueurs affichées
- [ ] Échiquier affiché avec position actuelle
- [ ] Bordure violette autour de l'échiquier
- [ ] Historique des coups visible
- [ ] Game status affiché
- [ ] Bouton "Quitter" visible

### Fonctionnalités
- [ ] Coups des Blancs s'affichent en temps réel
- [ ] Coups des Noirs s'affichent en temps réel
- [ ] Historique se met à jour automatiquement
- [ ] Statut de tour se met à jour
- [ ] Impossible de déplacer les pièces
- [ ] Aucun curseur "grab" sur les pièces

### Événements
- [ ] Déconnexion d'un joueur détectée
- [ ] Reconnexion d'un joueur détectée
- [ ] Fin de partie affichée (si applicable)
- [ ] Multi-spectateurs fonctionne

### Navigation
- [ ] Connexion au mode spectateur réussie
- [ ] Bouton "Quitter" fonctionne
- [ ] Retour au Dashboard
- [ ] Reconnexion possible

---

## 🎯 Cas de Test Avancés

### Test 1: Spectateur Avant les Joueurs

1. Connectez un spectateur à une partie
2. Les joueurs se connectent après
3. Vérifiez que le spectateur reçoit `GameStateSync`

### Test 2: Partie Terminée

1. Observez une partie jusqu'à l'échec et mat
2. Vérifiez que le statut "Échec et mat" s'affiche
3. Message "Partie terminée" visible
4. Coups toujours verrouillés

### Test 3: Rafraîchissement

1. En mode spectateur, appuyez sur **F5**
2. Vérifiez que:
   - La connexion est rétablie
   - L'état est re-synchronisé
   - Aucune perte de données

### Test 4: Latence

1. Activez le throttling réseau (DevTools → Network → Slow 3G)
2. Observez les coups avec latence
3. Vérifiez qu'aucun coup n'est perdu

---

## 🐛 Résolution de Problèmes

### Le spectateur ne voit pas les coups

**Solutions:**
1. Vérifiez la console (F12) pour les erreurs WebSocket
2. Vérifiez que le backend broadcast les messages aux spectateurs
3. Rafraîchissez la page (F5)

### "Cannot connect: No token found"

**Solutions:**
1. Déconnectez-vous
2. Reconnectez-vous
3. Le JWT sera régénéré

### L'échiquier ne s'affiche pas

**Solutions:**
1. Vérifiez que le Game ID est correct
2. Vérifiez que la partie existe (les joueurs sont connectés)
3. Regardez les logs backend

### Les pièces sont déplaçables

**Problème:** Le spectateur peut bouger les pièces (BUG!)

**Vérification:**
1. Inspectez l'élément `<app-chess-board>`
2. Vérifiez l'attribut `[draggable]="false"`
3. Si true, c'est un bug dans le template

---

## 📊 Différences Visuelles

### GameBoard vs Spectate

| Élément | GameBoard | Spectate |
|---------|-----------|----------|
| Badge | Aucun | "Mode Spectateur" |
| Orientation | Selon couleur | Toujours Blancs |
| Draggable | Selon tour | Toujours false |
| Bordure | Standard | Violette |
| Bouton | "Quitter la partie" | "Quitter le mode spectateur" |
| Indicateur tour | "C'est votre tour!" | "Au tour des..." |

---

## 🎉 Félicitations!

Si tous les tests passent, le **Mode Spectateur est 100% fonctionnel**!

**Ce que vous pouvez faire maintenant:**
- Observer des parties en cours
- Suivre plusieurs parties simultanément
- Apprendre en regardant des joueurs expérimentés
- Analyser des stratégies

**Prochaines phases:**
- Phase 8: Dashboard complet (historique, profil)
- Phase 9: Améliorations UX (animations, sons)
- Phase 10: Tests et polish final

---

**Bon spectating!** 🎥♟️
