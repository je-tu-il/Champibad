# 🏸 Champibad — Plateforme Interne de Compétition (Club Champipaf)

Application mobile officielle de compétition interne et de classement Elo pour le club de badminton **Champipaf** à **Champigneulles**.

Conçue avec **React Native / Expo SDK** (TypeScript) et **Firebase**, optimisée pour iPhone et Samsung / Android avec compilation automatisée via GitHub Actions.

---

## 🌟 Fonctionnalités Clés

### 1. 🔐 Authentification & Onboarding des Licenciés
* **Vérification FFBaD** : Seuls les adhérents figurant dans la liste officielle de Champipaf peuvent créer un compte (vérification Nom, Prénom, Numéro de licence).
* **Synchronisation API** : Actualisation en arrière-plan toutes les heures avec possibilité de forcer la synchro depuis le panel admin.
* **Super-Admin** : Réservé et configuré pour `reymond_aurelien@yahoo.fr`.

### 2. 🏆 Système d'Elo & Classements
* **Deux classements indépendants** :
  * 🏸 **Simple (1 contre 1)**
  * 👥 **Double (2 contre 2 / Équipes)**
* **Facteur $K$ Dynamique** : Gain d'Elo accru lors d'une victoire contre un joueur beaucoup mieux classé.
* **Snapshots Quotidiens** : Calcul en temps réel de l'Elo à chaque match + snapshot quotidien pour afficher les montées / descentes de places ($\pm$).

### 3. ⚖️ Matchs, Défis & Mode Handicap
* **Saisie & Validation de score** : Le joueur saisit les scores des sets $\rightarrow$ l'adversaire valide ou conteste sur son téléphone.
* **Régulation des écarts de niveau** (paramétrable par l'admin) :
  * **Handicap de points** (ex: $-10$ points de départ pour le favori ou avance pour le challenger).
  * **Handicap de terrain** (ex: jouer "Sans les couloirs").

### 4. 🕒 Créneaux de Badminton & Règle d'Affluence
* **Créneaux officiels du club à Champigneulles** (Mardi 18h-20h30, Jeudi 20h-22h, Samedi 10h-12h30).
* **Gestion des fortes affluences** : Restriction horaire intelligente (ex: séance du Jeudi 20h-22h avec défis autorisés uniquement après 21h00 pour libérer les terrains aux heures de pointe).
* **Disponibilités croisées** : Gestion des dispos récurrentes et absences ponctuelles avec proposition automatique de créneaux communs.

### 5. 💰 Mode Cashprize & Financement Google Ads
* **Cagnotte de saison** : Cotisation demandée de $X$ € (paramétrable par l'admin).
* **Validation physique** : L'administrateur valide manuellement les cotisations reçues en liquide lors des séances physiques.
* **3 Récompenses de fin de saison** :
  * 👑 **Le Plus Fort** (50% de la cagnotte) — N°1 au classement Elo.
  * 🔥 **Le Plus Assidu** (25% de la cagnotte) — Joueur avec le plus de matchs joués.
  * 🛡️ **Le Plus Résilient** (25% de la cagnotte) — Record de matchs remportés en 3 sets.
* **Financement Google Ads (5 secondes)** : Visionnage solidaire de 5s qui ajoute $+0.05$ € directement à la cagnotte des vainqueurs.

### 6. 🔒 Messagerie Chiffrée (E2EE - Vie Privée First)
* **Chiffrement de bout en bout (AES-256)** : Les messages sont chiffrés sur le terminal avant envoi dans Firestore.
* Fonctions sociales : Ajout d'amis, liste d'amis et blocage d'utilisateurs.

### 7. 🛡️ Panel Super-Admin
* Contrôle des saisons (1 à 2 saisons / an avec archivage).
* Gestion des paramètres de match, seuils d'écart d'Elo et handicaps.
* Déblocage physique des participants au Cashprize.
* Synchronisation API des licenciés.

---

## 🚀 Démarrage Rapide

### Prérequis
* Node.js $\ge 20$
* npm

### Installation
```bash
npm install
```

### Lancement en développement
```bash
npx expo start
```
* Appuyez sur `a` pour tester sur émulateur Android ou appareil connecté en USB.
* Appuyez sur `i` pour lancer sur simulateur iOS (Mac).
* Scannez le QR Code avec **Expo Go** pour tester directement sur votre smartphone.

---

## 📦 Compilation Automatisée (GitHub Actions)

Le workflow [`.github/workflows/production.yaml`](.github/workflows/production.yaml) est configuré pour compiler automatiquement les binaires à chaque push sur `main` :

1. **Android APK (`champibad-android-debug-apk`)** :
   * Génération d'un fichier `.apk` autonome.
   * Directement installable sur n'importe quel smartphone Samsung / Android sans compte Google Play Console.
2. **iOS IPA (`champibad-ios-unsigned-ipa`)** :
   * Génération d'une archive `.ipa` non signée.
   * Prête pour le sideloading direct sur iPhone via **Sideloadly**, **AltStore** ou **TrollStore**.

Pour télécharger vos fichiers de test :
Rendez-vous dans l'onglet **Actions** de votre dépôt GitHub $\rightarrow$ sélectionnez le dernier run $\rightarrow$ téléchargez les artefacts dans la section **Artifacts**.
