# 🧪 Guide de Test - gChess Frontend

## Prérequis

### 1. Backend en cours d'exécution
Le backend Kotlin doit être démarré sur `http://localhost:8080`

Vérifiez que les endpoints sont accessibles:
```bash
# Test de l'API REST
curl http://localhost:8080/api/auth/register

# Devrait retourner une erreur 400 ou similaire (normal sans données)
```

### 2. Frontend démarré
```bash
npm start
# Ou si le port 4200 est occupé:
npm start -- --port 4201
```

L'application sera accessible sur: `http://localhost:4200`

---

## 📋 Scénario de Test Complet

### Étape 1: Inscription d'un utilisateur

1. Ouvrez votre navigateur sur `http://localhost:4200`
2. Vous serez redirigé vers `/auth/login`
3. Cliquez sur **"S'inscrire"** (ou naviguez vers `/auth/register`)
4. Remplissez le formulaire:
   - **Username**: `joueur1`
   - **Email**: `joueur1@test.com`
   - **Password**: `Password123!`
5. Cliquez sur **"S'inscrire"**

**Résultat attendu:**
- ✅ Redirection vers `/dashboard`
- ✅ Affichage du message de bienvenue avec votre username
- ✅ Bouton "Trouver une partie" visible

---

### Étape 2: Tester le Dashboard

Sur la page Dashboard, vous devriez voir:

- ✅ **Carte de bienvenue** avec:
  - Nom d'utilisateur: `joueur1`
  - Email: `joueur1@test.com`
- ✅ **Carte "Jouer une partie"** avec bouton principal
- ✅ **Carte "Comment jouer"** avec instructions
- ✅ **Bouton Déconnexion** en bas

---

### Étape 3: Lancer le Matchmaking

1. Sur le Dashboard, cliquez sur **"Trouver une partie"**
2. Vous êtes redirigé vers `/matchmaking`

**Ce que vous devriez voir:**
- ✅ Indicateur de connexion WebSocket
- ✅ Message "Connexion au serveur..."
- ✅ Puis "Connecté au serveur de matchmaking"
- ✅ Bouton **"Rejoindre la file d'attente"**

3. Cliquez sur **"Rejoindre la file d'attente"**

**Résultat attendu:**
- ✅ Spinner de chargement
- ✅ Message "En attente d'un adversaire..."
- ✅ Position dans la file: `Position: 1`
- ✅ Bouton "Quitter la file" visible

---

### Étape 4: Créer un 2ème joueur (nouvel onglet/fenêtre)

Pour tester une vraie partie, il faut 2 joueurs:

1. **Ouvrez une fenêtre de navigation privée** (ou un autre navigateur)
2. Allez sur `http://localhost:4200`
3. Inscrivez un 2ème utilisateur:
   - **Username**: `joueur2`
   - **Email**: `joueur2@test.com`
   - **Password**: `Password123!`
4. Cliquez sur **"Trouver une partie"**
5. Cliquez sur **"Rejoindre la file d'attente"**

**Résultat attendu:**
- ✅ Match trouvé! Les deux joueurs sont redirigés vers la partie
- ✅ URL: `/game/{gameId}` (avec un ID unique)

---

### Étape 5: Tester la Partie d'Échecs

#### Interface de jeu

Vous devriez voir:

**Layout à 3 colonnes:**

```
┌────────────────────────────────────┐
│  Adversaire Info (Nom + Couleur)   │
├──────────┬──────────┬──────────────┤
│  Game    │  Chess   │  Move        │
│  Status  │  Board   │  History     │
├──────────┴──────────┴──────────────┤
│  Mon Info (Nom + Couleur)          │
├────────────────────────────────────┤
│  Bouton "Quitter la partie"        │
└────────────────────────────────────┘
```

**Composants visibles:**

1. **PlayerInfoComponent (Adversaire):**
   - ✅ Couleur de l'adversaire (Blancs ou Noirs)
   - ✅ Statut: "En ligne"
   - ✅ ID du joueur

2. **GameStatusComponent:**
   - ✅ "Au tour des Blancs" (au début)
   - ✅ Chip coloré: "C'est votre tour!" ou "Tour de l'adversaire"

3. **ChessBoardComponent:**
   - ✅ Échiquier 8x8 avec pièces en position initiale
   - ✅ Orientation correcte (Blancs en bas pour le joueur blanc)
   - ✅ Pièces déplaçables UNIQUEMENT si c'est votre tour

