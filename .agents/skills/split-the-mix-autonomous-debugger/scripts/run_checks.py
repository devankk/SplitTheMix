#!/usr/bin/env python3
"""
SplitTheMix: Automated Health & Regression Test Runner
Used by the split-the-mix-autonomous-debugger skill.
"""
import subprocess
import sys
import os

def run_step(name: str, cmd: list[str], cwd: str = None, shell: bool = False) -> bool:
    print(f"\n==========================================")
    print(f"[RUNNING] {name}")
    print(f"Command: {' '.join(cmd)}")
    print(f"Working Dir: {cwd}")
    print(f"==========================================")
    res = subprocess.run(cmd, cwd=cwd, shell=shell)
    if res.returncode == 0:
        print(f"--> [PASSED] {name}")
        return True
    else:
        print(f"--> [FAILED] {name} (exit code {res.returncode})")
        return False

def main():
    # .agents/skills/split-the-mix-autonomous-debugger/scripts -> root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".."))
    backend_dir = os.path.join(repo_root, "backend")
    frontend_dir = os.path.join(repo_root, "frontend")

    all_passed = True

    # 1. Backend Unit & Regression Tests
    ok = run_step(
        "Backend Audio Engine Regression Tests",
        [sys.executable, "-m", "unittest", "backend.tests.test_audio_engine", "-v"],
        cwd=repo_root
    )
    all_passed = all_passed and ok

    # 2. FastAPI Backend App Import Check
    backend_import_code = (
        f"import sys; sys.path.insert(0, r'{backend_dir}'); "
        "import main; print('Title:', main.app.title)"
    )
    ok = run_step(
        "FastAPI Backend Import Check",
        [sys.executable, "-c", backend_import_code],
        cwd=repo_root
    )
    all_passed = all_passed and ok

    # 3. Frontend Production Build Check
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    ok = run_step(
        "Frontend Production Build Check",
        [npm_cmd, "run", "build"],
        cwd=frontend_dir,
        shell=True
    )
    all_passed = all_passed and ok

    print("\n==========================================")
    if all_passed:
        print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        print("==========================================")
        sys.exit(0)
    else:
        print("SOME VERIFICATION CHECKS FAILED.")
        print("==========================================")
        sys.exit(1)

if __name__ == "__main__":
    main()
