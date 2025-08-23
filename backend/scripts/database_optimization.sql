-- Database Optimization Script for DocuSense AI
-- Execute this script to add performance indexes

-- OPTIMIZATION: Add indexes for file queries
CREATE INDEX IF NOT EXISTS idx_files_parent_directory ON files(parent_directory);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_is_selected ON files(is_selected);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- OPTIMIZATION: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_files_parent_status ON files(parent_directory, status);
CREATE INDEX IF NOT EXISTS idx_files_parent_selected ON files(parent_directory, is_selected);

-- OPTIMIZATION: Add indexes for directory structures
CREATE INDEX IF NOT EXISTS idx_directory_structures_parent_path ON directory_structures(parent_path);
CREATE INDEX IF NOT EXISTS idx_directory_structures_path ON directory_structures(path);

-- OPTIMIZATION: Add indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_analyses_file_id ON analyses(file_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);

-- OPTIMIZATION: Composite index for analysis queries
CREATE INDEX IF NOT EXISTS idx_analyses_file_status ON analyses(file_id, status);

-- OPTIMIZATION: Add indexes for queue queries
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_created_at ON queue_items(created_at);

-- OPTIMIZATION: Add indexes for configuration queries
CREATE INDEX IF NOT EXISTS idx_configs_key ON configs(key);
CREATE INDEX IF NOT EXISTS idx_configs_category ON configs(category);

-- ANALYZE tables to update statistics
ANALYZE files;
ANALYZE directory_structures;
ANALYZE analyses;
ANALYZE queue_items;
ANALYZE configs;

-- Show index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('files', 'directory_structures', 'analyses', 'queue_items', 'configs')
ORDER BY tablename, indexname; 