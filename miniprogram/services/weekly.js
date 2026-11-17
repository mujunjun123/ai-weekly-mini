const config = require('../config');
const KEY = 'ai-weekly-snapshot-v1';
function validate(value) {
  if (!value || value.schemaVersion !== 1 || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value.updatedAt) || !Number.isFinite(Date.parse(value.updatedAt)) || Date.parse(value.updatedAt) > Date.now()+300000 || !Array.isArray(value.projects) || !value.projects.length || value.projects.length > 500) throw Error('榜单格式错误');
  const ids = new Set();
  value.projects.forEach(p => {
    if (!p || typeof p.id !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(p.id) || ids.has(p.id) || p.name !== p.id || p.url !== 'https://github.com/'+p.id || !Number.isSafeInteger(p.growth) || p.growth < 0 || !Number.isSafeInteger(p.totalStars) || p.totalStars < 0 || !Number.isSafeInteger(p.rank) || p.rank < 1 || typeof p.category !== 'string' || !/^#[0-9a-f]{6}$/i.test(p.color) || typeof p.summary !== 'string') throw Error('项目字段错误');
    ids.add(p.id);
  });
  return value;
}
function initial() {
  try { return {snapshot:validate(wx.getStorageSync(KEY)), origin:'设备缓存'}; } catch (_) {}
  return {snapshot:validate(Object.assign({schemaVersion:1}, require('../utils/meta'), {projects:require('../utils/data')})), origin:'随包快照'};
}
let pending;
function fetchLatest() {
  if (pending) return pending;
  pending = new Promise((resolve,reject) => {
    if (config.transport === 'cloud') {
      if (!config.cloudEnv || !wx.cloud) return reject(Error('请配置云开发环境'));
      const timer=setTimeout(()=>reject(Error('云端读取超时')),config.timeout);
      wx.cloud.callFunction({name:config.cloudFunction,config:{env:config.cloudEnv},data:{},success:r=>{clearTimeout(timer);resolve(r.result);},fail:e=>{clearTimeout(timer);reject(e);}});
    } else {
      if (!/^https:\/\//.test(config.apiUrl)) return reject(Error('请配置 HTTPS 数据接口'));
      wx.request({url:config.apiUrl,method:'GET',timeout:config.timeout,success:r=>r.statusCode===200?resolve(r.data):reject(Error('接口暂不可用')),fail:reject});
    }
  }).then(validate).then(snapshot => {
    const current=initial().snapshot;
    if (Date.parse(snapshot.updatedAt)<Date.parse(current.updatedAt)) throw Error('服务端快照较旧');
    try { wx.setStorageSync(KEY,snapshot); } catch (_) {}
    return snapshot;
  }).finally(()=>{pending=null;});
  return pending;
}
module.exports={validate,initial,fetchLatest};
