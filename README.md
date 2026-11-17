# AI 开源真实周榜

## 使用
双击 start.command 启动本地服务，然后访问 http://127.0.0.1:8765/preview/ 。服务运行期间每小时采集一次，页面可手动刷新。关闭服务或电脑休眠后不会继续采集。直接打开 preview/index.html 只能查看上次成功快照。

## 数据口径
来源 https://github.com/trending?since=weekly 。从官方 Trending 周榜通过项目名称与简介关键词筛选 AI 项目，再按官方 stars this week 降序排列。不是 GitHub 全站排名，不等同于已结束自然周的净增 Star。类别为本地规则分类；简介保留来源原文。更新时间为抓取成功时间（北京时间），不是 GitHub 自身更新时间。解析失败保留旧榜并显示刷新失败。

原始页面 data/source-latest.html；结构化数据 data/weekly.json。抓取脚本 scripts/update.py。独立更新命令：.venv/bin/python scripts/update.py。

## 微信小程序
微信开发者工具导入本目录，选择测试号或替换 project.config.json 中 AppID。目前使用同一真实数据的随包快照；每次运行更新脚本会同步 miniprogram/utils/data.js。小程序自动在线刷新尚未接入，需要可供微信访问的 HTTPS 服务与合法域名配置。尚未进行微信真机验证、未发布。

## 安装
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/serve.py

## 开发参考
参考 huchenme/github-trending-api 的采集结构，将仓库地址、总星标与周期新增星标分开，解析与展示独立。本项目采用独立 Python 实现，没有接入该项目的公共 API。详见 REFERENCES.md。

## 在线接入开发（2026-11-18）

已配置正式 AppID，增加缓存优先、后台同步、下拉刷新、离线缓存、复制 URL 与本地收藏保持。在线地址默认留空，待配置；本地可先查看随包真实快照。

生产只读 API、每小时采集服务模板、可选云开发读取适配和测试已添加。部署步骤与尚未完成的后台操作见 [部署与验收](docs/部署与验收.md)。上述原始“尚未接入”的描述为初始状态，以本节为准。没有开通云资源或完成真机发布。
