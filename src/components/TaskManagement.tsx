import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Archive, 
  ChevronUp, 
  ChevronDown,
  Settings,
  Database,
  Target,
  Cpu,
  Eye,
  RotateCcw,
  Pause,
  Square,
  Play,
  Download,
  List,
  Grid,
  ArrowUp,
  ArrowDown,
  User,
  GitCompare,
  Maximize2,
  Minimize2,
  X,
  Upload,
} from 'lucide-react';
import { Pencil } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from './ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from './ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import TaskCompare from './TaskCompare';

// 模拟项目列表（后续可替换为真实项目数据）
const mockProjects = [
  { id: 'proj_001', name: '钢铁缺陷预测' },
  { id: 'proj_002', name: '电力能源预测' },
  { id: 'proj_003', name: '工艺时序预测' },
  { id: 'proj_004', name: '设备故障预测' },
];
const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || '未选择项目';

// 任务类型定义（优化为：时序预测、分类、回归）
type TaskType = 'forecasting' | 'classification' | 'regression';
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'table' | 'grid';
type SortField = 'createdAt' | 'completedAt' | 'status' | 'priority' | 'taskName';
type SortOrder = 'asc' | 'desc';

// 支持多数据集选择的条目类型（新增）
interface SelectedDatasetEntry {
  id: string;
  name: string;
  version: string;
}

// 任务接口定义
interface Task {
  id: string;
  taskName: string;
  taskType: TaskType;
  // 新增：所属项目信息
  projectId?: string;
  projectName?: string;
  datasetName: string;
  datasetVersion: string;
  // 新增：支持多数据集（保持向后兼容）
  datasets?: SelectedDatasetEntry[];
  modelName: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  description?: string;
  config?: any;
  results?: any;
  estimatedTime?: number;
  actualTime?: number;
}

// 筛选条件接口
interface FilterOptions {
  taskType: TaskType | 'all';
  status: TaskStatus | 'all';
  // 新增：按项目筛选（使用项目ID，'all' 表示全部项目）
  projectId?: string | 'all';
  datasetName: string;
  modelName: string;
  priority: TaskPriority | 'all';
  dateRange: {
    start: string;
    end: string;
  };
  searchQuery: string;
}

// 排序配置接口
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// 添加数据集详细信息接口
interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  size: string;
  fieldCount: number;
  sampleCount: number;
  source: 'upload' | 'subscription';
  status: 'success' | 'processing' | 'failed';
  versions: DatasetVersion[];
  // 新增：数据集包含的文件名称列表（用于主/协变量选择）
  files?: string[];
  previewData?: any[];
}

interface DatasetVersion {
  version: string;
  createdAt: string;
  description: string;
  size: string;
  fieldCount: number;
  sampleCount: number;
}

interface TaskManagementProps {
  isCreateTaskDialogOpen?: boolean;
  onCreateTaskDialogChange?: (open: boolean) => void;
  onOpenTaskDetailFullPage?: (task: Task) => void;
  // 新增：控制创建成功后是否自动打开详情页，默认保持在列表
  autoOpenDetailAfterCreate?: boolean;
}

