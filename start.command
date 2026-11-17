#!/bin/zsh
cd "${0:A:h}"
if [[ ! -x .venv/bin/python ]]; then
 python3 -m venv .venv || exit 1
 .venv/bin/pip install -r requirements.txt || exit 1
fi
open 'http://127.0.0.1:8765/preview/'
exec .venv/bin/python scripts/serve.py
