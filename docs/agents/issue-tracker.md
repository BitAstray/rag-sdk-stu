# Issue Tracker: 本地 Markdown

本仓库的 Issue 和 PRD 以 Markdown 文件形式存储在 `.scratch/` 目录下。

## 约定

- 每个功能一个目录：`.scratch/<feature-slug>/`
- PRD 文件：`.scratch/<feature-slug>/PRD.md`
- 实现 Issue：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号
- 分流状态记录在每个 Issue 文件顶部附近的 `Status:` 行（参见 `triage-labels.md` 中的角色字符串）
- 评论和对话记录追加在文件底部的 `## Comments` 标题下

## 当技能说"发布到问题追踪器"时

在 `.scratch/<feature-slug>/` 下创建新文件（如需要则创建目录）。

## 当技能说"获取相关票据"时

读取引用路径处的文件。用户通常会直接传递路径或 Issue 编号。
