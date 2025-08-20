export interface DatabaseStatus {
  total_files: number;
  files_by_status: Record<string, number>;
  total_analyses: number;
  total_queue_items: number;
  queue_by_status: Record<string, number>;
  consistency_report: {
    valid_files: number;
    invalid_statuses: number;
    orphaned_files: number;
    missing_mime_types: number;
    issues: Array<{
      file_id: number;
      file_name: string;
      issues: string[];
    }>;
  };
}

export interface CleanupResult {
  success: boolean;
  message: string;
  details?: {
    files_deleted?: number;
    analyses_deleted?: number;
    queue_items_deleted?: number;
    temp_files_cleaned?: number;
    invalid_statuses_fixed?: number;
  };
}

export interface BackupInfo {
  name: string;
  size: number;
  created_at: string;
}

export interface FileInfo {
  id: number;
  name: string;
  path: string;
  status: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface AnalysisInfo {
  id: number;
  file_id: number;
  status: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface QueueItemInfo {
  id: number;
  analysis_id: number;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}
