# 安全与隐私

本项目在用户本机运行。用量来自客户端自带 Codex CLI 的账号接口；只把 5h、Week 的百分比和重置时间送到本机 Codex 窗口显示。程序不读取聊天正文、项目文件、会话数据库，也不要求提供 API Key、Cookie 或访问令牌。

界面连接仅访问 `127.0.0.1:39222`。安装脚本把助手放在当前用户的 `~/Library/Application Support/CodexUsageBadge`，注册当前用户的 LaunchAgent，不修改 Codex 应用包。诊断结果可能包含使用百分比和本机安装路径；分享诊断输出前请自行检查。

项目不包含遥测或自动更新任务。用量读取依赖 Codex CLI 自身的网络连接；本项目不会把账号数据发送到其他服务。

## 报告问题

请在 [GitHub Issues](https://github.com/mingyue220/codex-usage-2rings/issues) 报告非敏感问题。不要公开提交账号 ID、凭据、完整日志或个人目录内容。涉及敏感信息时，请先创建不含敏感数据的最小复现说明。
