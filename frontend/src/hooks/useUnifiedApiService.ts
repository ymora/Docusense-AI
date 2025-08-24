/**
 * Hook React pour utiliser le service API unifié
 */

import { useMemo } from 'react';
import unifiedApiService, { UnifiedApiService } from '../services/unifiedApiService';

export function useUnifiedApiService(): UnifiedApiService {
  return useMemo(() => unifiedApiService, []);
}

// Export par défaut pour compatibilité
export default useUnifiedApiService;
