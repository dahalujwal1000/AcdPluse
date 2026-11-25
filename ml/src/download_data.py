"""
Automated download and extraction script for the Open University Learning Analytics Dataset (OULAD).
Downloads anonymisedData.zip directly from Open University / Figshare mirrors into ml/data/raw/oulad/
"""
import os
import sys
import zipfile
import urllib.request
from pathlib import Path

# Exact direct download link from Figshare API for OULAD (file 8606371)
DOWNLOAD_URLS = [
    "https://ndownloader.figshare.com/files/8606371",
]

RAW_DIR = Path("ml/data/raw/oulad")
ZIP_PATH = RAW_DIR / "anonymisedData.zip"


def download_oulad():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    expected_files = [
        "studentInfo.csv",
        "studentVle.csv",
        "studentAssessment.csv",
        "assessments.csv",
        "courses.csv",
        "vle.csv",
        "studentRegistration.csv",
    ]

    # Check if CSVs already exist
    existing = [f for f in expected_files if (RAW_DIR / f).exists()]
    if len(existing) == len(expected_files):
        print(f"OULAD CSVs already present in {RAW_DIR}. Skipping download.")
        return

    # Attempt download from mirrors
    download_success = False
    for url in DOWNLOAD_URLS:
        print(f"Attempting download from: {url}")
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (AcadPulse FYP Research Tool)"},
            )
            with urllib.request.urlopen(req, timeout=60) as response, open(ZIP_PATH, "wb") as out_file:
                total_length = response.getheader("content-length")
                if total_length:
                    total_bytes = int(total_length)
                    print(f"Archive size: {total_bytes / (1024 * 1024):.2f} MB")
                
                block_size = 64 * 1024
                downloaded = 0
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    downloaded += len(buffer)
                    out_file.write(buffer)
                    if total_length:
                        percent = downloaded * 100 / total_bytes
                        sys.stdout.write(f"\rDownloading: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB)")
                        sys.stdout.flush()
                print("\nDownload complete.")
            download_success = True
            break
        except Exception as e:
            print(f"Failed with URL {url}: {e}")
            if ZIP_PATH.exists():
                ZIP_PATH.unlink()

    if not download_success:
        print(
            "Could not automatically download the zip file from mirrors.\n"
            "Please manually download 'anonymisedData.zip' from https://analyse.kmi.open.ac.uk/open_dataset\n"
            f"and place the extracted CSV files into: {RAW_DIR.resolve()}"
        )
        return

    # Extract ZIP
    print(f"Extracting {ZIP_PATH} into {RAW_DIR}...")
    try:
        with zipfile.ZipFile(ZIP_PATH, "r") as zip_ref:
            # Handle possible nested directory inside the zip
            for member in zip_ref.infolist():
                filename = os.path.basename(member.filename)
                if not filename:
                    continue
                # Extract file directly to RAW_DIR without nested root folder
                source = zip_ref.open(member)
                target = open(RAW_DIR / filename, "wb")
                with source, target:
                    target.write(source.read())
        print(f"Extraction finished. Files extracted to {RAW_DIR}")
        # Clean up zip
        if ZIP_PATH.exists():
            ZIP_PATH.unlink()
    except Exception as e:
        print(f"Error extracting archive: {e}")


if __name__ == "__main__":
    download_oulad()
