# 站点统计部署配置

首页「站点足迹」卡片和 `/dashboard` 使用同一个 Google Analytics 4 汇总接口。页面代码已经接入，线上显示真实数字还需要给服务端提供只读访问凭据。

## 1. 建立只读服务账号

先登录 [Google Cloud 控制台](https://console.cloud.google.com/)，在页面顶部选择项目。如果列表中还没有可用项目，直接打开[新建 Google Cloud 项目](https://console.cloud.google.com/projectcreate)创建一个。这里的 Cloud 项目用于开通 API 和创建服务账号，与下方的 GA4「媒体资源」是两种不同的项目。以下页面都需要在顶部选中同一个 Cloud 项目：

1. 打开 [Google Analytics Data API 页面](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)，点击**启用**。如果已经显示「管理」，说明已启用。
2. 打开 [服务账号页面](https://console.cloud.google.com/iam-admin/serviceaccounts)，点击**创建服务账号**。创建后点进该账号，在「密钥」中添加一个 **JSON** 格式的新密钥。只需从下载的 JSON 中取出 `client_email` 和 `private_key`；不要把密钥文件提交到 GitHub。
3. 打开你的 [Google Analytics 管理页](https://analytics.google.com/analytics/web/#/a375944076p514187741/admin)，在「媒体资源 → 媒体资源访问权限管理」中，把服务账号的 `client_email` 加为 **Viewer（查看者）**。要授权的 GA4 媒体资源 ID 是 `514187741`。

如果 Google Cloud 链接跳到登录页，登录后返回原链接即可。第一次进入时，先在顶部项目选择器选中或创建 Cloud 项目。

## 2. 设置 Vercel 环境变量

直接打开 [你的网站 Vercel 环境变量页面](https://vercel.com/jupiterinjulys-projects-56c0e6e6/notion-next-qsuf/settings/environment-variables)，在 **Production** 环境添加下表三项。这个地址对应本地已关联的团队 `jupiterinjuly's projects` 和项目 `notion-next-qsuf`。如果直达链接要求登录，可从 [Vercel 控制台](https://vercel.com/dashboard)依次选择该团队 → `notion-next-qsuf` → Settings → Environment Variables。

| Key | Value | 类型 |
| --- | --- | --- |
| `GA_PROPERTY_ID` | `514187741` | Config |
| `GA_CLIENT_EMAIL` | JSON 中的 `client_email` | Secret |
| `GA_PRIVATE_KEY` | JSON 中的完整 `private_key`，包括 BEGIN/END 行 | Secret |

这三个变量都不要加 `NEXT_PUBLIC_`。私钥可以保留真实换行，也可以粘贴包含 `\n` 的 JSON 字符串值；服务端会处理转义换行。保存后重新部署，旧部署不会自动获得新增变量。

## 3. 验收

部署完成后打开 [统计接口](https://www.jupytermou.cn/api/analytics/summary)：应返回包含 `summary`、`trend`、`topPages` 和 `countries` 的 JSON。再检查[首页](https://www.jupytermou.cn/)卡片和[完整仪表盘](https://www.jupytermou.cn/dashboard)。如果接口返回 503，说明变量没有在当前部署生效；如果返回 502，优先核对 Data API 是否启用、服务账号是否获得媒体资源 Viewer 权限，以及私钥是否完整。

接口和浏览器页面每 30 分钟刷新一次。历史数字仅覆盖这项 GA4 媒体资源开始采集后的访问；地球上的点是国家聚合位置，不是访客的真实 IP 或精确位置。
