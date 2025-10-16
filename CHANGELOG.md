# 项目版本修改记录

本文件用于全程维护项目的版本修改记录，记录每次重要变更、修复与验证步骤，确保团队成员可以追踪历史与定位问题。

## 维护规则

- 更新时机：完成一次可感知的变更（功能、样式、结构、配置、文档）后立即更新本文件。
- 记录内容：日期、变更类型（Feature/Fix/Style/Docs/Build）、简要描述、涉及文件、验证方式/预览地址（如有）。
- 书写格式：采用倒序时间排列，最近的变更在最上方。
- 文件路径：使用相对路径，便于快速定位。

## 记录模板

```
### YYYY-MM-DD
- [类型] 变更标题/简述
  - 涉及文件：
  - 说明/验证：
```

---

## 变更历史

### 2025-10-16
- [Fix/Chart] 修复“任务结果”区图表不显示问题：为 ChartContainer 增加尺寸检测与数值回退，避免父容器宽/高为 0 时 Recharts 无法渲染；当检测到 0 尺寸时以 640×240 作为回退尺寸渲染；正常情况下仍维持 width/height 为 100% 的响应式。
  - 涉及文件：
    - src/components/ui/chart.tsx（新增 ResizeObserver 尺寸测量；在 ResponsiveContainer 上增加数值回退逻辑；保留 w-full 与 min-h-[220px]）
    - src/components/TaskDetailFullPage.tsx（确认“指标趋势/时序预测/预测值vs真实值/残差图/误差直方图/模型对比”等 6 类图表使用示例数据渲染）
  - 说明/验证：使用 `npm run dev` 启动 Vite，本地预览 http://localhost:3000/；进入某个“时序预测”任务的“任务结果”页签，6 类图表均能正常显示（无控制台报错）。

- [Docs] 更新版本修改记录，补充本次修复说明与验证步骤。
  - 预览地址：http://localhost:3000/
 
 - [Feature/UI] 将“参数 JSON 回显”从“参数配置”区移动至“任务产物”区进行展示，并在产物列表新增 `task_params.json` 条目；为该条目绑定“下载”直接导出 JSON 与“预览”滚动定位到下方卡片；预览区增大高度并使用 `whitespace-pre` 确保格式完整呈现。
   - 涉及文件：
     - src/components/TaskDetailFullPage.tsx（新增 artifacts 列表项、产物区参数 JSON 卡片、下载/预览行为联动；移除参数配置区的旧卡片）
   - 说明/验证：运行 `npm run dev`，在任务详情页左侧点击“任务产物”，确认列表出现 `task_params.json`；点击“预览”会滚动到下方“参数 JSON 回显”卡片，点击“下载”直接导出 JSON 文件；预览区域可完整显示格式化 JSON；预览地址 http://localhost:3000/。
  

### 2025-10-11
- [Fix/UX] 数据预处理规则卡片：移除“启用/禁用”开关，仅保留右侧删除按钮；清洗规则将按当前配置执行（不再提供启用开关）
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（删除 Switch 引用与开关 UI，保留并右对齐删除按钮）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理 -> 创建预处理任务”，规则卡片顶部不再出现开关，仅保留右侧删除按钮；控制台无错误。

- [Feature/UX] Solo 模式策略选择：语音输入替换为文本输入，并新增占位提示
  - 占位提示文案：请让输入自然语言指令，例如对数据进行去重、缺失值填充（均值/众数/前向填充）
  - 涉及文件：
    - src/components/SoloDataCleaning.tsx（移除语音入口 UI，新增 Label/Textarea 与占位提示）
  - 说明/验证：在 http://localhost:3000/ 打开 Solo 模式，策略选择区域显示文本输入框与上述占位提示，无语音控件。

- [Feature/AI] 文本指令与策略联动：基于关键词的自动勾选与排序
  - 变更点：
    - 新增 strategyKeywordMap（去重、缺失值填充：均值/众数/前向填充、格式标准化、异常值、文本标准化等关键词）。
    - computeStrategyScores 对文本进行关键词匹配评分。
    - 在“策略选择”步骤中，根据分数对策略排序，并自动勾选匹配到的策略（保留用户已有选择）。
  - 涉及文件：
    - src/components/SoloDataCleaning.tsx（新增映射、评分与 useEffect 联动逻辑）
  - 说明/验证：在策略文本框输入“去重，并对缺失值做前向填充与均值填充”，相关策略将自动靠前排序并被勾选。

