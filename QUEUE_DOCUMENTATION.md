# 📋 Documentation Complète - Onglet Queue

## 🎯 Vue d'ensemble

L'onglet **Queue** est le centre de contrôle des analyses IA dans DocuSense AI. Il permet de gérer, surveiller et contrôler toutes les analyses en cours, en attente ou terminées.

---

## 🏗️ Architecture et Composants

### **Composant Principal**
- **Fichier** : `frontend/src/components/Queue/QueuePanel.tsx`
- **Store** : `frontend/src/stores/queueStore.ts`
- **Service** : `frontend/src/services/queueService.ts`

### **Structure des Données**
```typescript
interface QueueItem {
  id: number;
  analysis_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  current_step?: string;
  total_steps: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  // Informations sur l'analyse
  analysis_type?: string;
  analysis_provider?: string;
  analysis_model?: string;
  file_info?: {
    id: number;
    name: string;
    size: number;
    mime_type: string;
  };
}
```

---

## 🔄 Système de Statuts

### **Statuts Disponibles**

| Statut | Icône | Couleur | Description | Actions Disponibles |
|--------|-------|---------|-------------|-------------------|
| **pending** | ⏰ | Jaune | En attente de lancement | Lancer, Changer prompt/IA |
| **processing** | 🔄 | Bleu | En cours d'analyse | Pause, Surveiller |
| **completed** | ✅ | Vert | Analyse terminée | Voir résultats, Relancer |
| **failed** | ❌ | Rouge | Analyse échouée | Relancer, Voir erreur |
| **paused** | ⏸️ | Jaune | Mise en pause | Reprendre |
| **cancelled** | 🚫 | Gris | Annulée | Relancer |

### **Gestion des Statuts**
- **Mise à jour automatique** toutes les 15 secondes
- **Événements temps réel** via `window.addEventListener('reloadQueue')`
- **Optimistic updates** pour une interface réactive

---

## 🎛️ Menus Déroulants et Sélecteurs

### **1. Sélecteur de Prompts**

#### **Types de Prompts Supportés**
```typescript
const ALL_PROMPT_TYPES = [
  'general',        // 📄 Général
  'summary',        // 📋 Résumé
  'extraction',     // 🔍 Extraction
  'classification', // 🏷️ Classification
  'ocr',           // 👁️ OCR
  'juridical',     // ⚖️ Juridique
  'technical',     // 🔧 Technique
  'administrative', // 📋 Administratif
  'comparison',    // ⚖️ Comparaison
];
```

#### **Fonctionnalités**
- **Sélection par type de fichier** : Automatique selon le MIME type
- **Prompts prédéfinis** : Chargés depuis `backend/app/data/prompts.json`
- **Changement en temps réel** : Mise à jour immédiate de l'analyse
- **Validation** : Vérification de la compatibilité prompt/fichier

#### **Logique de Sélection Automatique**
```typescript
const getDefaultPromptForFile = (file: any, allPrompts: any[]) => {
  const mimeType = file.mime_type.toLowerCase();
  
  // Emails
  if (mimeType.includes('message/rfc822')) {
    return allPrompts.find(p => p.id === 'email_analysis');
  }
  
  // Documents juridiques
  if (mimeType.includes('pdf') || mimeType.includes('word')) {
    return allPrompts.find(p => p.id === 'construction_litigation_analysis');
  }
  
  // Images
  if (mimeType.includes('image/')) {
    return allPrompts.find(p => p.id === 'construction_photo_analysis');
  }
  
  return allPrompts.find(p => p.id === 'general_summary');
};
```

### **2. Sélecteur d'IA (Providers)**

