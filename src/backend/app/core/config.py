from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
DEFAULT_DATA_FILE = DATA_DIR / "tagged_recipes.csv"
IFCT_DB_PATH = DATA_DIR / "ifct.db"