- [Build/Dev] 启动本地开发服务器以验证上述 UI 交互
  - 预览地址：http://localhost:3000/
  

### 2025-10-10
- [Feature/UX] 项目详情页（Solo 模式）新增“语音指令入口”与“本次与历史 Solo 会话记录”展示：
  - 语音入口包含录音按钮（占位实现）、文本输入与执行按钮；执行后将指令转为简化任务并记录。
  - 会话记录展示简化任务名、时间与“查看详情”入口；详情含原始指令与预计执行步骤。
  - 涉及文件：
    - src/components/ProjectDetailCards.tsx（新增 Mic/Square/Send/MessageSquare/Clock/Eye 图标、语义理解示例 semanticSimplify、会话记录 UI 与交互）。
  - 说明/验证：在 http://localhost:3000/ 进入项目详情（Solo 模式），右下角卡片可输入指令并执行；左下角记录区新增条目，点击“查看详情”展开原始指令与步骤。

- [Feature/Security] 数据上传与数据源新增：强制“所属项目”必选与“权限设置”可见性说明，公开权限覆盖项目成员可见性：
  - 涉及文件：
    - src/components/DataUpload.tsx（新增 projectId、permission 字段与校验；可见性预览区）。
    - src/components/DataSubscription.tsx（新增 projectId、permission 字段与校验；可见性预览区）。
  - 说明/验证：未选择项目时阻止上传/创建并提示；切换为公开时展示“公开数据”徽标与覆盖说明。

### 2025-10-10
- [Feature/Style] 报表页交互维度选择：新增无数据时的模拟字段选项与默认全选；未选项默认文字色改为黑色
  - 涉及文件：
    - src/components/ReportView.tsx（FALLBACK_X/FALLBACK_Y；未选标签文字色、边框调整；初始化选择与联动）
  - 说明/验证：在 http://localhost:3000/ 打开“分析报表”，若未加载数据，X 显示 12 个示例字段、Y 显示 prediction/actual，均可多选；未选标签文本为黑色，交互与下方数据表联动正常。

### 2025-10-10
- [Fix/UX] 移除项目详情中的“项目完成度”字段与进度条显示
  - 背景：当前系统无法准确计算完成度指标，展示可能造成误导。
  - 涉及文件：
    - src/components/ProjectDetailCards.tsx（删除完成度区块与 Progress 引用）
  - 说明/验证：在 http://localhost:3000/ 进入项目详情页，基本信息卡片中不再显示“项目完成度”与进度条，布局保持正常。

### 2025-10-10
- [Build/Automation] 引入 Husky + Commitlint，并新增 pre-commit 自动校验：当 src/styles/vite.config.ts/package.json 有改动时，要求本次提交同步更新 CHANGELOG.md 且包含当天日期段（如：`### 2025-10-10`）。
  - 涉及文件：
    - package.json（新增 devDependencies 与 prepare/check 脚本）
    - commitlint.config.cjs（提交信息规范：Conventional Commits）
    - scripts/check-changelog.js（自定义校验脚本）
    - .husky/pre-commit、.husky/commit-msg（Git 钩子）
  - 说明/验证：修改 src 任意文件后尝试提交，若未更新 CHANGELOG.md 将被阻止；更新并暂存 CHANGELOG 后提交可通过。提交信息需符合 Conventional Commits 规范。

### 2025-10-10
- [Fix/UX] 预处理创建流程补全：新增 Step 0“选择数据集”，统一从列表页与行内入口的流程顺序
  - 背景：点击“创建预处理任务”直接跳到“字段选择”，缺失数据集选择步骤，导致不同入口的流程不一致。
  - 变更点：
    - 新增 Step 0“选择数据集”，整体流程调整为 0 选择数据集 → 1 字段选择 → 2 规则配置 → 3 预览结果。
    - 引入 `selectedDatasetId` 状态并在进入“字段选择”后按所选数据集加载字段信息。
    - 从数据集行内入口打开时自动预选对应数据集，但仍停留在 Step 0 显示已选数据集，以保持流程一致性。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（新增步骤、状态与 Tabs；调整 useEffect 与加载逻辑；更新步骤指示器为四步）
    - src/components/DataManagement.tsx（列表页“创建预处理任务”不传 datasetId；行内预处理传入 datasetId）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理”，点击“创建预处理任务”应首先显示“选择数据集”步骤；选择数据集并点击“下一步：字段选择”后再加载字段信息；从数据集行内入口也应先停留在“选择数据集”，但已预选目标数据集。

