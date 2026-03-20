"""
Database migration script to add missing columns
"""
import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add missing columns to existing database"""
    # Try to find database file in common locations
    possible_paths = [
        Path(__file__).parent / 'instance' / 'quran_app.db',  # Flask default instance folder
        Path(__file__).parent / 'quran_app.db',
        Path(__file__).parent.parent / 'quran_app.db',
        Path.cwd() / 'quran_app.db',
    ]
    
    # Also check from environment variable
    import os
    db_url = os.getenv('DATABASE_URL', '')
    if db_url and db_url.startswith('sqlite:///'):
        db_path = Path(db_url.replace('sqlite:///', ''))
        possible_paths.insert(0, db_path)
    
    db_path = None
    for path in possible_paths:
        if path.exists():
            db_path = path
            break
    
    if not db_path:
        print("Database file not found. Checking common locations...")
        for path in possible_paths:
            print(f"  - {path}")
        print("\nDatabase will be created with correct schema on next run.")
        print("If you have an existing database, please specify its path.")
        return
    
    print(f"Found database at: {db_path}")
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if uuid column exists
        cursor.execute("PRAGMA table_info(recitation_sessions)")
        columns = [col[1] for col in cursor.fetchall()]
        
        migrations_applied = []
        
        # SQLite doesn't support adding UNIQUE columns, so we need to recreate the table
        if 'uuid' not in columns:
            print("Recreating recitation_sessions table with uuid column...")
            
            # Create new table with correct schema
            cursor.execute("""
                CREATE TABLE recitation_sessions_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT UNIQUE NOT NULL,
                    user_id INTEGER NOT NULL,
                    verse_id TEXT NOT NULL,
                    transcribed_text TEXT NOT NULL,
                    expected_text TEXT NOT NULL,
                    accuracy_score REAL NOT NULL,
                    audio_file_path TEXT,
                    audio_duration_ms INTEGER,
                    audio_sample_rate INTEGER,
                    audio_channels INTEGER,
                    session_id TEXT,
                    platform TEXT DEFAULT 'web',
                    recitation_mode TEXT DEFAULT 'single_verse',
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Copy existing data (generate UUIDs for existing records)
            import uuid as uuid_module
            cursor.execute("SELECT * FROM recitation_sessions")
            rows = cursor.fetchall()
            
            for row in rows:
                row_dict = dict(zip([col[1] for col in cursor.execute("PRAGMA table_info(recitation_sessions)").fetchall()], row))
                new_uuid = str(uuid_module.uuid4())
                
                cursor.execute("""
                    INSERT INTO recitation_sessions_new 
                    (id, uuid, user_id, verse_id, transcribed_text, expected_text, 
                     accuracy_score, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row_dict.get('id'),
                    new_uuid,
                    row_dict.get('user_id'),
                    row_dict.get('verse_id'),
                    row_dict.get('transcribed_text'),
                    row_dict.get('expected_text'),
                    row_dict.get('accuracy_score'),
                    row_dict.get('created_at'),
                    row_dict.get('created_at')  # Use created_at for updated_at if it doesn't exist
                ))
            
            # Drop old table and rename new one
            cursor.execute("DROP TABLE recitation_sessions")
            cursor.execute("ALTER TABLE recitation_sessions_new RENAME TO recitation_sessions")
            
            migrations_applied.append("Recreated table with uuid column")
        
        # --- Users table: add auth & profile columns ---
        cursor.execute("PRAGMA table_info(users)")
        user_columns = [col[1] for col in cursor.fetchall()]

        user_missing = {
            'email': "TEXT DEFAULT ''",
            'password_hash': "TEXT DEFAULT ''",
            'display_name': 'TEXT',
            'age_group': 'TEXT',
            'experience_level': 'TEXT',
            'onboarding_completed': 'BOOLEAN DEFAULT 0',
            'updated_at': 'DATETIME',
        }

        for col_name, col_type in user_missing.items():
            if col_name not in user_columns:
                print(f"Adding '{col_name}' column to users table...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                migrations_applied.append(f"Added users.{col_name} column")

        # Add other missing columns (these can be added with ALTER TABLE)
        missing_columns = {
            'audio_file_path': 'TEXT',
            'audio_duration_ms': 'INTEGER',
            'audio_sample_rate': 'INTEGER',
            'audio_channels': 'INTEGER',
            'session_id': 'TEXT',
            'platform': 'TEXT',
            'recitation_mode': 'TEXT',
            'updated_at': 'DATETIME'
        }
        
        # Refresh columns list after potential table recreation
        if 'uuid' not in columns:
            cursor.execute("PRAGMA table_info(recitation_sessions)")
            columns = [col[1] for col in cursor.fetchall()]
        
        for col_name, col_type in missing_columns.items():
            if col_name not in columns:
                print(f"Adding '{col_name}' column to recitation_sessions table...")
                cursor.execute(f"""
                    ALTER TABLE recitation_sessions 
                    ADD COLUMN {col_name} {col_type}
                """)
                migrations_applied.append(f"Added {col_name} column")
        
        conn.commit()
        
        if migrations_applied:
            print(f"\n✅ Migration completed! Applied {len(migrations_applied)} changes:")
            for migration in migrations_applied:
                print(f"  - {migration}")
        else:
            print("✅ Database is up to date. No migrations needed.")
            
    except sqlite3.Error as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()

