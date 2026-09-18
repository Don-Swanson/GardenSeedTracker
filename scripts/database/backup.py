#!/usr/bin/env python3
"""Create a verified SQLite online backup, including committed WAL data."""
import argparse
import os
import sqlite3
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('database', type=Path)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
source = args.database.resolve(strict=True)
destination = args.destination.resolve()
# Exclusive creation protects both the source and earlier backups from overwriting.
fd = os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
os.close(fd)
try:
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as src, sqlite3.connect(destination) as dst:
        src.backup(dst)
        if dst.execute('PRAGMA quick_check').fetchall() != [('ok',)]:
            raise RuntimeError('Backup integrity check failed')
except BaseException:
    destination.unlink(missing_ok=True)
    raise
print(f'Verified backup: {destination}')
