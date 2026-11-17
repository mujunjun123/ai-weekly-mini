# 开发参考

- 项目：https://github.com/huchenme/github-trending-api
- 阅读的代码：https://github.com/huchenme/github-trending-api/blob/master/src/functions/utils/fetch.js
- 阅读的接口层：https://github.com/huchenme/github-trending-api/blob/master/src/functions/repositories.js
- 参考时间：2026-11-17
- 上游许可证：MIT；当前未复制或打包其源文件，也未安装其依赖。

本次借鉴的是实现思路：将 Trending 页面解析为独立的仓库记录；源码 URL 与 owner/repo 对应；总 Star 和周期新增 Star 分开保存；解析和请求分离；源页面异常时保留已有数据。

对应改动：scripts/trending.py 独立解析并校验 URL、周增数据和重复仓库；scripts/update.py 接入解析器；预览列表的项目名称为 GitHub 仓库直达链接。保留当前中文简介、右侧彩色标签与收藏入口。

上游选择器与数字处理未直接照搬，以本次保存的 GitHub 页面为依据验证。未引入第三方公共 API，不改变现有榜单范围。