#### **Providers Supportés**
```json
{
  "openai": {
    "name": "openai",
    "priority": 1,
    "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"],
    "default_model": "gpt-4"
  },
  "claude": {
    "name": "claude", 
    "priority": 2,
    "models": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    "default_model": "claude-3-sonnet-20240229"
  },
  "mistral": {
    "name": "mistral",
    "priority": 3,
    "models": ["mistral-large-latest", "mistral-medium-latest"],
    "default_model": "mistral-large-latest"
  },
  "ollama": {
    "name": "ollama",
    "priority": 4,
    "models": ["llama2", "codellama", "mistral"],
    "default_model": "llama2",
    "is_local": true
  }
}
```

#### **Système de Priorité**
- **Priorité 1** : OpenAI (🥇 Prioritaire)
- **Priorité 2** : Claude (🥈 Secondaire)
- **Priorité 3** : Mistral (🥉 Tertiaire)
- **Priorité 4** : Ollama (🔹 Local)

#### **Sélection Intelligente**
```typescript
const selectBestProvider = () => {
  // 1. Vérifier les providers fonctionnels
  const functionalProviders = availableProviders.filter(p => 
    p.is_functional && p.has_api_key
  );
  
  // 2. Trier par priorité
  const sortedProviders = functionalProviders.sort((a, b) => 
    a.priority - b.priority
  );
  
  // 3. Retourner le meilleur disponible
  return sortedProviders[0];
};
```

### **3. Sélecteur de Statut (Filtres)**

#### **Filtres Disponibles**
- **Tous les statuts** : Affiche toutes les analyses
- **En attente** : `status === 'pending'`
- **En cours** : `status === 'processing'`
- **Terminé** : `status === 'completed'`
- **Échoué** : `status === 'failed'`

#### **Fonctionnalités**
- **Filtrage en temps réel** : Mise à jour instantanée
- **Compteurs** : Affichage du nombre d'analyses par statut
- **Tri combiné** : Avec recherche et type de prompt

---

## 🎨 Interface Utilisateur

### **Organisation par Sections**

#### **1. En-tête avec Statistiques**
```typescript
const renderHeader = () => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2>Liste des Analyses IA</h2>
      <p>{analyses?.length || 0} analyse(s) trouvée(s)</p>
    </div>
    <button onClick={loadAnalyses}>
      <ArrowPathIcon className="h-5 w-5" />
    </button>
  </div>
);
```

#### **2. Barre de Filtres**
- **Recherche textuelle** : Par nom de fichier, prompt, IA
- **Filtre par statut** : Dropdown avec tous les statuts
- **Filtre par type** : Général, Résumé, Extraction, etc.

#### **3. Groupement par Type**
```typescript
const groupedItems: Record<string, QueueItem[]> = {};
ALL_PROMPT_TYPES.forEach(type => {
  groupedItems[type] = queueItems.filter(item => 
    getPromptType(item) === type
  );
});
```

### **Affichage des Éléments**

#### **Carte d'Analyse Compacte**
```typescript
const renderQueueItem = (item: QueueItem) => (
  <div className="rounded-lg p-4 border mb-3">
    {/* En-tête : Nom fichier + statut */}
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4>{item.file_info?.name}</h4>
        <div className="text-xs">
          {formatFileSize(item.file_info?.size)} • 
          {getPromptTypeName(getPromptType(item))} • 
          {formatDate(item.created_at)}
        </div>
      </div>
      <span className="px-2 py-1 rounded text-xs">
        {getStatusIcon(item.status)} {item.status}
      </span>
    </div>
    
    {/* Informations techniques */}
    <div className="flex items-center space-x-2 mb-3">
      <span>{isMultipleAI(item) ? '🔗 Multiple IA' : '🔹 IA Simple'}</span>
      {getAIProviders(item).map(provider => (
        <span key={provider}>{provider}</span>
      ))}
    </div>
    
    {/* Barre de progression */}
    {(item.status === 'processing' || item.status === 'pending') && (
      <div className="mb-3">
        <div className="flex justify-between mb-2">
          <span>{item.current_step || 'En attente...'}</span>
          <span>{item.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
    )}
    
    {/* Actions */}
    <div className="flex items-center space-x-1">
      {item.status === 'pending' && (
        <>
          <select onChange={(e) => handlePromptChange(item.id, e.target.value)}>
            <option value="general_summary">Résumé général</option>
            <option value="juridical_analysis">Analyse juridique</option>
            {/* ... autres options */}
          </select>
          <button onClick={() => handleStartAnalysis(item.id)}>
            🚀 Lancer
          </button>
        </>
      )}
      {item.status === 'completed' && (
        <button onClick={() => handleViewResults(item)}>
          <EyeIcon className="h-4 w-4" />
        </button>
      )}
      <button onClick={() => handleDeleteAnalysis(item.id)}>
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
);
```

