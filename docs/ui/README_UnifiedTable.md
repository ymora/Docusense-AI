# Système Unifié des Tableaux

## Vue d'ensemble

Le composant `UnifiedTable` est un système unifié pour tous les tableaux de l'application Docusense AI. Il fournit une interface cohérente avec des fonctionnalités standardisées pour l'affichage, le tri, la sélection et les interactions utilisateur.

## Fonctionnalités

### ✅ Fonctionnalités incluses

- **Affichage unifié** : Style cohérent avec le thème de l'application
- **Tri des colonnes** : Tri ascendant/descendant avec indicateurs visuels
- **Sélection multiple** : Cases à cocher pour sélectionner plusieurs éléments
- **Effets de survol** : Feedback visuel au survol des lignes et en-têtes
- **Couleurs adaptatives** : Support automatique des thèmes clair/sombre
- **Responsive** : Adaptation automatique à différentes tailles d'écran
- **Accessibilité** : Support des raccourcis clavier et navigation au clavier

### 🎨 Style unifié

- **En-têtes** : Fond de surface avec texte secondaire, effet de survol
- **Lignes** : Fond principal avec effet de survol subtil
- **Bordures** : Couleurs cohérentes avec le thème
- **Typographie** : Police et tailles standardisées
- **Espacement** : Padding et marges uniformes

## Utilisation

### Import

```typescript
import { UnifiedTable, TableColumn } from '../UI/UnifiedTable';
```

### Définition des colonnes

```typescript
const columns: TableColumn<YourDataType>[] = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (item) => <span>{item.id}</span>
  },
  {
    key: 'name',
    label: 'Nom',
    sortable: true,
    render: (item) => <span>{item.name}</span>
  },
  {
    key: 'actions',
    label: 'Actions',
    width: '100px',
    render: (item) => (
      <button onClick={() => handleAction(item)}>
        Action
      </button>
    )
  }
];
```

### Utilisation du composant

```typescript
<UnifiedTable
  data={yourData}
  columns={columns}
  selectedItems={selectedItems}
  onSelectionChange={setSelectedItems}
  onSort={handleSort}
  sortConfig={sortConfig}
  getItemId={(item) => item.id}
  showCheckbox={true}
/>
```

## Propriétés

### TableProps<T>

| Propriété | Type | Requis | Description |
|-----------|------|--------|-------------|
| `data` | `T[]` | ✅ | Données à afficher |
| `columns` | `TableColumn<T>[]` | ✅ | Configuration des colonnes |
| `selectedItems` | `string[]` | ❌ | IDs des éléments sélectionnés |
| `onSelectionChange` | `(itemIds: string[]) => void` | ❌ | Callback de changement de sélection |
| `onSort` | `(key: string, direction: 'asc' \| 'desc') => void` | ❌ | Callback de tri |
| `sortConfig` | `{ key: string; direction: 'asc' \| 'desc' }` | ❌ | Configuration du tri actuel |
| `getItemId` | `(item: T) => string` | ✅ | Fonction pour obtenir l'ID d'un élément |
| `showCheckbox` | `boolean` | ❌ | Afficher les cases à cocher (défaut: false) |
| `className` | `string` | ❌ | Classes CSS supplémentaires |

### TableColumn<T>

| Propriété | Type | Requis | Description |
|-----------|------|--------|-------------|
| `key` | `string` | ✅ | Clé unique de la colonne |
| `label` | `string` | ✅ | Libellé affiché dans l'en-tête |
| `sortable` | `boolean` | ❌ | Permettre le tri (défaut: false) |
| `width` | `string` | ❌ | Largeur fixe de la colonne |
| `render` | `(item: T) => React.ReactNode` | ❌ | Fonction de rendu personnalisée |
| `headerRender` | `() => React.ReactNode` | ❌ | Rendu personnalisé de l'en-tête |

## Exemples d'implémentation

### Tableau simple

```typescript
const columns: TableColumn<User>[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Rôle' }
];

<UnifiedTable
  data={users}
  columns={columns}
  getItemId={(user) => user.id}
/>
```

### Tableau avec actions

```typescript
const columns: TableColumn<File>[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'size', label: 'Taille', sortable: true },
  {
    key: 'actions',
    label: 'Actions',
    width: '120px',
    render: (file) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(file)}>Modifier</button>
        <button onClick={() => handleDelete(file)}>Supprimer</button>
      </div>
    )
  }
];
```

### Tableau avec sélection

```typescript
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' as 'asc' | 'desc' });

const handleSort = (key: string, direction: 'asc' | 'desc') => {
  setSortConfig({ key, direction });
};

<UnifiedTable
  data={items}
  columns={columns}
  selectedItems={selectedItems}
  onSelectionChange={setSelectedItems}
  onSort={handleSort}
  sortConfig={sortConfig}
  getItemId={(item) => item.id}
  showCheckbox={true}
/>
```

## Migration depuis l'ancien système

### Avant (tableau personnalisé)

```typescript
<table className="min-w-full divide-y">
  <thead>
    <tr>
      <th onClick={() => handleSort('name')}>Nom</th>
      <th onClick={() => handleSort('email')}>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id} onMouseEnter={handleHover}>
        <td>{item.name}</td>
        <td>{item.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Après (UnifiedTable)

```typescript
const columns: TableColumn<User>[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true }
];

<UnifiedTable
  data={data}
  columns={columns}
  onSort={handleSort}
  sortConfig={sortConfig}
  getItemId={(item) => item.id}
/>
```

## Avantages

### 🎯 Cohérence
- Style uniforme dans toute l'application
- Comportement prévisible pour les utilisateurs
- Maintenance simplifiée

### 🚀 Performance
- Composant optimisé et réutilisable
- Moins de code dupliqué
- Rendu efficace avec React

### 🛠️ Développement
- API simple et intuitive
- TypeScript pour la sécurité des types
- Documentation complète

### 🎨 Personnalisation
- Rendu personnalisé par colonne
- Support des thèmes
- Classes CSS extensibles

## Maintenance

### Ajout de nouvelles fonctionnalités

1. Modifier le composant `UnifiedTable`
2. Tester avec tous les tableaux existants
3. Mettre à jour la documentation
4. Vérifier la compatibilité avec les thèmes

### Correction de bugs

1. Identifier le problème dans `UnifiedTable`
2. Corriger et tester
3. Vérifier l'impact sur tous les tableaux
4. Déployer la correction

## Tableaux existants utilisant UnifiedTable

- ✅ **LogsPanel** : Journal des événements
- ✅ **QueueIAAdvanced** : File d'attente des analyses
- 🔄 **Autres tableaux** : Migration en cours

## Support

Pour toute question ou problème avec le système unifié des tableaux, consulter :
- Cette documentation
- Les exemples d'implémentation
- Le code source du composant `UnifiedTable`
