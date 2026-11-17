from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import json,threading,time,sys
from update import update,ROOT
lock=threading.Lock()
def refresh():
 with lock:return update()
def periodic():
 while True:
  time.sleep(3600)
  try:refresh()
  except Exception as e:print('更新失败，保留上次数据：',e,flush=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path.split('?')[0]=='/api/weekly':
   try:
    p=ROOT/'data/weekly.json'
    if 'refresh=1' in self.path or not p.exists() or time.time()-p.stat().st_mtime>3600:refresh()
    data=p.read_bytes();self.send_response(200)
   except Exception:
    data=json.dumps({'error':'GitHub 更新失败，请稍后重试；页面保留上次成功数据。'}).encode();self.send_response(502)
   self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
  else:super().do_GET()
threading.Thread(target=periodic,daemon=True).start()
print('Local: http://127.0.0.1:8765/preview/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