4. **MoveHistoryComponent:**
   - ✅ "Historique des coups"
   - ✅ "Aucun coup joué" au début

5. **PlayerInfoComponent (Moi):**
   - ✅ Votre couleur
   - ✅ Statut: "En ligne"
   - ✅ Indicateur de tour actif

---

### Étape 6: Jouer des Coups

#### Joueur avec les Blancs (commence):

1. **Glissez-déposez** un pion blanc (par exemple `e2` → `e4`)
2. Attendez 1-2 secondes

**Résultat attendu:**
- ✅ Le coup s'affiche sur l'échiquier
- ✅ L'historique se met à jour: `1. e2-e4`
- ✅ Le statut change: "Au tour des Noirs"
- ✅ Les pièces blanches ne sont plus déplaçables
- ✅ **Sur l'autre navigateur:** Le coup apparaît automatiquement!

#### Joueur avec les Noirs (répond):

1. Dans l'autre navigateur/onglet
2. **Glissez-déposez** un pion noir (par exemple `e7` → `e5`)

**Résultat attendu:**
- ✅ Le coup s'affiche
- ✅ L'historique: `1. e2-e4  e7-e5`
- ✅ Le statut: "Au tour des Blancs"
- ✅ **Sur le premier navigateur:** Le coup du noir apparaît!

#### Continuez à jouer quelques coups

Testez différents scénarios:
- Coups normaux (pions, cavaliers, etc.)
- Tentative de coup invalide → Message d'erreur
- Tentative de jouer hors tour → Message "Ce n'est pas votre tour!"

---

### Étape 7: Tester la Promotion du Pion

1. Jouez une partie jusqu'à ce qu'un pion atteigne la dernière rangée
   - Pour tester rapidement, vous pouvez jouer: `e2-e4, e7-e5, d2-d4, d7-d6, ...`
   - Ou utilisez la console dev pour modifier le FEN si besoin

2. Quand un pion atteint la 8ème rangée (Blancs) ou 1ère rangée (Noirs):

**Résultat attendu:**
- ✅ **Dialog de promotion s'ouvre automatiquement**
- ✅ 4 boutons: Dame, Tour, Fou, Cavalier
- ✅ Sélection d'une pièce
- ✅ Le coup est envoyé avec la promotion
- ✅ L'historique affiche: `e7-e8=D` (par exemple)
- ✅ La pièce promue apparaît sur l'échiquier

---

### Étape 8: Tester la Déconnexion/Reconnexion

#### Test de déconnexion d'un joueur:

1. **Fermez l'onglet** du joueur 2 (ou fermez le navigateur privé)
2. **Sur l'onglet du joueur 1:**

**Résultat attendu:**
- ✅ Après 2-3 secondes
- ✅ L'indicateur de l'adversaire change:
  - Icône: `signal_wifi_off`
  - Statut: "Déconnecté"
  - Chip rouge ou grisé

#### Test de reconnexion:

