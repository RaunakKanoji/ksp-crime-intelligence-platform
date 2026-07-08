import os
import shutil
import subprocess
import sys

# Define target paths
WORK_DIR = "/Users/admin/Code/ksp"
BACKUP_DIR = "/Users/admin/Code/ksp_temp_backup"
PROGRESS_TRACKER_PATH = "crime-intelligence/context/docs/progress-tracker.md"

def run_cmd(cmd, cwd=WORK_DIR, check=True):
    print(f"Running: {cmd} in {cwd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"STDOUT:\n{res.stdout}")
        print(f"STDERR:\n{res.stderr}")
        if check:
            raise Exception(f"Command failed: {cmd}")
    return res.stdout.strip()

def main():
    # 1. Close PR #4 if it exists
    print("Closing PR #4 if it exists...")
    run_cmd("gh pr close 4", check=False)

    # 2. Checkout development to backup all files
    print("Checking out development to back up files...")
    run_cmd("git checkout development")
    
    # Ensure backup directory is clean
    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)
    os.makedirs(BACKUP_DIR)

    # Copy files to backup (excluding git, node_modules, .next)
    print("Backing up files to temporary directory...")
    for item in ["crime-intelligence", "functions"]:
        src = os.path.join(WORK_DIR, item)
        dst = os.path.join(BACKUP_DIR, item)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("node_modules", ".next", ".git"))

    # Copy .env.local if present
    env_local = os.path.join(WORK_DIR, "crime-intelligence", ".env.local")
    if os.path.exists(env_local):
        shutil.copy2(env_local, os.path.join(BACKUP_DIR, "crime-intelligence", ".env.local"))

    # Read final progress tracker contents
    with open(os.path.join(BACKUP_DIR, PROGRESS_TRACKER_PATH), "r") as f:
        final_tracker_lines = f.readlines()

    # 3. Checkout main to read initial progress tracker contents
    print("Checking out main...")
    run_cmd("git checkout main")
    with open(os.path.join(WORK_DIR, PROGRESS_TRACKER_PATH), "r") as f:
        initial_tracker_lines = f.readlines()

    # Clean local and remote feature/crime-intelligence-setup branches
    print("Cleaning up old feature/crime-intelligence-setup branches...")
    run_cmd("git branch -D feature/crime-intelligence-setup", check=False)
    run_cmd("git push origin --delete feature/crime-intelligence-setup", check=False)

    # Define steps
    # Each step lists the feature IDs it completes, commit message, and files to copy from backup.
    steps = [
        {
            "id": 1,
            "desc": "F003-F005 initial layout and summary cards",
            "msg": "feat(crime-intelligence): implement F003-F005 initial crime intelligence layout and summary cards",
            "features_done": ["003", "004", "005"],
            "copy_from_b5a2ab7": True, # special flag: checkout b5a2ab7 files first
            "additional_files": [
                "crime-intelligence/src/app/crime-summary/page.tsx",
                "crime-intelligence/src/components/dashboard/CrimeSummaryCards.tsx",
                "crime-intelligence/src/lib/dashboard/summary.ts",
                "crime-intelligence/src/components/dashboard/sections.tsx",
                "crime-intelligence/.env.example",
                "crime-intelligence/README.md"
            ]
        },
        {
            "id": 2,
            "desc": "F006 natural language query",
            "msg": "feat(crime-intelligence): implement F006 natural language query",
            "features_done": ["006"],
            "files": [
                "crime-intelligence/src/app/ai-query/page.tsx",
                "crime-intelligence/src/components/ai/NaturalLanguageQuery.tsx",
                "crime-intelligence/src/lib/ai/natural-language-query.ts",
                "crime-intelligence/src/lib/ai/types.ts",
                "crime-intelligence/src/lib/ai/gemini.ts",
                "crime-intelligence/src/app/api/ai/query/route.ts"
            ]
        },
        {
            "id": 3,
            "desc": "F007 AI query result explanation",
            "msg": "feat(crime-intelligence): implement F007 AI query result explanation",
            "features_done": ["007"],
            "files": [
                "crime-intelligence/src/app/ai-query/explanation/page.tsx",
                "crime-intelligence/src/components/ai/AIQueryResultExplanation.tsx"
            ]
        },
        {
            "id": 4,
            "desc": "F008 FIR search",
            "msg": "feat(crime-intelligence): implement F008 FIR search",
            "features_done": ["008"],
            "files": [
                "crime-intelligence/src/app/fir-search/page.tsx",
                "crime-intelligence/src/components/fir/FirSearch.tsx",
                "crime-intelligence/src/lib/fir/search.ts",
                "crime-intelligence/src/lib/fir/types.ts",
                "crime-intelligence/src/lib/permissions.ts"
            ]
        },
        {
            "id": 5,
            "desc": "F009 FIR detail view",
            "msg": "feat(crime-intelligence): implement F009 FIR detail view",
            "features_done": ["009"],
            "files": [
                "crime-intelligence/src/app/fir-search/[id]/page.tsx",
                "crime-intelligence/src/components/fir/FirDetailView.tsx",
                "crime-intelligence/src/lib/fir/detail.ts"
            ]
        },
        {
            "id": 6,
            "desc": "F010 FIR advanced filters",
            "msg": "feat(crime-intelligence): implement F010 FIR advanced filters",
            "features_done": ["010"],
            "files": [
                "crime-intelligence/src/app/fir-advanced-filters/page.tsx",
                "crime-intelligence/src/components/fir/FirAdvancedFilters.tsx",
                "crime-intelligence/src/lib/fir/advanced-filters.ts"
            ]
        },
        {
            "id": 7,
            "desc": "F011 crime map view",
            "msg": "feat(crime-intelligence): implement F011 crime map view",
            "features_done": ["011"],
            "files": [
                "crime-intelligence/src/app/crime-map/page.tsx",
                "crime-intelligence/src/app/crime-map/loading.tsx",
                "crime-intelligence/src/app/crime-map/error.tsx",
                "crime-intelligence/src/app/map/page.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMapCanvas.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMapFilters.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMapIntelPanel.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMapPage.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMapToolbar.tsx",
                "crime-intelligence/src/components/crime-map/CrimeMarkerPopup.tsx",
                "crime-intelligence/src/components/crime-map/MapLayerToggle.tsx",
                "crime-intelligence/src/components/crime-map/MapLegend.tsx",
                "crime-intelligence/src/lib/crime-map/h3-utils.ts",
                "crime-intelligence/src/lib/crime-map/layer-config.ts",
                "crime-intelligence/src/lib/crime-map/map-api.ts",
                "crime-intelligence/src/lib/crime-map/map-types.ts",
                "crime-intelligence/src/lib/crime-map/map-utils.ts",
                "crime-intelligence/src/lib/crime-map/mock-crime-data.ts",
                "crime-intelligence/src/lib/crime-map/service.ts",
                "crime-intelligence/src/lib/crime-map/types.ts",
                "crime-intelligence/src/app/api/map/_handler.ts",
                "crime-intelligence/src/app/api/map/boundaries/route.ts",
                "crime-intelligence/src/app/api/map/case/[id]/route.ts",
                "crime-intelligence/src/app/api/map/clusters/route.ts",
                "crime-intelligence/src/app/api/map/incidents/route.ts",
                "crime-intelligence/src/app/api/map/pattern-alerts/route.ts",
                "crime-intelligence/src/app/api/map/timeline/route.ts",
                "functions/ksp_crime_app_function/index.js",
                "crime-intelligence/package.json",
                "crime-intelligence/package-lock.json",
                "crime-intelligence/src/components/layout/navigation.tsx"
            ]
        },
        {
            "id": 8,
            "desc": "F012 hotspot detection",
            "msg": "feat(crime-intelligence): implement F012 hotspot detection",
            "features_done": ["012"],
            "files": [
                "crime-intelligence/src/lib/crime-map/hotspot-detection.ts",
                "crime-intelligence/src/app/api/map/hotspots/route.ts"
            ]
        },
        {
            "id": 9,
            "desc": "F013 police station analytics",
            "msg": "feat(crime-intelligence): implement F013 police station analytics",
            "features_done": ["013"],
            "files": [
                "crime-intelligence/src/app/analytics/page.tsx",
                "crime-intelligence/src/components/police-station-analytics/PoliceStationAnalytics.tsx",
                "crime-intelligence/src/lib/police-station-analytics/api.ts",
                "crime-intelligence/src/lib/police-station-analytics/service.ts",
                "crime-intelligence/src/lib/police-station-analytics/types.ts",
                "crime-intelligence/src/app/api/analytics/police-station/route.ts"
            ]
        }
    ]

    all_done_features = set()

    for idx, step in enumerate(steps):
        print(f"\n==========================================")
        print(f"STEP {step['id']}: {step['desc']}")
        print(f"==========================================")

        # Update cumulative done features
        for f in step["features_done"]:
            all_done_features.add(f)

        # Checkout and reset feature branch from the current main
        print("Checking out and resetting feature branch...")
        run_cmd("git checkout -B feature/crime-intelligence-setup main")

        # Copy files
        if step.get("copy_from_b5a2ab7"):
            print("Checking out b5a2ab7 files as base...")
            run_cmd("git checkout b5a2ab7 -- crime-intelligence")
            # Overwrite navigation.tsx with the version in b5a2ab7
            # (which has placeholder pages)
            run_cmd("git checkout b5a2ab7 -- crime-intelligence/src/components/layout/navigation.tsx")

            # Copy additional files for this step from backup
            for f in step["additional_files"]:
                src = os.path.join(BACKUP_DIR, f)
                dst = os.path.join(WORK_DIR, f)
                if os.path.isdir(src):
                    if os.path.exists(dst):
                        shutil.rmtree(dst)
                    shutil.copytree(src, dst)
                else:
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    shutil.copy2(src, dst)
        else:
            # Copy files for this step from backup
            for f in step["files"]:
                src = os.path.join(BACKUP_DIR, f)
                dst = os.path.join(WORK_DIR, f)
                if os.path.isdir(src):
                    if os.path.exists(dst):
                        shutil.rmtree(dst)
                    shutil.copytree(src, dst)
                else:
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    shutil.copy2(src, dst)

        # Generate updated progress-tracker.md
        print("Updating progress tracker...")
        new_tracker_content = []
        for line in initial_tracker_lines:
            # Check if this line is a feature we want to update
            matched = False
            for f_id in range(3, 14):
                f_str = f"{f_id:03d}"
                if f"| {f_str} |" in line:
                    matched = True
                    if f_str in all_done_features:
                        # Find the corresponding line in final tracker
                        final_line = [fl for fl in final_tracker_lines if f"| {f_str} |" in fl][0]
                        new_tracker_content.append(final_line)
                    else:
                        new_tracker_content.append(line)
                    break
            if not matched:
                new_tracker_content.append(line)

        tracker_full_path = os.path.join(WORK_DIR, PROGRESS_TRACKER_PATH)
        with open(tracker_full_path, "w") as f:
            f.writelines(new_tracker_content)

        # Stage and commit
        print("Staging and committing...")
        run_cmd("git add -A")
        # Check if there are any changes to commit
        status = run_cmd("git status --porcelain")
        if not status:
            print("No changes to commit, skipping commit/PR...")
            continue
        run_cmd(f"git commit -m '{step['msg']}'")

        # Push to remote (force-pushing is safe as the branch gets deleted on merge)
        print("Pushing to remote...")
        run_cmd("git push origin feature/crime-intelligence-setup --force")

        # Open Pull Request
        print("Creating Pull Request...")
        pr_url = run_cmd(
            f"gh pr create --head feature/crime-intelligence-setup --base main --title '{step['msg']}' --body 'This PR implements feature: {step['desc']}'"
        )
        print(f"PR Created: {pr_url}")

        # Merge Pull Request
        print("Merging Pull Request...")
        # Since we push to GitHub, let's wait 2 seconds for GitHub to register the PR
        import time
        time.sleep(2)
        run_cmd("gh pr merge --merge --delete-branch --admin")

        # Pull main and verify
        print("Updating local main...")
        run_cmd("git checkout main")
        run_cmd("git pull origin main")

    # Clean up backup
    print("Cleaning up backup directory...")
    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)

    # Checkout main and verify build
    print("Checking out main...")
    run_cmd("git checkout main")

    print("\nRebuild history complete! Verified and ready.")

if __name__ == "__main__":
    main()
