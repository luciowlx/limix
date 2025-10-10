import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, User, Database, Brain, AlertCircle, CheckCircle, XCircle, Pause, Play, RotateCcw, Archive, Eye, Settings, Download, Share2, Calendar, Tag, FileText, BarChart3, Activity, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// Tabs removed in favor of左侧锚点导航
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './ui/chart';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ErrorBar,
} from 'recharts';

interface Task {
  id: string;
  taskName: string;
  taskType: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'forecasting' | 'nlp' | 'computer_vision';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  datasetName: string;
  datasetVersion: string;
  modelName: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  progress?: number;
  estimatedTime?: string;
  actualTime?: string;
  accuracy?: number;
  loss?: number;
  parameters?: Record<string, any>;
  logs?: Array<{ timestamp: string; level: 'info' | 'warning' | 'error'; message: string; }>;
  metrics?: Record<string, number>;
  artifacts?: Array<{ name: string; type: string; size: string; url: string; }>;
}

interface TaskDetailFullPageProps {
  task: Task;
  onClose: () => void;
  onOpenDataDetail?: (dataset: any) => void;
}

const TaskDetailFullPage: React.FC<TaskDetailFullPageProps> = ({ task, onClose, onOpenDataDetail }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic-info']);
  const [activeSection, setActiveSection] = useState<string>('meta');
  const contentRef = useRef<HTMLDivElement | null>(null);

  // 字段选择配置：默认全选
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedXFields, setSelectedXFields] = useState<string[]>([]);
  const [selectedYFields, setSelectedYFields] = useState<string[]>([]);

  useEffect(() => {
    // 完整字段来源：以数据预览的列为准，保证字段齐全
    try {
      const cols = Object.keys(mockDatasetRows[0] || {});
      setAvailableFields(cols);
      setSelectedXFields(cols);
      setSelectedYFields(cols);
    } catch (e) {
      // 兜底：若数据预览为空则使用字段级元信息列表
      const cols = (mockDatasetFields || []).map((f) => f.name);
      setAvailableFields(cols);
      setSelectedXFields(cols);
      setSelectedYFields(cols);
    }
  }, []);

  const handleToggleField = (field: string, group: 'x' | 'y') => {
    if (group === 'x') {
      setSelectedXFields((prev) =>
        prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
      );
    } else {
      setSelectedYFields((prev) =>
        prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
      );
    }
  };

  const handleSelectAll = (group: 'x' | 'y') => {
    if (group === 'x') setSelectedXFields(availableFields);
    else setSelectedYFields(availableFields);
  };

  const handleClearAll = (group: 'x' | 'y') => {
    if (group === 'x') setSelectedXFields([]);
    else setSelectedYFields([]);
  };

  const sections = [
    { id: 'meta', label: '概览信息', icon: FileText },
    { id: 'dataset', label: '数据集信息', icon: Database },
    { id: 'model', label: '模型信息', icon: Brain },
    { id: 'params', label: '参数配置', icon: Settings },
    { id: 'results', label: '任务结果', icon: BarChart3 },
    { id: 'causal', label: '因果解释', icon: Zap },
    { id: 'logs', label: '执行日志', icon: FileText },
    { id: 'artifacts', label: '任务产物', icon: Download },
  ];

  // Mock data for demonstration
  const mockLogs = [
    { timestamp: '2024/1/15 14:30:25', level: 'info' as const, message: '开始数据预处理...' },
    { timestamp: '2024/1/15 14:32:10', level: 'info' as const, message: '数据清洗完成，处理了1000条记录' },
    { timestamp: '2024/1/15 14:35:45', level: 'warning' as const, message: '检测到5个异常值，已自动处理' },
    { timestamp: '2024/1/15 14:40:12', level: 'info' as const, message: '模型训练开始...' },
    { timestamp: '2024/1/15 15:15:30', level: 'info' as const, message: 'Epoch 1/10 完成，准确率: 85.2%' },
    { timestamp: '2024/1/15 15:45:18', level: 'info' as const, message: 'Epoch 5/10 完成，准确率: 92.1%' },
    { timestamp: '2024/1/15 16:20:05', level: 'error' as const, message: '内存不足，正在优化批处理大小...' },
    { timestamp: '2024/1/15 16:25:33', level: 'info' as const, message: '恢复训练，批处理大小调整为64' },
  ];

  const mockMetrics = {
    accuracy: 0.921,
    precision: 0.895,
    recall: 0.887,
    f1_score: 0.891,
    auc_roc: 0.945,
    loss: 0.234,
    val_accuracy: 0.898,
    val_loss: 0.267,
  };

  // 训练历史示例数据（参考scikit-learn文档的学习曲线样式）
  const trainingHistory = [
    { epoch: 1, train_acc: 0.72, val_acc: 0.68, train_loss: 0.62, val_loss: 0.65 },
    { epoch: 2, train_acc: 0.80, val_acc: 0.74, train_loss: 0.52, val_loss: 0.58 },
    { epoch: 3, train_acc: 0.85, val_acc: 0.79, train_loss: 0.44, val_loss: 0.51 },
    { epoch: 4, train_acc: 0.88, val_acc: 0.83, train_loss: 0.38, val_loss: 0.46 },
    { epoch: 5, train_acc: 0.90, val_acc: 0.86, train_loss: 0.34, val_loss: 0.42 },
    { epoch: 6, train_acc: 0.91, val_acc: 0.87, train_loss: 0.31, val_loss: 0.39 },
    { epoch: 7, train_acc: 0.92, val_acc: 0.88, train_loss: 0.29, val_loss: 0.37 },
    { epoch: 8, train_acc: 0.93, val_acc: 0.89, train_loss: 0.27, val_loss: 0.35 },
  ];

  // ROC与PR曲线示例数据（近似形状）
  const rocCurve = [
    { tpr: 0.0, fpr: 0.0 },
    { tpr: 0.2, fpr: 0.02 },
    { tpr: 0.4, fpr: 0.05 },
    { tpr: 0.6, fpr: 0.09 },
    { tpr: 0.75, fpr: 0.14 },
    { tpr: 0.85, fpr: 0.20 },
    { tpr: 0.92, fpr: 0.28 },
    { tpr: 0.97, fpr: 0.40 },
    { tpr: 1.0, fpr: 1.0 },
  ];

  const prCurve = [
    { recall: 0.0, precision: 1.0 },
    { recall: 0.2, precision: 0.95 },
    { recall: 0.4, precision: 0.90 },
    { recall: 0.6, precision: 0.86 },
    { recall: 0.7, precision: 0.83 },
    { recall: 0.8, precision: 0.80 },
    { recall: 0.9, precision: 0.74 },
    { recall: 1.0, precision: 0.68 },
  ];

  // 分类任务：指标报表（支持 micro/macro/weighted）
  const [avgMethod, setAvgMethod] = useState<'micro' | 'macro' | 'weighted'>('macro');
  const classificationMetrics = {
    accuracy: 0.921,
    precision: { micro: 0.902, macro: 0.895, weighted: 0.900 },
    recall: { micro: 0.898, macro: 0.887, weighted: 0.889 },
    f1: { micro: 0.900, macro: 0.891, weighted: 0.893 },
    roc_auc: { micro: 0.940, macro: 0.945, weighted: 0.943 },
  };

  // 多分类ROC曲线数据（示例三类 + macro/micro）
  const classificationRocData = [
    { fpr: 0.0, A: 0.00, B: 0.00, C: 0.00, macro: 0.00, micro: 0.00 },
    { fpr: 0.1, A: 0.45, B: 0.40, C: 0.42, macro: 0.42, micro: 0.44 },
    { fpr: 0.2, A: 0.62, B: 0.57, C: 0.60, macro: 0.60, micro: 0.61 },
    { fpr: 0.3, A: 0.74, B: 0.70, C: 0.72, macro: 0.72, micro: 0.73 },
    { fpr: 0.4, A: 0.82, B: 0.78, C: 0.80, macro: 0.80, micro: 0.81 },
    { fpr: 0.5, A: 0.88, B: 0.84, C: 0.86, macro: 0.86, micro: 0.87 },
    { fpr: 0.6, A: 0.92, B: 0.88, C: 0.90, macro: 0.90, micro: 0.91 },
    { fpr: 1.0, A: 1.00, B: 1.00, C: 1.00, macro: 1.00, micro: 1.00 },
  ];

  // 多分类PR曲线数据（示例三类 + macro/micro）
  const classificationPRData = [
    { recall: 0.0, A: 1.0, B: 1.0, C: 1.0, macro: 1.0, micro: 1.0 },
    { recall: 0.2, A: 0.95, B: 0.92, C: 0.93, macro: 0.93, micro: 0.94 },
    { recall: 0.4, A: 0.90, B: 0.86, C: 0.88, macro: 0.88, micro: 0.89 },
    { recall: 0.6, A: 0.85, B: 0.80, C: 0.83, macro: 0.83, micro: 0.84 },
    { recall: 0.8, A: 0.78, B: 0.73, C: 0.76, macro: 0.76, micro: 0.77 },
    { recall: 1.0, A: 0.70, B: 0.66, C: 0.68, macro: 0.68, micro: 0.69 },
  ];

  // 混淆矩阵（3类示例）
  const confusionMatrix = {
    labels: ['A', 'B', 'C'],
    values: [
      [50, 5, 2],
      [4, 46, 3],
      [1, 3, 52],
    ],
  };

  // 模型对比（分类）
  const [clsCompareMetric, setClsCompareMetric] = useState<'accuracy' | 'f1_macro' | 'roc_auc_macro'>('accuracy');
  const classificationModelComparison = [
    { model: 'Model A', accuracy: 0.91, f1_macro: 0.89, roc_auc_macro: 0.94 },
    { model: 'Model B', accuracy: 0.93, f1_macro: 0.90, roc_auc_macro: 0.95 },
    { model: 'Model C', accuracy: 0.90, f1_macro: 0.88, roc_auc_macro: 0.93 },
  ];

  // 回归任务：指标报表与数据
  const regressionMetrics = { mse: 32.5, rmse: 5.7, mae: 4.1, r2: 0.87 };
  const regressionPredictions = [
    { actual: 50, pred: 47 }, { actual: 55, pred: 52 }, { actual: 60, pred: 63 },
    { actual: 65, pred: 62 }, { actual: 70, pred: 73 }, { actual: 75, pred: 76 },
    { actual: 80, pred: 78 }, { actual: 85, pred: 88 }, { actual: 90, pred: 92 },
    { actual: 95, pred: 97 }, { actual: 100, pred: 98 }, { actual: 105, pred: 110 },
    { actual: 110, pred: 112 }, { actual: 115, pred: 118 }, { actual: 120, pred: 119 },
  ];
  const regressionResiduals = regressionPredictions.map((d) => ({ pred: d.pred, residual: d.pred - d.actual }));
  const errorHistogram = [
    { bin: '-10~-6', count: 2 }, { bin: '-6~-3', count: 4 }, { bin: '-3~0', count: 5 },
    { bin: '0~3', count: 6 }, { bin: '3~6', count: 3 }, { bin: '6~10', count: 2 },
  ];

  // 模型对比（回归）
  const [regCompareMetric, setRegCompareMetric] = useState<'mse' | 'rmse' | 'mae' | 'r2'>('rmse');
  const regressionModelComparison = [
    { model: 'Model A', mse: 35.2, rmse: 5.9, mae: 4.3, r2: 0.86 },
    { model: 'Model B', mse: 30.1, rmse: 5.5, mae: 3.9, r2: 0.88 },
    { model: 'Model C', mse: 33.4, rmse: 5.8, mae: 4.2, r2: 0.87 },
  ];

  // 因果解释：DeepSeek预测过程与因果图示意
  const [isDeepSeekOpen, setDeepSeekOpen] = useState(false);
  const featureWeights = [
    { feature: 'Pixels_Areas', weight: 0.32 },
    { feature: 'Sum_of_Luminosity', weight: 0.27 },
    { feature: 'Steel_Plate_Thickness', weight: 0.21 },
    { feature: 'Orientation_Index', weight: 0.11 },
    { feature: 'Edge_Roughness', weight: 0.07 },
    { feature: 'Temperature', weight: 0.05 },
    { feature: 'Vibration', weight: 0.03 },
  ];
  const deepSeekSteps = [
    '特征归一化与异常值处理',
    '基于信息增益的特征筛选',
    '规则生成与阈值分段',
    '多分类投票与置信度计算',
  ];
  const decisionRules = [
    '当 Pixels_Areas 小且 Sum_of_Luminosity 低 → 类别 0/1',
    '当 Steel_Plate_Thickness 大 → 类别 5/6',
    '当 Orientation_Index 为负且绝对值较大 → 类别 2',
    '其他情况 → 选择常见类别（缺陷）',
  ];
  const causalGraph = {
    nodes: [
      { id: 'Z1', x: 60, y: 60 },
      { id: 'Z2', x: 240, y: 60 },
      { id: 'Z3', x: 420, y: 60 },
      { id: 'X', x: 240, y: 160 },
      { id: 'Y', x: 240, y: 260 },
      { id: 'U1', x: 420, y: 20 },
      { id: 'U2a', x: 60, y: 20 },
      { id: 'U2b', x: 420, y: 260 },
    ],
    edges: [
      { from: 'Z1', to: 'X', strength: 0.4 },
      { from: 'Z2', to: 'X', strength: 0.6 },
      { from: 'Z3', to: 'X', strength: 0.5 },
      { from: 'X', to: 'Y', strength: 0.7 },
      { from: 'Z1', to: 'Y', strength: 0.3 },
      { from: 'Z2', to: 'Y', strength: 0.2 },
      { from: 'Z3', to: 'Y', strength: 0.35 },
      { from: 'U1', to: 'Z3', strength: 0.25 },
      { from: 'U2a', to: 'Z1', strength: 0.2 },
      { from: 'U2b', to: 'Y', strength: 0.3 },
    ],
  };

  // 模型评估原型数据（水平误差棒，95%置信区间）
  const modelEvalComparison = [
    { model: 'LimiX', accuracy: 86, ci: [81, 90] },
    { model: 'Autogluon', accuracy: 78, ci: [70, 83] },
    { model: 'DeepSeek', accuracy: 45, ci: [40, 51] },
  ];

  const mockArtifacts = [
    { name: 'training_history.json', type: 'Metrics', size: '12.5 KB', url: '#' },
    { name: 'model_config.yaml', type: 'Configuration', size: '2.1 KB', url: '#' },
  ];
  const mockDatasetRows = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: 'N/A', Embarked: 'S' },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: 'N/A', Embarked: 'S' }
  ];
  const mockDatasetFields = [
    { name: 'PassengerId', type: 'Integer', missing: '0%' },
    { name: 'Survived', type: 'Integer', missing: '0%' },
    { name: 'Pclass', type: 'Integer', missing: '0%' },
    { name: 'Name', type: 'String', missing: '<1%' },
    { name: 'Sex', type: 'Enum', missing: '0%' },
    { name: 'Age', type: 'Float', missing: '19%' },
    { name: 'Fare', type: 'Float', missing: '0%' }
  ];

  const getStatusConfig = (status: Task['status']) => {
    const configs = {
      pending: { label: '等待中', color: 'bg-gray-100 text-gray-800', icon: Clock },
      running: { label: '运行中', color: 'bg-blue-100 text-blue-800', icon: Play },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { label: '失败', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: XCircle },
      paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: Task['priority']) => {
    const configs = {
      low: { label: '低', color: 'bg-gray-100 text-gray-800' },
      medium: { label: '中', color: 'bg-blue-100 text-blue-800' },
      high: { label: '高', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: '紧急', color: 'bg-red-100 text-red-800' },
    };
    return configs[priority];
  };

  const getTaskTypeLabel = (type: Task['taskType']) => {
    const labels = {
      classification: '分类',
      regression: '回归',
      clustering: '聚类',
      anomaly_detection: '异常检测',
      forecasting: '预测',
      nlp: '自然语言处理',
      computer_vision: '计算机视觉',
    };
    return labels[type];
  };

  useEffect(() => {
    const root = contentRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('id');
          if (id) setActiveSection(id);
        }
      },
      { root, threshold: 0.3, rootMargin: '-64px 0px -40% 0px' }
    );
    if (root) {
      sections.forEach(s => {
        const el = root.querySelector(`#${s.id}`);
        if (el) observer.observe(el);
      });
    }
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const root = contentRef.current;
    if (!root) return;
    const el = root.querySelector(`#${id}`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
        <AccordionItem value="basic-info">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              基本信息
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  任务概要
                </CardTitle>
                <CardDescription>紧凑展示核心信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">任务名称</p>
                    <p className="font-medium">{task.taskName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">任务ID</p>
                    <p className="font-mono font-medium">{task.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">任务类型</p>
                    <Badge variant="outline" className="mt-1">{getTaskTypeLabel(task.taskType)}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">状态</p>
                    <div className="flex items-center gap-2 mt-1">
                      {React.createElement(getStatusConfig(task.status).icon, { className: "h-4 w-4" })}
                      <Badge className={getStatusConfig(task.status).color}>{getStatusConfig(task.status).label}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">优先级</p>
                    <Badge className={`${getPriorityConfig(task.priority).color} mt-1`}>{getPriorityConfig(task.priority).label}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">创建者</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{task.createdBy}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">数据集名称</p>
                    <p className="font-medium">{task.datasetName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">数据集ID + 版本号</p>
                    <p className="font-mono font-medium">{task.datasetVersion}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">来源</p>
                    <p className="font-medium">上传</p>
                  </div>
                  <div>
                    <p className="text-gray-600">资源</p>
                    <p className="font-medium">GPU</p>
                  </div>
                  <div>
                    <p className="text-gray-600">配额</p>
                    <p className="font-medium">2 vGPU / 16GB</p>
                  </div>
                </div>
                {task.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">任务描述</p>
                    <p className="text-gray-900 leading-relaxed mt-1">{task.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 数据集和模型信息 */}
        <AccordionItem value="dataset-model">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据集和模型
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    模型信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">模型名称</p>
                    <p className="font-medium">{task.modelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">模型类型</p>
                    <p className="font-medium">{getTaskTypeLabel(task.taskType)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 执行进度 */}
        {task.status === 'running' && task.progress !== undefined && (
          <AccordionItem value="progress">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                执行进度
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">总体进度</span>
                      <span className="text-sm text-gray-600">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-3" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">预计时间</p>
                        <p className="font-medium">{task.estimatedTime || '计算中...'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">已用时间</p>
                        <p className="font-medium">{task.actualTime || '计算中...'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      {task.taskType === 'classification' ? (
        <>
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>分类任务指标报表</CardTitle>
                <CardDescription>支持 micro / macro / weighted 平均</CardDescription>
              </div>
              <div className="w-48">
                <Select value={avgMethod} onValueChange={(v) => setAvgMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择平均方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">micro</SelectItem>
                    <SelectItem value="macro">macro</SelectItem>
                    <SelectItem value="weighted">weighted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { key: 'Accuracy', val: classificationMetrics.accuracy },
                  { key: 'Precision', val: classificationMetrics.precision[avgMethod] },
                  { key: 'Recall', val: classificationMetrics.recall[avgMethod] },
                  { key: 'F1-score', val: classificationMetrics.f1[avgMethod] },
                  { key: 'ROC-AUC', val: classificationMetrics.roc_auc[avgMethod] },
                ].map((item) => (
                  <Card key={item.key} className="border-gray-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-gray-600">{item.key}</p>
                      <p className="text-2xl font-bold">{(item.val * 100).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>ROC 曲线</CardTitle>
              <CardDescription>多分类每一类 + micro/macro 平均</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-64"
                config={{
                  A: { label: 'Class A', color: 'hsl(210 90% 55%)' },
                  B: { label: 'Class B', color: 'hsl(280 80% 55%)' },
                  C: { label: 'Class C', color: 'hsl(20 80% 55%)' },
                  macro: { label: 'Macro Avg', color: 'hsl(150 70% 45%)' },
                  micro: { label: 'Micro Avg', color: 'hsl(45 85% 45%)' },
                }}
              >
                <LineChart data={classificationRocData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Line type="monotone" dataKey="A" stroke="var(--color-A)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="B" stroke="var(--color-B)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="C" stroke="var(--color-C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="macro" stroke="var(--color-macro)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="micro" stroke="var(--color-micro)" dot={false} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>Precision-Recall 曲线</CardTitle>
              <CardDescription>不同阈值下模型表现</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-64"
                config={{
                  A: { label: 'Class A', color: 'hsl(210 90% 55%)' },
                  B: { label: 'Class B', color: 'hsl(280 80% 55%)' },
                  C: { label: 'Class C', color: 'hsl(20 80% 55%)' },
                  macro: { label: 'Macro Avg', color: 'hsl(150 70% 45%)' },
                  micro: { label: 'Micro Avg', color: 'hsl(45 85% 45%)' },
                }}
              >
                <LineChart data={classificationPRData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recall" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Line type="monotone" dataKey="A" stroke="var(--color-A)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="B" stroke="var(--color-B)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="C" stroke="var(--color-C)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="macro" stroke="var(--color-macro)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="micro" stroke="var(--color-micro)" dot={false} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>混淆矩阵</CardTitle>
              <CardDescription>真实标签 vs 预测结果</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const maxVal = Math.max(...confusionMatrix.values.flat());
                return (
                  <div className="overflow-auto">
                    <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${confusionMatrix.labels.length}, 80px)` }}>
                      <div className="font-medium text-gray-700 flex items-center">真实/预测</div>
                      {confusionMatrix.labels.map((l) => (
                        <div key={l} className="text-center text-sm text-gray-600">{l}</div>
                      ))}
                      {confusionMatrix.labels.map((rowLabel, i) => (
                        <React.Fragment key={rowLabel}>
                          <div className="text-sm font-medium text-gray-600 flex items-center">{rowLabel}</div>
                          {confusionMatrix.values[i].map((v, j) => {
                            const ratio = v / maxVal;
                            const bg = `rgba(59, 130, 246, ${0.15 + ratio * 0.7})`;
                            return (
                              <div key={`${i}-${j}`} className="flex items-center justify-center border border-gray-200" style={{ background: bg }}>
                                <span className="text-sm font-medium">{v}</span>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>按指标查看不同模型的表现</CardDescription>
              </div>
              <div className="w-48">
                <Select value={clsCompareMetric} onValueChange={(v) => setClsCompareMetric(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择指标" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="f1_macro">F1 Macro</SelectItem>
                    <SelectItem value="roc_auc_macro">ROC-AUC Macro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={classificationModelComparison} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Bar dataKey={clsCompareMetric} fill="var(--color-metric)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle>学习曲线（Accuracy）</CardTitle>
                <CardDescription>训练与验证准确率随Epoch变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64" config={{
                  train_acc: { label: 'Train Accuracy', color: 'hsl(210 90% 55%)' },
                  val_acc: { label: 'Validation Accuracy', color: 'hsl(150 70% 45%)' },
                }}>
                  <LineChart data={trainingHistory} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" tickLine={false} />
                    <YAxis domain={[0.5, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Line type="monotone" dataKey="train_acc" stroke="var(--color-train_acc)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="val_acc" stroke="var(--color-val_acc)" dot={false} strokeWidth={2} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
              <CardHeader>
                <CardTitle>损失曲线（Loss）</CardTitle>
                <CardDescription>训练与验证损失随Epoch变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64" config={{
                  train_loss: { label: 'Train Loss', color: 'hsl(8 80% 55%)' },
                  val_loss: { label: 'Validation Loss', color: 'hsl(45 85% 45%)' },
                }}>
                  <AreaChart data={trainingHistory} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" tickLine={false} />
                    <YAxis domain={[0, 1]} />
                    <Area type="monotone" dataKey="train_loss" stroke="var(--color-train_loss)" fill="var(--color-train_loss)" fillOpacity={0.15} dot={false} strokeWidth={2} />
                    <Area type="monotone" dataKey="val_loss" stroke="var(--color-val_loss)" fill="var(--color-val_loss)" fillOpacity={0.15} dot={false} strokeWidth={2} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : task.taskType === 'regression' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'MSE', val: regressionMetrics.mse },
              { key: 'RMSE', val: regressionMetrics.rmse },
              { key: 'MAE', val: regressionMetrics.mae },
              { key: 'R²', val: regressionMetrics.r2 },
            ].map((item) => (
              <Card key={item.key} className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">{item.key}</p>
                  <p className="text-2xl font-bold">{item.key === 'R²' ? (item.val * 100).toFixed(1) + '%' : Number(item.val).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>预测值 vs 真实值</CardTitle>
              <CardDescription>直观比较模型预测与实际情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ scatter: { label: 'Points', color: 'hsl(210 90% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="actual" name="Actual" />
                  <YAxis type="number" dataKey="pred" name="Predicted" />
                  <ZAxis type="number" range={[60, 60]} />
                  <Scatter data={regressionPredictions} fill="var(--color-scatter)" />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 130, y: 130 }]} stroke="#8884d8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>残差图</CardTitle>
              <CardDescription>横坐标为预测值，纵坐标为残差</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ residual: { label: 'Residual', color: 'hsl(8 80% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pred" name="Predicted" />
                  <YAxis type="number" dataKey="residual" name="Residual" />
                  <Scatter data={regressionResiduals} fill="var(--color-residual)" />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>误差分布直方图</CardTitle>
              <CardDescription>展示预测误差的分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ hist: { label: 'Error Count', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={errorHistogram} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" tickLine={false} />
                  <YAxis />
                  <Bar dataKey="count" fill="var(--color-hist)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>不同模型在所选指标下的表现</CardDescription>
              </div>
              <div className="w-48">
                <Select value={regCompareMetric} onValueChange={(v) => setRegCompareMetric(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择指标" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mse">MSE</SelectItem>
                    <SelectItem value="rmse">RMSE</SelectItem>
                    <SelectItem value="mae">MAE</SelectItem>
                    <SelectItem value="r2">R²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={regressionModelComparison} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tickLine={false} />
                  <YAxis tickFormatter={(v) => regCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : `${v}` } />
                  <Bar dataKey={regCompareMetric} fill="var(--color-metric)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
          <CardHeader>
            <CardTitle>任务类型暂不支持详细结果展示</CardTitle>
            <CardDescription>当前仅针对 分类 与 回归 任务提供结果展示</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">请创建分类或回归任务以体验完整的结果可视化。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // 下载执行日志为本地文本文件
  const handleDownloadLogs = () => {
    const content = mockLogs
      .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()} - ${log.message}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task_${task.id}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderLogsTab = () => (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              执行日志
            </CardTitle>
            <CardDescription>任务执行过程中的详细日志记录</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={handleDownloadLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            下载日志
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {mockLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  log.level === 'error' ? 'bg-red-500' : 
                  log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 font-mono">{log.timestamp}</span>
                    <Badge variant="outline" className={`text-xs ${
                      log.level === 'error' ? 'border-red-200 text-red-700' :
                      log.level === 'warning' ? 'border-yellow-200 text-yellow-700' :
                      'border-green-200 text-green-700'
                    }`}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderArtifactsTab = () => (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            任务产物
          </CardTitle>
          <CardDescription>任务执行生成的文件和资源</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockArtifacts.map((artifact, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{artifact.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{artifact.type}</Badge>
                  </TableCell>
                  <TableCell>{artifact.size}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-200"
                        disabled={loadingAction === `download-${index}`}
                        onClick={() => {
                          setLoadingAction(`download-${index}`);
                          setTimeout(() => setLoadingAction(null), 1500);
                        }}
                      >
                        {loadingAction === `download-${index}` ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        下载
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="transition-all duration-200 hover:bg-green-50 hover:border-green-200"
                        disabled={loadingAction === `preview-${index}`}
                        onClick={() => {
                          setLoadingAction(`preview-${index}`);
                          setTimeout(() => setLoadingAction(null), 1000);
                        }}
                      >
                        {loadingAction === `preview-${index}` ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        预览
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">任务详情分析</h1>
            <p className="text-sm text-gray-600">{task.taskName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLoadingAction('export-pdf')}>导出 PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLoadingAction('export-excel')}>导出 Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLoadingAction('export-json')}>导出 JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {task.status === 'running' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-orange-600 border-orange-200 hover:bg-orange-50 transition-all duration-200"
              disabled={loadingAction === 'pause'}
              onClick={() => {
                setLoadingAction('pause');
                setTimeout(() => setLoadingAction(null), 2000);
              }}
            >
              {loadingAction === 'pause' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              暂停任务
            </Button>
          )}
          {task.status === 'failed' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-all duration-200"
              disabled={loadingAction === 'restart'}
              onClick={() => {
                setLoadingAction('restart');
                setTimeout(() => setLoadingAction(null), 2000);
              }}
            >
              {loadingAction === 'restart' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              重新运行
            </Button>
          )}
          {task.status === 'completed' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-600 border-green-200 hover:bg-green-50 transition-all duration-200"
                disabled={loadingAction === 'export'}
                onClick={() => {
                  setLoadingAction('export');
                  setTimeout(() => setLoadingAction(null), 2000);
                }}
              >
                {loadingAction === 'export' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                导出结果
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-purple-600 border-purple-200 hover:bg-purple-50 transition-all duration-200"
                disabled={loadingAction === 'retrain'}
                onClick={() => {
                  setLoadingAction('retrain');
                  setTimeout(() => setLoadingAction(null), 2000);
                }}
              >
                {loadingAction === 'retrain' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                基于此重新训练
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            disabled={loadingAction === 'archive'}
            onClick={() => {
              setLoadingAction('archive');
              setTimeout(() => setLoadingAction(null), 2000);
            }}
          >
            {loadingAction === 'archive' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            归档任务
          </Button>
          
        </div>
      </div>

      {/* Content: 左侧锚点导航 + 纵向分区 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧锚点导航 */}
          <div className="w-56 border-r bg-white">
            <div className="sticky top-16 p-4 space-y-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${activeSection === s.id ? 'bg-green-50 text-green-700 border border-green-200' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  {React.createElement(s.icon, { className: 'h-4 w-4' })}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧内容区 */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-10">
            {/* 概览信息 */}
            <section id="meta" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">概览信息</h2>
              {renderOverviewTab()}
            </section>

            {/* 数据集信息 */}
            <section id="dataset" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">数据集信息</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">数据集名称</p>
                      <p className="font-medium">{task.datasetName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">数据集ID + 版本号</p>
                      <p className="font-medium">{task.datasetVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">来源</p>
                      <p className="font-medium">上传</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>数据预览（前 10 行）</CardTitle>
                      <CardDescription>字段名 + 示例值</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-gray-50"
                      onClick={() => {
                        onOpenDataDetail?.({
                          id: task.datasetVersion,
                          name: task.datasetName,
                          description: '任务关联数据集',
                          size: '未知',
                          fieldCount: mockDatasetFields.length,
                          sampleCount: mockDatasetRows.length,
                          source: 'upload',
                        });
                      }}
                    >
                      查看更多
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(mockDatasetRows[0]).map((col) => (
                              <TableHead key={col}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockDatasetRows.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.entries(row).map(([k, v]) => (
                                <TableCell key={k}>{String(v)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200 mt-6">
                <CardHeader>
                  <CardTitle>字段级元信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段名</TableHead>
                        <TableHead>数据类型</TableHead>
                        <TableHead>缺失率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDatasetFields.map((f) => (
                        <TableRow key={f.name}>
                          <TableCell className="font-medium">{f.name}</TableCell>
                          <TableCell>{f.type}</TableCell>
                          <TableCell>{f.missing}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>

            {/* 模型信息 */}
            <section id="model" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">模型信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5"/>主模型</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><span className="text-sm text-gray-600">模型名称</span><p className="font-medium">{task.modelName}</p></div>
                    <div><span className="text-sm text-gray-600">模型类型</span><p className="font-medium">自研</p></div>
                    <div><span className="text-sm text-gray-600">版本号</span><p className="font-medium">v1.0.0</p></div>
                    <div><span className="text-sm text-gray-600">模型描述</span><p className="text-gray-900">用于{getTaskTypeLabel(task.taskType)}任务的模型。</p></div>
                  </CardContent>
                </Card>
                {[1,2].map(i => (
                  <Card key={i} className="transition-all duration-200 hover:shadow-md border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5"/>并行模型 {i}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><span className="text-sm text-gray-600">模型名称</span><p className="font-medium">Model-{i}</p></div>
                      <div><span className="text-sm text-gray-600">模型类型</span><p className="font-medium">微调</p></div>
                      <div><span className="text-sm text-gray-600">版本号</span><p className="font-medium">v{i}.2</p></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* 参数配置 */}
            <section id="params" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">参数配置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* X字段选择 */}
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>特征字段（X）</CardTitle>
                      <CardDescription>默认全选，共 {availableFields.length} 个字段</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSelectAll('x')}>全选</Button>
                      <Button size="sm" variant="outline" onClick={() => handleClearAll('x')}>清空</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {availableFields.map((field) => (
                        <label key={`x-${field}`} className="flex items-center gap-2 px-2 py-1 rounded-md border bg-gray-50 hover:bg-gray-100 cursor-pointer">
                          <Checkbox
                            checked={selectedXFields.includes(field)}
                            onCheckedChange={() => handleToggleField(field, 'x')}
                          />
                          <span className="text-sm text-gray-800">{field}</span>
                        </label>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">已选 {selectedXFields.length}/{availableFields.length}</div>
                  </CardContent>
                </Card>
                {/* Y字段选择 */}
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>目标字段（Y）</CardTitle>
                      <CardDescription>支持复选，默认全选</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSelectAll('y')}>全选</Button>
                      <Button size="sm" variant="outline" onClick={() => handleClearAll('y')}>清空</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {availableFields.map((field) => (
                        <label key={`y-${field}`} className="flex items-center gap-2 px-2 py-1 rounded-md border bg-gray-50 hover:bg-gray-100 cursor-pointer">
                          <Checkbox
                            checked={selectedYFields.includes(field)}
                            onCheckedChange={() => handleToggleField(field, 'y')}
                          />
                          <span className="text-sm text-gray-800">{field}</span>
                        </label>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">已选 {selectedYFields.length}/{availableFields.length}</div>
                  </CardContent>
                </Card>
                {/* 运行资源配置已整合至任务概要卡片，移除此处的重复卡片 */}
              </div>
            </section>

            {/* 任务结果 */}
            <section id="results" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">任务结果</h2>
              {renderMetricsTab()}
            </section>

            {/* 因果解释 */}
            <section id="causal" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">因果解释</h2>

              {/* 模型对比：水平误差棒（95%CI） */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200 mb-6">
                <CardHeader>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">模型评估</Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700">模型指标对比：</div>
                    <div className="text-xs text-gray-500">任务类型：{getTaskTypeLabel(task.taskType)}</div>
                  </div>
                  <ChartContainer className="h-64" config={{ acc: { label: 'Accuracy', color: 'hsl(210 90% 55%)' } }}>
                    <BarChart data={modelEvalComparison} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[40, 100]} tickFormatter={(v) => `${v}`} label={{ value: 'Accuracy (%) (95% CI)', position: 'right', offset: 0 }} />
                      <YAxis type="category" dataKey="model" tickLine={false} width={100} />
                      <Bar dataKey="accuracy" fill="url(#gradient-acc)" stroke="var(--color-acc)" >
                        <ErrorBar dataKey="ci" width={8} direction="x" stroke="#475569" strokeWidth={2} />
                      </Bar>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient id="gradient-acc" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-6">
                    <div className="text-sm font-medium text-gray-700 mb-1">图表解释</div>
                    <p className="text-xs text-gray-600">该图表展示了不同模型的准确率百分比，误差棒为95%置信区间。准确率越高表示性能越优。</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>因果链条</CardTitle>
                    <CardDescription>展示特征之间的因果影响关系</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDeepSeekOpen(true)}>
                    <Brain className="h-4 w-4 mr-2" />
                    DeepSeek预测过程
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">因果关系示意图（包含影响强度）</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <svg viewBox="0 0 500 320" className="w-full h-64">
                        {/* edges */}
                        {causalGraph.edges.map((e, idx) => {
                          const from = causalGraph.nodes.find(n => n.id === e.from)!;
                          const to = causalGraph.nodes.find(n => n.id === e.to)!;
                          const width = 1 + e.strength * 4;
                          const color = e.strength > 0.5 ? '#0ea5e9' : '#64748b';
                          return (
                            <g key={idx}>
                              <defs>
                                <marker id={`arrow-${idx}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                  <path d="M0,0 L0,6 L6,3 z" fill={color} />
                                </marker>
                              </defs>
                              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={width} markerEnd={`url(#arrow-${idx})`} />
                              <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} fontSize="10" fill="#334155">{e.strength.toFixed(2)}</text>
                            </g>
                          );
                        })}
                        {/* nodes */}
                        {causalGraph.nodes.map((n) => (
                          <g key={n.id}>
                            <circle cx={n.x} cy={n.y} r={18} fill="#1e40af" />
                            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fill="#fff">{n.id}</text>
                          </g>
                        ))}
                      </svg>
                      <div className="text-xs text-gray-500">连线颜色/粗细代表影响强度，数值为强度标注</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">解释结果：</p>
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                      缺陷率升高的主要原因是温度参数偏高和设备老化。
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* DeepSeek 预测过程弹窗 */}
              <Dialog open={isDeepSeekOpen} onOpenChange={setDeepSeekOpen}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>DeepSeek预测过程</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-700">模型推理的关键节点</div>
                      <ul className="list-disc pl-5 text-sm text-blue-900 mt-2">
                        {deepSeekSteps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">特征权重分析（Top Features）</div>
                      <ChartContainer className="h-56" config={{ weight: { label: 'Weight', color: 'hsl(210 90% 55%)' } }}>
                        <BarChart data={featureWeights} margin={{ left: 12, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="feature" tickLine={false} />
                          <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                          <Bar dataKey="weight" fill="var(--color-weight)" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">决策路径可视化</div>
                      <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-3">
                        {decisionRules.map((r, idx) => (
                          <React.Fragment key={idx}>
                            <div className="px-3 py-1 bg-white border rounded-md text-sm">{r}</div>
                            {idx < decisionRules.length - 1 && <span className="text-gray-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">按规则链路依次判断并形成最终分类决策</div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </section>

            {/* 执行日志 */}
            <section id="logs" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">执行日志</h2>
              {renderLogsTab()}
            </section>

            {/* 任务产物 */}
            <section id="artifacts" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">任务产物</h2>
              {renderArtifactsTab()}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailFullPage;