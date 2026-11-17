const weekly = require('../../services/weekly');
const projects = require('../../utils/data');
const meta = require('../../utils/meta');
Page({
 data:{meta,total:projects.length,growthTotal:(projects.reduce((n,p)=>n+p.growth,0)/1000).toFixed(1),categoryTotal:new Set(projects.map(p=>p.category)).size,projects:[],categories:['全部',...new Set(projects.map(p=>p.category))],category:'全部',query:'',tab:'榜单',saved:[],selected:null,period:0,periods:['2026.11.09 — 11.15','2026.11.02 — 11.08'],sort:'growth'},
 onLoad(){let saved=[];try{saved=wx.getStorageSync('ai-weekly-saved')||[]}catch(_){}this.setData({saved:Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[]});const cached=weekly.initial();this.applySnapshot(cached.snapshot,cached.origin);this.sync()},
 applySnapshot(snapshot,origin){this.snapshot=snapshot;const list=snapshot.projects;const categories=['全部',...new Set(list.map(p=>p.category))];this.setData({meta:snapshot,origin,categories,category:categories.includes(this.data.category)?this.data.category:'全部',total:list.length,growthTotal:(list.reduce((n,p)=>n+p.growth,0)/1000).toFixed(1),categoryTotal:categories.length-1,delayed:Date.now()-Date.parse(snapshot.updatedAt)>7200000,selected:this.data.selected?list.find(p=>p.id===this.data.selected.id)||null:null});this.refresh()},
 sync(){if(this.loading)return this.loading;this.setData({syncing:true,status:'正在同步…'});this.loading=weekly.fetchLatest().then(snapshot=>{if(!this.disposed){this.applySnapshot(snapshot,'云端榜单');this.setData({status:'已同步，数据更新于 '+snapshot.updatedAt})}}).catch(error=>{if(!this.disposed){const message=error&&error.message;this.setData({status:message==='服务端快照较旧'?'已连接云端，云端版本较旧，保留'+this.data.origin:message==='榜单格式错误'||message==='项目字段错误'?'云端数据格式异常，保留'+this.data.origin:'云端读取失败，保留'+this.data.origin});}}).finally(()=>{this.loading=null;if(!this.disposed)this.setData({syncing:false});wx.stopPullDownRefresh()});return this.loading},
 onPullDownRefresh(){this.sync()},
 onUnload(){this.disposed=true},
 refresh(){let list=this.snapshot.projects.filter(p=>(this.data.category==='全部'||p.category===this.data.category)&&(!this.data.query||(p.name+' '+(p.summary||'')+' '+p.desc+' '+p.category).toLowerCase().includes(this.data.query.toLowerCase()))&&(this.data.tab!=='收藏'||this.data.saved.includes(p.id)));if(this.data.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));this.setData({projects:list.map(p=>({...p,growthLabel:p.growth.toLocaleString('en-US'),saved:this.data.saved.includes(p.id)}))})},
 search(e){this.setData({query:e.detail.value});this.refresh()},
 category(e){this.setData({category:e.currentTarget.dataset.value});this.refresh()},
 tab(e){this.setData({tab:e.currentTarget.dataset.value});this.refresh()},
 detail(e){this.setData({selected:this.snapshot.projects.find(p=>p.id===e.currentTarget.dataset.id)})},
 close(){this.setData({selected:null})}, noop(){},
 save(e){const id=e.currentTarget.dataset.id;const saved=this.data.saved.includes(id)?this.data.saved.filter(x=>x!==id):[...this.data.saved,id];this.setData({saved});try{wx.setStorageSync('ai-weekly-saved',saved)}catch(_){wx.showToast({title:'设备存储已满，收藏仅本次有效',icon:'none'});this.refresh();return;}this.refresh();wx.showToast({title:saved.includes(id)?'已收藏':'已取消收藏',icon:'none'})},
 period(){wx.showModal({title:'真实周榜快照',content:'更新时间：'+this.data.meta.updatedAt+'。下拉刷新只读取共享快照，不触发采集。',showCancel:false})},
 sort(){this.setData({sort:this.data.sort==='growth'?'name':'growth'});this.refresh()},
 copy(e){const id=e&&e.currentTarget.dataset.id;const project=id?this.snapshot.projects.find(p=>p.id===id):this.data.selected;if(project)wx.setClipboardData({data:project.url,success:()=>wx.showToast({title:'已复制，请在浏览器打开',icon:'none'})})},
 onShareAppMessage(){return{title:'本周值得关注的 AI 开源项目',path:'/pages/index/index'}}
});
