import React, { useState, useEffect } from 'react';
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
  GitCompare
} from 'lucide-react';
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

// 任务类型定义
type TaskType = 'prediction' | 'classification' | 'evaluation' | 'regression';
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'table' | 'grid';
type SortField = 'createdAt' | 'completedAt' | 'status' | 'priority' | 'taskName';
type SortOrder = 'asc' | 'desc';

// 任务接口定义
interface Task {
  id: string;
  taskName: string;
  taskType: TaskType;
  datasetName: string;
  datasetVersion: string;
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
}

// 更新FormData接口，添加数据集相关字段
interface FormData {
  taskName: string;
  taskType: TaskType;
  datasetName: string;
  datasetVersion: string;
  selectedDataset: DatasetInfo | null; // 新增：选中的数据集详细信息
  modelName: string;
  models: string[]; // 支持多模型选择
  modelSelectionMode: 'single' | 'multiple'; // 新增：模型选择模式
  targetFields: string[]; // 预测目标字段（支持多选）
  availableFields: string[]; // 数据集中可用的字段列表
  priority: TaskPriority;
  description: string;
  config: string;
  hyperparameterMode: 'auto' | 'manual'; // 超参数配置模式
  autoMLConfig: {
    maxTime: number; // 早停时间（分钟）
    searchSpace: string;
  };
  manualConfig: string; // JSON格式手动配置
  resourceType: 'cpu' | 'gpu' | 'auto'; // 运行资源类型
  resourceConfig: {
    cores: number;
    memory: number; // GB
    maxRunTime: number; // 最大运行时长（分钟）
  };
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  isCreateTaskDialogOpen = false,
  onCreateTaskDialogChange,
  onOpenTaskDetailFullPage
}) => {
  // 状态管理
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCompareDemoOpen, setIsCompareDemoOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  
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
    datasetName: '',
    modelName: '',
    priority: 'all',
    dateRange: { start: '', end: '' },
    searchQuery: ''
  });

  // 任务创建表单状态
  const [formData, setFormData] = useState<FormData>({
    taskName: '',
    taskType: 'prediction',
    datasetName: '',
    datasetVersion: '',
    selectedDataset: null,
    modelName: '',
    models: [],
    modelSelectionMode: 'multiple',
    targetFields: [],
    availableFields: [],
    priority: 'medium',
    description: '',
    config: '',
    hyperparameterMode: 'auto',
    autoMLConfig: {
      maxTime: 60,
      searchSpace: 'default'
    },
    manualConfig: '',
    resourceType: 'auto',
    resourceConfig: {
      cores: 4,
      memory: 8,
      maxRunTime: 120
    }
  });

  // 添加表单验证状态
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatasetPreview, setShowDatasetPreview] = useState(false);

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
      versions: [
        {
          version: 'v3',
          createdAt: '2025-01-15 14:30',
          description: '修复数据质量问题，增加新特征',
          size: '2.5MB',
          fieldCount: 15,
          sampleCount: 10000
        },
        {
          version: 'v2',
          createdAt: '2025-01-10 10:20',
          description: '数据清洗优化，移除异常值',
          size: '2.3MB',
          fieldCount: 14,
          sampleCount: 9800
        },
        {
          version: 'v1',
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
      versions: [
        {
          version: 'v2',
          createdAt: '2025-01-12 09:15',
          description: '增加用户画像特征',
          size: '5.2MB',
          fieldCount: 20,
          sampleCount: 25000
        },
        {
          version: 'v1',
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

  const [availableModels] = useState([
    { 
      id: 'MODEL-001', 
      name: 'XGBoost分类器', 
      type: '自研模型', 
      status: 'available',
      description: '基于梯度提升的高性能分类算法，适用于结构化数据分类任务',
      accuracy: '92.5%',
      size: '15.2MB',
      supportedTasks: ['classification', 'prediction'],
      trainingTime: '~30分钟',
      features: ['高准确率', '快速训练', '特征重要性分析']
    },
    { 
      id: 'MODEL-002', 
      name: 'LightGBM回归器', 
      type: '自研模型', 
      status: 'available',
      description: '轻量级梯度提升框架，专为回归任务优化',
      accuracy: '89.3%',
      size: '8.7MB',
      supportedTasks: ['regression', 'prediction'],
      trainingTime: '~20分钟',
      features: ['内存效率高', '训练速度快', '支持类别特征']
    },
    { 
      id: 'MODEL-003', 
      name: '神经网络模型', 
      type: '微调模型', 
      status: 'available',
      description: '深度学习神经网络，适用于复杂模式识别',
      accuracy: '94.1%',
      size: '45.6MB',
      supportedTasks: ['classification', 'regression', 'prediction'],
      trainingTime: '~2小时',
      features: ['高精度', '强泛化能力', '支持复杂特征']
    },
    { 
      id: 'MODEL-004', 
      name: '随机森林', 
      type: '第三方模型', 
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
      type: 'AutoML模型', 
      status: 'available',
      description: 'AutoML自动机器学习框架，自动选择最优模型',
      accuracy: '95.2%',
      size: '78.9MB',
      supportedTasks: ['classification', 'regression', 'prediction'],
      trainingTime: '~3小时',
      features: ['自动调参', '模型集成', '无需专业知识']
    }
  ]);

  // 模拟任务数据
  const [tasks] = useState<Task[]>([
    {
      id: 'TASK-001',
      taskName: '销售数据预测模型训练',
      taskType: 'prediction',
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
      taskType: 'evaluation',
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
      taskType: 'prediction',
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

  // 任务类型映射
  const getTaskTypeLabel = (type: TaskType) => {
    const labels = {
      prediction: '预测',
      classification: '分类',
      evaluation: '评估',
      regression: '回归'
    };
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

    // 数据集验证
    if (!formData.selectedDataset) {
      errors.datasetName = '请选择数据集';
    }

    // 数据版本验证
    if (!formData.datasetVersion) {
      errors.datasetVersion = '请选择数据版本';
    }

    // 目标字段验证（可选）
    if (formData.targetFields.length > 10) {
      errors.targetFields = '最多只能选择10个目标字段';
    }

    // 模型选择验证
    if (formData.modelSelectionMode === 'single') {
      if (!formData.modelName) {
        errors.modelName = '请选择一个模型';
      }
    } else {
      if (formData.models.length === 0) {
        errors.models = '请至少选择一个模型';
      } else if (formData.models.length > 5) {
        errors.models = '最多只能选择5个模型进行并行训练';
      }
    }

    // 超参数配置验证
    if (formData.hyperparameterMode === 'auto') {
      // AutoML配置验证
      if (formData.autoMLConfig.maxTime < 5 || formData.autoMLConfig.maxTime > 1440) {
        errors.autoMLMaxTime = '搜索时间应在5-1440分钟之间';
      }
      if (!formData.autoMLConfig.searchSpace) {
        errors.autoMLSearchSpace = '请选择搜索空间';
      }
    } else {
      // 手动配置验证
      if (!formData.manualConfig.trim()) {
        errors.manualConfig = '请输入超参数配置';
      } else {
        try {
          const config = JSON.parse(formData.manualConfig);
          if (typeof config !== 'object' || config === null || Array.isArray(config)) {
            errors.manualConfig = '超参数配置必须是有效的JSON对象';
          } else if (Object.keys(config).length === 0) {
            errors.manualConfig = '超参数配置不能为空对象';
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
      
      console.log('创建任务:', formData);
      
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

  // 处理筛选条件变化
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      taskType: 'all',
      status: 'all',
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
    info: { id: 'TC-A', name: '分类任务 A', dataset: 'CreditRisk v1', model: 'AutoGluon (v0.8)' },
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
    info: { id: 'TC-B', name: '分类任务 B', dataset: 'CreditRisk v1', model: 'LimX (v1.2)' },
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
              // 重置表单
              setFormData({
                taskName: '',
                taskType: 'prediction',
                datasetName: '',
                datasetVersion: '',
                selectedDataset: null,
                modelName: '',
                models: [],
                modelSelectionMode: 'multiple',
                targetFields: [],
                availableFields: [],
                priority: 'medium',
                description: '',
                config: '',
                hyperparameterMode: 'auto',
                autoMLConfig: {
                  maxTime: 60,
                  searchSpace: 'default'
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
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>创建任务</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>创建新任务</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 基本信息区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>基本信息</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="prediction">预测</SelectItem>
                            <SelectItem value="classification">分类</SelectItem>
                            <SelectItem value="evaluation">评估</SelectItem>
                            <SelectItem value="regression">回归</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.taskType && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.taskType}</p>
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
                  </CardContent>
                </Card>

                {/* 数据配置区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>数据配置</span>
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
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">记录数：</span>
                              <span className="font-medium">{formData.selectedDataset.sampleCount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">字段数：</span>
                              <span className="font-medium">{formData.selectedDataset.fieldCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">大小：</span>
                              <span className="font-medium">{formData.selectedDataset.size}</span>
                            </div>
                          </div>
                          
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
                      </div>
                    </div>

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
                          <p className="text-sm">请先选择数据集以查看可用字段</p>
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

                {/* 模型配置区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>模型配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 模型选择模式 */}
                    <div>
                      <Label className="text-sm font-medium">选择模式</Label>
                      <RadioGroup
                        value={formData.modelSelectionMode}
                        onValueChange={(value: 'single' | 'multiple') => {
                          handleInputChange('modelSelectionMode', value);
                          // 切换模式时清空已选择的模型
                          handleInputChange('models', []);
                          handleInputChange('modelName', '');
                        }}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <Label htmlFor="single" className="text-sm">单模型运行</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multiple" id="multiple" />
                          <Label htmlFor="multiple" className="text-sm">多模型对比</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 模型选择 */}
                    <div>
                      <Label className="flex items-center space-x-1">
                        <span>模型选择</span>
                        <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-sm text-gray-500 mb-3">
                        {formData.modelSelectionMode === 'single' 
                          ? '选择一个模型进行训练' 
                          : '选择多个模型进行并行运行和对比'
                        }
                      </p>
                      
                      {formData.modelSelectionMode === 'single' ? (
                        // 单选模式
                        <div className="space-y-2">
                          {availableModels
                            .filter(model => model.status === 'available')
                            .map(model => (
                              <div 
                                key={model.id} 
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                  formData.modelName === model.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleInputChange('modelName', model.id)}
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
                                      <span>训练时间: {model.trainingTime}</span>
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
                                    <div className={`w-4 h-4 rounded-full border-2 ${
                                      formData.modelName === model.id 
                                        ? 'border-blue-500 bg-blue-500' 
                                        : 'border-gray-300'
                                    }`}>
                                      {formData.modelName === model.id && (
                                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        // 多选模式
                        <div className="space-y-2">
                          {availableModels
                            .filter(model => model.status === 'available')
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
                                      <span>训练时间: {model.trainingTime}</span>
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
                      )}
                      
                      {/* 已选择模型的摘要 */}
                      {((formData.modelSelectionMode === 'single' && formData.modelName) || 
                        (formData.modelSelectionMode === 'multiple' && formData.models.length > 0)) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">已选择的模型:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.modelSelectionMode === 'single' ? (
                              formData.modelName && (
                                <Badge variant="default">
                                  {availableModels.find(m => m.id === formData.modelName)?.name}
                                </Badge>
                              )
                            ) : (
                              formData.models.map(modelId => (
                                <Badge key={modelId} variant="default">
                                  {availableModels.find(m => m.id === modelId)?.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                      
                      {formErrors.models && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.models}</p>
                      )}
                      {formErrors.modelName && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.modelName}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 超参数配置区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>超参数配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">配置模式</Label>
                      <RadioGroup
                        value={formData.hyperparameterMode}
                        onValueChange={(value: 'auto' | 'manual') => handleInputChange('hyperparameterMode', value)}
                        className="flex space-x-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auto" id="auto-mode" />
                          <Label htmlFor="auto-mode" className="text-sm">自动搜参 (AutoML)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual-mode" />
                          <Label htmlFor="manual-mode" className="text-sm">手动配置</Label>
                        </div>
                      </RadioGroup>
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.hyperparameterMode === 'auto' 
                          ? '系统自动搜索最优超参数组合，适合快速实验' 
                          : '手动指定超参数，适合精细调优'
                        }
                      </p>
                    </div>

                    {formData.hyperparameterMode === 'auto' ? (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">AutoML 配置</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="maxTime" className="flex items-center space-x-1">
                              <span>最大搜索时间</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Input
                                id="maxTime"
                                type="number"
                                value={formData.autoMLConfig.maxTime}
                                onChange={(e) => handleInputChange('autoMLConfig', {
                                  ...formData.autoMLConfig,
                                  maxTime: parseInt(e.target.value) || 60
                                })}
                                min="5"
                                max="1440"
                                className="w-24"
                              />
                              <span className="text-sm text-gray-600">分钟</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              建议: 5-60分钟
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="searchSpace">搜索空间</Label>
                            <Select 
                              value={formData.autoMLConfig.searchSpace} 
                              onValueChange={(value) => handleInputChange('autoMLConfig', {
                                ...formData.autoMLConfig,
                                searchSpace: value
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">默认搜索空间</SelectItem>
                                <SelectItem value="light">轻量搜索空间</SelectItem>
                                <SelectItem value="extensive">扩展搜索空间</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              搜索空间越大，找到更优参数的可能性越高
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-blue-100 p-3 rounded border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>AutoML 说明:</strong> 系统将自动尝试不同的超参数组合，并根据验证集性能选择最优配置。
                            搜索过程中会显示实时进度和当前最佳结果。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">手动配置</span>
                        </div>
                        
                        <div>
                          <Label htmlFor="manualConfig" className="flex items-center space-x-1">
                            <span>超参数配置 (JSON格式)</span>
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
                          <div className="flex items-start space-x-2 mt-2">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                请输入有效的JSON格式超参数配置。系统会进行格式校验和参数范围检查。
                              </p>
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // 这里可以添加参数模板功能
                                const template = {
                                  learning_rate: 0.1,
                                  max_depth: 6,
                                  n_estimators: 100
                                };
                                handleInputChange('manualConfig', JSON.stringify(template, null, 2));
                              }}
                            >
                              使用模板
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>提示:</strong> 不同模型支持的超参数可能不同。请参考模型文档确保参数名称和取值范围正确。
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 运行配置区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Cpu className="h-4 w-4" />
                      <span>运行配置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateTaskOpen(false)}
                    disabled={isSubmitting}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleCreateTask}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>创建中...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>创建任务</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 任务对比预览弹窗 */}
      <Dialog open={isCompareDemoOpen} onOpenChange={setIsCompareDemoOpen}>
        <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" /> 任务对比预览
            </DialogTitle>
          </DialogHeader>
          <TaskCompare
            task1={taskCompareDemoA}
            task2={taskCompareDemoB}
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
                    <SelectItem value="prediction">预测</SelectItem>
                    <SelectItem value="classification">分类</SelectItem>
                    <SelectItem value="evaluation">评估</SelectItem>
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
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const statusConfig = getStatusConfig(task.status);
                    const priorityConfig = getPriorityConfig(task.priority);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={task.id} className="hover:bg-gray-50">
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
                          <div>
                            <div className="font-medium">{task.datasetName}</div>
                            <div className="text-sm text-gray-500">{task.datasetVersion}</div>
                          </div>
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
                        <TableCell>
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
                
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
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
                          <span>{task.datasetName} ({task.datasetVersion})</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Cpu className="h-4 w-4 text-gray-400" />
                          <span>{task.modelName}</span>
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