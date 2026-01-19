import pandas as pd
import numpy as np
import os
import glob

# ==============================================================================
# CONFIGURATION
# ==============================================================================
CANONICAL_STATES = {
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
}

# ==============================================================================
# 🧹 CLEANING MAP (Updated to fix Missing J&K)
# ==============================================================================
STATE_ALIAS_MAP = {
    # --- WEST BENGAL ---
    "West Bangal": "West Bengal",
    "Westbengal": "West Bengal",
    "Wb": "West Bengal",
    
    # --- JAMMU & KASHMIR (The Missing One) ---
    "J&K": "Jammu and Kashmir",
    "J & K": "Jammu and Kashmir",        # <--- New catch
    "Jammu & Kashmir": "Jammu and Kashmir",
    "Jammu And Kashmir": "Jammu and Kashmir",
    "Jammu Kashmir": "Jammu and Kashmir", # <--- New catch
    
    # --- SPELLING & FORMATTING ---
    "Rajasthan.": "Rajasthan",
    "Orissa": "Odisha",
    "Pondicherry": "Puducherry",
    "Bangalore": "Karnataka",
    "Uttaranchal": "Uttarakhand",
    "Telengana": "Telangana",
    "Chattisgarh": "Chhattisgarh",
    "Tamilnadu": "Tamil Nadu",
    
    # --- ANDAMAN ---
    "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
    "Andaman And Nicobar Islands": "Andaman and Nicobar Islands",
    "Andaman & Nicobar": "Andaman and Nicobar Islands",

    # --- DADRA & DAMAN (Merged UT) ---
    "Dadra & Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "Dadra And Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "D&NH": "Dadra and Nagar Haveli and Daman and Diu",
    "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
    "Daman And Diu": "Dadra and Nagar Haveli and Daman and Diu",
    "The Dadra And Nagar Haveli And Daman And Diu": "Dadra and Nagar Haveli and Daman and Diu",
    
    # --- GARBAGE CLEANING ---
    "100000": "Unknown",
    "0": "Unknown",
    "Null": "Unknown"
}

class UniversalCleaner:
    def __init__(self, raw_path, processed_path):
        self.raw_path = raw_path
        self.processed_path = processed_path
        os.makedirs(self.processed_path, exist_ok=True)

    def normalize_state(self, text):
        if pd.isna(text): return "Unknown"
        text = str(text).strip().strip('.').title()
        return STATE_ALIAS_MAP.get(text, text)

    def find_count_column(self, df, filename):
        # 1. Lowercase all columns for comparison
        df.columns = [c.lower().strip() for c in df.columns]
        cols = df.columns.tolist()

        # 2. Known Biometric Column Names (Common Patterns)
        biometric_keywords = ['biometric', 'update', 'packets', 'transactions', 'cnt', 'count', 'total']
        
        # Check explicit match first
        for key in biometric_keywords:
            matches = [c for c in cols if key in c]
            if matches:
                # Prefer the one that implies a count
                return matches[0]

        # 3. Last numeric column fallback
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            return numeric_cols[-1]
            
        return None

    def process_folder(self, folder_name):
        # Handle both "Biometric_Updates" and "Biometric Updates" just in case
        full_path = os.path.join(self.raw_path, folder_name)
        if not os.path.exists(full_path):
            # Try space version
            full_path = os.path.join(self.raw_path, folder_name.replace('_', ' '))
            
        all_files = glob.glob(os.path.join(full_path, "*.csv"))
        
        print(f"\n🚀 STARTING BATCH: {folder_name} (Found {len(all_files)} files)")
        
        if not all_files:
            print(f"   ❌ ERROR: Folder seems empty or path is wrong: {full_path}")
            return

        cleaned_dfs = []

        for filepath in all_files:
            filename = os.path.basename(filepath)
            try:
                df = pd.read_csv(filepath)
                
                # Column Rename Logic
                count_col = self.find_count_column(df, filename)
                
                if count_col:
                    print(f"   ℹ️  {filename}: Using '{count_col}' as count")
                    df.rename(columns={count_col: 'count'}, inplace=True)
                    df['count'] = df['count'].fillna(0).astype(int)
                else:
                    print(f"   ❌ FAILED {filename}: No numeric column found. Columns are: {df.columns.tolist()}")
                    continue

                # State Cleaning
                # Try to find state column
                state_col = next((c for c in df.columns if 'state' in c), None)
                if state_col:
                    df['state_normalized'] = df[state_col].apply(self.normalize_state)
                    df = df[df['state_normalized'].isin(CANONICAL_STATES)]
                    
                    # Pincode cleaning (if exists)
                    pin_col = next((c for c in df.columns if 'pin' in c), None)
                    if pin_col:
                        df.rename(columns={pin_col: 'pincode'}, inplace=True)
                        df['pincode'] = df['pincode'].astype(str).str.replace(r'\.0$', '', regex=True)
                    else:
                        df['pincode'] = "000000"

                    df['source_file'] = filename
                    df['dqs_score'] = 100
                    
                    if not df.empty:
                        cleaned_dfs.append(df)
                else:
                    print(f"   ⚠️  Skipping {filename}: No 'state' column found.")

            except Exception as e:
                print(f"   ❌ Error reading {filename}: {e}")

        # SAVE
        if cleaned_dfs:
            final_df = pd.concat(cleaned_dfs, ignore_index=True)
            # Ensure name matches exactly what ingest_data.py expects
            output_name = f"clean_{folder_name.replace(' ', '_')}_combined.csv"
            final_df.to_csv(os.path.join(self.processed_path, output_name), index=False)
            print(f"✅ SUCCESS: Created {output_name} with {len(final_df)} rows")
        else:
            print(f"❌ FAILED: Could not process any files in {folder_name}")

if __name__ == "__main__":
    cleaner = UniversalCleaner("./data_raw", "./data_processed")
    # Note: I added the spaced version just in case
    for cat in ["Demographic", "Biometric_Updates", "Enrolment"]:
        cleaner.process_folder(cat)