---

## ⚡ Actions et Fonctionnalités

### **Actions Individuelles**

#### **1. Lancement d'Analyse**
```typescript
const handleStartAnalysis = async (itemId: string) => {
  try {
    // Validation préalable
    const item = queueItems.find(q => q.id === itemId);
    if (!item || item.status !== 'pending') return;
    
    // Mise à jour optimiste
    setQueueItems(prev => prev.map(q => 
      q.id === itemId ? { ...q, status: 'processing' } : q
    ));
    
    // Appel API
    const response = await fetch(`/api/analysis/${itemId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      loadQueueStatus(); // Recharger pour synchroniser
    }
  } catch (error) {
    console.error('Erreur lors du lancement:', error);
  }
};
```

#### **2. Changement de Prompt**
```typescript
const handlePromptChange = async (itemId: string, newPromptId: string) => {
  try {
    const response = await fetch(`/api/analysis/${itemId}/update-prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_id: newPromptId })
    });
    
    if (response.ok) {
      loadQueueStatus();
    }
  } catch (error) {
    console.error('Erreur lors du changement de prompt:', error);
  }
};
```

#### **3. Visualisation des Résultats**
```typescript
const handleViewResults = (item: QueueItem) => {
  if (!item.pdf_path) return;
  
  const pdfFile = {
    id: `analysis_pdf_${item.id}`,
    name: `Analyse - ${item.file_info?.name}.pdf`,
    path: `analysis_pdf_${item.id}.pdf`,
    mime_type: 'application/pdf',
    analysis_id: item.id,
    is_analysis_pdf: true,
    analysis_pdf_url: `/api/pdf/analysis/${item.id}/stream`
  };
  
  window.dispatchEvent(new CustomEvent('viewFileInMainPanel', {
    detail: { file: pdfFile, mode: 'pdf' }
  }));
};
```

### **Actions par Groupe**

#### **1. Relance par Type**
```typescript
const handleRetryType = async (type: string) => {
  const itemsOfType = queueItems.filter(item => 
    getPromptType(item) === type && item.status === 'failed'
  );
  
  for (const item of itemsOfType) {
    await handleRetryAnalysis(item.id);
  }
};
```

#### **2. Suppression par Type**
```typescript
const handleDeleteType = async (type: string) => {
  const itemsOfType = queueItems.filter(item => 
    getPromptType(item) === type
  );
  
  for (const item of itemsOfType) {
    await handleDeleteAnalysis(item.id);
  }
};
```

---

## 🔄 Gestion des États

### **Synchronisation Automatique**

#### **1. Polling Régulier**
```typescript
useEffect(() => {
  loadQueueStatus();
  const interval = setInterval(loadQueueStatus, 15000); // 15 secondes
  return () => clearInterval(interval);
}, [loadQueueStatus]);
```

#### **2. Événements Temps Réel**
```typescript
useEffect(() => {
  const handleReloadQueue = useCallback(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  window.addEventListener('reloadQueue', handleReloadQueue);
  return () => {
    window.removeEventListener('reloadQueue', handleReloadQueue);
  };
}, [loadQueueStatus]);
```

#### **3. Mise à Jour Optimiste**
```typescript
// Avant l'action
setQueueItems(prev => prev.map(item => 
  item.id === targetId ? { ...item, status: 'processing' } : item
));

// Après l'action (succès ou échec)
loadQueueStatus(); // Synchronisation avec le serveur
```

### **Gestion des Erreurs**

#### **1. Affichage des Erreurs**
```typescript
{item.error_message && (
  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
    <div className="flex items-start space-x-2">
      <span className="text-red-500">⚠️</span>
      <span className="text-sm text-red-700">{item.error_message}</span>
    </div>
  </div>
)}
```

#### **2. Retry Automatique**
```typescript
const handleRetryAnalysis = async (itemId: string) => {
  try {
    await analysisService.retryAnalysis(itemId);
    loadQueueStatus();
  } catch (error) {
    setError(`Erreur lors de la relance: ${error}`);
  }
};
```

---

## 🎯 Fonctionnalités Avancées

### **Analyses Multiples IA**

#### **Détection**
```typescript
const isMultipleAI = (item: QueueItem) => {
  const metadata = item.analysis_metadata || {};
  return metadata.is_multiple_ai === true || 
         item.analysis_type === 'multiple_ai';
};
```

#### **Affichage**
```typescript
const getAIProviders = (item: QueueItem) => {
  if (isMultipleAI(item)) {
    const providers = new Set();
    queueItems.forEach(relatedItem => {
      if (relatedItem.analysis_metadata?.multiple_ai_file_ids === 
          item.analysis_metadata?.multiple_ai_file_ids) {
        providers.add(relatedItem.provider);
      }
    });
    return Array.from(providers);
  } else {
    return [item.provider];
  }
};
```

### **Barre de Progression**

#### **Calcul du Progrès**
```typescript
const calculateProgress = (item: QueueItem) => {
  if (item.status === 'pending') return 0;
  if (item.status === 'completed') return 100;
  if (item.status === 'failed') return 0;
  
  return item.progress || 0;
};
```

#### **Affichage Dynamique**
```typescript
{(item.status === 'processing' || item.status === 'pending') && (
  <div className="mb-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs">
        {item.current_step || 'En attente...'}
      </span>
      <span className="text-xs">{item.progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${item.progress}%` }}
      />
    </div>
  </div>
)}
```

---

## 🔧 Configuration et Personnalisation

### **Types de Prompts Personnalisables**

#### **Structure des Prompts**
```json
{
  "id": "construction_litigation_analysis",
  "name": "Analyse de litige construction",
  "description": "Analyse juridique spécialisée pour les litiges de construction",
  "type": "juridical",
  "content": "Analysez ce document juridique en identifiant...",
  "parameters": {
    "temperature": 0.3,
    "max_tokens": 2000
  }
}
```

#### **Catégorisation**
```typescript
const getPromptTypeName = (type: string) => {
  switch (type) {
    case 'general': return 'Général';
    case 'summary': return 'Résumé';
    case 'extraction': return 'Extraction';
    case 'comparison': return 'Comparaison';
    case 'classification': return 'Classification';
    case 'ocr': return 'OCR';
    case 'juridical': return 'Juridique';
    case 'technical': return 'Technique';
    case 'administrative': return 'Administratif';
    default: return type;
  }
};
```

### **Configuration des Providers IA**

#### **Priorités Dynamiques**
```typescript
const updateProviderPriority = async (providerName: string, newPriority: number) => {
  try {
    await configService.updateAIProviderPriority(providerName, newPriority);
    loadAIProviders(); // Recharger la configuration
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la priorité:', error);
  }
};
```

#### **Test de Connectivité**
```typescript
const testProvider = async (providerName: string) => {
  try {
    const response = await fetch(`/api/config/ai/test/${providerName}`, {
      method: 'POST'
    });
    
    if (response.ok) {
      // Provider fonctionnel
      setProviderStatus(providerName, 'functional');
    } else {
      // Provider défaillant
      setProviderStatus(providerName, 'failed');
    }
  } catch (error) {
    setProviderStatus(providerName, 'error');
  }
};
```

---

## 📊 Monitoring et Métriques

### **Statistiques en Temps Réel**

#### **Compteurs par Statut**
```typescript
const getStatusCounts = () => {
  const counts = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    paused: 0
  };
  
  queueItems.forEach(item => {
    counts[item.status]++;
  });
  
  return counts;
};
```

#### **Temps d'Attente Moyen**
```typescript
const calculateAverageWaitTime = () => {
  const pendingItems = queueItems.filter(item => item.status === 'pending');
  if (pendingItems.length === 0) return 0;
  
  const totalWaitTime = pendingItems.reduce((sum, item) => {
    const waitTime = Date.now() - new Date(item.created_at).getTime();
    return sum + waitTime;
  }, 0);
  
  return totalWaitTime / pendingItems.length;
};
```

### **Logs et Debugging**

#### **Interface Logger**
```typescript
import { addInterfaceLog } from '../../utils/interfaceLogger';

