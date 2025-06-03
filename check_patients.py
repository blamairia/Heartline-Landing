#!/usr/bin/env python3
"""
Check if patients exist in PostgreSQL database
"""

import psycopg2
import sys

def check_patients():
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
        
        # Check if patient table exists and has data
        try:
            cursor.execute("SELECT COUNT(*) FROM patient")
            count = cursor.fetchone()[0]
            print(f"✓ Found {count} patients in the database")
        except psycopg2.Error as e:
            print(f"✗ Error accessing patient table: {e}")
            print("The patient table might not exist.")
            
            # List all tables to see what exists
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            print("\nAvailable tables:")
            for table in tables:
                print(f"  - {table[0]}")
            
            cursor.close()
            conn.close()
            return False
        
        # Get sample patients if they exist
        if count > 0:
            cursor.execute("""
                SELECT id, first_name, last_name, date_of_birth 
                FROM patient 
                ORDER BY first_name 
                LIMIT 10
            """)
            patients = cursor.fetchall()
            
            print("\nSample patients:")
            for patient in patients:
                print(f"  - ID: {patient[0]}, Name: {patient[1]} {patient[2]}, DOB: {patient[3]}")
        else:
            print("No patients found in database - this is why the dropdown is empty!")
        
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
    if check_patients():
        print("\n✓ Patient check completed!")
    else:
        print("\n✗ Patient check failed!")
        sys.exit(1)
