#!/usr/bin/env python3
"""
Test PostgreSQL connection and check medications
"""

import psycopg2
import sys

def test_postgres_connection():
    try:
        print("Connecting to PostgreSQL database 'nv'...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="nv",
            user="postgres",
            password="root"
        )
        
        cursor = conn.cursor()
        
        # Check if medicament table exists and has data
        cursor.execute("SELECT COUNT(*) FROM medicament")
        count = cursor.fetchone()[0]
        print(f"✓ Found {count} medications in the database")
        
        # Get sample medications
        cursor.execute("""
            SELECT num_enr, nom_com, dosage, unite 
            FROM medicament 
            ORDER BY nom_com 
            LIMIT 10
        """)
        medications = cursor.fetchall()
        
        print("\nSample medications:")
        for med in medications:
            print(f"  - ID: {med[0]}, Name: {med[1]}, Dosage: {med[2]}{med[3]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"PostgreSQL Error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if test_postgres_connection():
        print("\n✓ PostgreSQL connection test successful!")
    else:
        print("\n✗ PostgreSQL connection test failed!")
        sys.exit(1)
