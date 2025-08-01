# Guide de Configuration des IA - DocuSense AI

## Vue d'ensemble

Le système de configuration des IA de DocuSense AI permet de gérer plusieurs providers d'intelligence artificielle de manière centralisée et intelligente. L'utilisateur peut configurer ses clés API, tester leur validité, définir des priorités et choisir des stratégies de sélection.

## Fonctionnalités principales

### 🔑 Validation des clés API
- **Validation en temps réel** : Les clés API sont validées automatiquement lors de la saisie
- **Validation par format** : Chaque provider a ses propres règles de validation
- **Test de connexion** : Possibilité de tester la connectivité avec chaque provider
- **Indicateurs visuels** : Statuts clairs (valide, invalide, en cours de test, non configuré)

### 🎯 Gestion des priorités
- **Priorités uniques** : Chaque provider actif a une priorité unique (1, 2, 3...)
- **Activation conditionnelle** : Seuls les providers avec des clés valides peuvent être activés
- **Ajustement automatique** : Les priorités sont automatiquement ajustées lors de l'activation/désactivation
- **Validation automatique** : Le système peut corriger automatiquement les conflits de priorités

### 📊 Stratégies de sélection
- **Priority** : Utilise les providers dans l'ordre de priorité défini
- **Cost** : Sélectionne le provider avec le coût le plus bas
- **Performance** : Sélectionne le provider avec les meilleures performances
- **Fallback** : Utilise le provider principal avec repli automatique
- **Quality** : Sélectionne le provider avec la meilleure qualité de réponse
- **Speed** : Sélectionne le provider le plus rapide

## Providers supportés

### 🤖 OpenAI
- **Format de clé** : `sk-` suivi d'au moins 20 caractères
- **Modèles par défaut** : gpt-4, gpt-3.5-turbo, gpt-4o
- **Modèle par défaut** : gpt-3.5-turbo

### 🧠 Claude (Anthropic)
- **Format de clé** : `sk-ant-` suivi d'au moins 20 caractères
- **Modèles par défaut** : claude-3-opus, claude-3-sonnet, claude-3-haiku
- **Modèle par défaut** : claude-3-sonnet

### 🌪️ Mistral
- **Format de clé** : `mistral-` suivi d'au moins 20 caractères
- **Modèles par défaut** : mistral-large, mistral-medium, mistral-small
- **Modèle par défaut** : mistral-medium

### 🐳 Ollama
- **Format de clé** : Flexible (peut être vide ou personnalisée)
- **Modèles par défaut** : llama2, mistral, codellama, phi
- **Modèle par défaut** : llama2

## Interface utilisateur

### Onglet "Providers"
- **Liste des providers** : Affichage de tous les providers disponibles
- **Statuts visuels** : Icônes colorées pour indiquer l'état de chaque provider
- **Champs de clés API** : Saisie sécurisée des clés avec validation en temps réel
- **Boutons de test** : Test de connectivité pour chaque provider
- **Gestion des priorités** : Sélection de la priorité pour chaque provider actif
- **Messages d'erreur** : Affichage clair des erreurs de validation

### Onglet "Stratégie"
- **Sélection de stratégie** : Choix de la méthode de sélection des providers
- **Description** : Explication de chaque stratégie
- **État des providers** : Résumé du nombre de providers valides et actifs

### Onglet "Métriques"
- **Statistiques d'utilisation** : Nombre de requêtes, taux de succès
- **Coûts estimés** : Coût total et coût moyen par requête

## Architecture technique

### Frontend
- **Hook personnalisé** : `useAIConfig` pour la gestion centralisée de l'état
- **Service de configuration** : `ConfigService` pour les appels API
- **Validation côté client** : Validation immédiate des formats de clés
- **Gestion d'état réactive** : Mise à jour automatique de l'interface

### Backend
- **Service de configuration** : `ConfigService` pour la gestion des données
- **Service IA** : `AIService` pour les tests de connectivité
- **API REST** : Endpoints pour toutes les opérations de configuration
- **Validation côté serveur** : Tests réels de connectivité avec les providers

## Workflow de configuration

1. **Saisie de clé API**
   - L'utilisateur saisit une clé API
   - Validation immédiate du format
   - Affichage des erreurs si nécessaire

