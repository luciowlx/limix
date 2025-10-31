import { useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { DataManagement } from "./components/DataManagement";
import { TaskManagement } from "./components/TaskManagement";
import { ModelManagement } from "./components/ModelManagement";
import { ModelTuning } from "./components/ModelTuning";
import { SystemManagement } from "./components/SystemManagement";
import { PersonalCenterDialog } from "./components/PersonalCenterDialog";
import { PersonalizationSettings } from "./components/PersonalizationSettings";
import { SoloMode } from "./components/SoloMode";
import { FullPageView } from "./components/FullPageView";
import { ReportView } from "./components/ReportView";
import { DataDetailFullPage } from "./components/DataDetailFullPage";
import TaskDetailFullPage from "./components/TaskDetailFullPage";
import TaskCompare from "./components/TaskCompare";
import { TASK_TYPES } from "./utils/taskTypes";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectDetailCards } from "./components/ProjectDetailCards";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { X, Search, Grid3X3, List, ChevronDown, Calendar, Users, Database, TrendingUp, Clock, CheckCircle, Settings, UserPlus, Mail, Trash2, Eye, Archive, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { Checkbox } from "./components/ui/checkbox";
import FloatingAssistantEntry from "./components/FloatingAssistantEntry";
import TeamMemberSelector from "./components/TeamMemberSelector";
import { registeredUsers } from "./mock/users";
import { Popover, PopoverTrigger, PopoverContent } from "./components/ui/popover";
import { Calendar as DateRangeCalendar } from "./components/ui/calendar";

export default function App() {
  const [activeTab, setActiveTab] = useState("看板");
  const [showModelTuning, setShowModelTuning] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    projectName: "",
    projectDescription: "",
    projectStartDate: "", // 项目开始日期
    projectEndDate: "", // 项目结束日期
    projectVisibility: "private", // 项目权限（private/public）
    teamLeader: "", // 团队负责人
    teamMembers: [] as string[] // 团队成员列表
  });
  
  // 项目管理页面状态
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [projectDateRange, setProjectDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);
  const [isProjectManageOpen, setIsProjectManageOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetailMode, setProjectDetailMode] = useState<'traditional' | 'auto'>('traditional');
  const [manageFormData, setManageFormData] = useState({
    projectName: "",
    projectDescription: "",
    teamLeader: "",
    projectStartDate: "",
    projectEndDate: "",
    projectVisibility: "private",
    teamMembers: [] as string[]
  });
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // 数据管理页面状态
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // 任务管理页面状态
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);

  // 个人中心状态
  const [isPersonalCenterOpen, setIsPersonalCenterOpen] = useState(false);

  // 个性化设置状态
  const [isPersonalizationSettingsOpen, setIsPersonalizationSettingsOpen] = useState(false);

  // 当前项目状态
  const [currentProject, setCurrentProject] = useState<{
    name: string;
    mode: 'traditional' | 'auto';
  } | null>(null);

  // 系统管理子标签状态
  const [systemManagementSubTab, setSystemManagementSubTab] = useState("overview");

  // 全页面视图状态
  const [fullPageViewType, setFullPageViewType] = useState<'personal-center' | 'personalization-settings' | 'notification-center' | 'ai-assistant' | 'data-detail' | 'task-detail' | null>(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  // 新增：通知中心初始页签（notifications/activity），用于从看板打开活动中心
  const [notificationCenterInitialTab, setNotificationCenterInitialTab] = useState<'notifications' | 'activity' | null>(null);

  // 数据详情全页面状态
  const [selectedDatasetForFullPage, setSelectedDatasetForFullPage] = useState<any>(null);
  // 新增：数据详情初始 Tab（overview/versions/missing）
  const [dataDetailInitialTab, setDataDetailInitialTab] = useState<'overview' | 'versions' | 'missing' | null>(null);

  // 任务详情全页面状态
  const [selectedTaskForFullPage, setSelectedTaskForFullPage] = useState<any>(null);

  // AI助手已统一到 FullPageView（type='ai-assistant'），不再单独维护 isAIAssistantOpen

  // 团队成员由统一组件 TeamMemberSelector 管理（移除本地 availableMembers 与搜索状态）

  const projects = [
    {
      id: "PRJ001",
      title: "智能缺陷检测",
      mode: "协作模式",
      description: "基于用户产品智能推荐引荐用户中的智能推荐功能重新推荐",
      status: "进行中",
      stats: { datasets: 3, models: 7, tasks: 12 },
      dataset: "缺陷图像数据集",
      model: "CNN检测模型",
      task: "缺陷识别分类",
      date: "2024/9/18",
      members: 5,
      dataSource: "文件上传",
      color: "green" as const,
      owner: "张三",
      projectCycle: "2024/01/15 - 2024/03/15",
      createdTime: "2024/01/15 09:00:00",
      updatedTime: "2024/01/19 17:15:00",
      completeness: 75,
      totalTasks: 16,
      completedTasks: 12,
      recentActivities: [
        { time: "2024/1/19 17:15:00", activity: "智能推荐模型训练中", type: "training" },
        { time: "2024/1/18 22:30:00", activity: "API数据接入完成", type: "completed" },
        { time: "2024/1/17 19:20:00", activity: "数据清洗和验证", type: "processing" }
      ]
    },
    {
      id: "PRJ002",
      title: "能源预测", 
      mode: "独立模式",
      description: "基于企业管理数据统计中的服务分支以外的智能推荐功能进而特制",
      status: "进行中",
      stats: { datasets: 1, models: 3, tasks: 6 },
      dataset: "能源消耗数据",
      model: "时间序列预测",
      task: "能源需求预测",
      date: "2024/1/8",
      members: 2,
      dataSource: "API接口",
      color: "blue" as const,
      owner: "李四",
      projectCycle: "2024/01/08 - 2024/02/28",
      createdTime: "2024/01/08 10:30:00",
      updatedTime: "2024/01/19 14:30:00",
      completeness: 60,
      totalTasks: 10,
      completedTasks: 6,
      recentActivities: [
        { time: "2024/1/19 14:30:00", activity: "预测模型优化中", type: "training" },
        { time: "2024/1/18 10:15:00", activity: "特征工程完成", type: "completed" },
        { time: "2024/1/17 16:45:00", activity: "数据预处理", type: "processing" }
      ]
    },
    {
      id: "PRJ003",
      title: "工艺优化分析",
      mode: "协作模式",
      description: "基于目标数据智能推荐中的分析化。量实最终优化产品分析", 
      status: "已完成",
      stats: { datasets: 4, models: 6, tasks: 10 },
      dataset: "生产工艺数据",
      model: "优化算法模型",
      task: "工艺参数优化",
      date: "2024/7/9",
      members: 4,
      dataSource: "数据库",
      color: "purple" as const,
      owner: "王五",
      projectCycle: "2023/12/01 - 2024/01/19",
      createdTime: "2023/12/01 08:00:00",
      updatedTime: "2024/01/19 09:00:00",
      completeness: 100,
      totalTasks: 18,
      completedTasks: 18,
      recentActivities: [
        { time: "2024/1/19 09:00:00", activity: "项目已完成部署", type: "completed" },
        { time: "2024/1/18 15:20:00", activity: "模型测试通过", type: "completed" },
        { time: "2024/1/17 11:30:00", activity: "最终验证完成", type: "completed" }
      ]
    },
    {
      id: "PRJ004",
      title: "供应链优化分析",
      mode: "协作模式",
      description: "基于供应链数据进行库存优化、需求预测和成本分析",
      status: "进行中", 
      stats: { datasets: 2, models: 4, tasks: 8 },
      dataset: "供应链数据",
      model: "库存优化模型",
      task: "供应链分析",
      date: "2024/6/15",
      members: 4,
      dataSource: "数据库",
      color: "orange" as const,
      owner: "赵六",
      projectCycle: "2024/01/10 - 2024/04/10",
      createdTime: "2024/01/10 14:00:00",
      updatedTime: "2024/01/19 17:15:00",
      completeness: 45,
      totalTasks: 18,
      completedTasks: 8,
      recentActivities: [
        { time: "2024/1/19 17:15:00", activity: "需求预测模型训练中", type: "training" },
        { time: "2024/1/18 22:30:00", activity: "API数据接入完成", type: "completed" },
        { time: "2024/1/17 19:20:00", activity: "数据清洗和验证", type: "processing" }
      ]
    }
  ];

  // 过滤项目逻辑
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      project.status === statusFilter ||
      // 兼容旧数据：若项目状态为“暂停”，在筛选选择“已延期”时也匹配
      (statusFilter === "已延期" && project.status === "暂停");
    const matchesOwner = ownerFilter === "all" || project.owner === ownerFilter;
    // 日期范围筛选：按项目创建时间 createdTime（若无则按 date）过滤
    const projectCreated = new Date(project.createdTime || project.date);
    const start = projectDateRange.start ? new Date(projectDateRange.start) : null;
    const end = projectDateRange.end ? new Date(projectDateRange.end) : null;
    const matchesDate = (!start || projectCreated >= start) && (!end || projectCreated <= end);
    
    return matchesSearch && matchesStatus && matchesOwner && matchesDate;
  });

  const handleCreateProject = () => {
    // 验证必填字段

    if (!projectFormData.projectName.trim()) {
      alert("请输入项目名称");
      return;
    }
    if (!projectFormData.projectStartDate) {
      alert("请选择项目开始日期");
      return;
    }
    if (!projectFormData.projectEndDate) {
      alert("请选择项目结束日期");
      return;
    }
    if (new Date(projectFormData.projectStartDate) >= new Date(projectFormData.projectEndDate)) {
      alert("项目结束日期必须晚于开始日期");
      return;
    }
    if (!projectFormData.teamLeader.trim()) {
      alert("请选择团队负责人");
      return;
    }
    
    // 处理创建项目逻辑
    console.log("创建项目:", projectFormData);
    
    // 设置当前项目
    setCurrentProject({
      name: projectFormData.projectName,
      mode: 'traditional'
    });
    
    setIsCreateProjectOpen(false);
    // 重置表单
    setProjectFormData({
      projectName: "",
      projectDescription: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamLeader: "当前用户",
      teamMembers: []
    });

  };

  const handleCancelProject = () => {
    setIsCreateProjectOpen(false);
    // 重置表单
    setProjectFormData({
      projectName: "",
      projectDescription: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamLeader: "当前用户",
      teamMembers: []
    });

  };

  // 团队成员管理已由 TeamMemberSelector 统一处理（移除本地添加逻辑）

  // 团队成员移除逻辑也由 TeamMemberSelector 统一处理（移除本地移除函数）

  // 成员过滤与搜索逻辑由 TeamMemberSelector 内部实现（移除本地 filteredMembers）

  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  const handleManageProject = (project: any) => {
    setSelectedProject(project);
    setManageFormData({
      projectName: project.title,
      projectDescription: project.description,
      teamLeader: project.teamLeader || "",
      projectStartDate: project.startDate || "",
      projectEndDate: project.endDate || "",
      projectVisibility: project.visibility || "private",
      teamMembers: Array.isArray(project?.members) ? project.members : []
    });
    setIsProjectManageOpen(true);
  };

  const handleSaveProjectSettings = () => {
    // 处理保存项目设置逻辑
    console.log("保存项目设置:", {
      project: selectedProject,
      settings: manageFormData
    });
    setIsProjectManageOpen(false);
  };

  const handleArchiveProject = () => {
    // 显示归档确认弹窗
    setIsArchiveConfirmOpen(true);
  };

  // 复制项目选项（默认全部勾选）
  const [duplicateOptions, setDuplicateOptions] = useState({
    copyTasks: true,
    copyDatasets: true,
    copyMembers: true,
  });

  const toggleDuplicateOption = (key: keyof typeof duplicateOptions, value: boolean) => {
    setDuplicateOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmArchive = () => {
    // 处理归档项目逻辑
    console.log("归档项目:", selectedProject?.title);
    setIsArchiveConfirmOpen(false);
    setIsProjectManageOpen(false);
    // 这里可以添加实际的项目归档逻辑
  };

  const handleDuplicateProject = () => {
    // 显示复制确认弹窗
    setIsDuplicateConfirmOpen(true);
  };

  const handleConfirmDuplicate = () => {
    // 处理复制项目逻辑
    const duplicatedProjectName = `${selectedProject?.title} - 副本`;
    const { copyTasks, copyDatasets, copyMembers } = duplicateOptions;
    const onlyBasicInfo = !copyTasks && !copyDatasets && !copyMembers;
    console.log("复制项目:", duplicatedProjectName, {
      copyTasks,
      copyDatasets,
      copyMembers,
      strategy: onlyBasicInfo ? "仅复制基础信息（项目名称与描述）" : "复制所选内容",
    });
    setIsDuplicateConfirmOpen(false);
    setIsProjectManageOpen(false);
    // 这里可以添加实际的项目复制逻辑
  };

  // 成员邀请逻辑已由 TeamMemberSelector 统一管理，无需单独通过邮箱邀请

  const handleCancelManage = () => {
    setIsProjectManageOpen(false);
    setManageFormData({
      projectName: "",
      projectDescription: "",
      teamLeader: "",
      projectStartDate: "",
      projectEndDate: "",
      projectVisibility: "private",
      teamMembers: []
    });
  };

  // 个人中心和退出登录处理函数
  const handleOpenPersonalCenter = () => {
    setFullPageViewType('personal-center');
  };

  const handleLogout = () => {
    // 处理退出登录逻辑
    console.log("用户退出登录");
    // 这里可以添加清除用户数据、跳转到登录页等逻辑
    alert("退出登录成功！");
  };

  // 个性化设置处理函数
  const handleOpenPersonalizationSettings = () => {
    setFullPageViewType('personalization-settings');
  };

  const handleClosePersonalizationSettings = () => {
    setIsPersonalizationSettingsOpen(false);
  };

  // 通知中心处理函数
  const handleOpenNotificationCenter = () => {
    setNotificationCenterInitialTab('notifications');
    setFullPageViewType('notification-center');
  };

  // 活动中心处理函数：打开通知中心并切换到“活动”Tab
  const handleOpenActivityCenter = () => {
    setNotificationCenterInitialTab('activity');
    setFullPageViewType('notification-center');
  };

  // 项目管理总览：切换到“项目管理”标签，不弹创建项目弹窗
  const handleGoToProjectOverview = () => {
    setActiveTab("项目管理");
  };

  // 关闭全页面视图
  const handleCloseFullPageView = () => {
    setFullPageViewType(null);
    setSelectedDatasetForFullPage(null);
    setSelectedTaskForFullPage(null);
    // 同步重置数据详情初始页签
    setDataDetailInitialTab(null);
    // 重置通知中心初始页签
    setNotificationCenterInitialTab(null);
  };

  // 数据详情全页面处理函数
  const handleOpenDataDetailFullPage = (dataset: any, initialTab?: 'overview' | 'versions' | 'missing') => {
    setSelectedDatasetForFullPage(dataset);
    // 根据调用方传入的初始页签进行设置，默认跳转到概览
    setDataDetailInitialTab(initialTab ?? 'overview');
    setFullPageViewType('data-detail');
  };

  // 任务详情全页面处理函数
  const handleOpenTaskDetailFullPage = (task: any) => {
    setSelectedTaskForFullPage(task);
    setFullPageViewType('task-detail');
  };

  const handleOpenSoloMode = () => {
    // 如果没有当前项目，创建一个默认的自动模式项目
    if (!currentProject || currentProject.mode !== 'auto') {
      setCurrentProject({
        name: "智能分析项目",
        mode: 'auto'
      });
    }
  };

  // 智能助手入口（统一为 FullPageView -> ai-assistant）
  const handleOpenAIAssistant = () => {
    setFullPageViewType('ai-assistant');
  };

  const renderContent = () => {
    console.log("当前活动标签:", activeTab); // 添加调试日志
    
    // 如果当前有项目且为自动模式，显示智能界面
    if (currentProject && currentProject.mode === 'auto') {
      return <SoloMode projectName={currentProject.name} />;
    }
    
    switch (activeTab) {
      case "看板":
        return (
          <div>
            <Dashboard 
              onNavigateToProjectManagement={() => {
                setActiveTab("项目管理");
                setIsCreateProjectOpen(true);
              }}
              onNavigateToDataManagement={() => {
                setActiveTab("数据管理");
                setIsUploadDialogOpen(true);
              }}
              onNavigateToTaskManagement={() => {
                setActiveTab("任务管理");
                setIsCreateTaskDialogOpen(true);
              }}
              onNavigateToModelManagement={() => {
                setActiveTab("模型管理");
                setShowModelTuning(true);
              }}
              // 新增：从看板打开统一活动中心
              onOpenActivityCenter={handleOpenActivityCenter}
              // 新增：最近项目-查看全部 跳转到项目管理总览
              onNavigateToProjectOverview={handleGoToProjectOverview}
            />
          </div>
        );
      case "项目管理":
        return (
          <div>
            {/* 页头部分 */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">项目管理</h1>
              <p className="text-gray-600">管理您的机器学习项目，跟踪进度并与团队协作</p>
            </div>

            {/* 搜索和过滤区域 */}
            <div className="mb-6 space-y-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="搜索项目"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>

              {/* 过滤器和视图切换 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="状态" />
                      <ChevronDown className="w-4 h-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="进行中">进行中</SelectItem>
                      <SelectItem value="已完成">已完成</SelectItem>
                      <SelectItem value="已延期">已延期</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Owner Filter */}
                  <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="负责人" />
                      <ChevronDown className="w-4 h-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部负责人</SelectItem>
                      <SelectItem value="张三">张三</SelectItem>
                      <SelectItem value="李四">李四</SelectItem>
                      <SelectItem value="王五">王五</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Filter: 替换为日期范围选择 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[320px] justify-between">
                        <span className="truncate text-left">
                          {projectDateRange.start && projectDateRange.end
                            ? `${projectDateRange.start} - ${projectDateRange.end}`
                            : '开始日期 - 结束日期'}
                        </span>
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[640px] p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            placeholder="开始日期"
                            value={projectDateRange.start || ''}
                            className="w-48"
                          />
                          <span className="text-gray-500">-</span>
                          <Input
                            readOnly
                            placeholder="结束日期"
                            value={projectDateRange.end || ''}
                            className="w-48"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProjectDateRange({ start: '', end: '' })}
                          >
                            清除
                          </Button>
                        </div>
                        <DateRangeCalendar
                          mode="range"
                          numberOfMonths={2}
                          initialFocus
                          defaultMonth={projectDateRange.start ? new Date(projectDateRange.start) : new Date()}
                          selected={{
                            from: projectDateRange.start ? new Date(projectDateRange.start) : undefined,
                            to: projectDateRange.end ? new Date(projectDateRange.end) : undefined,
                          }}
                          onSelect={(range: any) => {
                            const startDate = range?.from ? new Date(range.from) : undefined;
                            const endDate = range?.to ? new Date(range.to) : undefined;
                            const fmt = (d: Date | undefined) =>
                              d
                                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                                : '';
                            setProjectDateRange({ start: fmt(startDate), end: fmt(endDate) });
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                </div>

                {/* 视图切换按钮 */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="w-20"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    网格
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="w-20"
                  >
                    <List className="w-4 h-4 mr-1" />
                    列表
                  </Button>
                </div>
              </div>
            </div>

            {/* 项目内容区域 */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 创建新项目卡片 */}
                <div 
                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">创建新项目</h3>
                  <p className="text-sm text-gray-500 mb-4">开始一个新的项目并配置项目设置</p>
                </div>
                
                {/* 项目卡片 */}
                {filteredProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    title={project.title}
                    description={project.description}
                    status={project.status}
                    stats={project.stats}
                    date={project.date}
                    members={project.members}
                    dataSource={project.dataSource}
                    color={project.color}
                    onViewDetails={() => handleViewProjectDetails(project)}
                    onManage={() => handleManageProject(project)}
                  />
                ))}
              </div>
            ) : (
              /* 列表视图 */
              <div className="bg-white rounded-lg border overflow-x-auto">
                <div className="grid gap-2 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-500 min-w-max" style={{gridTemplateColumns: "80px 200px 100px 80px 150px 150px 150px 100px 120px 120px 120px 100px"}}>
                  <div>项目ID</div>
                  <div>项目名称</div>
                  <div>项目模式</div>
                  <div>状态</div>
                  <div>数据集</div>
                  <div>模型</div>
                  <div>任务</div>
                  <div>负责人</div>
                  <div>项目周期</div>
                  <div>创建时间</div>
                  <div>更新时间</div>
                  <div>操作</div>
                </div>
                
                {/* 创建新项目行 */}
                <div 
                  className="grid gap-2 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-w-max"
                  style={{gridTemplateColumns: "80px 200px 100px 80px 150px 150px 150px 100px 120px 120px 120px 100px"}}
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  <div className="flex items-center gap-3" style={{gridColumn: "1 / 4"}}>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-blue-600 font-medium">创建新项目</span>
                  </div>
                  <div className="flex items-center text-gray-500" style={{gridColumn: "4 / -1"}}>
                    <span>开始一个新的项目并配置项目设置</span>
                  </div>
                </div>

                {filteredProjects.map((project, index) => (
                  <div key={index} className="grid gap-2 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors min-w-max" style={{gridTemplateColumns: "80px 200px 100px 80px 150px 150px 150px 100px 120px 120px 120px 100px"}}>
                    <div className="flex items-center text-sm text-gray-700">{project.id}</div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{project.title}</div>
                      <div className="text-xs text-gray-500">{project.description}</div>
                    </div>
                    <div className="flex items-center text-xs text-gray-700">{project.mode}</div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === "进行中" ? "bg-green-100 text-green-700" :
                        project.status === "已完成" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.datasets}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.models}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.stats.tasks}</div>
                    <div className="flex items-center text-xs text-gray-700">{project.owner}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.projectCycle}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.createdTime}</div>
                    <div className="flex items-center text-xs text-gray-500">{project.updatedTime}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleViewProjectDetails(project)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleManageProject(project)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 创建项目抽屉 */}
            <Sheet open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
              <SheetContent className="w-[900px] max-w-[90vw] max-h-[85vh] p-0 overflow-y-auto" side="right">
                <SheetHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle>创建新项目</SheetTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancelProject}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SheetDescription>
                    填写项目信息以创建新的AI模型项目
                  </SheetDescription>
                </SheetHeader>
                
                <div className="px-6 py-6 space-y-6">
                  {/* 项目模式选择（已移除） */}

                  {/* 项目名称和团队负责人 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName" className="text-sm font-medium">
                        项目名称 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="projectName"
                        placeholder="请输入项目名称"
                        value={projectFormData.projectName}
                        onChange={(e) => setProjectFormData({...projectFormData, projectName: e.target.value})}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        团队负责人 <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={projectFormData.teamLeader} 
                        onValueChange={(value: string) => setProjectFormData({...projectFormData, teamLeader: value})}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="选择团队负责人" />
                        </SelectTrigger>
                        <SelectContent>
                          {registeredUsers.map((u) => (
                            <SelectItem key={u.id} value={u.realName}>
                              {u.realName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 项目描述 */}
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription" className="text-sm font-medium">
                      项目描述
                    </Label>
                    <Textarea
                      id="projectDescription"
                      placeholder="请输入项目描述（可选）"
                      value={projectFormData.projectDescription}
                      onChange={(e) => setProjectFormData({...projectFormData, projectDescription: e.target.value})}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 项目周期 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      项目周期 <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="startDate" className="text-xs text-gray-600">开始日期</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={projectFormData.projectStartDate}
                          onChange={(e) => setProjectFormData({...projectFormData, projectStartDate: e.target.value})}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs text-gray-600">结束日期</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={projectFormData.projectEndDate}
                          onChange={(e) => setProjectFormData({...projectFormData, projectEndDate: e.target.value})}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 项目权限设置和团队成员搜索 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        项目权限 <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup 
                        value={projectFormData.projectVisibility} 
                        onValueChange={(value: string) => setProjectFormData({...projectFormData, projectVisibility: value})}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="private" />
                          <Label htmlFor="private" className="text-sm cursor-pointer">
                            私有项目 - 仅团队成员可访问
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="public" />
                          <Label htmlFor="public" className="text-sm cursor-pointer">
                            公开项目 - 组织内所有成员可查看
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <TeamMemberSelector
                      selectedIds={projectFormData.teamMembers}
                      onChange={(ids) => setProjectFormData({ ...projectFormData, teamMembers: ids })}
                      currentUserRole="项目经理"
                     />
                </div>
              </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleCancelProject}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={
                      !projectFormData.projectName || 
                      !projectFormData.projectStartDate || 
                      !projectFormData.projectEndDate ||
                      !projectFormData.projectVisibility ||
                      !projectFormData.teamLeader
                    }
                  >
                    创建项目
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* 项目详情弹窗 */}
            <Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
              <DialogContent className="sm:max-w-[1200px] p-0" aria-describedby="project-detail-description">
                <DialogHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DialogTitle className="text-xl">{selectedProject?.title}</DialogTitle>
                      <Badge variant={selectedProject?.status === "进行中" ? "default" : "secondary"}>
                        {selectedProject?.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsProjectDetailOpen(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{selectedProject?.description}</p>
                </DialogHeader>
                
                <div className="px-6 py-4">
                  <ProjectDetailCards 
                    project={selectedProject}
                    mode={projectDetailMode}
                    onNavigateToData={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("数据管理");
                    }}
                    onNavigateToTasks={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("任务管理");
                    }}
                    onNavigateToModels={() => {
                      setIsProjectDetailOpen(false);
                      setActiveTab("模型管理");
                    }}
                    onQuickPredict={() => {
                      // TODO: 实现快速预测功能
                      console.log("快速预测功能");
                    }}
                    onViewReports={() => {
                      // 打开查看报表全屏视图，并自动执行清洗-分析-展示流程
                      setIsReportViewOpen(true);
                    }}
                  />
                </div>

                <DialogDescription id="project-detail-description" className="sr-only">
                  查看项目详细信息，包括统计数据、进度和最近活动
                </DialogDescription>
              </DialogContent>
            </Dialog>

            {/* 项目管理弹窗 */}
            <Sheet open={isProjectManageOpen} onOpenChange={setIsProjectManageOpen}>
              <SheetContent className="w-3/4 sm:max-w-sm max-h-[85vh] p-0 overflow-y-auto" side="right">
                <SheetHeader className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <SheetTitle>项目设置</SheetTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancelManage}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SheetDescription>
                    管理项目设置，包括基本信息、团队成员和权限配置
                  </SheetDescription>
                </SheetHeader>
                
                <div className="px-6 py-4 space-y-8">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">📋</div>
                      <h3 className="text-lg font-medium">基本信息</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manage-project-name" className="text-sm">项目名称</Label>
                        <Input
                          id="manage-project-name"
                          value={manageFormData.projectName}
                          onChange={(e) => setManageFormData({...manageFormData, projectName: e.target.value})}
                          className="h-10"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="manage-project-description" className="text-sm">项目描述</Label>
                        <Textarea
                          id="manage-project-description"
                          value={manageFormData.projectDescription}
                          onChange={(e) => setManageFormData({...manageFormData, projectDescription: e.target.value})}
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="manage-team-leader" className="text-sm">团队负责人 <span className="text-red-500">*</span></Label>
                        <Select value={manageFormData.teamLeader} onValueChange={(value: string) => setManageFormData({...manageFormData, teamLeader: value})}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="选择团队负责人" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredUsers.map((u) => (
                              <SelectItem key={u.id} value={u.realName}>
                                {u.realName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">项目周期 <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="manage-start-date" className="text-xs text-gray-600">开始日期</Label>
                            <Input
                              id="manage-start-date"
                              type="date"
                              value={manageFormData.projectStartDate}
                              onChange={(e) => setManageFormData({...manageFormData, projectStartDate: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manage-end-date" className="text-xs text-gray-600">结束日期</Label>
                            <Input
                              id="manage-end-date"
                              type="date"
                              value={manageFormData.projectEndDate}
                              onChange={(e) => setManageFormData({...manageFormData, projectEndDate: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 团队管理 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">👥</div>
                      <h3 className="text-lg font-medium">团队管理</h3>
                    </div>

                    <TeamMemberSelector
                      selectedIds={manageFormData.teamMembers ?? []}
                      onChange={(ids) => setManageFormData({ ...manageFormData, teamMembers: ids })}
                      projectId={selectedProject?.id ?? ''}
                      currentUserRole="项目经理"
                    />
                  </div>

                  {/* 项目权限 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">🔒</div>
                      <h3 className="text-lg font-medium">项目权限</h3>
                    </div>
                    
                    <RadioGroup 
                      value={manageFormData.projectVisibility} 
                      onValueChange={(value: string) => setManageFormData({...manageFormData, projectVisibility: value})}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="private" id="private" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="private" className="text-sm font-medium cursor-pointer">
                            私有项目
                          </Label>
                          <p className="text-sm text-gray-500">
                            只有团队成员可以访问
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="public" id="public" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
                            公开项目
                          </Label>
                          <p className="text-sm text-gray-500">
                            所有人都可以查看
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 border-t flex justify-between">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleArchiveProject}
                      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Archive className="h-4 w-4" />
                      归档项目
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleDuplicateProject}
                      className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4" />
                      复制项目
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCancelManage}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleSaveProjectSettings}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      保存设置
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* 复制项目确认弹窗 */}
            <Dialog open={isDuplicateConfirmOpen} onOpenChange={setIsDuplicateConfirmOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5 text-blue-600" />
                    复制项目
                  </DialogTitle>
                  <DialogDescription>
                    确认要复制项目 "{selectedProject?.title}" 吗？
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>新项目名称：</strong>{selectedProject?.title} - 副本
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      可选择复制任务、数据集与项目成员；若取消所有选项，则仅复制项目基础信息（名称与描述）。
                    </div>
                  </div>

                  {/* 复制选项（默认全部勾选） */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">选择需要复制的内容（可选）：</div>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyTasks}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyTasks", checked)}
                          aria-label="复制项目下的任务"
                        />
                        <span className="text-sm">复制项目下的任务</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyDatasets}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyDatasets", checked)}
                          aria-label="复制项目下的数据集"
                        />
                        <span className="text-sm">复制项目下的数据集</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <Checkbox
                          checked={duplicateOptions.copyMembers}
                          onCheckedChange={(checked: boolean) => toggleDuplicateOption("copyMembers", checked)}
                          aria-label="复制项目成员"
                        />
                        <span className="text-sm">复制项目成员</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsDuplicateConfirmOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleConfirmDuplicate}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    确认复制
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 归档项目确认弹窗 */}
            <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-orange-600" />
                    归档项目
                  </DialogTitle>
                  <DialogDescription>
                    确认要归档项目 "{selectedProject?.title}" 吗？
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-sm text-orange-800">
                      <strong>注意：</strong>归档后的项目将被移至归档区域
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      归档的项目可以随时恢复，但将不会在主项目列表中显示
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsArchiveConfirmOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleConfirmArchive}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    确认归档
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      case "数据管理":
        return (
          <div>
            <DataManagement 
              onNavigateToPreprocessing={() => {
                // 这里可以添加额外的跳转逻辑，比如显示通知等
                console.log("已跳转到数据预处理页面");
              }}
              isUploadDialogOpen={isUploadDialogOpen}
              onUploadDialogClose={() => setIsUploadDialogOpen(false)}
              onOpenDataDetailFullPage={handleOpenDataDetailFullPage}
            />
          </div>
        );
      case "任务管理":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">任务管理</h1>
              <p className="text-gray-600">创建、监控和管理AI模型训练任务，实时跟踪任务进度和性能指标</p>
            </div>
            <TaskManagement 
              isCreateTaskDialogOpen={isCreateTaskDialogOpen}
              onCreateTaskDialogChange={(open: boolean) => setIsCreateTaskDialogOpen(open)}
              onOpenTaskDetailFullPage={handleOpenTaskDetailFullPage}
            />
          </div>
        );
      case "模型管理":
        console.log("正在渲染模型管理页面, showModelTuning:", showModelTuning); // 添加调试日志
        if (showModelTuning) {
          console.log("显示模型微调页面"); // 添加调试日志
          return (
            <ModelTuning onBack={() => setShowModelTuning(false)} />
          );
        }
        console.log("显示模型管理主页面"); // 添加调试日志
        return (
          <ModelManagement onOpenModelTuning={() => setShowModelTuning(true)} />
        );
      case "系统管理":
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">系统管理</h1>
              <p className="text-gray-600">管理系统用户、角色权限和组织架构，配置个人账户信息</p>
            </div>
            <SystemManagement defaultSubTab={systemManagementSubTab} />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600">{activeTab} 页面正在开发中...</h2>
          </div>
        );
    }
  };

  // Demo: 任务对比入口
  const [showTaskCompareDemo, setShowTaskCompareDemo] = useState(false);

  const taskCompareDemoA = {
    info: { id: 'TASK-A', name: '缺陷识别-ResNet', dataset: '缺陷图像数据集 v1.0', model: 'ResNet50', params: { lr: 0.001, batch_size: 32 } },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.9144, precision: 0.902, recall: 0.895, f1: 0.898, rocAuc: 0.945,
      rocCurve: Array.from({ length: 21 }, (_, i) => ({ fpr: i/20, tpr: Math.min(1, Math.pow(i/20, 0.6)) })),
      confusionMatrix: [[120, 10],[8, 140]],
      ci95: { accuracy: [0.90, 0.93] },
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '纹理', x: 120, y: 60 },
        { id: 'n2', label: '亮度', x: 260, y: 120 },
        { id: 'n3', label: '边缘', x: 420, y: 80 },
        { id: 'n4', label: '判定', x: 600, y: 120 },
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.8 },
        { source: 'n2', target: 'n3', influenceStrength: 0.4 },
        { source: 'n3', target: 'n4', influenceStrength: 0.9 },
      ],
    },
    phases: [ { name: '数据加载', durationSec: 35 }, { name: '训练', durationSec: 820 }, { name: '评估', durationSec: 65 } ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 40 + (i%5)*5, gpu: 30 + (i%7)*3 })),
    totalTimeSec: 920,
    trainTimeSec: 820,
    inferTimeMs: 45,
    quota: { gpuMemGB: 16, cpuCores: 8, ramGB: 32, timeLimitMin: 60 },
    actual: { gpuMemGB: 12, cpuCores: 6, ramGB: 24 },
    warnings: ['评估阶段出现少量类不平衡警告'],
  };

  const taskCompareDemoB = {
    info: { id: 'TASK-B', name: '缺陷识别-EfficientNet', dataset: '缺陷图像数据集 v1.0', model: 'EfficientNet-B0', params: { lr: 0.0008, batch_size: 64 } },
    type: TASK_TYPES.classification,
    metrics: {
      accuracy: 0.904, precision: 0.895, recall: 0.882, f1: 0.888, rocAuc: 0.936,
      rocCurve: Array.from({ length: 21 }, (_, i) => ({ fpr: i/20, tpr: Math.min(1, Math.pow(i/20, 0.65)) })),
      confusionMatrix: [[115, 15],[12, 135]],
      ci95: { accuracy: [0.88, 0.92] },
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '纹理', x: 120, y: 60 },
        { id: 'n5', label: '对比度', x: 280, y: 40 },
        { id: 'n3', label: '边缘', x: 420, y: 80 },
        { id: 'n4', label: '判定', x: 600, y: 120 },
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.6 },
        { source: 'n5', target: 'n3', influenceStrength: -0.2 },
        { source: 'n3', target: 'n4', influenceStrength: 0.8 },
      ],
    },
    phases: [ { name: '数据加载', durationSec: 40 }, { name: '训练', durationSec: 780 }, { name: '评估', durationSec: 70 } ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + (i%6)*4, gpu: 25 + (i%5)*4 })),
    totalTimeSec: 890,
    trainTimeSec: 780,
    inferTimeMs: 38,
    quota: { gpuMemGB: 16, cpuCores: 8, ramGB: 32, timeLimitMin: 60 },
    actual: { gpuMemGB: 10, cpuCores: 6, ramGB: 22 },
    warnings: [],
  };

  // 如果个性化设置页面打开，则显示个性化设置页面
  if (isPersonalizationSettingsOpen) {
    return (
      <PersonalizationSettings 
        onBack={handleClosePersonalizationSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onOpenPersonalCenter={handleOpenPersonalCenter}
        onOpenPersonalizationSettings={handleOpenPersonalizationSettings}
        onOpenNotificationCenter={handleOpenNotificationCenter}
        onLogout={handleLogout}
      />
      
      <main className="p-6 max-w-7xl mx-auto">
        {renderContent()}
      </main>
      
      {/* 全页面视图 */}
      {fullPageViewType === 'data-detail' && selectedDatasetForFullPage && (
        <DataDetailFullPage 
          dataset={selectedDatasetForFullPage}
          onClose={handleCloseFullPageView}
          initialTab={dataDetailInitialTab ?? 'overview'}
        />
      )}
      {fullPageViewType === 'task-detail' && selectedTaskForFullPage && (
        <TaskDetailFullPage 
          task={selectedTaskForFullPage}
          onClose={handleCloseFullPageView}
          onOpenDataDetail={handleOpenDataDetailFullPage}
        />
      )}
      {fullPageViewType && fullPageViewType !== 'data-detail' && fullPageViewType !== 'task-detail' && (
        <FullPageView 
          type={fullPageViewType}
          onClose={handleCloseFullPageView}
          notificationCenterInitialTab={notificationCenterInitialTab ?? 'notifications'}
        />
      )}

      {/* 报表全屏视图 */}
      {isReportViewOpen && (
        <ReportView onClose={() => setIsReportViewOpen(false)} />
      )}

      {/* AI助手已统一到 FullPageView（type='ai-assistant'） */}

      {/* 浮动预览入口：任务对比（仅在任务管理页显示） */}
      {activeTab === '任务管理' && (
        <>
          <div className="fixed bottom-6 right-6 space-y-2 z-50">
            <button
              className="shadow-lg rounded-full px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setShowTaskCompareDemo(true)}
            >
              任务对比预览
            </button>
          </div>

          {/* 任务对比页面 */}
          <Dialog open={showTaskCompareDemo} onOpenChange={setShowTaskCompareDemo}>
            <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>任务对比预览</DialogTitle>
              </DialogHeader>
              <TaskCompare task1={taskCompareDemoA as any} task2={taskCompareDemoB as any} onBack={() => setShowTaskCompareDemo(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* 全局悬浮动态助手入口（与右上角智能助手按钮同源） */}
      <FloatingAssistantEntry onOpenAIAssistant={handleOpenAIAssistant} />

      <Toaster />
    </div>
  );
}