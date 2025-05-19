# SnapLearn 贡献指南

感谢你有兴趣为 SnapLearn 做出贡献！无论你是开发者、设计师、教育者还是学习者，我们都欢迎你的加入。

---

## 如何参与

- **功能开发**：前端、后端、AI/NLP、移动端等
- **Bug 修复**：发现并修复问题
- **文档完善**：补充/优化文档、翻译
- **UI/UX 设计**：界面与交互优化
- **内容建议**：教学内容、视频上传建议
- **社区推广**：宣传、答疑、组织活动

---

## 开发流程

1. **Fork 本仓库**，并 clone 到本地
2. 新建分支（建议使用 `feature/xxx` 或 `fix/xxx` 命名）
3. 开发并提交代码，确保通过本地测试
4. Push 到你的 Fork，并发起 Pull Request（PR）
5. 填写清晰的 PR 标题和描述，关联相关 Issue（如有）
6. 等待 Review，按需修改，合并后贡献完成

---

## Issue 提交规范

- 标题简明扼要，正文描述清楚问题/建议
- 如为 Bug，请尽量提供复现步骤、截图、环境信息
- 功能建议请说明场景、预期效果
- 标签（bug/feature/docs/question）可选

---

## Pull Request 规范

- 每个 PR 只做一件事，避免大杂烩
- 代码需通过本地测试（前端：`npm test`，后端：`python manage.py test`）
- 遵循项目代码风格（见下）
- 如涉及 UI，建议附截图
- 关联相关 Issue（如有），格式：`Closes #123`

---

## 代码风格

- **前端**：遵循 [Airbnb JavaScript/React Style Guide](https://github.com/airbnb/javascript)
- **后端**：遵循 [PEP8](https://pep8.org/)，推荐使用 `black` 格式化
- **注释**：关键逻辑需有注释，函数/类建议写 docstring
- **提交信息**：建议使用英文，格式如 `fix: 修复登录异常`、`feat: 新增AI批改接口`

---

## 本地开发建议

- 推荐使用虚拟环境（venv/conda）
- 前端建议用 VSCode + ESLint/Prettier
- 后端建议用 PyCharm/VSCode + black/isort
- 详细开发环境见 [README.md](README.md)

---

## 社区行为准则

- 尊重每一位贡献者，友善沟通
- 禁止歧视、骚扰、恶意攻击等行为
- 共同维护开放、包容、创新的社区氛围
- 详见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## 常见问题

- 见 [FAQ.md](docs/FAQ.md)
- 有疑问欢迎在 [Discussions](https://github.com/yourusername/snaplearn/discussions) 提问

---

## 联系我们

- GitHub Issue/PR/Discussions
- 邮箱：eatonchen@hotmail.com

---

再次感谢你的贡献！  
让我们一起用代码改变教育，让学习更高效有趣 🚀
