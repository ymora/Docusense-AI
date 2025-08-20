import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  selectedItems?: string[];
  onSelectionChange?: (itemIds: string[]) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  getItemId: (item: T) => string;
  showCheckbox?: boolean;
  className?: string;
  emptyMessage?: React.ReactNode;
}

export function UnifiedTable<T>({
  data,
  columns,
  selectedItems = [],
  onSelectionChange,
  onSort,
  sortConfig,
  getItemId,
  showCheckbox = false,
  className = '',
  emptyMessage
}: TableProps<T>) {
  const { colors } = useColors();

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange(data.map(getItemId));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedItems, itemId]);
      } else {
        onSelectionChange(selectedItems.filter(id => id !== itemId));
      }
    }
  };

  const handleSort = (key: string) => {
    if (onSort && sortConfig) {
      const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    }
  };

  return (
    <div className={`h-full overflow-auto ${className}`}>
      <table className="min-w-full divide-y" style={{ borderColor: colors.border }}>
        <thead style={{ backgroundColor: colors.surface }}>
          <tr>
            {showCheckbox && (
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                  style={{ borderColor: colors.border }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer transition-colors' : ''
                }`}
                style={{ 
                  color: colors.textSecondary,
                  width: column.width
                }}
                onMouseEnter={column.sortable ? (e) => {
                  e.currentTarget.style.backgroundColor = colors.hover?.surface || 'rgba(148, 163, 184, 0.1)';
                } : undefined}
                onMouseLeave={column.sortable ? (e) => {
                  e.currentTarget.style.backgroundColor = colors.surface;
                } : undefined}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                {column.headerRender ? (
                  column.headerRender()
                ) : (
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <ChevronDownIcon 
                        className={`w-3 h-3 transition-transform ${sortConfig?.key === column.key ? (sortConfig.direction === 'asc' ? '' : 'rotate-180') : 'opacity-30'}`} 
                        style={{ color: colors.textSecondary }} 
                      />
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: colors.border }}>
          {data.length === 0 ? (
            <tr>
              {showCheckbox && (
                <td className="px-3 py-4 whitespace-nowrap">
                  {/* Cellule vide pour la checkbox */}
                </td>
              )}
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className="px-3 py-4 whitespace-nowrap"
                  style={{ width: column.width }}
                >
                  {index === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📋</div>
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                          Aucun log disponible
                        </h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Aucun événement enregistré
                        </p>
                      </div>
                    </div>
                  ) : null}
                </td>
              ))}
            </tr>
          ) : (
            data.map((item) => {
              const itemId = getItemId(item);
              return (
                <tr
                  key={itemId}
                  className="transition-colors"
                  style={{ backgroundColor: colors.background }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.hover?.surface || 'rgba(148, 163, 184, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background;
                  }}
                >
                  {showCheckbox && (
                    <td className="px-3 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemId)}
                        onChange={(e) => handleSelectItem(itemId, e.target.checked)}
                        className="rounded"
                        style={{ borderColor: colors.border }}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-4 whitespace-nowrap"
                      style={{ width: column.width }}
                    >
                      {column.render ? (
                        column.render(item)
                      ) : (
                        <span style={{ color: colors.text }}>
                          {(item as any)[column.key] || ''}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UnifiedTable;