### 2025-10-10
- [Fix/UX] 修复数据管理模块中“数据预处理”入口点击后直接弹窗的问题，恢复为任务列表页面优先展示
  - 说明：切换到“数据预处理”子菜单时，先展示“预处理任务管理”列表与“创建预处理任务”按钮；仅在点击“创建预处理任务”或数据集行内的预处理操作时再打开预处理弹窗。
  - 涉及文件：
    - src/components/DataManagement.tsx（新增任务列表 UI、状态与操作；移除子菜单中直接渲染弹窗的逻辑）
  - 说明/验证：在本地预览 http://localhost:3000/ 打开“数据管理 -> 数据预处理”，应看到任务列表与信息提示条；点击“创建预处理任务”后弹出预处理对话框。

### 2025-10-10
- [Fix/Style] 调整“数据预处理”弹窗宽度与滚动以避免水平滚动条
  - 主要修改：将弹窗容器从 `max-w-7xl`/默认 `sm:max-w-lg` 改为 `sm:max-w-6xl max-w-6xl w-[95vw]`，并增加 `overflow-x-hidden` 与 `max-h-[90vh] overflow-y-auto`；同时让次级弹窗在小屏下 `w-[95vw]`，避免过窄导致内容挤压。
  - 涉及文件：
    - src/components/DataPreprocessing.tsx（更新 DialogContent 样式类名）
  - 说明/验证：在 http://localhost:3000/ 打开“数据管理 -> 数据预处理 -> 创建预处理任务”，弹窗应在桌面端宽屏达到 6xl（约 72rem）且不出现水平滚动，内容可在垂直方向滚动查看。

### 2025-10-10
- [Feature/UX] 在项目管理的“复制项目”弹窗中新增三项可选内容（复选框，默认全部勾选）：
  - 复制项目下的任务
  - 复制项目下的数据集
  - 复制项目成员
  - 若用户取消所有勾选，则仅复制项目基础信息（项目名称与描述）。
  - 涉及文件：
    - src/App.tsx（新增 Checkbox 组件引用与状态逻辑，更新对话框内容与确认逻辑）
  - 说明/验证：在本地预览 http://localhost:3000/ 中打开“项目管理 -> 复制项目”，确认三个复选框默认勾选、布局清晰，取消全部时仅复制基础信息。

### 2025-10-10
- [Style/Fix] 调整“任务对比预览”对话框的高度与滚动，避免内容超出页面后无法完整查看
  - 涉及文件：
    - src/App.tsx
    - src/components/TaskManagement.tsx
  - 主要修改：在 DialogContent 上增加 `max-h-[90vh]` 与 `overflow-y-auto`，确保内容在视口内可滚动查看。
  - 说明/验证：在本地预览中确认纵向可滚动、内容可完整查看。

- [Style/Responsive] 统一“任务对比预览”对话框宽度策略以适配大屏并避免横向滚动
  - 涉及文件：
    - src/App.tsx
    - src/components/TaskManagement.tsx
  - 主要修改：设置 `sm:max-w-6xl max-w-6xl w-[95vw]`，并隐藏横向滚动 `overflow-x-hidden`，保证大屏自适应、内容尽量在宽度内完整展示。
  - 说明/验证：在本地预览 http://localhost:3000/ 验证无水平滚动、宽度在大屏达到 `max-w-6xl`。

- [Build/Dev] 启动本地开发服务器以验证 UI 修改
  - 涉及文件：vite.config.ts（端口配置 3000）
  - 说明/验证：通过 `npm run dev` 启动 Vite 开发服务器，预览地址为 http://localhost:3000/。

- [Docs/Repo] 初始化 Git 仓库并配置远程
  - 说明：执行 `git init`；添加远程仓库 `origin` -> `https://github.com/luciowlx/learngit.git`；完成首次提交 `Initial commit`。

---

如需进一步自动化维护（例如在提交前检查是否更新此日志），可在后续增加提交规范或自动化脚本（例如使用 commitlint/linters 或自定义 Pre-Commit 钩子）。