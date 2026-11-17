"""Create a console-importable JSON line; does not deploy or write cloud data."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
snapshot=json.loads((root/'data/weekly.json').read_text())
print(json.dumps({'_id':'latest','snapshot':snapshot},ensure_ascii=False))
