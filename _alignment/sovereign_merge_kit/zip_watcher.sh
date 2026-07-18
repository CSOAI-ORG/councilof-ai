#!/bin/bash
# Polls for sov33_adapters.zip every 30 seconds. When found, runs the install.
ZIP_PATH="$HOME/Downloads/sov33_adapters.zip"
LOG=~/.sovereign/logs/zip_watcher.log
mkdir -p ~/.sovereign/logs

echo "[$(date)] zip_watcher started, polling $ZIP_PATH" >> $LOG
while true; do
    if [ -f "$ZIP_PATH" ]; then
        SIZE=$(stat -f%z "$ZIP_PATH" 2>/dev/null)
        echo "[$(date)] ZIP FOUND: $ZIP_PATH ($SIZE bytes)" >> $LOG
        
        # Wait a moment to ensure download complete
        sleep 5
        
        # Run the install
        echo "[$(date)] Running install..." >> $LOG
        unset PYTHONPATH
        ~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
            --zip "$ZIP_PATH" --no-merge --no-quantize >> $LOG 2>&1
        EXIT=$?
        echo "[$(date)] Install exit code: $EXIT" >> $LOG
        
        if [ $EXIT -eq 0 ]; then
            echo "[$(date)] SUCCESS - adapters installed" >> $LOG
            break
        fi
    fi
    sleep 30
done