1. **Rouvrez le navigateur/onglet** du joueur 2
2. Reconnectez-vous et accédez à la même partie
   - URL: `/game/{gameId}` (même ID qu'avant)

**Résultat attendu:**
- ✅ Le joueur se reconnecte à la partie
- ✅ L'état de la partie est synchronisé (FEN, historique)
- ✅ Sur le joueur 1: Indicateur passe à "En ligne"

---

### Étape 9: Tester les Fins de Partie

#### Échec et Mat:

Jouez jusqu'à obtenir un échec et mat (par exemple le "Coup du Berger"):
- `e2-e4 e7-e5`
- `Fb1-c4 Fb8-c5`
- `Dd1-h5 Cg8-f6`
- `Dh5xf7#`

**Résultat attendu:**
- ✅ GameStatus affiche: "Échec et mat ! Blancs gagnent"
- ✅ Chip rouge avec icône trophée
- ✅ Message "Partie terminée"
- ✅ Plus de coups possibles

#### Pat, Nulle:

Testez également les autres fins de partie si possible.

---

### Étape 10: Quitter la Partie

1. Cliquez sur **"Quitter la partie"**
2. Confirmez dans le popup

**Résultat attendu:**
- ✅ Redirection vers `/dashboard`
- ✅ Déconnexion WebSocket propre

---

## 🐛 Vérifications de Debug

### Console Développeur (F12)

Pendant les tests, surveillez la console pour:

**Messages attendus:**
```
Connecting to game WebSocket: ws://localhost:8080/ws/game/{gameId}
Game state sync received: {...}
Move executed: {...}
Player disconnected: ...
Player reconnected: ...
```

**Erreurs à surveiller:**
- ❌ `WebSocket connection failed`
  → Vérifiez que le backend est démarré
- ❌ `Cannot connect to game: No token found`
  → Problème d'authentification
- ❌ `Move rejected: ...`
  → Coup invalide (normal si vous testez)

---

## 🔧 Résolution de Problèmes

### Le backend ne répond pas

```bash
# Vérifiez que le backend est en cours d'exécution
curl http://localhost:8080/api/auth/login
```

### Le WebSocket ne se connecte pas

1. Vérifiez les logs du backend
2. Vérifiez que le port WebSocket est correct (`8080`)
3. Inspectez Network → WS dans les DevTools

### Les coups ne s'affichent pas

1. Ouvrez la console (F12)
2. Vérifiez les messages `MoveExecuted`
3. Vérifiez que `gameState()` est mis à jour

### L'historique ne se met pas à jour

Vérifiez que:
- Le `GameService` reçoit bien les messages
- Le signal `gameState.moveHistory` est mis à jour
- Le composant `MoveHistoryComponent` reçoit bien l'input

---

## ✅ Checklist de Test

### Fonctionnalités de Base
- [ ] Inscription d'un utilisateur
- [ ] Connexion d'un utilisateur
- [ ] Affichage du Dashboard
- [ ] Navigation vers Matchmaking
- [ ] Connexion WebSocket matchmaking

### Matchmaking
- [ ] Rejoindre la file d'attente
- [ ] Affichage position dans la file
- [ ] Match trouvé (avec 2 joueurs)
- [ ] Navigation automatique vers la partie

### Partie d'Échecs
- [ ] Affichage de l'échiquier
- [ ] Orientation correcte (Blancs en bas pour blanc)
- [ ] Pièces en position initiale
- [ ] Informations des 2 joueurs affichées
- [ ] Indicateur de tour correct

### Mouvements
- [ ] Glisser-déposer fonctionne
- [ ] Coup envoyé au serveur
- [ ] Coup affiché sur les 2 clients
- [ ] Historique mis à jour
- [ ] Tentative de coup invalide → Erreur
- [ ] Tentative hors tour → Erreur

### Promotion
- [ ] Dialog s'ouvre automatiquement
- [ ] Sélection de pièce fonctionne
- [ ] Promotion envoyée au serveur
- [ ] Historique affiche la promotion (e7-e8=D)

### Connexion/Déconnexion
- [ ] Déconnexion d'un joueur détectée
- [ ] Indicateur "Déconnecté" affiché
- [ ] Reconnexion fonctionne
- [ ] État de la partie synchronisé

### Fin de Partie
- [ ] Échec et mat détecté
- [ ] Message de victoire affiché
- [ ] Plus de mouvements possibles

### Navigation
- [ ] Bouton "Quitter la partie" fonctionne
- [ ] Retour au Dashboard
- [ ] Déconnexion propre

---

## 🎯 Tests Avancés

### Test avec 3+ onglets
- 2 joueurs en partie
- 1 spectateur (si implémenté)

### Test de Latence
- Ajoutez un délai réseau (DevTools → Network → Throttling)
- Vérifiez que les coups sont bien synchronisés

### Test de Reconnexion Rapide
- Rafraîchissez la page (F5) pendant une partie
- Vérifiez que l'état est restauré

---

## 📊 Métriques de Performance

Vérifiez dans les DevTools:

- **Bundle size:** ~90 kB pour game-board-component (lazy loaded)
- **Time to Interactive:** < 3 secondes
- **WebSocket messages:** < 100ms de latence

---

## 🎉 Félicitations!

Si tous les tests passent, la Phase 6 est **100% fonctionnelle** et prête pour une démonstration ou une utilisation réelle!

**Prochaines étapes:**
- Phase 7: Mode Spectateur
- Phase 8: Dashboard complet (historique, stats, etc.)
- Phase 9: Améliorations UX
- Phase 10: Tests automatisés et polish final
