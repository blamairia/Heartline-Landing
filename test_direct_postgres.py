#!/usr/bin/env python3
"""
Simple PostgreSQL connection test
"""

import psycopg2
import sys

print("Testing direct PostgreSQL connection...", flush=True)

try:
    # Test basic connection
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="nv",
        user="postgres",
        password="root"
    )
    print("✓ Direct PostgreSQL connection successful", flush=True)
    
    # Test medicament table
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM medicament")
    count = cursor.fetchone()[0]
    print(f"✓ Medicament table has {count} records", flush=True)
    
    # Get some sample medications
    cursor.execute("SELECT num_enr, nom_com, dosage, unite FROM medicament LIMIT 5")
    rows = cursor.fetchall()
    
    print("\nSample medications:")
    for row in rows:
        print(f"  - {row[1]} ({row[2]}{row[3]}) [ID: {row[0]}]")
    
    cursor.close()
    conn.close()
    print("\nDirect PostgreSQL test completed successfully!")
    
except psycopg2.Error as e:
    print(f"✗ PostgreSQL Error: {e}", flush=True)
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
