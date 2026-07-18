#!/bin/bash
# MEOK BACKUP SYSTEM v2.0
# Backs up critical data with compression & rotation

BACKUP_DIR="/Users/nicholas/clawd/backups"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/Users/nicholas/clawd"
RETENTION_DAYS=7
MAX_BACKUPS=10

mkdir -p "$BACKUP_DIR"

echo "=== MEOK Backup - $DATE ==="
START_TIME=$(date +%s)

backup_size() {
    du -sh "$1" 2>/dev/null | cut -f1
}

# Backup PostgreSQL
echo "📦 Backing up PostgreSQL..."
if docker exec sovereign-postgres pg_dump -U postgres meok 2>/dev/null | gzip > "$BACKUP_DIR/meok_db_$DATE.sql.gz"; then
    SIZE=$(backup_size "$BACKUP_DIR/meok_db_$DATE.sql.gz")
    echo "  ✅ Database backed up ($SIZE)"
else
    echo "  ⚠️ DB backup failed"
fi

# Backup Redis
echo "📦 Backing up Redis..."
if docker exec sovereign-redis redis-cli SAVE > /dev/null 2>&1; then
    docker cp sovereign-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb" 2>/dev/null
    gzip "$BACKUP_DIR/redis_$DATE.rdb" 2>/dev/null
    SIZE=$(backup_size "$BACKUP_DIR/redis_$DATE.rdb.gz")
    echo "  ✅ Redis backed up ($SIZE)"
else
    echo "  ⚠️ Redis backup failed"
fi

# Backup neural models
echo "📦 Backing up neural models..."
rsync -av --ignore-errors "$SOURCE_DIR/meok/neural/models/" "$BACKUP_DIR/models_$DATE/" 2>/dev/null
SIZE=$(backup_size "$BACKUP_DIR/models_$DATE")
echo "  ✅ Models backed up ($SIZE)"

# Backup sovereign-temple models
echo "📦 Backing up sovereign-temple models..."
rsync -av --ignore-errors "$SOURCE_DIR/sovereign-temple/models/" "$BACKUP_DIR/st_models_$DATE/" 2>/dev/null
SIZE=$(backup_size "$BACKUP_DIR/st_models_$DATE")
echo "  ✅ ST Models backed up ($SIZE)"

# Backup memory files (compressed)
echo "📦 Backing up memory..."
tar -czf "$BACKUP_DIR/memory_$DATE.tar.gz" -C "$SOURCE_DIR" memory/ 2>/dev/null
SIZE=$(backup_size "$BACKUP_DIR/memory_$DATE.tar.gz")
echo "  ✅ Memory backed up ($SIZE)"

# Backup recovery state
echo "📦 Backing up recovery state..."
rsync -av --ignore-errors "$SOURCE_DIR/recovery/" "$BACKUP_DIR/recovery_$DATE/" 2>/dev/null
SIZE=$(backup_size "$BACKUP_DIR/recovery_$DATE")
echo "  ✅ Recovery backed up ($SIZE)"

# Backup configs
echo "📦 Backing up configs..."
tar -czf "$BACKUP_DIR/configs_$DATE.tar.gz" \
    -C "$SOURCE_DIR/meok" .env.local 2>/dev/null \
    -C "$SOURCE_DIR/meok/ui" .env.local 2>/dev/null \
    2>/dev/null
echo "  ✅ Configs backed up"

# Rotation: keep only last N backups
echo "🧹 Rotating backups (keeping last $MAX_BACKUPS)..."

for type in "memory" "models" "st_models" "recovery" "configs"; do
    BACKUPS=$(ls -1t "$BACKUP_DIR"/${type}_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) || true)
    if [ -n "$BACKUPS" ]; then
        echo "  Removing old $type backups..."
        echo "$BACKUPS" | xargs rm -rf 2>/dev/null
    fi
done

# Clean up old daily folders
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=== Backup Complete ==="
echo "Duration: ${DURATION}s"
echo ""
echo "📁 Backup location: $BACKUP_DIR"
echo ""
echo "Recent backups:"
ls -lt "$BACKUP_DIR" | head -10 | awk '{print "  " $9, $5}'

# Calculate total backup size
TOTAL=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo ""
echo "Total backup size: $TOTAL"