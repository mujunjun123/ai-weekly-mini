import unittest,sys,json,threading,tempfile
from pathlib import Path
from unittest.mock import patch
from urllib.request import urlopen
from urllib.error import HTTPError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import api,update
class BackendTests(unittest.TestCase):
 def test_failed_collection_preserves_snapshot(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);(root/'data').mkdir();p=root/'data/weekly.json';p.write_text('previous')
   with patch.object(update,'ROOT',root),patch.object(update.subprocess,'check_output',return_value=b'<html>bad</html>'):
    with self.assertRaises(ValueError):update.update()
   self.assertEqual(p.read_text(),'previous')
 def test_publish_and_lock(self):
  raw=b'<article class="Box-row"><h2><a href="/owner/ai-agent">AI Agent</a></h2><p>AI agent tool</p><a href="/owner/ai-agent/stargazers">1,234</a><span>123 stars this week</span></article>'
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder)
   for directory in ['data','miniprogram/utils','preview']:(root/directory).mkdir(parents=True)
   with patch.object(update,'ROOT',root),patch.object(update.subprocess,'check_output',return_value=raw):
    result=update.update()
    self.assertEqual(json.loads((root/'data/weekly.json').read_text()),result)
    self.assertEqual(len(list((root/'data/snapshots').glob('*.json'))),1)
    with update.update_lock():
     with self.assertRaises(BlockingIOError):update.update()
 def test_api_is_readonly(self):
  server=api.ThreadingHTTPServer(('127.0.0.1',0),api.Handler)
  threading.Thread(target=server.serve_forever,daemon=True).start()
  url='http://127.0.0.1:'+str(server.server_port)
  try:
   with patch.object(update,'update',side_effect=AssertionError('must not collect')):
    with urlopen(url+'/v1/weekly?refresh=1') as response:self.assertEqual(json.load(response)['schemaVersion'],1)
    for path in ['/.env','/data/weekly.json','/scripts/update.py']:
     with self.assertRaises(HTTPError) as error:urlopen(url+path)
     self.assertEqual(error.exception.code,404)
   with tempfile.TemporaryDirectory() as folder,patch.object(api,'ROOT',Path(folder)):
    with self.assertRaises(HTTPError) as error:urlopen(url+'/v1/weekly')
    self.assertEqual(error.exception.code,503)
  finally:server.shutdown();server.server_close()
if __name__=='__main__':unittest.main()