const handleStartAnalysis = async (itemId: string) => {
  addInterfaceLog('Queue', 'INFO', `🚀 Lancement de l'analyse ${itemId}`);
  
  try {
    await analysisService.startAnalysis(itemId);
    addInterfaceLog('Queue', 'SUCCESS', `✅ Analyse ${itemId} lancée avec succès`);
  } catch (error) {
    addInterfaceLog('Queue', 'ERROR', `❌ Erreur lors du lancement: ${error}`);
  }
};
```

---

## 🚀 Optimisations et Performance

### **Mise à Jour Optimisée**

#### **Store Utils**
```typescript
import { createOptimizedUpdater } from '../utils/storeUtils';

const updater = createOptimizedUpdater(set, get);

// Mise à jour optimisée
updater.updateMultiple({ 
  queueItems: newItems,
  queueStatus: newStatus 
});
```

#### **Debounce pour la Recherche**
```typescript
useEffect(() => {
  if (filters.search !== undefined) {
    const timeoutId = setTimeout(() => {
      loadAnalyses();
    }, 300); // 300ms de délai

    return () => clearTimeout(timeoutId);
  }
}, [filters.search]);
```

### **Gestion de la Mémoire**

#### **Nettoyage Automatique**
```typescript
useEffect(() => {
  return () => {
    // Nettoyage lors du démontage
    clearInterval(interval);
    window.removeEventListener('reloadQueue', handleReloadQueue);
  };
}, []);
```

---

## 🔒 Sécurité et Validation

### **Validation des Données**

#### **Vérification des Permissions**
```typescript
const validateAnalysisAccess = (itemId: string) => {
  const item = queueItems.find(q => q.id === itemId);
  if (!item) {
    throw new Error('Analyse non trouvée');
  }
  
  // Vérifier les permissions utilisateur
  if (!hasPermission('analysis:manage')) {
    throw new Error('Permissions insuffisantes');
  }
  
  return item;
};
```

#### **Sanitisation des Entrées**
```typescript
const sanitizePromptId = (promptId: string) => {
  // Vérifier que le prompt existe
  const validPrompts = ['general_summary', 'juridical_analysis', ...];
  if (!validPrompts.includes(promptId)) {
    throw new Error('Prompt invalide');
  }
  
  return promptId;
};
```

---

## 📝 Conclusion

L'onglet Queue de DocuSense AI offre une interface complète et intuitive pour gérer les analyses IA. Avec ses menus déroulants intelligents, sa gestion d'état robuste et ses fonctionnalités avancées, il permet aux utilisateurs de :

- **Surveiller** toutes les analyses en temps réel
- **Contrôler** le lancement et l'arrêt des analyses
- **Personnaliser** les prompts et providers IA
- **Gérer** les erreurs et relances automatiques
- **Visualiser** les résultats et métriques

L'architecture modulaire et les optimisations de performance garantissent une expérience utilisateur fluide même avec un grand nombre d'analyses simultanées.