// 更新FormData接口，添加数据集相关字段
interface FormData {
  taskName: string;
  taskType: TaskType;
  projectId: string; // 所属项目（必填）
  datasetName: string;
  datasetVersion: string;
  selectedDataset: DatasetInfo | null; // 新增：选中的数据集详细信息
  // 新增：多数据集（含版本）已选列表
  selectedDatasets: SelectedDatasetEntry[];
  modelName: string;
  models: string[]; // 支持多模型选择
  modelSelectionMode: 'single' | 'multiple'; // 新增：模型选择模式
  targetFields: string[]; // 预测目标字段（支持多选）
  availableFields: string[]; // 数据集中可用的字段列表
  priority: TaskPriority;
  description: string;
  config: string;
  // 参数配置模式：页面配置 或 JSON 手动导入
  hyperparameterMode: 'page' | 'json';
  // 页面配置：按任务类型分别保存
  forecastingConfig: {
    // 新增：时间序列任务的时间列（来自公共字段）
    timeColumn: string; // 时间列（必选）
    contextLength: number; // 上下文长度
    forecastLength: number; // 预测长度
    stepLength: number; // 预测步长
    startTime: string; // 预测开始时间（日期+时间）
    mainVariableFiles: string[]; // 主变量文件（多选）
    covariateFiles: string[]; // 协变量文件列表（可选）
  };
  classificationConfig: {
    trainRatio: number; // 训练集比例(%)
    testRatio: number; // 测试集比例(%)
    shuffle: boolean; // 是否洗牌
  };
  regressionConfig: {
    trainRatio: number; // 训练集比例(%)
    testRatio: number; // 测试集比例(%)
    shuffle: boolean; // 是否洗牌
  };
  // JSON格式手动配置
  manualConfig: string;
  // 运行资源类型
  resourceType: 'cpu' | 'gpu' | 'auto';
  resourceConfig: {
    cores: number;
    memory: number; // GB
    maxRunTime: number; // 最大运行时长（分钟）
  };
}

  const TaskManagement: React.FC<TaskManagementProps> = ({
    isCreateTaskDialogOpen = false,
    onCreateTaskDialogChange,
    onOpenTaskDetailFullPage,
    autoOpenDetailAfterCreate = false,
  }) => {
    // 创建任务弹窗分步导航（4步）
    const [currentStep, setCurrentStep] = useState<number>(1);
    const steps = [
      { number: 1, label: '基础信息配置' },
      { number: 2, label: '数据与目标' },
      { number: 3, label: '模型选择' },
      { number: 4, label: '参数配置' },
    ];
  // 状态管理
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCompareDemoOpen, setIsCompareDemoOpen] = useState(false);
  // 全屏模式状态（创建任务弹窗）
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // 任务对比预览：示例类型选择（分类/回归/时序预测）
  const [compareDemoType, setCompareDemoType] = useState<TaskType>('classification');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  // 新增：创建成功后用于高亮并滚动定位的任务ID
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    taskId: string;
    taskName: string;
  }>({
    isOpen: false,
    action: '',
    taskId: '',
    taskName: ''
  });
  
  // 筛选状态
  const [filters, setFilters] = useState<FilterOptions>({
    taskType: 'all',
    status: 'all',
    projectId: 'all',
    datasetName: '',
    modelName: '',
    priority: 'all',
    dateRange: { start: '', end: '' },
    searchQuery: ''
  });

  // 任务创建表单状态
  const [formData, setFormData] = useState<FormData>({
    taskName: '',
    taskType: 'forecasting',
    projectId: '',
    datasetName: '',
  datasetVersion: '',
  selectedDataset: null,
  selectedDatasets: [],
  modelName: '',
  models: [],
  modelSelectionMode: 'multiple',
  targetFields: [],
  availableFields: [],
    priority: 'medium',
    description: '',
    config: '',
    hyperparameterMode: 'page',
    forecastingConfig: {
      timeColumn: '',
      contextLength: 24,
      forecastLength: 12,
      stepLength: 1,
      startTime: '',
      mainVariableFiles: [],
      covariateFiles: []
    },
    classificationConfig: {
      trainRatio: 80,
      testRatio: 20,
      shuffle: false
    },
    regressionConfig: {
      trainRatio: 80,
      testRatio: 20,
      shuffle: false
    },
    manualConfig: '',
    resourceType: 'auto',
    resourceConfig: {
      cores: 4,
      memory: 8,
      maxRunTime: 120
    }
  });

  // JSON 配置导入错误提示
  const [jsonImportError, setJsonImportError] = useState<string>('');
  const importJsonInputRef = useRef<HTMLInputElement | null>(null);

  // 生成标准 JSON 配置模板（根据当前任务类型预填常用字段，保留可编辑性）
  const buildJsonTemplate = () => {
    const baseHyper: Record<string, any> = {
      learning_rate: 0.1,
      max_depth: 6,
      n_estimators: 100,
      subsample: 0.8,
      colsample_bytree: 0.8,
    };
    if (formData.taskType === 'forecasting') {
      return {
        mode: 'json',
        taskType: 'forecasting',
        forecasting: {
          timeColumn: formData.forecastingConfig.timeColumn || 'timestamp',
          contextLength: formData.forecastingConfig.contextLength || 24,
          forecastLength: formData.forecastingConfig.forecastLength || 12,
          stepLength: formData.forecastingConfig.stepLength || 1,
          startTime: formData.forecastingConfig.startTime || '',
          mainVariableFiles: formData.forecastingConfig.mainVariableFiles || [],
          covariateFiles: formData.forecastingConfig.covariateFiles || [],
        },
        hyperparameters: baseHyper,
      };
    }
    if (formData.taskType === 'classification') {
      return {
        mode: 'json',
        taskType: 'classification',
        classification: {
          trainRatio: formData.classificationConfig.trainRatio,
          testRatio: formData.classificationConfig.testRatio,
          shuffle: formData.classificationConfig.shuffle,
        },
        hyperparameters: baseHyper,
      };
    }
    // regression
    return {
      mode: 'json',
      taskType: 'regression',
      regression: {
        trainRatio: formData.regressionConfig.trainRatio,
        testRatio: formData.regressionConfig.testRatio,
        shuffle: formData.regressionConfig.shuffle,
      },
      hyperparameters: baseHyper,
    };
  };

  // 导出 JSON 模板文件
  const handleExportJsonTemplate = () => {
    try {
      const tpl = buildJsonTemplate();
      const dataStr = JSON.stringify(tpl, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `任务参数模板_${formData.taskType}_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出模板失败:', err);
    }
  };

  // 处理导入 JSON 配置文件
  const handleImportJsonFile = async (file: File) => {
    setJsonImportError('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonImportError('导入失败：JSON 须为对象类型');
        return;
      }
      const pretty = JSON.stringify(parsed, null, 2);
      handleInputChange('manualConfig', pretty);
    } catch (err) {
      console.error('导入 JSON 解析错误:', err);
      setJsonImportError('导入失败：JSON 解析错误，请检查文件内容');
    }
  };

  // 添加表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);

  // 第4步：主/协变量文件多选弹窗状态与搜索词
  const [mainFilesOpen, setMainFilesOpen] = useState(false);
  const [covFilesOpen, setCovFilesOpen] = useState(false);
  const [mainFilesQuery, setMainFilesQuery] = useState('');
  const [covFilesQuery, setCovFilesQuery] = useState('');

  // 模拟数据集详细信息
  const [availableDatasets] = useState<DatasetInfo[]>([
    {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      description: '包含生产线质量检测相关数据，用于缺陷预测和质量评估',
      size: '2.5MB',
      fieldCount: 15,
      sampleCount: 10000,
      source: 'upload',
      status: 'success',
      files: [
        '生产线_主变量.csv',
        '生产线_协变量_设备功率.csv',
        '生产线_协变量_环境温度.csv',
        '生产线_日志.csv'
      ],
      versions: [
        {
          version: 'v3.0',
          createdAt: '2025-01-15 14:30',
          description: '修复数据质量问题，增加新特征',
          size: '2.5MB',
          fieldCount: 15,
          sampleCount: 10000
        },
        {
          version: 'v2.0',
          createdAt: '2025-01-10 10:20',
          description: '数据清洗优化，移除异常值',
          size: '2.3MB',
          fieldCount: 14,
          sampleCount: 9800
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-05 16:45',
          description: '初始版本',
          size: '2.1MB',
          fieldCount: 12,
          sampleCount: 9500
        }
      ],
      previewData: [
        { id: 1, temperature: 85.2, pressure: 1.2, defect_rate: 0.02, quality_score: 98.5 },
        { id: 2, temperature: 87.1, pressure: 1.3, defect_rate: 0.03, quality_score: 97.8 },
        { id: 3, temperature: 84.8, pressure: 1.1, defect_rate: 0.01, quality_score: 99.2 }
      ]
    },
    {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      description: '电商平台客户购买行为分析数据',
      size: '5.2MB',
      fieldCount: 20,
      sampleCount: 25000,
      source: 'subscription',
      status: 'success',
      files: [
        '客户_主变量.csv',
        '客户_协变量_画像.csv',
        '客户_交易明细.csv'
      ],
      versions: [
        {
          version: 'v2.0',
          createdAt: '2025-01-12 09:15',
          description: '增加用户画像特征',
          size: '5.2MB',
          fieldCount: 20,
          sampleCount: 25000
        },
        {
          version: 'v1.0',
          createdAt: '2025-01-08 11:30',
          description: '基础行为数据',
          size: '4.8MB',
          fieldCount: 18,
          sampleCount: 23000
        }
      ],
      previewData: [
        { user_id: 'U001', age: 28, purchase_amount: 299.99, category: 'electronics', satisfaction: 4.5 },
        { user_id: 'U002', age: 35, purchase_amount: 159.50, category: 'clothing', satisfaction: 4.2 },
        { user_id: 'U003', age: 42, purchase_amount: 89.99, category: 'books', satisfaction: 4.8 }
  ]
    }
  ]);

  // 多数据集：根据已选的数据集列表自动更新可用字段（公共字段交集）
  useEffect(() => {
    let intersection: Set<string> | null = null;
    formData.selectedDatasets.forEach((sd) => {
      const ds = availableDatasets.find((d) => d.id === sd.id);
      const fields = ds?.previewData && ds.previewData.length > 0
        ? Object.keys(ds.previewData[0])
        : [];
      if (intersection === null) {
        intersection = new Set(fields);
      } else {
        const next = new Set<string>();
        fields.forEach((f) => { if (intersection && intersection.has(f)) next.add(f); });
        intersection = next;
      }
    });
    // 保证交集数组类型稳定为 string[]，避免在 TS 推断中出现 never[]
    const intersectionArr: string[] = intersection ? Array.from(intersection) : [];
    setFormData((prev) => {
      const same = prev.availableFields.length === intersectionArr.length && prev.availableFields.every((f) => intersectionArr.includes(f));
      if (same) return prev;
      return { ...prev, availableFields: intersectionArr };
    });
  }, [formData.selectedDatasets, availableDatasets]);

  // 当公共字段（availableFields）变化时，校正或自动预填时间列
  useEffect(() => {
    if (formData.taskType !== 'forecasting') return;
    const fields = formData.availableFields || [];
    const current = formData.forecastingConfig?.timeColumn || '';
    // 如果当前时间列不在公共字段中，则清空
    if (current && !fields.includes(current)) {
      setFormData(prev => ({
        ...prev,
        forecastingConfig: { ...prev.forecastingConfig, timeColumn: '' }
      }));
      return;
    }
    // 若为空且存在常见时间字段名，自动预填
    if (!current && fields.length > 0) {
      const candidates = ['timestamp', 'time', 'date', 'datetime', 'event_time', 'ts'];
      const found = candidates.find(c => fields.includes(c));
      if (found) {
        setFormData(prev => ({
          ...prev,
          forecastingConfig: { ...prev.forecastingConfig, timeColumn: found }
        }));
      }
    }
  }, [formData.availableFields, formData.taskType]);

  // 聚合可选文件名：来自已选数据集(selectedDatasets)与当前选择(selectedDataset)
  const aggregatedFileOptions = useMemo(() => {
    const set = new Set<string>();
    // 来自多数据集选择
    formData.selectedDatasets.forEach(sd => {
      const ds = availableDatasets.find(d => d.id === sd.id);
      ds?.files?.forEach(f => set.add(f));
    });
    // 来自当前选中的数据集（如果未在 selectedDatasets 中）
    if (formData.selectedDataset) {
      const inList = formData.selectedDatasets.some(sd => sd.id === formData.selectedDataset?.id);
      if (!inList) {
        const ds = availableDatasets.find(d => d.id === formData.selectedDataset?.id) || formData.selectedDataset;
        ds?.files?.forEach(f => set.add(f));
      }
    }
    return Array.from(set);
  }, [formData.selectedDatasets, formData.selectedDataset, availableDatasets]);

  // 互斥后的主/协变量候选项 + 搜索过滤
  const filteredMainOptions = useMemo(() => {
    const exclude = new Set(formData.forecastingConfig.covariateFiles || []);
    return aggregatedFileOptions
      .filter(f => !exclude.has(f))
      .filter(f => (mainFilesQuery ? f.toLowerCase().includes(mainFilesQuery.toLowerCase()) : true));
  }, [aggregatedFileOptions, formData.forecastingConfig.covariateFiles, mainFilesQuery]);

  const filteredCovOptions = useMemo(() => {
    const exclude = new Set(formData.forecastingConfig.mainVariableFiles || []);
    return aggregatedFileOptions
      .filter(f => !exclude.has(f))
      .filter(f => (covFilesQuery ? f.toLowerCase().includes(covFilesQuery.toLowerCase()) : true));
  }, [aggregatedFileOptions, formData.forecastingConfig.mainVariableFiles, covFilesQuery]);

  // 选择/取消选择主变量文件（并从协变量中移除，保持互斥）
  const toggleMainFile = (file: string) => {
    const selected = formData.forecastingConfig.mainVariableFiles || [];
    const isChecked = selected.includes(file);
    const nextMain = isChecked ? selected.filter(f => f !== file) : [...selected, file];
    const nextCov = (formData.forecastingConfig.covariateFiles || []).filter(f => !nextMain.includes(f));
    handleInputChange('forecastingConfig', {
      ...formData.forecastingConfig,
      mainVariableFiles: nextMain,
      covariateFiles: nextCov,
    });
  };

  // 选择/取消选择协变量文件（并从主变量中移除，保持互斥）
  const toggleCovFile = (file: string) => {
    const selected = formData.forecastingConfig.covariateFiles || [];
    const isChecked = selected.includes(file);
    const nextCov = isChecked ? selected.filter(f => f !== file) : [...selected, file];
    const nextMain = (formData.forecastingConfig.mainVariableFiles || []).filter(f => !nextCov.includes(f));
    handleInputChange('forecastingConfig', {
      ...formData.forecastingConfig,
      mainVariableFiles: nextMain,
      covariateFiles: nextCov,
    });
  };

  const [availableModels] = useState([
    { 
      id: 'MODEL-006',
      name: 'Limix',
      type: '大模型',
      status: 'available',
      description: 'limix自研结构化数据大模型，支持多种任务',
      accuracy: '95.2%',
      size: '78.9MB',
      supportedTasks: ['classification', 'regression', 'forecasting'],
      trainingTime: '自动调参',
      features: ['模型集成', '无需专业知识']
    },
    { 
      id: 'MODEL-001', 
      name: 'XGBoost分类器', 
      type: '三方模型', 
      status: 'available',
      description: '基于梯度提升的高性能分类算法，适用于结构化数据分类任务',
      accuracy: '92.5%',
      size: '15.2MB',
      supportedTasks: ['classification', 'forecasting'],
      trainingTime: '~30分钟',
      features: ['高准确率', '快速训练', '特征重要性分析']
    },
    { 
      id: 'MODEL-002', 
      name: 'LightGBM回归器', 
      type: '三方模型', 
      status: 'available',
      description: '轻量级梯度提升框架，专为回归任务优化',
      accuracy: '89.3%',
      size: '8.7MB',
      supportedTasks: ['regression', 'forecasting'],
      trainingTime: '~20分钟',
      features: ['内存效率高', '训练速度快', '支持类别特征']
    },
    { 
      id: 'MODEL-003', 
      name: '神经网络模型', 
      type: '三方模型', 
      status: 'available',
      description: '深度学习神经网络，适用于复杂模式识别',
      accuracy: '94.1%',
      size: '45.6MB',
      supportedTasks: ['classification', 'regression', 'forecasting'],
      trainingTime: '~2小时',
      features: ['高精度', '强泛化能力', '支持复杂特征']
    },
    { 
      id: 'MODEL-004', 
      name: '随机森林', 
      type: '三方模型', 
      status: 'available',
      description: '集成学习算法，通过多个决策树提高预测准确性',
      accuracy: '87.8%',
      size: '12.3MB',
      supportedTasks: ['classification', 'regression'],
      trainingTime: '~45分钟',
      features: ['抗过拟合', '特征选择', '处理缺失值']
    },
    { 
      id: 'MODEL-005', 
      name: 'AutoGluon-Tabular', 
      type: '三方模型', 
      status: 'available',
      description: 'AutoML自动机器学习框架，自动选择最优模型',
      accuracy: '95.2%',
      size: '78.9MB',
      supportedTasks: ['classification', 'regression', 'forecasting'],
      trainingTime: '~3小时',
      features: ['自动调参', '模型集成', '无需专业知识']
    }
  ]);

  // 模拟任务数据
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'TASK-001',
      taskName: '销售数据预测模型训练',
      taskType: 'forecasting',
      projectId: 'proj_003',
      datasetName: '销售数据集',
      datasetVersion: 'v2.1',
      modelName: 'Limix',
      priority: 'high',
      status: 'completed',
      progress: 100,
      createdAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T12:45:00Z',
      createdBy: '张三',
      description: '基于历史销售数据训练预测模型',
      estimatedTime: 120,
      actualTime: 135
    },
    {
      id: 'TASK-002',
      taskName: '用户行为分析',
      taskType: 'classification',
      projectId: 'proj_004',
      datasetName: '用户行为数据',
      datasetVersion: 'v1.3',
      modelName: 'XGBoost',
      priority: 'medium',
      status: 'running',
      progress: 65,
      createdAt: '2024-01-16T09:15:00Z',
      createdBy: '李四',
      description: '分析用户行为模式和偏好',
      estimatedTime: 90
    },
    {
      id: 'TASK-003',
      taskName: '产品推荐算法优化',
      taskType: 'classification',
      projectId: 'proj_001',
      datasetName: '产品数据集',
      datasetVersion: 'v3.0',
      modelName: 'DeepLearning',
      priority: 'urgent',
      status: 'pending',
      progress: 0,
      createdAt: '2024-01-16T14:20:00Z',
      createdBy: '王五',
      description: '对比多种推荐算法效果',
      estimatedTime: 180
    },
    {
      id: 'TASK-004',
      taskName: '客户流失预测',
      taskType: 'regression',
      projectId: 'proj_004',
      datasetName: '客户数据集',
      datasetVersion: 'v1.8',
      modelName: 'Limix',
      priority: 'high',
      status: 'failed',
      progress: 45,
      createdAt: '2024-01-14T16:00:00Z',
      completedAt: '2024-01-14T17:30:00Z',
      createdBy: '赵六',
      description: '预测客户流失风险',
      estimatedTime: 100,
      actualTime: 90
    },
    {
      id: 'TASK-005',
      taskName: '库存优化模型',
      taskType: 'forecasting',
      projectName: '电力能源预测',
      datasetName: '库存数据',
      datasetVersion: 'v2.5',
      modelName: 'Limix',
      priority: 'low',
      status: 'archived',
      progress: 100,
      createdAt: '2024-01-10T11:00:00Z',
      completedAt: '2024-01-12T15:30:00Z',
      createdBy: '孙七',
      description: '优化库存管理策略',
      estimatedTime: 200,
      actualTime: 185
    },
    // 新增：演示多数据集联合训练的任务，便于预览多数据集聚合统计
    {
      id: 'TASK-006',
      taskName: '多数据集联合预测实验',
      taskType: 'forecasting',
      projectId: 'proj_002',
      datasetName: '生产质量数据集',
      datasetVersion: 'v3.0',
      datasets: [
        { id: 'DATA-2025-001', name: '生产质量数据集', version: 'v3.0' },
        { id: 'DATA-2025-002', name: '客户行为数据集', version: 'v2.0' }
      ],
      modelName: 'AutoGluon-Tabular',
      priority: 'high',
      status: 'running',
      progress: 30,
      createdAt: '2025-01-16T09:50:00Z',
      createdBy: '测试用户',
      description: '跨数据源联合训练以提升预测准确率',
      estimatedTime: 180
    }
  ]);

  // 同步外部对话框状态
  useEffect(() => {
    setIsCreateTaskOpen(isCreateTaskDialogOpen);
  }, [isCreateTaskDialogOpen]);

  // 状态颜色和图标映射
  const getStatusConfig = (status: TaskStatus) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: '排队中' },
      running: { color: 'bg-blue-100 text-blue-800', icon: Activity, label: '运行中' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: '已完成' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: '失败' },
      cancelled: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: '已取消' },
      archived: { color: 'bg-gray-100 text-gray-600', icon: Archive, label: '已归档' }
    };
    return configs[status];
  };

  // 优先级颜色映射
  const getPriorityConfig = (priority: TaskPriority) => {
    const configs = {
      low: { color: 'bg-gray-100 text-gray-800', label: '低' },
      medium: { color: 'bg-blue-100 text-blue-800', label: '中' },
      high: { color: 'bg-orange-100 text-orange-800', label: '高' },
      urgent: { color: 'bg-red-100 text-red-800', label: '紧急' }
    };
    return configs[priority];
  };

  // 任务类型映射（中文标签）
  const getTaskTypeLabel = (type: TaskType) => {
    const labels = {
      forecasting: '时序预测',
      classification: '分类',
      regression: '回归',
    } as const;
    return labels[type];
  };

  // 筛选和排序逻辑
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks.filter(task => {
      // 搜索查询筛选
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!task.taskName.toLowerCase().includes(query) &&
            !task.id.toLowerCase().includes(query) &&
            !task.datasetName.toLowerCase().includes(query) &&
            !task.modelName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 任务类型筛选
      if (filters.taskType !== 'all' && task.taskType !== filters.taskType) {
        return false;
      }

      // 状态筛选
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // 数据集名称筛选
      if (filters.datasetName && !task.datasetName.toLowerCase().includes(filters.datasetName.toLowerCase())) {
        return false;
      }

      // 模型名称筛选
      if (filters.modelName && !task.modelName.toLowerCase().includes(filters.modelName.toLowerCase())) {
        return false;
      }

      // 所属项目筛选（优先按ID匹配，兼容仅有名称的旧数据）
      if (filters.projectId && filters.projectId !== 'all') {
        const projectIdMatches = task.projectId && task.projectId === filters.projectId;
        const projectNameMatches = task.projectName && (task.projectName === getProjectName(String(filters.projectId)));
        if (!projectIdMatches && !projectNameMatches) {
          return false;
        }
      }

      // 优先级筛选
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // 日期范围筛选
      if (filters.dateRange.start) {
        const taskDate = new Date(task.createdAt);
        const startDate = new Date(filters.dateRange.start);
        if (taskDate < startDate) return false;
      }

      if (filters.dateRange.end) {
        const taskDate = new Date(task.createdAt);
        const endDate = new Date(filters.dateRange.end);
        if (taskDate > endDate) return false;
      }

      return true;
    });

    // 排序
    filteredTasks.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'completedAt':
          aValue = a.completedAt ? new Date(a.completedAt) : new Date(0);
          bValue = b.completedAt ? new Date(b.completedAt) : new Date(0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'taskName':
          aValue = a.taskName;
          bValue = b.taskName;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredTasks;
  };

  // 处理排序
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 表单验证函数
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 任务名称验证
    if (!formData.taskName.trim()) {
      errors.taskName = '任务名称不能为空';
    } else if (formData.taskName.length < 3 || formData.taskName.length > 64) {
      errors.taskName = '任务名称长度应在3-64个字符之间';
    } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(formData.taskName)) {
      errors.taskName = '任务名称只能包含字母、数字、中文、下划线和连字符';
    }

    // 任务类型验证
    if (!formData.taskType) {
      errors.taskType = '请选择任务类型';
    }

    // 项目选择验证
    if (!formData.projectId || formData.projectId.trim() === '') {
      errors.projectId = '请选择所属项目';
    }

    // 数据集验证（支持多选）
    if (!formData.selectedDatasets || formData.selectedDatasets.length === 0) {
      // 使用 datasetName 错误键以兼容现有UI提示位置
      errors.datasetName = '请至少选择一个数据集';
    } else {
      // 检查每个数据集是否选择了版本
      const hasMissingVersion = formData.selectedDatasets.some((d) => !d.version);
      if (hasMissingVersion) {
        errors.datasetVersion = '请为每个已选择的数据集选择对应的版本';
      }
    }

    // 目标字段验证（可选）
    if (formData.targetFields.length > 10) {
      errors.targetFields = '最多只能选择10个目标字段';
    }

    // 模型选择验证（默认多选）
    if (formData.models.length === 0) {
      errors.models = '请至少选择一个模型';
    } else if (formData.models.length > 5) {
      errors.models = '最多只能选择5个模型进行并行训练';
    }

    // 超参数/任务配置验证
    if (formData.hyperparameterMode === 'page') {
      // 根据任务类型校验对应的页面配置
      if (formData.taskType === 'forecasting') {
        const fc = formData.forecastingConfig;
        // 时间列必选且必须来自公共字段
        if (!fc || !String(fc.timeColumn || '').trim()) {
          errors.forecastingTimeColumn = '请选择时间列（来自公共字段）';
        } else if (!formData.availableFields.includes(fc.timeColumn)) {
          errors.forecastingTimeColumn = '时间列必须来自已选数据集的公共字段';
        }
        if (!fc || fc.contextLength < 1 || fc.contextLength > 10000) {
          errors.forecastingContextLength = '上下文长度应在1-10000之间';
        }
        if (!fc || fc.forecastLength < 1 || fc.forecastLength > 10000) {
          errors.forecastingForecastLength = '预测长度应在1-10000之间';
        }
        if (!fc || fc.stepLength < 1 || fc.stepLength > 10000) {
          errors.forecastingStepLength = '步长应在1-10000之间';
        }
        if (!fc || !String(fc.startTime || '').trim()) {
          errors.forecastingStartTime = '请选择预测开始时间';
        }
      } else if (formData.taskType === 'classification') {
        const cc = formData.classificationConfig;
        if (!cc) {
          errors.classificationSplit = '请完善分类任务的训练/测试集配置';
        } else {
          const sum = cc.trainRatio + cc.testRatio;
          if (cc.trainRatio <= 0 || cc.testRatio <= 0 || sum !== 100) {
            errors.classificationSplit = '训练/测试比例必须为正且相加等于100%';
          }
        }
      } else if (formData.taskType === 'regression') {
        const rc = formData.regressionConfig;
        if (!rc) {
          errors.regressionSplit = '请完善回归任务的训练/测试集配置';
        } else {
          const sum = rc.trainRatio + rc.testRatio;
          if (rc.trainRatio <= 0 || rc.testRatio <= 0 || sum !== 100) {
            errors.regressionSplit = '训练/测试比例必须为正且相加等于100%';
          }
        }
      }
    } else {
      // JSON配置验证
      if (!formData.manualConfig.trim()) {
        errors.manualConfig = '请输入参数配置';
      } else {
        try {
          const config = JSON.parse(formData.manualConfig);
          if (typeof config !== 'object' || config === null || Array.isArray(config)) {
            errors.manualConfig = '参数配置必须是有效的JSON对象';
          } else if (Object.keys(config).length === 0) {
            errors.manualConfig = '参数配置不能为空对象';
          }
        } catch (e) {
          errors.manualConfig = 'JSON格式不正确，请检查语法';
        }
      }
    }

    // 资源配置验证
    if (formData.resourceConfig.cores < 1 || formData.resourceConfig.cores > 32) {
      errors.resourceCores = 'CPU核心数应在1-32之间';
    }
    if (formData.resourceConfig.memory < 1 || formData.resourceConfig.memory > 128) {
      errors.resourceMemory = '内存大小应在1-128GB之间';
    }
    if (formData.resourceConfig.maxRunTime < 5 || formData.resourceConfig.maxRunTime > 2880) {
      errors.resourceMaxRunTime = '最大运行时长应在5-2880分钟之间';
    }

    // 描述验证（可选）
    if (formData.description && formData.description.length > 500) {
      errors.description = '任务描述不能超过500个字符';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理表单提交
  const handleCreateTask = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 构造提交payload：包含多数据集，保持向后兼容的字段
      const firstDs = formData.selectedDatasets[0];
      const payload = {
        ...formData,
        datasets: formData.selectedDatasets,
        datasetName: firstDs ? firstDs.name : (formData.selectedDataset?.name || formData.datasetName),
        datasetVersion: firstDs ? firstDs.version : formData.datasetVersion,
      };

      // 生成下一个任务ID（基于现有ID的最大序号 + 1）
      const nextIdNumber = (() => {
        const nums = tasks
          .map(t => {
            const m = t.id.match(/^TASK-(\d{3,})$/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter(n => !isNaN(n));
        const max = nums.length > 0 ? Math.max(...nums) : 0;
        return max + 1;
      })();
      const nextId = `TASK-${String(nextIdNumber).padStart(3, '0')}`;

      // 将表单数据映射为 Task 类型，并追加到任务列表
      const nowIso = new Date().toISOString();
      // 将所选模型ID映射为名称，用于摘要展示
      const selectedModelNames = formData.models.map(id => {
        const m = availableModels.find(mm => mm.id === id);
        return m?.name || id;
      });

      const newTask: Task = {
        id: nextId,
        taskName: formData.taskName,
        taskType: formData.taskType,
        projectId: formData.projectId,
        projectName: getProjectName(formData.projectId),
        datasetName: payload.datasetName || '',
        datasetVersion: payload.datasetVersion || '',
        datasets: formData.selectedDatasets.length > 0 ? formData.selectedDatasets : undefined,
        modelName: (selectedModelNames.length > 0
          ? `${selectedModelNames[0]} 等 ${selectedModelNames.length} 个模型`
          : '未选择模型'),
        priority: formData.priority,
        status: 'pending',
        progress: 0,
        createdAt: nowIso,
        createdBy: '当前用户',
        description: formData.description,
        estimatedTime: formData.resourceConfig?.maxRunTime || undefined,
        config: formData.hyperparameterMode === 'json' 
          ? formData.manualConfig 
          : (() => {
              const base: any = { mode: 'page', taskType: formData.taskType };
              if (formData.taskType === 'forecasting') {
                // 兼容后端旧字段：mainVariableFile 取 mainVariableFiles[0]
                base.forecasting = {
                  ...formData.forecastingConfig,
                  mainVariableFile: formData.forecastingConfig?.mainVariableFiles?.[0] || undefined,
                };
              } else if (formData.taskType === 'classification') {
                base.classification = { ...formData.classificationConfig };
              } else if (formData.taskType === 'regression') {
                base.regression = { ...formData.regressionConfig };
              }
              return base;
            })(),
      };

      setTasks(prev => [newTask, ...prev]);
      console.log('创建任务:', newTask);
      // 创建成功后：切换到表格视图，并高亮新任务（选中复选框）
      setViewMode('table');
      setSelectedTaskIds([newTask.id]);
      setHighlightTaskId(newTask.id);
      // 创建成功后：按需求保持在任务列表，不自动打开详情
      // 如果需要恢复为自动打开详情，可将 autoOpenDetailAfterCreate 置为 true
      if (autoOpenDetailAfterCreate) {
        if (onOpenTaskDetailFullPage) {
          onOpenTaskDetailFullPage(newTask);
        } else {
          setSelectedTaskForDetails(newTask);
        }
      }
      
      // 成功后关闭对话框
      setIsCreateTaskOpen(false);
      
      // 这里可以添加成功提示
      // toast.success('任务创建成功');
      
    } catch (error) {
      console.error('创建任务失败:', error);
      // 这里可以添加错误提示
      // toast.error('创建任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 编辑任务保存
  const handleSaveEditTask = async () => {
    if (!editingTask) return;
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));

      const firstDs = formData.selectedDatasets[0];
      const payload = {
        ...formData,
        datasets: formData.selectedDatasets,
        datasetName: firstDs ? firstDs.name : (formData.selectedDataset?.name || formData.datasetName),
        datasetVersion: firstDs ? firstDs.version : formData.datasetVersion,
      };

      setTasks(prev => prev.map(t => {
        if (t.id !== editingTask.id) return t;
        return {
          ...t,
          taskName: formData.taskName,
          taskType: formData.taskType,
          projectId: formData.projectId,
          projectName: getProjectName(formData.projectId),
          datasetName: payload.datasetName || t.datasetName,
          datasetVersion: payload.datasetVersion || t.datasetVersion,
          datasets: formData.selectedDatasets.length > 0 ? formData.selectedDatasets : undefined,
          modelName: formData.modelSelectionMode === 'single'
            ? formData.modelName
            : (formData.models.length > 0
                ? `${formData.models[0]} 等 ${formData.models.length} 个模型`
                : t.modelName),
          priority: formData.priority,
          description: formData.description,
          // 保持状态、进度不变，仅更新配置
          config: formData.hyperparameterMode === 'json' 
            ? formData.manualConfig 
            : (() => {
                const base: any = { mode: 'page', taskType: formData.taskType };
                if (formData.taskType === 'forecasting') {
                  base.forecasting = { ...formData.forecastingConfig };
                } else if (formData.taskType === 'classification') {
                  base.classification = { ...formData.classificationConfig };
                } else if (formData.taskType === 'regression') {
                  base.regression = { ...formData.regressionConfig };
                }
                return base;
              })(),
        };
      }));

      // 关闭弹窗与编辑模式
      setIsCreateTaskOpen(false);
      setIsEditMode(false);
      setEditingTask(null);
      // 高亮修改的任务
      setViewMode('table');
      setSelectedTaskIds([editingTask.id]);
      setHighlightTaskId(editingTask.id);
    } catch (error) {
      console.error('保存编辑失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 当需要高亮某个任务时，滚动至该任务所在行，并在几秒后自动移除高亮效果
  useEffect(() => {
    if (!highlightTaskId) return;
    // 仅当当前是表格视图时，滚动定位到高亮任务
    if (viewMode === 'table') {
      const el = document.getElementById(`task-row-${highlightTaskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    // 高亮保持，直到用户手动修改选择或再次创建任务
    return () => {};
  }, [highlightTaskId, viewMode]);

  // 处理任务选择
  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => 
      checked 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    const filteredTasks = getFilteredAndSortedTasks();
    setSelectedTaskIds(checked ? filteredTasks.map(task => task.id) : []);
  };

  // 处理表单输入
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 将当前选中的数据集 + 版本加入到 selectedDatasets 列表（若已存在则更新版本）
  const addSelectedDataset = () => {
    const current = formData.selectedDataset;
    if (!current) {
      setFormErrors(prev => ({ ...prev, datasetName: '请选择数据集' }));
      return;
    }
    if (!formData.datasetVersion) {
      setFormErrors(prev => ({ ...prev, datasetVersion: '请选择数据版本' }));
      return;
    }

    setFormData(prev => {
      const existsIdx = prev.selectedDatasets.findIndex(d => d.id === current.id);
      let nextList = [...prev.selectedDatasets];
      const newEntry: SelectedDatasetEntry = {
        id: current.id,
        name: current.name,
        version: formData.datasetVersion
      };
      if (existsIdx >= 0) {
        nextList[existsIdx] = newEntry; // 更新版本
      } else {
        nextList.push(newEntry);
      }
      return {
        ...prev,
        selectedDatasets: nextList
      };
    });
    // 清理相关错误
    setFormErrors(prev => {
      const { datasetName, datasetVersion, ...rest } = prev;
      return rest;
    });
  };

  // 从 selectedDatasets 列表移除指定数据集
  const removeSelectedDataset = (datasetId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDatasets: prev.selectedDatasets.filter(d => d.id !== datasetId)
    }));
  };

  // 直接在“已选数据集列表”中更新某条目的版本
  const updateSelectedDatasetVersion = (datasetId: string, newVersion: string) => {
    setFormData(prev => {
      const nextList = prev.selectedDatasets.map(d => 
        d.id === datasetId ? { ...d, version: newVersion } : d
      );
      const next: typeof prev = { ...prev, selectedDatasets: nextList };
      // 如果当前上方选择器正好是这个数据集，则同步更新其版本选择
      if (prev.selectedDataset?.id === datasetId) {
        next.datasetVersion = newVersion;
      }
      return next;
    });
  };

  // 点击某个已选条目后回填到当前选择器，以便修改再更新回列表
  const backfillSelectedDataset = (datasetId: string) => {
    const ds = availableDatasets.find(d => d.id === datasetId);
    const sd = formData.selectedDatasets.find(d => d.id === datasetId);
    if (!ds) return;
    setFormData(prev => ({
      ...prev,
      datasetName: ds.id, // 注意：选择器使用的是数据集ID
      selectedDataset: ds,
      datasetVersion: sd?.version || (ds.versions?.[0]?.version ?? '')
    }));
  };

  // 处理筛选条件变化
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      taskType: 'all',
      status: 'all',
      projectId: 'all',
      datasetName: '',
      modelName: '',
      priority: 'all',
      dateRange: { start: '', end: '' },
      searchQuery: ''
    });
  };

  // 显示确认对话框
  const handleTaskAction = (action: string, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 处理查看详情操作
    if (action.trim() === 'view') {
      if (onOpenTaskDetailFullPage) {
        onOpenTaskDetailFullPage(task);
      } else {
        // 如果没有全页面回调，使用原有的模态框
        setSelectedTaskForDetails(task);
      }
      return;
    }

    // 处理编辑任务操作（支持失败任务等状态）
    if (action.trim() === 'edit') {
      // 预填创建表单为编辑模式
      const matchedProjectId = task.projectId || (mockProjects.find(p => p.name === task.projectName)?.id ?? '');
      // 通过数据集名称匹配ID
      const matchedDataset = availableDatasets.find(d => d.name === task.datasetName);
      const availableFields = matchedDataset?.previewData && matchedDataset.previewData.length > 0
        ? Object.keys(matchedDataset.previewData[0])
        : [];
      // 从任务的模型摘要中尽可能解析出已选择的模型名称（兼容“Limix 等 N 个模型”或逗号/顿号分隔的形式）
      const parsedModels = (() => {
        const name = task.modelName || '';
        if (!name || /未选择模型/.test(name)) return [];
        // 处理“xxx 等 N 个模型”
        if (name.includes('等') && name.includes('模型')) {
          const first = name.split('等')[0].trim();
          return first ? [first] : [];
        }
        // 处理逗号/顿号/分号分隔
        return name
          .split(/[，,、;]+/)
          .map(s => s.trim())
          .filter(Boolean);
      })();
      // 将解析出的模型名称转换为可识别的模型ID
      const nameToId = new Map<string, string>(availableModels.map(m => [m.name, m.id]));
      const editModels = parsedModels
        .map(n => nameToId.get(n))
        .filter((id): id is string => Boolean(id));
      setFormData(prev => ({
        ...prev,
        taskName: task.taskName,
        taskType: task.taskType,
        projectId: matchedProjectId,
        datasetName: matchedDataset?.id || '',
        datasetVersion: task.datasetVersion || '',
        selectedDataset: matchedDataset || null,
        selectedDatasets: task.datasets ?? [],
        modelSelectionMode: 'multiple',
        modelName: task.modelName,
        models: editModels,
        targetFields: [],
        availableFields,
        priority: task.priority,
        description: task.description || '',
        config: typeof task.config === 'string' ? task.config : '',
        hyperparameterMode: typeof task.config === 'string' ? 'json' : 'page',
        forecastingConfig: (typeof task.config === 'object' && task.config?.forecasting)
          ? {
              timeColumn: task.config.forecasting.timeColumn ?? '',
              contextLength: task.config.forecasting.contextLength ?? 24,
              forecastLength: task.config.forecasting.forecastLength ?? 12,
              stepLength: task.config.forecasting.stepLength ?? 1,
              startTime: task.config.forecasting.startTime ?? '',
              // 兼容旧数据：如果只存在 mainVariableFile，则转为数组
              mainVariableFiles: (task.config.forecasting.mainVariableFiles
                ? task.config.forecasting.mainVariableFiles
                : (task.config.forecasting.mainVariableFile ? [task.config.forecasting.mainVariableFile] : [])),
              covariateFiles: task.config.forecasting.covariateFiles ?? []
            }
          : {
              timeColumn: '',
              contextLength: 24,
              forecastLength: 12,
              stepLength: 1,
              startTime: '',
              mainVariableFiles: [],
              covariateFiles: []
            },
        classificationConfig: (typeof task.config === 'object' && task.config?.classification)
          ? {
              trainRatio: task.config.classification.trainRatio ?? 80,
              testRatio: task.config.classification.testRatio ?? 20,
              shuffle: task.config.classification.shuffle ?? false
            }
          : {
              trainRatio: 80,
              testRatio: 20,
              shuffle: false
            },
        regressionConfig: (typeof task.config === 'object' && task.config?.regression)
          ? {
              trainRatio: task.config.regression.trainRatio ?? 80,
              testRatio: task.config.regression.testRatio ?? 20,
              shuffle: task.config.regression.shuffle ?? false
            }
          : {
              trainRatio: 80,
              testRatio: 20,
              shuffle: false
            },
        manualConfig: typeof task.config === 'string' ? task.config : '',
        resourceType: 'auto',
        resourceConfig: { cores: 4, memory: 8, maxRunTime: 120 },
      }));
      setIsEditMode(true);
      setEditingTask(task);
      setIsCreateTaskOpen(true);
      return;
    }
    
    // 对于需要确认的操作，显示确认对话框
    if (['start', 'cancel', 'archive', 'retry'].includes(action.trim())) {
      setConfirmDialog({
        isOpen: true,
        action: action.trim(),
        taskId,
        taskName: task.taskName
      });
    } else {
      // 对于其他操作，直接执行
      executeTaskAction(action.trim(), taskId);
    }
  };

  // 执行实际的任务操作
  const executeTaskAction = (action: string, taskId: string) => {
    console.log(`执行操作: ${action}, 任务ID: ${taskId}`);
    // 这里可以添加具体的操作逻辑
    if (action === 'start') {
      // 将任务状态更新为运行中，隐藏编辑按钮
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: 'running',
          // 初始进度（模拟），确保表格显示进度条
          progress: t.progress !== undefined ? t.progress : 5,
        };
      }));
    }
    if (action === 'pause') {
      // 简单模拟暂停为挂起（回到待执行），以便再次“开始”
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: 'pending',
        };
      }));
    }
    if (action === 'cancel') {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'cancelled' } : t));
    }
    if (action === 'retry') {
      // 失败或取消的任务重试为待执行
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'pending' } : t));
    }
    // 关闭确认对话框
    setConfirmDialog({
      isOpen: false,
      action: '',
      taskId: '',
      taskName: ''
    });
  };

  // 取消确认操作
  const handleCancelConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      action: '',
      taskId: '',
      taskName: ''
    });
  };

  // 批量操作函数
  const handleBatchAction = (action: string) => {
    console.log(`批量操作: ${action}, 选中任务: ${selectedTaskIds}`);
    // 这里可以添加具体的批量操作逻辑
  };

  // 获取可用操作按钮
  const getAvailableActions = (task: Task): Array<{ key: string; label: string; icon: any }> => {
    const actions: Array<{ key: string; label: string; icon: any }> = [];
    
    actions.push({ key: 'view', label: '查看详情', icon: Eye });
    // 编辑任务：确保失败任务可编辑，其他非运行中状态也可编辑
    if (task.status === 'failed' || task.status === 'pending' || task.status === 'cancelled' || task.status === 'completed') {
      actions.push({ key: 'edit', label: '编辑任务', icon: Pencil });
    }
    
    if (task.status === 'failed' || task.status === 'cancelled') {
      actions.push({ key: 'retry', label: '重试', icon: RotateCcw });
    }
    
    if (task.status === 'running') {
      actions.push({ key: 'pause', label: '暂停', icon: Pause });
      actions.push({ key: 'stop', label: '终止', icon: Square });
    }
    
    if (task.status === 'pending') {
      actions.push({ key: 'start', label: '开始', icon: Play });
      actions.push({ key: 'cancel', label: '取消', icon: XCircle });
    }
    
    if (task.status === 'completed' || task.status === 'failed') {
      actions.push({ key: 'export', label: '导出', icon: Download });
    }
    
    if (task.status !== 'archived') {
      actions.push({ key: 'archive', label: '归档', icon: Archive });
    }
    
    return actions;
  };

  const filteredTasks = getFilteredAndSortedTasks();

  // 示例对比数据（分类任务）
  const taskCompareDemoA = {
    info: { id: 'TC-A', name: '分类任务 A', dataset: 'CreditRisk v1.0', model: 'AutoGluon (v0.8)' },
    type: 'classification' as const,
    metrics: {
      accuracy: 0.86,
      precision: 0.83,
      recall: 0.81,
      f1: 0.82,
      rocAuc: 0.88,
      rocCurve: Array.from({ length: 11 }, (_, i) => ({ fpr: i / 10, tpr: Math.min(1, (i / 10) ** 0.7) })),
      confusionMatrix: [
        [420, 80],
        [70, 430]
      ],
      ci95: { accuracy: [0.84, 0.88] }
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '年龄', x: 40, y: 60 },
        { id: 'n2', label: '收入', x: 160, y: 60 },
        { id: 'n3', label: '违约', x: 100, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.6 },
        { source: 'n2', target: 'n3', influenceStrength: 0.8 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 35 },
      { name: '训练', durationSec: 180 },
      { name: '评估', durationSec: 40 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 30 + Math.sin(i / 3) * 20, gpu: 0 })),
    totalTimeSec: 255,
    trainTimeSec: 180,
    inferTimeMs: 40,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['评估阶段出现少量类别不平衡']
  };

  const taskCompareDemoB = {
    info: { id: 'TC-B', name: '分类任务 B', dataset: 'CreditRisk v1.0', model: 'LimX (v1.2)' },
    type: 'classification' as const,
    metrics: {
      accuracy: 0.90,
      precision: 0.89,
      recall: 0.86,
      f1: 0.87,
      rocAuc: 0.92,
      rocCurve: Array.from({ length: 11 }, (_, i) => ({ fpr: i / 10, tpr: Math.min(1, (i / 10) ** 0.6) })),
      confusionMatrix: [
        [450, 50],
        [55, 445]
      ],
      ci95: { accuracy: [0.88, 0.92] }
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '年龄', x: 40, y: 60 },
        { id: 'n2', label: '收入', x: 160, y: 60 },
        { id: 'n3', label: '违约', x: 100, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.4 },
        { source: 'n2', target: 'n3', influenceStrength: 0.9 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 28 },
      { name: '训练', durationSec: 150 },
      { name: '评估', durationSec: 35 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + Math.cos(i / 3) * 20, gpu: 0 })),
    totalTimeSec: 213,
    trainTimeSec: 150,
    inferTimeMs: 35,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['训练阶段进行了早停']
  };

  // 示例对比数据（回归任务）
  const taskCompareRegA = {
    info: { id: 'TR-A', name: '回归任务 A', dataset: 'HousePrice v2.0', model: 'XGBoostRegressor (v1.0)' },
    type: 'regression' as const,
    metrics: {
      mse: 0.024,
      rmse: 0.155,
      mae: 0.112,
      r2: 0.89,
      residuals: Array.from({ length: 60 }, (_, i) => ({ x: i, y: (Math.sin(i / 5) * 0.05) - 0.02 + (Math.random() - 0.5) * 0.02 }))
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '面积', x: 60, y: 60 },
        { id: 'n2', label: '房龄', x: 180, y: 60 },
        { id: 'n3', label: '价格', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.85 },
        { source: 'n2', target: 'n3', influenceStrength: -0.35 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 25 },
      { name: '训练', durationSec: 120 },
      { name: '评估', durationSec: 30 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 40 + Math.sin(i / 3) * 15, gpu: 0 })),
    totalTimeSec: 175,
    trainTimeSec: 120,
    inferTimeMs: 25,
    quota: { gpuMemGB: 0, cpuCores: 8, ramGB: 16, timeLimitMin: 45 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['数据标准化后效果更稳定']
  };

  const taskCompareRegB = {
    info: { id: 'TR-B', name: '回归任务 B', dataset: 'HousePrice v2.0', model: 'LightGBMRegressor (v3.2)' },
    type: 'regression' as const,
    metrics: {
      mse: 0.020,
      rmse: 0.141,
      mae: 0.105,
      r2: 0.91,
      residuals: Array.from({ length: 60 }, (_, i) => ({ x: i, y: (Math.cos(i / 4) * 0.04) - 0.01 + (Math.random() - 0.5) * 0.02 }))
    },
    causalGraph: {
      nodes: [
        { id: 'n1', label: '面积', x: 60, y: 60 },
        { id: 'n2', label: '房龄', x: 180, y: 60 },
        { id: 'n3', label: '价格', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.80 },
        { source: 'n2', target: 'n3', influenceStrength: -0.28 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 22 },
      { name: '训练', durationSec: 100 },
      { name: '评估', durationSec: 28 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 35 + Math.cos(i / 3) * 15, gpu: 0 })),
    totalTimeSec: 150,
    trainTimeSec: 100,
    inferTimeMs: 22,
    quota: { gpuMemGB: 0, cpuCores: 8, ramGB: 16, timeLimitMin: 45 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['模型对异常值较为敏感，建议加强鲁棒性']
  };

  // 示例对比数据（时序预测任务）
  const forecastSeriesBase = Array.from({ length: 50 }, (_, i) => {
    const actual = 50 + i * 0.8 + Math.sin(i / 4) * 5 + (Math.random() - 0.5) * 2;
    return actual;
  });
  const taskCompareFctA = {
    info: { id: 'TF-A', name: '时序预测任务 A', dataset: 'EnergyLoad v1.0', model: 'Prophet (v1.1)' },
    type: 'forecasting' as const,
    metrics: (() => {
      const series = forecastSeriesBase.map((a, t) => ({ t, actual: a, predicted: a * (1 + ((Math.random() - 0.5) * 0.06)) }));
      const errors = series.map(p => Math.abs(p.predicted - p.actual));
      const mae = errors.reduce((s, e) => s + e, 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      const mape = series.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / p.actual), 0) / series.length;
      const residuals = series.map((p, i) => ({ x: i, y: p.predicted - p.actual }));
      return { mae, rmse, mape, smape: mape, r2: 0.72, series, residuals };
    })(),
    causalGraph: {
      nodes: [
        { id: 'n1', label: '温度', x: 60, y: 60 },
        { id: 'n2', label: '工作日', x: 180, y: 60 },
        { id: 'n3', label: '负载', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.55 },
        { source: 'n2', target: 'n3', influenceStrength: 0.35 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 30 },
      { name: '训练', durationSec: 160 },
      { name: '评估', durationSec: 35 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 38 + Math.sin(i / 3) * 18, gpu: 0 })),
    totalTimeSec: 225,
    trainTimeSec: 160,
    inferTimeMs: 30,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['节假日影响导致误差波动']
  };

  const taskCompareFctB = {
    info: { id: 'TF-B', name: '时序预测任务 B', dataset: 'EnergyLoad v1.0', model: 'AutoTS (v0.6)' },
    type: 'forecasting' as const,
    metrics: (() => {
      const series = forecastSeriesBase.map((a, t) => ({ t, actual: a, predicted: a * (1 + ((Math.random() - 0.5) * 0.04)) }));
      const errors = series.map(p => Math.abs(p.predicted - p.actual));
      const mae = errors.reduce((s, e) => s + e, 0) / errors.length;
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      const mape = series.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / p.actual), 0) / series.length;
      const residuals = series.map((p, i) => ({ x: i, y: p.predicted - p.actual }));
      return { mae, rmse, mape, smape: mape, r2: 0.78, series, residuals };
    })(),
    causalGraph: {
      nodes: [
        { id: 'n1', label: '温度', x: 60, y: 60 },
        { id: 'n2', label: '工作日', x: 180, y: 60 },
        { id: 'n3', label: '负载', x: 120, y: 160 }
      ],
      edges: [
        { source: 'n1', target: 'n3', influenceStrength: 0.50 },
        { source: 'n2', target: 'n3', influenceStrength: 0.40 }
      ]
    },
    phases: [
      { name: '数据加载', durationSec: 28 },
      { name: '训练', durationSec: 140 },
      { name: '评估', durationSec: 32 }
    ],
    usage: Array.from({ length: 30 }, (_, i) => ({ t: i, cpu: 36 + Math.cos(i / 3) * 18, gpu: 0 })),
    totalTimeSec: 200,
    trainTimeSec: 140,
    inferTimeMs: 26,
    quota: { gpuMemGB: 8, cpuCores: 8, ramGB: 16, timeLimitMin: 60 },
    actual: { gpuMemGB: 0, cpuCores: 6, ramGB: 12 },
    warnings: ['模型对温度的影响权重略低']
  };

  return (
    <div className="p-6 space-y-6">
      {/* 操作栏 */}
      <div className="flex justify-end items-center">
        <div className="flex items-center space-x-3">
          {/* 任务对比预览按钮，置于筛选按钮左侧 */}
          <Button
            size="sm"
            onClick={() => setIsCompareDemoOpen(true)}
            className="flex items-center space-x-2"
          >
            <GitCompare className="h-4 w-4" />
            <span>任务对比预览</span>
          </Button>

          {/* 示例类型选择：分类/回归/时序预测 */}
          <Select value={compareDemoType} onValueChange={(value) => setCompareDemoType(value as TaskType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="示例类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classification">分类</SelectItem>
              <SelectItem value="regression">回归</SelectItem>
              <SelectItem value="forecasting">时序预测</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>筛选</span>
          </Button>
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isCreateTaskOpen} onOpenChange={(open) => {
            setIsCreateTaskOpen(open);
            onCreateTaskDialogChange?.(open);
            if (!open) {
              // 重置到第1步
              setCurrentStep(1);
              // 重置表单
              setFormData({
                taskName: '',
                taskType: 'forecasting',
                projectId: '',
                datasetName: '',
                datasetVersion: '',
                selectedDataset: null,
                selectedDatasets: [],
                modelName: '',
                models: [],
                modelSelectionMode: 'multiple',
                targetFields: [],
                availableFields: [],
                priority: 'medium',
                description: '',
                config: '',
                hyperparameterMode: 'page',
              forecastingConfig: {
                contextLength: 24,
                forecastLength: 12,
                stepLength: 1,
                startTime: '',
                mainVariableFiles: [],
                covariateFiles: []
              },
                classificationConfig: {
                  trainRatio: 80,
                  testRatio: 20,
                  shuffle: false
                },
                regressionConfig: {
                  trainRatio: 80,
                  testRatio: 20,
                  shuffle: false
                },
                manualConfig: '',
                resourceType: 'auto',
                resourceConfig: {
                  cores: 4,
                  memory: 8,
                  maxRunTime: 120
                }
              });
              setFormErrors({});
              setIsEditMode(false);
              setEditingTask(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>创建任务</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isFullScreen ? 'sm:max-w-[100vw] max-w-[100vw] w-[100vw] h-[96vh]' : 'sm:max-w-[1920px] max-w-[1920px] w-[98vw] max-h-[90vh]'} overflow-y-auto overflow-x-hidden`}>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{isEditMode ? '编辑任务' : '创建新任务'}</span>
                </DialogTitle>
              </DialogHeader>
              {/* 步骤导航条 */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b mb-4">
                <div className="flex items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-2">
                    {steps.map((s, idx) => {
                      const isActive = currentStep === s.number;
                      const isCompleted = currentStep > s.number;
                      return (
                        <button
                          key={s.number}
                          type="button"
                          onClick={() => setCurrentStep(s.number)}
                          className={`${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 transition-colors`}
                          title={`第${s.number}步：${s.label}`}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}>{s.number}</span>
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullScreen(prev => !prev)}
                      className="ml-1"
                      title={isFullScreen ? '退出全屏' : '全屏'}
                    >
                      {isFullScreen ? (
                        <span className="inline-flex items-center gap-1"><Minimize2 className="h-4 w-4" /> 退出全屏</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Maximize2 className="h-4 w-4" /> 全屏</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* 第1步：基础信息配置 */}
                {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>基础信息配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="taskName" className="flex items-center space-x-1">
                          <span>任务名称</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="taskName"
                          value={formData.taskName}
                          onChange={(e) => handleInputChange('taskName', e.target.value)}
                          placeholder="输入任务名称（3-64个字符）"
                          className={formErrors.taskName ? 'border-red-500' : ''}
                        />
                        {formErrors.taskName && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.taskName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="taskType" className="flex items-center space-x-1">
                          <span>任务类型</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.taskType} onValueChange={(value) => handleInputChange('taskType', value)}>
                          <SelectTrigger className={formErrors.taskType ? 'border-red-500' : ''}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="forecasting">时序预测</SelectItem>
                            <SelectItem value="classification">分类</SelectItem>
                            <SelectItem value="regression">回归</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.taskType && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.taskType}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="projectId" className="flex items-center space-x-1">
                          <span>所属项目</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                          <SelectTrigger className={formErrors.projectId ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择所属项目" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProjects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.projectId && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.projectId}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">任务描述</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="描述任务目标和要求"
                        rows={3}
                      />
                    </div>

                    {/* 运行配置（整合至基础信息配置） */}
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium text-gray-900">运行配置</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center space-x-1">
                            <span>资源类型</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select value={formData.resourceType} onValueChange={(value) => handleInputChange('resourceType', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">自动分配</SelectItem>
                              <SelectItem value="cpu">CPU</SelectItem>
                              <SelectItem value="gpu">GPU</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="priority" className="flex items-center space-x-1">
                            <span>任务优先级</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span>低 - 空闲时执行</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="medium">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span>中 - 按时间顺序执行</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="high">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span>高 - 插队执行</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="urgent">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span>紧急 - 立即执行</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {formData.resourceType !== 'auto' && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium">资源配额设置</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="cores">CPU核心数</Label>
                              <Input
                                id="cores"
                                type="number"
                                value={formData.resourceConfig.cores}
                                onChange={(e) => handleInputChange('resourceConfig', {
                                  ...formData.resourceConfig,
                                  cores: parseInt(e.target.value) || 4
                                })}
                                min="1"
                                max="32"
                              />
                            </div>
                            <div>
                              <Label htmlFor="memory">内存 (GB)</Label>
                              <Input
                                id="memory"
                                type="number"
                                value={formData.resourceConfig.memory}
                                onChange={(e) => handleInputChange('resourceConfig', {
                                  ...formData.resourceConfig,
                                  memory: parseInt(e.target.value) || 8
                                })}
                                min="1"
                                max="128"
                              />
                            </div>
                            <div>
                              <Label htmlFor="maxRunTime">最大运行时长 (分钟)</Label>
                              <Input
                                id="maxRunTime"
                                type="number"
                                value={formData.resourceConfig.maxRunTime}
                                onChange={(e) => handleInputChange('resourceConfig', {
                                  ...formData.resourceConfig,
                                  maxRunTime: parseInt(e.target.value) || 120
                                })}
                                min="1"
                                max="2880"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第2步：数据与目标 */}
                {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>数据与目标</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 数据集选择 */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="datasetName" className="flex items-center space-x-1">
                          <span>数据集选择</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.datasetName} 
                          onValueChange={(value) => {
                            const selectedDataset = availableDatasets.find(d => d.id === value);
                            // 提取数据集字段
                            const availableFields = selectedDataset?.previewData && selectedDataset.previewData.length > 0 
                              ? Object.keys(selectedDataset.previewData[0]) 
                              : [];
                            
                            handleInputChange('datasetName', value);
                            handleInputChange('selectedDataset', selectedDataset || null);
                            handleInputChange('datasetVersion', ''); // 重置版本选择
                            handleInputChange('availableFields', availableFields); // 设置可用字段
                            handleInputChange('targetFields', []); // 重置目标字段选择
                          }}
                        >
                          <SelectTrigger className={formErrors.datasetName ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择已预处理的数据集" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDatasets
                              .filter(dataset => dataset.status === 'success')
                              .map(dataset => (
                                <SelectItem key={dataset.id} value={dataset.id}>
                                  <div className="flex flex-col items-start w-full">
                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">{dataset.name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {dataset.source === 'upload' ? '上传' : '订阅'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {dataset.sampleCount.toLocaleString()} 条记录 • {dataset.fieldCount} 个字段 • {dataset.size}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {formErrors.datasetName && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.datasetName}</p>
                        )}
                      </div>

                      {/* 数据集详情预览 */}
                      {formData.selectedDataset && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">数据集详情</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDatasetPreview(!showDatasetPreview)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {showDatasetPreview ? '隐藏预览' : '预览数据'}
                            </Button>
                          </div>
                          
                          {/* 优先显示所选版本的统计信息，未选择版本时显示数据集默认统计 */}
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">记录数：</span>
                              <span className="font-medium">{(
                                (formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.sampleCount ?? formData.selectedDataset.sampleCount)
                              ).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">字段数：</span>
                              <span className="font-medium">{
                                formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.fieldCount ?? formData.selectedDataset.fieldCount
                              }</span>
                            </div>
                            <div>
                              <span className="text-gray-500">大小：</span>
                              <span className="font-medium">{
                                formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.size ?? formData.selectedDataset.size
                              }</span>
                            </div>
                          </div>
                          {formData.datasetVersion && (
                            <div className="text-xs text-gray-500">当前版本：{formData.datasetVersion}（{formData.selectedDataset.versions.find(v => v.version === formData.datasetVersion)?.createdAt}）</div>
                          )}
                          
                          <p className="text-sm text-gray-600">{formData.selectedDataset.description}</p>
                          
                          {/* 数据预览表格 */}
                          {showDatasetPreview && formData.selectedDataset.previewData && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">数据预览（前5行）</h5>
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(formData.selectedDataset.previewData[0] || {}).map(key => (
                                        <TableHead key={key} className="text-xs">{key}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {formData.selectedDataset.previewData.slice(0, 5).map((row, index) => (
                                      <TableRow key={index}>
                                        {Object.values(row).map((value, cellIndex) => (
                                          <TableCell key={cellIndex} className="text-xs">
                                            {String(value)}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 版本选择 */}
                      <div>
                        <Label htmlFor="datasetVersion" className="flex items-center space-x-1">
                          <span>数据版本</span>
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.datasetVersion} 
                          onValueChange={(value) => handleInputChange('datasetVersion', value)}
                          disabled={!formData.datasetName}
                        >
                          <SelectTrigger className={formErrors.datasetVersion ? 'border-red-500' : ''}>
                            <SelectValue placeholder="选择数据版本" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.selectedDataset?.versions.map(version => (
                              <SelectItem key={version.version} value={version.version}>
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{version.version}</span>
                                    <span className="text-xs text-gray-500 ml-2">{version.createdAt}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {version.sampleCount.toLocaleString()} 条记录 • {version.fieldCount} 个字段 • {version.size}
                                  </div>
                                  {version.description && (
                                    <div className="text-xs text-gray-400 mt-1">{version.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.datasetVersion && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.datasetVersion}</p>
                        )}
                        {/* 添加到已选数据集列表 */}
                        <div className="mt-3">
                          <Button type="button" variant="outline" size="sm" onClick={addSelectedDataset} disabled={!formData.datasetName || !formData.datasetVersion}>
                            添加/更新至列表
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">可添加多个数据集进行联合训练。</p>
                        </div>
                      </div>
                    </div>

                    {/* 已选择的数据集列表（多选） */}
                    {formData.selectedDatasets.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">已选择的数据集</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedDatasets.map((ds) => {
                            const versions = availableDatasets.find(d => d.id === ds.id)?.versions ?? [];
                            return (
                              <div key={ds.id} className="flex items-center gap-2 bg-gray-100 rounded-md px-2 py-1">
                                <button
                                  type="button"
                                  className="text-sm font-medium hover:text-blue-600"
                                  title="点击回填到上方选择器以修改版本"
                                  onClick={() => backfillSelectedDataset(ds.id)}
                                >
                                  {ds.name}
                                </button>
                                <Select
                                  value={ds.version}
                                  onValueChange={(value) => updateSelectedDatasetVersion(ds.id, value)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-28 bg-transparent border-none shadow-none px-1 focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {versions.map(v => (
                                      <SelectItem key={v.version} value={v.version}>
                                        <div className="flex flex-col items-start w-full">
                                          <div className="flex items-center justify-between w-full">
                                            <span className="font-medium">{v.version}</span>
                                            <span className="text-xs text-gray-500 ml-2">{v.createdAt}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {v.sampleCount.toLocaleString()} 条记录 • {v.fieldCount} 个字段 • {v.size}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={() => removeSelectedDataset(ds.id)}
                                >
                                  移除
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500">提示：点击数据集名称可回填到上方选择器；右侧下拉可直接修改版本。</p>
                      </div>
                    )}

                    {/* 目标字段配置 */}
                    <div>
                      <Label className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>预测目标字段</span>
                        <span className="text-gray-500 text-sm">(可选)</span>
                      </Label>
                      
                      {formData.availableFields.length > 0 ? (
                        <div className="space-y-3">
                          {/* 字段选择区域 */}
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-medium text-gray-700">
                                可用字段 ({formData.availableFields.length}个)
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleInputChange('targetFields', [...formData.availableFields]);
                                  }}
                                  className="text-xs h-7"
                                >
                                  全选
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleInputChange('targetFields', []);
                                  }}
                                  className="text-xs h-7"
                                >
                                  清空
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {formData.availableFields.map((field) => {
                                // 简单的字段类型推断
                                const sampleValue = formData.selectedDataset?.previewData?.[0]?.[field];
                                const fieldType = typeof sampleValue === 'number' ? 'number' : 
                                                typeof sampleValue === 'boolean' ? 'boolean' : 'text';
                                const typeColor = fieldType === 'number' ? 'text-blue-600' : 
                                                fieldType === 'boolean' ? 'text-green-600' : 'text-gray-600';
                                
                                return (
                                  <div key={field} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`field-${field}`}
                                      checked={formData.targetFields.includes(field)}
                                      onCheckedChange={(checked) => {
                                        const newTargetFields = checked
                                          ? [...formData.targetFields, field]
                                          : formData.targetFields.filter(f => f !== field);
                                        handleInputChange('targetFields', newTargetFields);
                                      }}
                                    />
                                    <Label 
                                      htmlFor={`field-${field}`} 
                                      className="text-sm cursor-pointer hover:text-blue-600 flex-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{field}</span>
                                        <span className={`text-xs ${typeColor}`}>
                                          {fieldType}
                                        </span>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* 已选择字段显示 */}
                          {formData.targetFields.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700">
                                已选择字段 ({formData.targetFields.length}个)
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.targetFields.map((field) => (
                                  <Badge 
                                    key={field} 
                                    variant="secondary" 
                                    className="flex items-center space-x-1"
                                  >
                                    <span>{field}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTargetFields = formData.targetFields.filter(f => f !== field);
                                        handleInputChange('targetFields', newTargetFields);
                                      }}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 bg-gray-50 text-center text-gray-500">
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">请先添加至少一个数据集以查看可用字段</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        选择数据集中用于预测的目标字段，支持多选。如不选择，将使用所有数值型字段进行预测。
                      </p>
                      {formErrors.targetFields && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.targetFields}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第3步：模型选择 */}
                {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>模型选择</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 模型选择模式：移除单/多切换，默认多选 */}

                    {/* 模型选择 */}
                    <div>
                      <Label className="flex items-center space-x-1">
                        <span>模型选择</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-sm text-gray-500 mb-3">选择多个模型进行并行运行和对比</p>
                      
                      {/* 多选模式（默认） */}
                      <div className="space-y-2">
                        {availableModels
                          // 创建任务步骤：隐藏 神经网络模型、随机森林、AutoGluon 相关选项
                          .filter(model => 
                            model.status === 'available' &&
                            !['神经网络模型', '随机森林', 'AutoGluon-Tabular', 'AutoGluon'].includes(model.name)
                          )
                          .map(model => (
                            <div 
                              key={model.id} 
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                formData.models.includes(model.id) 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                const newModels = formData.models.includes(model.id)
                                  ? formData.models.filter(id => id !== model.id)
                                  : [...formData.models, model.id];
                                handleInputChange('models', newModels);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium">{model.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {model.type}
                                    </Badge>
                                    {model.accuracy && (
                                      <Badge variant="outline" className="text-xs">
                                        准确率: {model.accuracy}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>大小: {model.size}</span>
                                    <span>支持任务: {model.supportedTasks?.join(', ')}</span>
                                  </div>
                                  {model.features && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {model.features.map((feature, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <Checkbox
                                    checked={formData.models.includes(model.id)}
                                    onCheckedChange={() => {}}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      
                      {/* 已选择模型的摘要 */}
                      {(formData.models.length > 0) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">已选择的模型:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.models.map(modelId => (
                              <Badge key={modelId} variant="default">
                                {availableModels.find(m => m.id === modelId)?.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {formErrors.models && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.models}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 第4步：参数配置 */}
                {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>参数配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">配置模式</Label>
                      <RadioGroup
                        value={formData.hyperparameterMode}
                        onValueChange={(value: 'page' | 'json') => handleInputChange('hyperparameterMode', value)}
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="page" id="page-mode" />
                          <Label htmlFor="page-mode" className="text-sm">页面配置</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="json" id="json-mode" />
                          <Label htmlFor="json-mode" className="text-sm">JSON配置</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.hyperparameterMode === 'page' 
                          ? '通过页面表单配置常见任务参数，简单直观' 
                          : '直接粘贴/编辑JSON配置，适合精细调优或批量迁移'
                        }
                      </p>
                    </div>
                    {formData.hyperparameterMode === 'page' ? (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">页面配置</span>
                        </div>

                        {formData.taskType === 'forecasting' && (
                          <div className="space-y-4">
                            {/* 时间列：来源于第2步选择的数据集公共字段 */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="timeColumn" className="flex items-center space-x-1">
                                  <span>时间列</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                {formData.availableFields.length > 0 ? (
                                  <Select
                                    value={formData.forecastingConfig.timeColumn || ''}
                                    onValueChange={(value) =>
                                      handleInputChange('forecastingConfig', {
                                        ...formData.forecastingConfig,
                                        timeColumn: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className={formErrors.forecastingTimeColumn ? 'border-red-500' : ''}>
                                      <SelectValue placeholder="选择来源于公共字段的时间列" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {formData.availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input id="timeColumn" disabled placeholder="请先在第2步选择数据集以获取公共字段" />
                                )}
                                {formErrors.forecastingTimeColumn && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingTimeColumn}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">提示：时间列来源于第2步所选数据集的公共字段，确保数据一致性。</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="contextLength" className="flex items-center space-x-1">
                                  <span>上下文长度</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="contextLength"
                                  type="number"
                                  value={formData.forecastingConfig.contextLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    contextLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingContextLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingContextLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="forecastLength" className="flex items-center space-x-1">
                                  <span>预测长度</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="forecastLength"
                                  type="number"
                                  value={formData.forecastingConfig.forecastLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    forecastLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingForecastLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingForecastLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="stepLength" className="flex items-center space-x-1">
                                  <span>预测步长</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="stepLength"
                                  type="number"
                                  value={formData.forecastingConfig.stepLength}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    stepLength: parseInt(e.target.value) || 0
                                  })}
                                  min="1"
                                  max="10000"
                                />
                                {formErrors.forecastingStepLength && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingStepLength}</p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="startTime" className="flex items-center space-x-1">
                                  <span>预测开始时间</span>
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="startTime"
                                  type="datetime-local"
                                  value={formData.forecastingConfig.startTime}
                                  onChange={(e) => handleInputChange('forecastingConfig', {
                                    ...formData.forecastingConfig,
                                    startTime: e.target.value
                                  })}
                                />
                                {formErrors.forecastingStartTime && (
                                  <p className="text-xs text-red-500 mt-1">{formErrors.forecastingStartTime}</p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {/* 主变量文件（多选） */}
                              <div>
                                <Label className="flex items-center gap-1">主变量文件<small className="text-gray-500">(可选，互斥)</small></Label>
                                <Popover open={mainFilesOpen} onOpenChange={setMainFilesOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={mainFilesOpen} className="w-full justify-between">
                                      {formData.forecastingConfig.mainVariableFiles.length > 0
                                        ? `已选择 ${formData.forecastingConfig.mainVariableFiles.length} 个文件`
                                        : '选择主变量文件'}
                                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[420px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput placeholder="搜索文件..." value={mainFilesQuery} onValueChange={setMainFilesQuery} />
                                      <CommandList>
                                        <CommandEmpty>没有匹配的文件</CommandEmpty>
                                        <CommandGroup heading="可选文件">
                                          {filteredMainOptions.map((file) => {
                                            const checked = formData.forecastingConfig.mainVariableFiles.includes(file);
                                            return (
                                              <CommandItem key={file} onSelect={() => toggleMainFile(file)}>
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={() => toggleMainFile(file)}
                                                  className="mr-2"
                                                />
                                                <span className="truncate">{file}</span>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {formData.forecastingConfig.mainVariableFiles.map((file) => (
                                    <Badge key={file} variant="secondary" className="flex items-center gap-1">
                                      <span className="truncate max-w-[200px]">{file}</span>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted"
                                        onClick={() => toggleMainFile(file)}
                                        aria-label={`移除 ${file}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {formData.forecastingConfig.mainVariableFiles.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, mainVariableFiles: [] })}>清空</Button>
                                  )}
                                </div>
                              </div>
                              {/* 协变量文件（多选） */}
                              <div>
                                <Label className="flex items-center gap-1">协变量文件<small className="text-gray-500">(多选，互斥)</small></Label>
                                <Popover open={covFilesOpen} onOpenChange={setCovFilesOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={covFilesOpen} className="w-full justify-between">
                                      {formData.forecastingConfig.covariateFiles.length > 0
                                        ? `已选择 ${formData.forecastingConfig.covariateFiles.length} 个文件`
                                        : '选择协变量文件'}
                                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[420px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput placeholder="搜索文件..." value={covFilesQuery} onValueChange={setCovFilesQuery} />
                                      <CommandList>
                                        <CommandEmpty>没有匹配的文件</CommandEmpty>
                                        <CommandGroup heading="可选文件">
                                          {filteredCovOptions.map((file) => {
                                            const checked = formData.forecastingConfig.covariateFiles.includes(file);
                                            return (
                                              <CommandItem key={file} onSelect={() => toggleCovFile(file)}>
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={() => toggleCovFile(file)}
                                                  className="mr-2"
                                                />
                                                <span className="truncate">{file}</span>
                                              </CommandItem>
                                            );
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {formData.forecastingConfig.covariateFiles.map((file) => (
                                    <Badge key={file} variant="secondary" className="flex items-center gap-1">
                                      <span className="truncate max-w-[200px]">{file}</span>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted"
                                        onClick={() => toggleCovFile(file)}
                                        aria-label={`移除 ${file}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {formData.forecastingConfig.covariateFiles.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => handleInputChange('forecastingConfig', { ...formData.forecastingConfig, covariateFiles: [] })}>清空</Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {formData.taskType === 'classification' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="class-train">训练集比例(%)</Label>
                                <Input
                                  id="class-train"
                                  type="number"
                                  value={formData.classificationConfig.trainRatio}
                                  onChange={(e) => {
                                    const train = parseInt(e.target.value) || 0;
                                    const test = 100 - train;
                                    handleInputChange('classificationConfig', {
                                      ...formData.classificationConfig,
                                      trainRatio: train,
                                      testRatio: test < 0 ? 0 : test
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                              <div>
                                <Label htmlFor="class-test">测试集比例(%)</Label>
                                <Input
                                  id="class-test"
                                  type="number"
                                  value={formData.classificationConfig.testRatio}
                                  onChange={(e) => {
                                    const test = parseInt(e.target.value) || 0;
                                    const train = 100 - test;
                                    handleInputChange('classificationConfig', {
                                      ...formData.classificationConfig,
                                      testRatio: test,
                                      trainRatio: train < 0 ? 0 : train
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="class-shuffle"
                                checked={formData.classificationConfig.shuffle}
                                onCheckedChange={(checked) => handleInputChange('classificationConfig', {
                                  ...formData.classificationConfig,
                                  shuffle: Boolean(checked)
                                })}
                              />
                              <Label htmlFor="class-shuffle">洗牌(Shuffle)</Label>
                            </div>
                            {formErrors.classificationSplit && (
                              <p className="text-xs text-red-500 mt-1">{formErrors.classificationSplit}</p>
                            )}
                          </div>
                        )}

                        {formData.taskType === 'regression' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="reg-train">训练集比例(%)</Label>
                                <Input
                                  id="reg-train"
                                  type="number"
                                  value={formData.regressionConfig.trainRatio}
                                  onChange={(e) => {
                                    const train = parseInt(e.target.value) || 0;
                                    const test = 100 - train;
                                    handleInputChange('regressionConfig', {
                                      ...formData.regressionConfig,
                                      trainRatio: train,
                                      testRatio: test < 0 ? 0 : test
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                              <div>
                                <Label htmlFor="reg-test">测试集比例(%)</Label>
                                <Input
                                  id="reg-test"
                                  type="number"
                                  value={formData.regressionConfig.testRatio}
                                  onChange={(e) => {
                                    const test = parseInt(e.target.value) || 0;
                                    const train = 100 - test;
                                    handleInputChange('regressionConfig', {
                                      ...formData.regressionConfig,
                                      testRatio: test,
                                      trainRatio: train < 0 ? 0 : train
                                    });
                                  }}
                                  min="1"
                                  max="99"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="reg-shuffle"
                                checked={formData.regressionConfig.shuffle}
                                onCheckedChange={(checked) => handleInputChange('regressionConfig', {
                                  ...formData.regressionConfig,
                                  shuffle: Boolean(checked)
                                })}
                              />
                              <Label htmlFor="reg-shuffle">洗牌(Shuffle)</Label>
                            </div>
                            {formErrors.regressionSplit && (
                              <p className="text-xs text-red-500 mt-1">{formErrors.regressionSplit}</p>
                            )}
                          </div>
                        )}

                        <div className="bg-blue-100 p-3 rounded border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>页面配置说明:</strong> 针对不同任务类型提供常用参数项。若需要更复杂的配置，请切换到 JSON 模式。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">JSON配置</span>
                        </div>
                        
                        <div>
                          <Label htmlFor="manualConfig" className="flex items-center space-x-1">
                        <span>参数配置 (JSON格式)</span>
                            <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="manualConfig"
                            value={formData.manualConfig}
                            onChange={(e) => handleInputChange('manualConfig', e.target.value)}
                            placeholder={`{
  "learning_rate": 0.1,
  "max_depth": 6,
  "n_estimators": 100,
  "subsample": 0.8,
  "colsample_bytree": 0.8
}`}
                            rows={8}
                            className="font-mono text-sm mt-1"
                          />
                          <div className="flex items-start mt-2 justify-between">
                            <div className="flex-1 pr-4">
                              <p className="text-sm text-gray-600">
                                请输入有效的 JSON 参数配置。可直接粘贴或上传 JSON 文件，或使用系统模板快速开始。
                              </p>
                              {jsonImportError && (
                                <p className="text-xs text-red-500 mt-1">{jsonImportError}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const tplObj = buildJsonTemplate();
                                  handleInputChange('manualConfig', JSON.stringify(tplObj, null, 2));
                                }}
                                className="flex items-center space-x-1"
                              >
                                <Settings className="h-4 w-4" />
                                <span>使用模板</span>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExportJsonTemplate}
                                className="flex items-center space-x-1"
                              >
                                <Download className="h-4 w-4" />
                                <span>导出模板</span>
                              </Button>
                              <input
                                ref={importJsonInputRef}
                                type="file"
                                accept="application/json,.json"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImportJsonFile(file);
                                  // 清空同名文件再次选择的阻塞
                                  e.currentTarget.value = '';
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => importJsonInputRef.current?.click()}
                                className="flex items-center space-x-1"
                              >
                                <Upload className="h-4 w-4" />
                                <span>导入配置</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                        <strong>提示:</strong> 不同模型支持的参数可能不同。请参考模型文档确保参数名称和取值范围正确。
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}

                {/* 删除：第4步运行资源配置（已合并到第1步） */}

                {/* 底部操作按钮（按步骤显示） */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateTaskOpen(false)}
                      disabled={isSubmitting}
                    >
                      取消
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={isSubmitting}
                      >
                        上一步
                      </Button>
                    )}
                    {currentStep < 4 ? (
                      <Button 
                        onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                        disabled={isSubmitting}
                      >
                        下一步
                      </Button>
                    ) : (
                      <Button 
                        onClick={isEditMode ? handleSaveEditTask : handleCreateTask}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{isEditMode ? '保存中...' : '创建中...'}</span>
                          </>
                        ) : (
                          <>
                            {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            <span>{isEditMode ? '保存修改' : '创建任务'}</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务对比预览弹窗 */}
      <Dialog open={isCompareDemoOpen} onOpenChange={setIsCompareDemoOpen}>
        <DialogContent className="sm:max-w-[1600px] max-w-[1600px] w-[98vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" /> 任务对比预览
            </DialogTitle>
          </DialogHeader>
          <TaskCompare
            task1={compareDemoType === 'classification' ? taskCompareDemoA : (compareDemoType === 'regression' ? taskCompareRegA : taskCompareFctA)}
            task2={compareDemoType === 'classification' ? taskCompareDemoB : (compareDemoType === 'regression' ? taskCompareRegB : taskCompareFctB)}
            onBack={() => setIsCompareDemoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 筛选面板 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>搜索</Label>
                <Input
                  placeholder="搜索任务名称、ID等"
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                />
              </div>
              
              <div>
                <Label>任务类型</Label>
                <Select value={filters.taskType} onValueChange={(value) => handleFilterChange('taskType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="forecasting">时序预测</SelectItem>
                    <SelectItem value="classification">分类</SelectItem>
                    <SelectItem value="regression">回归</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>状态</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">排队中</SelectItem>
                    <SelectItem value="running">运行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>所属项目</Label>
                <Select value={filters.projectId ?? 'all'} onValueChange={(value) => handleFilterChange('projectId', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部项目</SelectItem>
                    {mockProjects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>优先级</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部优先级</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>数据集名称</Label>
                <Input
                  placeholder="筛选数据集"
                  value={filters.datasetName}
                  onChange={(e) => handleFilterChange('datasetName', e.target.value)}
                />
              </div>

              <div>
                <Label>模型名称</Label>
                <Input
                  placeholder="筛选模型"
                  value={filters.modelName}
                  onChange={(e) => handleFilterChange('modelName', e.target.value)}
                />
              </div>

              <div>
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                />
              </div>

              <div>
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={resetFilters}>
                重置筛选
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                应用筛选
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 批量操作栏 */}
      {selectedTaskIds.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                已选择 {selectedTaskIds.length} 个任务
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('archive')}
                  className="flex items-center space-x-1"
                >
                  <Archive className="h-4 w-4" />
                  <span>批量归档</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('export')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>批量导出</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('retry')}
                  className="flex items-center space-x-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>批量重试</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务统计卡片 */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">总任务数</p>
                <p className="text-xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">运行中</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'running').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">已完成</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">失败</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'failed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-[160px]">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">排队中</p>
                <p className="text-xl font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>任务列表</CardTitle>
            <div className="text-sm text-gray-600">
              显示 {filteredTasks.length} / {tasks.length} 个任务
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('taskName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>任务名称</span>
                        {sortConfig.field === 'taskName' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>任务ID</TableHead>
                    <TableHead>任务类型</TableHead>
                    <TableHead>所属项目</TableHead>
                    <TableHead>数据集</TableHead>
                    <TableHead>模型</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>优先级</span>
                        {sortConfig.field === 'priority' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>状态</span>
                        {sortConfig.field === 'status' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>创建时间</span>
                        {sortConfig.field === 'createdAt' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('completedAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>完成时间</span>
                        {sortConfig.field === 'completedAt' && (
                          sortConfig.order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>创建者</TableHead>
                    <TableHead className="sticky right-0 bg-white z-30 border-l w-[220px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const statusConfig = getStatusConfig(task.status);
                    const priorityConfig = getPriorityConfig(task.priority);
                    const StatusIcon = statusConfig.icon;
                    const isHighlighted = task.id === highlightTaskId;
                    
                    return (
                      <TableRow
                        key={task.id}
                        id={`task-row-${task.id}`}
                        className={`hover:bg-gray-50 ${isHighlighted ? 'bg-amber-50 ring-2 ring-amber-200' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTaskIds.includes(task.id)}
                            onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.taskName}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {task.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTaskTypeLabel(task.taskType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.projectId || task.projectName ? (
                            <Badge variant="secondary" className="bg-purple-50">
                              {task.projectName ?? (task.projectId ? getProjectName(task.projectId) : '未选择项目')}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">未选择项目</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.datasets && task.datasets.length > 0 ? (
                            <div>
                              <div className="font-medium flex flex-wrap gap-2">
                                {task.datasets.slice(0, 3).map((ds) => (
                                  <Badge key={ds.id} variant="secondary">
                                    {ds.name}
                                  </Badge>
                                ))}
                                {task.datasets.length > 3 && (
                                  <span className="text-xs text-gray-500">+{task.datasets.length - 3} 更多</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {task.datasets.slice(0, 1).map((ds) => (
                                  <span key={ds.id}>{ds.version}</span>
                                ))}
                                {task.datasets.length > 1 && (
                                  <span className="ml-1">等 {task.datasets.length} 个数据集</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{task.datasetName}</div>
                              <div className="text-sm text-gray-500">{task.datasetVersion}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {task.modelName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {task.status === 'running' && task.progress !== undefined && (
                              <div className="w-20">
                                <Progress value={task.progress} className="h-2" />
                                <div className="text-xs text-gray-500 mt-1">{task.progress}%</div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(task.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {task.completedAt 
                              ? new Date(task.completedAt).toLocaleString('zh-CN')
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{task.createdBy}</span>
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-white z-20 border-l">
                          {/* 常用操作直接展示 */}
                          {(() => {
                            const actions = getAvailableActions(task);
                            const commonKeys = ['view', 'edit', 'start', 'pause'];
                            const commonActions = actions.filter(a => commonKeys.includes(a.key));
                            const moreActions = actions.filter(a => !commonKeys.includes(a.key));
                            const hasStart = commonActions.some(a => a.key === 'start');
                            const hasPause = commonActions.some(a => a.key === 'pause');
                            return (
                              <div className="flex items-center gap-2 justify-end w-[220px]">
                                {/* 详情 */}
                                <Button variant="outline" size="sm" onClick={() => handleTaskAction('view', task.id)} className="px-2">
                                  <Eye className="h-4 w-4 mr-1" /> 详情
                                </Button>
                                {/* 编辑（仅当可用） */}
                                {commonActions.some(a => a.key === 'edit') && (
                                  <Button variant="outline" size="sm" onClick={() => handleTaskAction('edit', task.id)} className="px-2">
                                    <Pencil className="h-4 w-4 mr-1" /> 编辑
                                  </Button>
                                )}
                                {/* 开始/暂停 */}
                                {hasStart && (
                                  <Button variant="default" size="sm" onClick={() => handleTaskAction('start', task.id)} className="px-2">
                                    <Play className="h-4 w-4 mr-1" /> 开始
                                  </Button>
                                )}
                                {hasPause && (
                                  <Button variant="secondary" size="sm" onClick={() => handleTaskAction('pause', task.id)} className="px-2">
                                    <Pause className="h-4 w-4 mr-1" /> 暂停
                                  </Button>
                                )}
                                {/* 更多 */}
                                {moreActions.length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="px-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {moreActions.map((action) => {
                                        const ActionIcon = action.icon;
                                        return (
                                          <DropdownMenuItem
                                            key={action.key}
                                            onClick={() => handleTaskAction(action.key, task.id)}
                                          >
                                            <ActionIcon className="h-4 w-4 mr-2" />
                                            {action.label}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            // 网格视图
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const statusConfig = getStatusConfig(task.status);
                const priorityConfig = getPriorityConfig(task.priority);
                const StatusIcon = statusConfig.icon;
                const isHighlighted = task.id === highlightTaskId;
                
                return (
                  <Card
                    key={task.id}
                    id={`task-grid-${task.id}`}
                    className={`hover:shadow-md transition-shadow ${isHighlighted ? 'ring-2 ring-amber-200 bg-amber-50' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                            />
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {task.id}
                            </code>
                          </div>
                          <CardTitle className="text-lg">{task.taskName}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getAvailableActions(task).map((action) => {
                              const ActionIcon = action.icon;
                              return (
                                <DropdownMenuItem
                                  key={action.key}
                                  onClick={() => handleTaskAction(action.key, task.id)}
                                >
                                  <ActionIcon className="h-4 w-4 mr-2" />
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {getTaskTypeLabel(task.taskType)}
                        </Badge>
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Database className="h-4 w-4 text-gray-400" />
                          {task.datasets && task.datasets.length > 0 ? (
                            <span>
                              {task.datasets[0].name} ({task.datasets[0].version})
                              {task.datasets.length > 1 && ` 等 ${task.datasets.length} 个数据集`}
                            </span>
                          ) : (
                            <span>{task.datasetName} ({task.datasetVersion})</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Cpu className="h-4 w-4 text-gray-400" />
                          <span>{task.modelName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Target className="h-4 w-4 text-gray-400" />
                          {task.projectId || task.projectName ? (
                            <Badge variant="secondary" className="bg-purple-50">
                              {task.projectName ?? (task.projectId ? getProjectName(task.projectId) : '未选择项目')}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">未选择项目</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{task.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {task.status === 'running' && task.progress !== undefined && (
                          <div className="flex items-center space-x-2">
                            <Progress value={task.progress} className="w-16 h-2" />
                            <span className="text-xs text-gray-500">{task.progress}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的任务</h3>
              <p className="text-gray-600">尝试调整筛选条件或创建新任务</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 任务详情对话框 */}
      {selectedTaskForDetails && (
        <Dialog open={!!selectedTaskForDetails} onOpenChange={() => setSelectedTaskForDetails(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>任务详情 - {selectedTaskForDetails.taskName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 任务详情内容 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">任务ID</Label>
                    <p className="mt-1">{selectedTaskForDetails.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">任务类型</Label>
                    <p className="mt-1">{getTaskTypeLabel(selectedTaskForDetails.taskType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">数据集</Label>
                    <p className="mt-1">{selectedTaskForDetails.datasetName} ({selectedTaskForDetails.datasetVersion})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">模型</Label>
                    <p className="mt-1">{selectedTaskForDetails.modelName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">状态</Label>
                    <div className="mt-1">
                      <Badge className={getStatusConfig(selectedTaskForDetails.status).color}>
                        {getStatusConfig(selectedTaskForDetails.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">优先级</Label>
                    <div className="mt-1">
                      <Badge className={getPriorityConfig(selectedTaskForDetails.priority).color}>
                        {getPriorityConfig(selectedTaskForDetails.priority).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">创建时间</Label>
                    <p className="mt-1">{new Date(selectedTaskForDetails.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">创建者</Label>
                    <p className="mt-1">{selectedTaskForDetails.createdBy}</p>
                  </div>
                </div>
              </div>
              
              {selectedTaskForDetails.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">任务描述</Label>
                  <p className="mt-1 text-gray-900">{selectedTaskForDetails.description}</p>
                </div>
              )}

              {selectedTaskForDetails.status === 'running' && selectedTaskForDetails.progress !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">执行进度</Label>
                  <div className="mt-2">
                    <Progress value={selectedTaskForDetails.progress} className="h-3" />
                    <p className="text-sm text-gray-600 mt-1">{selectedTaskForDetails.progress}% 完成</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 确认操作对话框 */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={handleCancelConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'start' && (
                <>
                  <Play className="h-5 w-5 text-green-600" />
                  确认开始任务
                </>
              )}
              {confirmDialog.action === 'cancel' && (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  确认取消任务
                </>
              )}
              {confirmDialog.action === 'retry' && (
                <>
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  确认重试任务
                </>
              )}
              {confirmDialog.action === 'archive' && (
                <>
                  <Archive className="h-5 w-5 text-gray-600" />
                  确认归档任务
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">任务名称</p>
              <p className="font-medium">{confirmDialog.taskName}</p>
            </div>
            
            <div className="text-sm text-gray-600">
              {confirmDialog.action === 'start' && (
                <p>确认要开始执行此任务吗？任务开始后将消耗计算资源，请确保配置正确。</p>
              )}
              {confirmDialog.action === 'cancel' && (
                <p>确认要取消此任务吗？取消后任务将停止执行，已完成的部分将被保留。</p>
              )}
              {confirmDialog.action === 'retry' && (
                <p>确认要重试此任务吗？重试将按当前配置重新执行失败或已取消的任务。</p>
              )}
              {confirmDialog.action === 'archive' && (
                <p>确认要归档此任务吗？归档后任务将移至历史记录，不会影响任务结果。</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelConfirm}
            >
              取消
            </Button>
            <Button
              variant="default"
              type="button"
              onClick={() => executeTaskAction(confirmDialog.action, confirmDialog.taskId)}
              className={
                confirmDialog.action === 'start' 
                  ? '!bg-green-600 hover:!bg-green-700 !text-white' 
                : confirmDialog.action === 'cancel'
                  ? '!bg-red-600 hover:!bg-red-700 !text-white'
                : confirmDialog.action === 'retry'
                  ? '!bg-blue-600 hover:!bg-blue-700 !text-white'
                  : '!bg-gray-700 hover:!bg-gray-800 !text-white'
              }
            >
              {confirmDialog.action === 'start' ? '开始任务' : 
               confirmDialog.action === 'cancel' ? '取消任务' : 
               confirmDialog.action === 'retry' ? '重试任务' : 
               confirmDialog.action === 'archive' ? '归档任务' : '确认'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { TaskManagement };