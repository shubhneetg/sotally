#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U sotally sotally > $BACKUP_DIR/sotally_$TIMESTAMP.sql
gzip $BACKUP_DIR/sotally_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup complete: sotally_$TIMESTAMP.sql.gz"
