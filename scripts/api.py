"""Read-only origin. Put HTTPS and request limits in a reverse proxy."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json, os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  if self.path.split('?')[0] != '/v1/weekly':
   self.send_response(404); self.end_headers(); return
  try:
   data=(ROOT/'data/weekly.json').read_bytes()
   value=json.loads(data)
   if value.get('schemaVersion') != 1 or not value.get('projects'): raise ValueError()
   status=200
  except (OSError,ValueError):
   data=b'{"error":"snapshot_unavailable"}'; status=503
  self.send_response(status)
  self.send_header('Content-Type','application/json; charset=utf-8')
  self.send_header('Cache-Control','public, max-age=60' if status==200 else 'no-store')
  self.send_header('Content-Length',str(len(data)))
  self.end_headers(); self.wfile.write(data)
if __name__=='__main__':
 ThreadingHTTPServer((os.environ.get('BIND','127.0.0.1'),int(os.environ.get('PORT','8767'))),Handler).serve_forever()
