import os
import glob
import pandas as pd
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from dashboard.models import AadharEnrolment, AadharBiometric, AadharDemographic

class Command(BaseCommand):
    help = 'Ingests Enrolment, Biometric, and Demographic CSV data into the database'

    # --- CONFIGURATION ---
    # We use settings.BASE_DIR to find the data_raw folder dynamically
    # Assuming structure: C:\django\uidai_dashboard_project\data_raw
    BASE_DATA_DIR = r"C:\django\uidai_dashboard_project\data_raw"

    DIRS = {
        "enrolment": os.path.join(BASE_DATA_DIR, "Enrolment"),
        "biometric": os.path.join(BASE_DATA_DIR, "Biometric_Updates"),
        "demographic": os.path.join(BASE_DATA_DIR, "Demographic"),
    }

    def parse_date(self, date_obj):
        if pd.isna(date_obj): return None
        date_str = str(date_obj).strip()
        formats = ['%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d']
        for fmt in formats:
            try: return datetime.strptime(date_str, fmt).date()
            except ValueError: continue
        return None

    def clean_int(self, value):
        try: return int(float(value))
        except (ValueError, TypeError): return 0

    def clean_pincode(self, value):
        try: return str(int(float(value)))
        except (ValueError, TypeError): return "000000"

    def ingest_folder(self, folder_path, model_class, file_type):
        csv_files = glob.glob(os.path.join(folder_path, "*.csv"))
        
        if not csv_files:
            self.stdout.write(self.style.WARNING(f"⚠️ No CSV files found in {folder_path}"))
            return

        self.stdout.write(f"📂 Found {len(csv_files)} files in {file_type}...")

        total_records = 0
        all_objects = []

        for file_path in csv_files:
            self.stdout.write(f"   ↳ Reading {os.path.basename(file_path)}...")
            try:
                df = pd.read_csv(file_path)
                df.columns = [c.lower().strip() for c in df.columns]

                for _, row in df.iterrows():
                    common_data = {
                        "date": self.parse_date(row.get('date')),
                        "state": row.get('state', 'Unknown'),
                        "district": row.get('district', 'Unknown'),
                        "pincode": self.clean_pincode(row.get('pincode', '0'))
                    }

                    if file_type == "enrolment":
                        obj = model_class(
                            **common_data,
                            age_0_5=self.clean_int(row.get('age_0_5', 0)),
                            age_5_17=self.clean_int(row.get('age_5_17', 0)),
                            age_18_greater=self.clean_int(row.get('age_18_greater', 0))
                        )
                    
                    elif file_type == "biometric":
                        age_17_val = row.get('bio_age_17_', 0) if 'bio_age_17_' in df.columns else row.get('bio_age_17_greater', 0)
                        obj = model_class(
                            **common_data,
                            bio_age_5_17=self.clean_int(row.get('bio_age_5_17', 0)),
                            bio_age_17_greater=self.clean_int(age_17_val)
                        )

                    elif file_type == "demographic":
                        age_17_val = row.get('demo_age_17_', 0) if 'demo_age_17_' in df.columns else row.get('demo_age_17_greater', 0)
                        obj = model_class(
                            **common_data,
                            demo_age_5_17=self.clean_int(row.get('demo_age_5_17', 0)),
                            demo_age_17_greater=self.clean_int(age_17_val)
                        )
                    
                    all_objects.append(obj)

                    if len(all_objects) >= 10000:
                        model_class.objects.bulk_create(all_objects)
                        total_records += len(all_objects)
                        all_objects = []
                        self.stdout.write(".", ending="")
                        self.stdout.flush()

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error processing {os.path.basename(file_path)}: {e}"))

        if all_objects:
            model_class.objects.bulk_create(all_objects)
            total_records += len(all_objects)
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Finished {file_type}: {total_records} records loaded.\n"))

    def handle(self, *args, **options):
        self.stdout.write("🧹 Wiping old data from database...")
        AadharEnrolment.objects.all().delete()
        AadharBiometric.objects.all().delete()
        AadharDemographic.objects.all().delete()
        
        self.ingest_folder(self.DIRS["enrolment"], AadharEnrolment, "enrolment")
        self.ingest_folder(self.DIRS["biometric"], AadharBiometric, "biometric")
        self.ingest_folder(self.DIRS["demographic"], AadharDemographic, "demographic")

        self.stdout.write(self.style.SUCCESS("🎉 All Data Ingestion Complete!"))