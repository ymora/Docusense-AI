"""
Create system_logs table for security monitoring
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

def create_system_logs_table():
    """Create the system_logs table"""
    
    # Create database engine
    engine = create_engine(settings.database_url)
    
    # SQL to create the table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level VARCHAR(20) NOT NULL,
        source VARCHAR(100) NOT NULL,
        user_id INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        action VARCHAR(200) NOT NULL,
        details JSON,
        is_security_event BOOLEAN DEFAULT FALSE,
        is_suspicious BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """
    
    # Create indexes for better performance
    create_indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_ip_address ON system_logs(ip_address);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_security ON system_logs(is_security_event);",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_suspicious ON system_logs(is_suspicious);"
    ]
    
    try:
        with engine.connect() as connection:
            # Create the table
            connection.execute(text(create_table_sql))
            logger.info("System logs table created successfully")
            
            # Create indexes
            for index_sql in create_indexes_sql:
                connection.execute(text(index_sql))
            
            logger.info("System logs indexes created successfully")
            
            # Commit the transaction
            connection.commit()
            
        logger.info("System logs table setup completed successfully")
        
    except Exception as e:
        logger.error(f"Error creating system logs table: {str(e)}")
        raise

if __name__ == "__main__":
    create_system_logs_table()
    print("✅ System logs table created successfully!")
