#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

# Database migrate aur static files collect karo
python manage.py collectstatic --no-input
python manage.py migrate