2. **Test de connectivité**
   - L'utilisateur clique sur le bouton de test
   - Le système teste la connexion avec le provider
   - Mise à jour du statut selon le résultat

3. **Activation du provider**
   - Seuls les providers avec des clés valides peuvent être activés
   - Attribution automatique d'une priorité
   - Mise à jour de l'interface

4. **Configuration des priorités**
   - L'utilisateur peut ajuster les priorités
   - Validation automatique des conflits
   - Correction automatique si nécessaire

5. **Sélection de stratégie**
   - Choix de la méthode de sélection
   - Application immédiate de la stratégie
   - Mise à jour des métriques

## Gestion des erreurs

### Erreurs de validation
- **Format invalide** : Messages d'erreur spécifiques par provider
- **Clé trop courte** : Indication de la longueur minimale requise
- **Préfixe incorrect** : Indication du préfixe attendu

### Erreurs de connexion
- **Timeout** : Gestion des timeouts de connexion
- **Clé invalide** : Messages d'erreur clairs
- **Problèmes réseau** : Gestion des erreurs réseau

### Erreurs de priorité
- **Conflits** : Détection et correction automatique
- **Priorités dupliquées** : Validation et correction
- **Priorités manquantes** : Attribution automatique

## Sécurité

### Chiffrement des clés
- **Stockage sécurisé** : Chiffrement des clés API en base de données
- **Transmission sécurisée** : Utilisation de HTTPS pour toutes les communications
- **Validation côté serveur** : Double validation des clés

### Gestion des sessions
- **Authentification** : Vérification de l'authentification utilisateur
- **Autorisation** : Contrôle d'accès aux configurations
- **Audit** : Logs des modifications de configuration

## Monitoring et métriques

### Métriques collectées
- **Nombre de requêtes** : Total et par provider
- **Taux de succès** : Pourcentage de requêtes réussies
- **Coûts** : Estimation des coûts par provider
- **Performance** : Temps de réponse et latence

### Alertes
- **Providers défaillants** : Notification des problèmes de connectivité
- **Clés expirées** : Détection des clés API expirées
- **Quotas dépassés** : Surveillance des limites d'utilisation

## Bonnes pratiques

### Configuration
1. **Commencez par un provider** : Configurez et testez un provider à la fois
2. **Utilisez des clés de test** : Testez d'abord avec des clés de développement
3. **Vérifiez les quotas** : Surveillez les limites d'utilisation
4. **Sauvegardez les configurations** : Exportez régulièrement vos configurations

### Maintenance
1. **Testez régulièrement** : Vérifiez périodiquement la connectivité
2. **Mettez à jour les clés** : Renouvelez les clés API expirées
3. **Surveillez les coûts** : Contrôlez régulièrement les dépenses
4. **Optimisez les priorités** : Ajustez selon les performances

## Dépannage

### Problèmes courants

#### Clé API rejetée
- Vérifiez le format de la clé
- Assurez-vous que la clé est active
- Vérifiez les quotas d'utilisation

#### Connexion échouée
- Vérifiez votre connexion internet
- Testez l'URL de l'API
- Vérifiez les paramètres de proxy

#### Priorités en conflit
- Utilisez la fonction de validation automatique
- Vérifiez qu'il n'y a pas de doublons
- Réinitialisez les priorités si nécessaire

### Logs et debugging
- **Logs frontend** : Console du navigateur pour les erreurs client
- **Logs backend** : Fichiers de logs pour les erreurs serveur
- **API responses** : Réponses détaillées des endpoints

## Évolutions futures

### Fonctionnalités prévues
- **Support de nouveaux providers** : Intégration de nouveaux services IA
- **Gestion des modèles** : Configuration des modèles par provider
- **Analytics avancés** : Métriques détaillées et graphiques
- **Notifications** : Alertes en temps réel

### Améliorations techniques
- **Cache intelligent** : Mise en cache des résultats de tests
- **Tests automatisés** : Validation périodique automatique
- **API GraphQL** : Alternative à l'API REST
- **Webhooks** : Notifications d'événements

---

*Ce guide est maintenu à jour avec les dernières fonctionnalités du système de configuration des IA.* 