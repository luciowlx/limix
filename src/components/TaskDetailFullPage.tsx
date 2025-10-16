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

interface SelectedDatasetEntry {
  id: string;
  name: string;
  version: string;
}

interface Task {
  id: string;
  taskName: string;
  taskType: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'forecasting' | 'nlp' | 'computer_vision';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  datasetName: string;
  datasetVersion: string;
  datasets?: SelectedDatasetEntry[]; // 新增：支持多数据集
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
  // 兼容 TaskManagement 传入的配置信息
  config?: any;
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
  // 导出需要的可视化区域引用
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const causalRef = useRef<HTMLDivElement | null>(null);

  // 数据预览：多数据集切换 & 行数选择
  const [datasetPreviewIndex, setDatasetPreviewIndex] = useState(0);
  const [previewRowCount, setPreviewRowCount] = useState(10);

  // 因果解释交互
  const [selectedCausalNode, setSelectedCausalNode] = useState<string | null>(null);
  const [topNEdges, setTopNEdges] = useState<number>(5);

  // 模型对比图表类型切换
  const [compareChartType, setCompareChartType] = useState<'bar' | 'line'>('bar');

  // 用户配置的时序预测参数解析（兼容字符串/对象两种config）
  const forecastingParams = React.useMemo(() => {
    try {
      const rawCfg: any = (task as any)?.config;
      const cfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
      const fc = cfg?.forecasting || task.parameters?.forecasting || {};

      // 解析协变量文件（兼容字符串/数组/旧键名）
      const covariateFilesParsed = Array.isArray(fc?.covariateFiles)
        ? fc.covariateFiles
        : (typeof fc?.covariateFiles === 'string'
            ? String(fc?.covariateFiles).split(',').map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(fc?.covariates) ? fc.covariates : []));

      // 基于当前任务数据集，构造可选的数据文件列表（模拟）
      const baseName = (task.datasetName || 'dataset').replace(/\s+/g, '_');
      const versionTag = task.datasetVersion ? `_${task.datasetVersion}` : '_v1';
      const availableFilesMock = [
        `${baseName}${versionTag}.csv`,
        `${baseName}_cov_weather.csv`,
        `${baseName}_cov_holiday.csv`,
        `${baseName}_cov_events.csv`,
      ];

      // 主变量文件：优先取后端/参数中的值，否则使用模拟列表的第一个
      const mainFile = fc?.mainVariableFile ?? fc?.main_variable_file ?? availableFilesMock[0];
      // 协变量文件：优先取后端/参数中的值；如果为空，自动从可选列表中过滤掉主变量并取其余项
      const covariateFiles = (covariateFilesParsed && covariateFilesParsed.length > 0)
        ? covariateFilesParsed
        : availableFilesMock.filter(f => f !== mainFile);

      // 数值与时间默认值（模拟）：满足“必填项”的展示需求
      const defaultContextLength = 72;   // 窗口长度：72（例如按小时统计为3天历史）
      const defaultForecastLength = 24;  // 预测长度：24（例如预测未来24个时间步）
      const defaultStepLength = 1;       // 预测步长：1（滑动窗口每次前进1步）
      const defaultStartTime = new Date().toISOString(); // ISO字符串，便于解析与展示

      return {
        contextLength: fc?.contextLength ?? fc?.context_length ?? defaultContextLength,
        stepLength: fc?.stepLength ?? fc?.step_length ?? defaultStepLength,
        forecastLength: fc?.forecastLength ?? fc?.prediction_length ?? fc?.forecast_length ?? defaultForecastLength,
        startTime: fc?.startTime ?? fc?.start_time ?? defaultStartTime,
        mainVariableFile: mainFile,
        covariateFiles,
      };
    } catch (e) {
      // 解析失败时也提供模拟默认值，确保页面展示完整
      const baseName = (task.datasetName || 'dataset').replace(/\s+/g, '_');
      const versionTag = task.datasetVersion ? `_${task.datasetVersion}` : '_v1';
      const availableFilesMock = [
        `${baseName}${versionTag}.csv`,
        `${baseName}_cov_weather.csv`,
        `${baseName}_cov_holiday.csv`,
        `${baseName}_cov_events.csv`,
      ];
      return {
        contextLength: 72,
        stepLength: 1,
        forecastLength: 24,
        startTime: new Date().toISOString(),
        mainVariableFile: availableFilesMock[0],
        covariateFiles: availableFilesMock.slice(1),
      };
    }
  }, [task]);

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
    // 调整示例数据以更贴近上方指标（Accuracy≈92%）：总样本180，正确166
    values: [
      [56, 2, 2], // A 类：60 样本，56 预测正确
      [2, 55, 3], // B 类：60 样本，55 预测正确
      [3, 2, 55], // C 类：60 样本，55 预测正确
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

  // =============================
  // 时序预测（Forecasting）指标与可视化
  // =============================
  type ForecastPoint = { t: number; time: string; actual: number; predicted: number; ciLower: number; ciUpper: number };

  // 从任务中提取或生成预测时序数据
  const forecastSeries: ForecastPoint[] = React.useMemo(() => {
    // 优先从 task.metrics / task.parameters 中提取（若后端已提供），否则生成示例数据
    const len = 80;
    const startMs = (() => {
      const st = forecastingParams?.startTime;
      const d = st ? new Date(st) : new Date(Date.now() - len * 3600 * 1000);
      return isNaN(d.getTime()) ? Date.now() - len * 3600 * 1000 : d.getTime();
    })();
    const stepHours = Number(forecastingParams?.stepLength ?? 1);
    let base = 100;
    const res: ForecastPoint[] = Array.from({ length: len }, (_, i) => {
      // 生成带趋势与噪声的实际值
      base += (Math.random() - 0.5) * 3 + Math.sin(i / 10) * 0.8;
      const actual = Number(base.toFixed(2));
      // 预测值在实际值附近波动
      const predictedRaw = actual * (1 + (Math.random() - 0.5) * 0.08);
      const predicted = Number(predictedRaw.toFixed(2));
      const err = Math.abs(predicted - actual);
      const ci = err * 1.6; // 近似构造区间宽度（示意）
      const ciLower = Number((predicted - ci).toFixed(2));
      const ciUpper = Number((predicted + ci).toFixed(2));
      const t = startMs + i * stepHours * 3600 * 1000;
      const time = new Date(t).toLocaleString('zh-CN', { hour12: false });
      return { t: i, time, actual, predicted, ciLower, ciUpper };
    });
    return res;
  }, [forecastingParams]);

  // 计算基础指标
  const forecastingMetrics = React.useMemo(() => {
    const n = forecastSeries.length;
    const meanActual = forecastSeries.reduce((s, p) => s + p.actual, 0) / (n || 1);
    const sse = forecastSeries.reduce((s, p) => s + (p.predicted - p.actual) ** 2, 0);
    const mae = forecastSeries.reduce((s, p) => s + Math.abs(p.predicted - p.actual), 0) / (n || 1);
    const rmse = Math.sqrt(sse / (n || 1));
    const mse = sse / (n || 1);
    const mape = forecastSeries.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / (p.actual || 1)), 0) / (n || 1);
    const sst = forecastSeries.reduce((s, p) => s + (p.actual - meanActual) ** 2, 0);
    const r2 = sst > 0 ? 1 - sse / sst : 0;
    return { mse, rmse, mae, mape, r2 };
  }, [forecastSeries]);

  // 残差与散点数据
  const forecastingResiduals = React.useMemo(() => forecastSeries.map((p) => ({ pred: p.predicted, residual: Number((p.predicted - p.actual).toFixed(2)) })), [forecastSeries]);
  const forecastingPredVsActual = React.useMemo(() => forecastSeries.map((p) => ({ actual: p.actual, pred: p.predicted })), [forecastSeries]);

  // 误差分布直方图（绝对误差）
  const forecastingErrorHistogram = React.useMemo(() => {
    const absErrors = forecastSeries.map((p) => Math.abs(p.predicted - p.actual));
    const bins = [0, 2, 4, 6, 8, 10, 15, 20];
    const counts: { bin: string; count: number }[] = [];
    for (let i = 0; i < bins.length - 1; i++) {
      const low = bins[i], high = bins[i + 1];
      const cnt = absErrors.filter((e) => e >= low && e < high).length;
      counts.push({ bin: `${low}-${high}`, count: cnt });
    }
    const over = absErrors.filter((e) => e >= bins[bins.length - 1]).length;
    counts.push({ bin: `${bins[bins.length - 1]}+`, count: over });
    return counts;
  }, [forecastSeries]);

  // 指标趋势（示例：RMSE / MAPE 随时间变化）：使用滑动窗口计算
  const metricTrend = React.useMemo(() => {
    const win = Math.max(3, Math.min(12, Number(forecastingParams?.stepLength ?? 6)));
    const arr = forecastSeries.map((_, idx) => {
      const start = Math.max(0, idx - win + 1);
      const slice = forecastSeries.slice(start, idx + 1);
      const n = slice.length;
      const rmse = Math.sqrt(slice.reduce((s, p) => s + (p.predicted - p.actual) ** 2, 0) / (n || 1));
      const mape = slice.reduce((s, p) => s + Math.abs((p.predicted - p.actual) / (p.actual || 1)), 0) / (n || 1);
      return { time: forecastSeries[idx].time, RMSE: Number(rmse.toFixed(2)), MAPE: Number((mape * 100).toFixed(2)) };
    });
    return arr;
  }, [forecastSeries, forecastingParams]);

  // 偏差统计（正负相对/绝对偏差）
  const deviationStats = React.useMemo(() => {
    const relThresholds = [0.10, 0.20]; // 10%, 20%
    const absThresholds = [10, 20]; // 10, 20（单位随数据而定）
    const relErrs = forecastSeries.map((p) => (p.predicted - p.actual) / (p.actual || 1));
    const absErrs = forecastSeries.map((p) => p.predicted - p.actual);
    const computeForRel = (thr: number) => {
      const pos = relErrs.filter((e) => e >= thr).length;
      const neg = relErrs.filter((e) => e <= -thr).length;
      const within = relErrs.filter((e) => Math.abs(e) <= thr).length;
      return { threshold: thr, posRate: pos / relErrs.length, negRate: neg / relErrs.length, withinRate: within / relErrs.length };
    };
    const computeForAbs = (thr: number) => {
      const pos = absErrs.filter((e) => e >= thr).length;
      const neg = absErrs.filter((e) => e <= -thr).length;
      const within = absErrs.filter((e) => Math.abs(e) <= thr).length;
      return { threshold: thr, posRate: pos / absErrs.length, negRate: neg / absErrs.length, withinRate: within / absErrs.length };
    };
    return {
      relative: relThresholds.map(computeForRel),
      absolute: absThresholds.map(computeForAbs),
    };
  }, [forecastSeries]);

  // 模型对比（时序预测）：示例数据。后续可换为后端返回的真实对比结果
  const [fctCompareMetric, setFctCompareMetric] = useState<'rmse' | 'mae' | 'mape' | 'r2'>('rmse');
  const forecastingModelComparison = [
    { model: 'Model A', rmse: Number((forecastingMetrics.rmse * 1.05).toFixed(2)), mae: Number((forecastingMetrics.mae * 1.06).toFixed(2)), mape: Number((forecastingMetrics.mape * 1.02).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 0.98).toFixed(2)))) },
    { model: 'Model B', rmse: Number((forecastingMetrics.rmse * 0.95).toFixed(2)), mae: Number((forecastingMetrics.mae * 0.92).toFixed(2)), mape: Number((forecastingMetrics.mape * 0.97).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 1.03).toFixed(2)))) },
    { model: 'Model C', rmse: Number((forecastingMetrics.rmse * 1.02).toFixed(2)), mae: Number((forecastingMetrics.mae * 0.98).toFixed(2)), mape: Number((forecastingMetrics.mape * 1.00).toFixed(4)), r2: Math.max(0, Math.min(1, Number((forecastingMetrics.r2 * 0.99).toFixed(2)))) },
  ];

  // 自定义指标：p-范数误差（p可调），默认 p=1 即MAE
  const [customP, setCustomP] = useState<number>(1);
  const customMetricValue = React.useMemo(() => {
    const p = Math.max(0.1, Math.min(10, customP));
    const n = forecastSeries.length;
    const mean = forecastSeries.reduce((s, pnt) => s + Math.abs(pnt.predicted - pnt.actual) ** p, 0) / (n || 1);
    return Number(mean ** (1 / p));
  }, [forecastSeries, customP]);

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

  // 多数据集聚合：数据集统计注册表（示例）
  // 注意：这里的注册表仅用于演示聚合统计的渲染，真实项目应由后端接口提供对应ID+版本的统计信息
  type DatasetStats = {
    id: string;
    name: string;
    version: string;
    size: string; // 例如 "2.5MB"
    fieldCount: number;
    sampleCount: number;
    fields?: string[]; // 字段名列表，用于计算并集
  };

  const datasetStatsRegistry: Record<string, DatasetStats> = {
    // 生产质量数据集
    'DATA-2025-001@v3': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v3',
      size: '2.5MB',
      fieldCount: 15,
      sampleCount: 10000,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    'DATA-2025-001@v2': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v2',
      size: '2.3MB',
      fieldCount: 14,
      sampleCount: 9800,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    'DATA-2025-001@v1': {
      id: 'DATA-2025-001',
      name: '生产质量数据集',
      version: 'v1',
      size: '2.1MB',
      fieldCount: 12,
      sampleCount: 9500,
      fields: ['id', 'temperature', 'pressure', 'defect_rate', 'quality_score']
    },
    // 客户行为数据集
    'DATA-2025-002@v2': {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      version: 'v2',
      size: '5.2MB',
      fieldCount: 20,
      sampleCount: 25000,
      fields: ['user_id', 'age', 'purchase_amount', 'category', 'satisfaction']
    },
    'DATA-2025-002@v1': {
      id: 'DATA-2025-002',
      name: '客户行为数据集',
      version: 'v1',
      size: '4.8MB',
      fieldCount: 18,
      sampleCount: 23000,
      fields: ['user_id', 'age', 'purchase_amount', 'category', 'satisfaction']
    },
  };

  const parseSizeMB = (size?: string) => {
    if (!size) return 0;
    const m = size.match(/([\d.]+)\s*MB/i);
    return m ? parseFloat(m[1]) : 0;
  };

  const formatSizeMB = (value: number) => `${value.toFixed(1)} MB`;

  const getDatasetStats = (id?: string, version?: string): DatasetStats | undefined => {
    if (!id || !version) return undefined;
    return datasetStatsRegistry[`${id}@${version}`];
  };

  const aggregatedStats = React.useMemo(() => {
    const entries = task.datasets || [];
    if (!entries || entries.length === 0) return null;
    const statsList = entries
      .map((e) => getDatasetStats(e.id, e.version))
      .filter(Boolean) as DatasetStats[];
    if (statsList.length === 0) return null;

    const datasetCount = statsList.length;
    const totalSamples = statsList.reduce((sum, s) => sum + (s.sampleCount || 0), 0);
    const totalSizeMB = statsList.reduce((sum, s) => sum + parseSizeMB(s.size), 0);
    const union = new Set<string>();
    statsList.forEach((s) => (s.fields || []).forEach((f) => union.add(f)));
    const unionFields = Array.from(union);
    const unionFieldCount = unionFields.length > 0 ? unionFields.length : Math.max(...statsList.map((s) => s.fieldCount));

    return {
      datasetCount,
      totalSamples,
      totalSizeMB,
      unionFieldCount,
      unionFields,
      statsList,
    };
  }, [task.datasets]);

  // 多数据集：不同数据集的示例预览数据与字段元信息（模拟）
  const mockDatasetSamples: Record<string, Array<Record<string, any>>> = {
    'DATA-2025-001': [
      { id: 1001, temperature: 73.2, pressure: 1.02, defect_rate: 0.015, quality_score: 91 },
      { id: 1002, temperature: 75.1, pressure: 1.01, defect_rate: 0.012, quality_score: 93 },
      { id: 1003, temperature: 71.7, pressure: 1.03, defect_rate: 0.018, quality_score: 88 },
      { id: 1004, temperature: 74.3, pressure: 1.02, defect_rate: 0.017, quality_score: 90 },
      { id: 1005, temperature: 76.0, pressure: 1.00, defect_rate: 0.011, quality_score: 95 },
      { id: 1006, temperature: 72.6, pressure: 1.05, defect_rate: 0.020, quality_score: 86 },
      { id: 1007, temperature: 73.9, pressure: 1.04, defect_rate: 0.013, quality_score: 92 },
      { id: 1008, temperature: 75.5, pressure: 1.02, defect_rate: 0.010, quality_score: 96 },
      { id: 1009, temperature: 71.9, pressure: 1.03, defect_rate: 0.019, quality_score: 87 },
      { id: 1010, temperature: 74.0, pressure: 1.01, defect_rate: 0.016, quality_score: 90 },
    ],
    'DATA-2025-002': [
      { user_id: 'U-001', age: 28, purchase_amount: 219.5, category: '电子', satisfaction: 4 },
      { user_id: 'U-002', age: 35, purchase_amount: 58.2, category: '服饰', satisfaction: 3 },
      { user_id: 'U-003', age: 41, purchase_amount: 430.0, category: '家居', satisfaction: 5 },
      { user_id: 'U-004', age: 23, purchase_amount: 17.9, category: '食品', satisfaction: 2 },
      { user_id: 'U-005', age: 30, purchase_amount: 159.0, category: '电子', satisfaction: 4 },
      { user_id: 'U-006', age: 27, purchase_amount: 98.7, category: '服饰', satisfaction: 3 },
      { user_id: 'U-007', age: 52, purchase_amount: 800.3, category: '家居', satisfaction: 5 },
      { user_id: 'U-008', age: 19, purchase_amount: 12.5, category: '食品', satisfaction: 2 },
      { user_id: 'U-009', age: 33, purchase_amount: 299.9, category: '电子', satisfaction: 4 },
      { user_id: 'U-010', age: 45, purchase_amount: 76.4, category: '服饰', satisfaction: 3 },
    ],
    default: [
      { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: 'N/A', Embarked: 'S' },
      { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
      { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: 'N/A', Embarked: 'S' },
    ],
  };

  const mockFieldMetaById: Record<string, Array<{ name: string; type: string; missing: string }>> = {
    'DATA-2025-001': [
      { name: 'id', type: 'Integer', missing: '0%' },
      { name: 'temperature', type: 'Float', missing: '3%' },
      { name: 'pressure', type: 'Float', missing: '1%' },
      { name: 'defect_rate', type: 'Float', missing: '<1%' },
      { name: 'quality_score', type: 'Integer', missing: '0%' },
    ],
    'DATA-2025-002': [
      { name: 'user_id', type: 'String', missing: '0%' },
      { name: 'age', type: 'Integer', missing: '2%' },
      { name: 'purchase_amount', type: 'Float', missing: '0%' },
      { name: 'category', type: 'Enum', missing: '<1%' },
      { name: 'satisfaction', type: 'Integer', missing: '5%' },
    ],
    default: [
      { name: 'PassengerId', type: 'Integer', missing: '0%' },
      { name: 'Survived', type: 'Integer', missing: '0%' },
      { name: 'Pclass', type: 'Integer', missing: '0%' },
      { name: 'Name', type: 'String', missing: '<1%' },
      { name: 'Sex', type: 'Enum', missing: '0%' },
      { name: 'Age', type: 'Float', missing: '19%' },
      { name: 'Fare', type: 'Float', missing: '0%' },
    ],
  };

  const getSampleRowsForDataset = (id?: string) => {
    if (!id) return mockDatasetSamples.default;
    return mockDatasetSamples[id] || mockDatasetSamples.default;
  };

  const getFieldMetaForDataset = (id?: string) => {
    if (!id) return mockFieldMetaById.default;
    return mockFieldMetaById[id] || mockFieldMetaById.default;
  };

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
      forecasting: '时序预测',
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

  // 参数JSON回显与导出（模拟）
  const parameterJSON = React.useMemo(() => {
    const base = task.parameters || { learning_rate: 0.01, batch_size: 64, epochs: 8 };
    const json = {
      forecasting_params: forecastingParams,
      parameters: base,
      resource_quota: { gpu: 2, memory_gb: 16 },
    };
    return JSON.stringify(json, null, 2);
  }, [forecastingParams, task.parameters]);

  const handleExportParamsJson = () => {
    const blob = new Blob([parameterJSON], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${task.id}_params.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出HTML/PDF（包含指标与因果区）
  const handleExportHTML = () => {
    const resultsHTML = resultsRef.current?.innerHTML || '';
    const causalHTML = causalRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>任务${task.id} 报告</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";padding:24px;}
      h1{font-size:20px;margin-bottom:8px} h2{font-size:16px;margin:20px 0 8px}
      .section{margin-bottom:24px;border-top:1px solid #eee;padding-top:12px}
      svg{max-width:100%}
    </style></head><body>
      <h1>任务报告 - ${task.taskName}</h1>
      <div class="section"><h2>指标与可视化</h2>${resultsHTML}</div>
      <div class="section"><h2>因果解释</h2>${causalHTML}</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task_${task.id}_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const resultsHTML = resultsRef.current?.innerHTML || '';
    const causalHTML = causalRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>任务${task.id} 报告</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:24px;}
      h1{font-size:20px;margin-bottom:8px} h2{font-size:16px;margin:20px 0 8px}
      .section{margin-bottom:24px;border-top:1px solid #eee;padding-top:12px}
      svg{max-width:100%}
      @page { size: A4; margin: 16mm; }
    </style></head><body>
      <h1>任务报告 - ${task.taskName}</h1>
      <div class="section"><h2>指标与可视化</h2>${resultsHTML}</div>
      <div class="section"><h2>因果解释</h2>${causalHTML}</div>
    </body></html>`;
    const printWin = window.open('', 'printWindow');
    if (!printWin) return;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    // 等待渲染后打印
    setTimeout(() => {
      printWin.print();
    }, 300);
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
                  {task.datasets && task.datasets.length > 0 ? (
                    <div className="col-span-2">
                      <p className="text-gray-600">已关联数据集（多选）</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {task.datasets.map((ds) => (
                          <Badge key={ds.id} variant="secondary" className="flex items-center space-x-2">
                            <span>{ds.name}</span>
                            <span className="text-xs text-gray-500">{ds.version}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-600">数据集名称</p>
                        <p className="font-medium">{task.datasetName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">数据集ID + 版本号</p>
                        <p className="font-mono font-medium">{task.datasetVersion}</p>
                      </div>
                    </>
                  )}
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
                {/* 状态轨迹：排队 → 运行中 → 完成/失败 */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">状态轨迹</p>
                  <div className="flex items-center">
                    {/* 排队 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'pending' ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
                        <Clock className={`h-4 w-4 ${task.status === 'pending' ? 'text-gray-700' : 'text-gray-500'}`} />
                      </div>
                      <span className="mt-1 text-xs text-gray-700">排队</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.createdAt}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    {/* 运行中 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'running' ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                        <Play className={`h-4 w-4 ${task.status === 'running' ? 'text-blue-700' : 'text-gray-500'}`} />
                      </div>
                      <span className={`mt-1 text-xs ${task.status === 'running' ? 'text-blue-700' : 'text-gray-700'}`}>运行中</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.estimatedTime || '预计耗时未知'}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    {/* 完成/失败 */}
                    <div className="flex flex-col items-center w-32">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${task.status === 'completed' ? 'bg-green-100 border-green-300' : task.status === 'failed' ? 'bg-red-100 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-700" />
                        ) : task.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-700" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span className="mt-1 text-xs text-gray-700">{task.status === 'failed' ? '失败' : '完成'}</span>
                      <span className="mt-1 text-[11px] text-gray-500 font-mono">{task.actualTime || '-'}</span>
                    </div>
                  </div>
                </div>
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
              <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={classificationModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Bar dataKey={clsCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={classificationModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Line type="monotone" dataKey={clsCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
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
      ) : task.taskType === 'forecasting' ? (
        <>
          {/* 指标报表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { key: 'MSE（均方误差）', val: forecastingMetrics.mse },
              { key: 'RMSE（均方根误差）', val: forecastingMetrics.rmse },
              { key: 'MAE（平均绝对误差）', val: forecastingMetrics.mae },
              { key: 'MAPE（平均绝对百分比误差）', val: forecastingMetrics.mape * 100 },
              { key: 'R²（决定系数）', val: forecastingMetrics.r2 * 100 },
            ].map((item) => (
              <Card key={item.key} className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">{item.key}</p>
                  <p className="text-2xl font-bold">{item.key.includes('R²') || item.key.includes('MAPE') ? `${item.val.toFixed(2)}%` : Number(item.val).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 指标趋势折线图：RMSE & MAPE (%) */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>指标趋势</CardTitle>
              <CardDescription>RMSE 与 MAPE 随时间变化（示意）</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{
                RMSE: { label: 'RMSE', color: 'hsl(210 90% 55%)' },
                MAPE: { label: 'MAPE (%)', color: 'hsl(120 70% 45%)' },
              }}>
                <LineChart data={metricTrend} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} />
                  <YAxis />
                  <Line type="monotone" dataKey="RMSE" stroke="var(--color-RMSE)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="MAPE" stroke="var(--color-MAPE)" dot={false} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 时序预测折线图：真实值 / 预测值 / CI 上下界 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>时序预测曲线</CardTitle>
              <CardDescription>展示真实值、预测值与区间上下界</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{
                actual: { label: '真实值', color: 'hsl(210 90% 55%)' },
                predicted: { label: '预测值', color: 'hsl(120 70% 45%)' },
                ciUpper: { label: 'CI上界', color: 'hsl(20 80% 55%)' },
                ciLower: { label: 'CI下界', color: 'hsl(8 80% 55%)' },
              }}>
                <LineChart data={forecastSeries} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} />
                  <YAxis />
                  <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="ciUpper" stroke="var(--color-ciUpper)" dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="ciLower" stroke="var(--color-ciLower)" dot={false} strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 预测值 vs 真实值散点图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>预测值 vs 真实值散点图</CardTitle>
              <CardDescription>用于直观比较预测与实际情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ scatter: { label: 'Points', color: 'hsl(210 90% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="actual" name="Actual" />
                  <YAxis type="number" dataKey="pred" name="Predicted" />
                  <ZAxis type="number" range={[60, 60]} />
                  <Scatter data={forecastingPredVsActual} fill="var(--color-scatter)" />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 200, y: 200 }]} stroke="#8884d8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 残差图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>残差图（Residual Plot）</CardTitle>
              <CardDescription>横坐标为预测值，纵坐标为残差</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ residual: { label: 'Residual', color: 'hsl(8 80% 55%)' } }}>
                <ScatterChart margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pred" name="Predicted" />
                  <YAxis type="number" dataKey="residual" name="Residual" />
                  <Scatter data={forecastingResiduals} fill="var(--color-residual)" />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 误差分布直方图 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>误差分布直方图</CardTitle>
              <CardDescription>展示预测误差的分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ hist: { label: 'Error Count', color: 'hsl(210 90% 55%)' } }}>
                <BarChart data={forecastingErrorHistogram} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" tickLine={false} />
                  <YAxis />
                  <Bar dataKey="count" fill="var(--color-hist)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 偏差统计（正负相对偏差 / 正负绝对偏差） */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader>
              <CardTitle>偏差统计</CardTitle>
              <CardDescription>正负相对偏差（±10%、±20%）与正负绝对偏差（±10、±20）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">相对偏差</p>
                  <div className="grid grid-cols-3 gap-3">
                    {deviationStats.relative.map((d) => (
                      <Card key={`rel-${d.threshold}`} className="border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">±{(d.threshold * 100).toFixed(0)}%</p>
                          <div className="text-sm text-gray-700 mt-1">在范围内：{(d.withinRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">正向超阈：{(d.posRate * 100).toFixed(1)}% | 负向超阈：{(d.negRate * 100).toFixed(1)}%</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">绝对偏差</p>
                  <div className="grid grid-cols-3 gap-3">
                    {deviationStats.absolute.map((d) => (
                      <Card key={`abs-${d.threshold}`} className="border-gray-200">
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">±{d.threshold}</p>
                          <div className="text-sm text-gray-700 mt-1">在范围内：{(d.withinRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">正向超阈：{(d.posRate * 100).toFixed(1)}% | 负向超阈：{(d.negRate * 100).toFixed(1)}%</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 模型对比 */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>模型对比</CardTitle>
                <CardDescription>多模型并行时对比不同指标</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48">
                  <Select value={fctCompareMetric} onValueChange={(v) => setFctCompareMetric(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择指标" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rmse">RMSE</SelectItem>
                      <SelectItem value="mae">MAE</SelectItem>
                      <SelectItem value="mape">MAPE</SelectItem>
                      <SelectItem value="r2">R²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={forecastingModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => fctCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : fctCompareMetric === 'mape' ? `${(v * 100).toFixed(0)}%` : `${v}` } />
                    <Bar dataKey={fctCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={forecastingModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => fctCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : fctCompareMetric === 'mape' ? `${(v * 100).toFixed(0)}%` : `${v}` } />
                    <Line type="monotone" dataKey={fctCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 自定义指标（p-范数） */}
          <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>自定义指标</CardTitle>
                <CardDescription>p-范数误差（p=1 为 MAE，p=2 为 RMSE）</CardDescription>
              </div>
              <div className="w-40">
                <Input type="number" step="0.1" min={0.1} max={10} value={customP} onChange={(e) => setCustomP(Number(e.target.value))} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">当前 p = {customP}，值：<span className="font-semibold">{customMetricValue.toFixed(3)}</span></div>
            </CardContent>
          </Card>
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
              <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={compareChartType === 'bar' ? 'default' : 'outline'} onClick={() => setCompareChartType('bar')}>柱状</Button>
                  <Button size="sm" variant={compareChartType === 'line' ? 'default' : 'outline'} onClick={() => setCompareChartType('line')}>折线</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-64" config={{ metric: { label: 'Metric', color: 'hsl(210 90% 55%)' } }}>
                {compareChartType === 'bar' ? (
                  <BarChart data={regressionModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => regCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : `${v}` } />
                    <Bar dataKey={regCompareMetric} fill="var(--color-metric)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </BarChart>
                ) : (
                  <LineChart data={regressionModelComparison} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" tickLine={false} />
                    <YAxis tickFormatter={(v) => regCompareMetric === 'r2' ? `${(v * 100).toFixed(0)}%` : `${v}` } />
                    <Line type="monotone" dataKey={regCompareMetric} stroke="var(--color-metric)" dot />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
          <CardHeader>
            <CardTitle>任务类型暂不支持详细结果展示</CardTitle>
            <CardDescription>当前仅针对 分类 / 回归 / 时序预测 任务提供结果展示</CardDescription>
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
              <DropdownMenuItem onClick={handleExportPDF}>导出 PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportHTML}>导出 HTML</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportParamsJson}>导出参数 JSON</DropdownMenuItem>
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
                    {task.datasets && task.datasets.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600">已关联数据集（多选）</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.datasets.map((ds) => (
                            <Badge key={ds.id} variant="secondary" className="flex items-center space-x-2">
                              <span>{ds.name}</span>
                              <span className="text-xs text-gray-500">{ds.version}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">数据集名称</p>
                          <p className="font-medium">{task.datasetName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">数据集ID + 版本号</p>
                          <p className="font-medium">{task.datasetVersion}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">来源</p>
                      <p className="font-medium">上传</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>数据预览</CardTitle>
                      <CardDescription>支持多数据集切换，字段名 + 示例值</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-52">
                        <Select value={String(datasetPreviewIndex)} onValueChange={(v) => setDatasetPreviewIndex(Number(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择数据集" />
                          </SelectTrigger>
                          <SelectContent>
                            {(task.datasets && task.datasets.length > 0 ? task.datasets : [{ id: 'default', name: task.datasetName, version: task.datasetVersion }]).map((ds, idx) => (
                              <SelectItem key={`${ds.id}@${ds.version}`} value={String(idx)}>
                                {ds.name} <span className="text-xs text-gray-500">{ds.version}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-36">
                        <Select value={String(previewRowCount)} onValueChange={(v) => setPreviewRowCount(Number(v))}>
                          <SelectTrigger>
                            <SelectValue placeholder="行数" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">前 10 行</SelectItem>
                            <SelectItem value="20">前 20 行</SelectItem>
                            <SelectItem value="50">前 50 行</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-gray-50"
                        onClick={() => {
                          const curDs = task.datasets?.[datasetPreviewIndex];
                          onOpenDataDetail?.({
                            id: curDs ? curDs.id : task.datasetVersion,
                            name: curDs ? curDs.name : task.datasetName,
                            description: '任务关联数据集',
                            size: '未知',
                            fieldCount: (getFieldMetaForDataset(curDs?.id) || []).length,
                            sampleCount: (getSampleRowsForDataset(curDs?.id) || []).length,
                            source: 'upload',
                          });
                        }}
                      >
                        数据详情
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      {(() => {
                        const curDs = task.datasets?.[datasetPreviewIndex];
                        const rows = getSampleRowsForDataset(curDs?.id);
                        const limited = rows.slice(0, Math.min(previewRowCount, rows.length));
                        const columns = rows[0] ? Object.keys(rows[0]) : [];
                        return (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {columns.map((col) => (
                                  <TableHead key={col}>{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {limited.map((row, idx) => (
                                <TableRow key={idx}>
                                  {Object.entries(row).map(([k, v]) => (
                                    <TableCell key={k}>{String(v)}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* 多数据集聚合统计：仅在选择了多个数据集时显示 */}
              {aggregatedStats && task.datasets && task.datasets.length > 1 && (
                <Card className="transition-all duration-200 hover:shadow-md border-gray-200 mt-6">
                  <CardHeader>
                    <CardTitle>多数据集聚合统计</CardTitle>
                    <CardDescription>展示参与训练的多个数据集的合并统计信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">数据集数量</div>
                        <div className="text-lg font-medium">{aggregatedStats.datasetCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">样本总数</div>
                        <div className="text-lg font-medium">{aggregatedStats.totalSamples.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">字段并集数量</div>
                        <div className="text-lg font-medium">{aggregatedStats.unionFieldCount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">合计大小</div>
                        <div className="text-lg font-medium">{formatSizeMB(aggregatedStats.totalSizeMB)}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">提示：字段并集基于注册表中的已知字段集合估算，实际以数据处理结果为准。</div>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">参与数据集</div>
                      <div className="flex flex-wrap gap-2">
                        {aggregatedStats.statsList.map((s) => (
                          <Badge key={`${s.id}@${s.version}`} variant="outline" className="flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-xs text-gray-500">{s.version}</span>
                            <span className="text-xs text-gray-400">样本 {s.sampleCount.toLocaleString()} • 字段 {s.fieldCount} • {s.size}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
              {/* 用户配置的参数字段展示（替换X/Y字段选择） */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle>用户配置的参数字段</CardTitle>
                  <CardDescription>展示任务创建时填写的时序预测相关参数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">上下文长度</span>
                      <p className="font-medium">{forecastingParams?.contextLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测步长</span>
                      <p className="font-medium">{forecastingParams?.stepLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测长度</span>
                      <p className="font-medium">{forecastingParams?.forecastLength ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">预测开始时间</span>
                      <p className="font-medium">{forecastingParams?.startTime ?? '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">主变量文件</span>
                      <p className="font-medium">{forecastingParams?.mainVariableFile || '未指定'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">协变量文件</span>
                      <p className="font-medium">{(forecastingParams?.covariateFiles && forecastingParams.covariateFiles.length > 0) ? forecastingParams.covariateFiles.join(', ') : '无'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* 参数 JSON 回显与导出 */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200 mt-6">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>参数 JSON 回显</CardTitle>
                    <CardDescription>用于复盘与核对，支持直接导出 JSON 文件</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportParamsJson}>
                      <Download className="h-4 w-4 mr-2" /> 导出 JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 rounded-md p-4 text-xs w-full max-w-full max-h-56 overflow-auto overflow-x-auto whitespace-pre-wrap break-words">
                    {parameterJSON}
                  </pre>
                </CardContent>
              </Card>
            </section>

            {/* 任务结果 */}
            <section id="results" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">任务结果</h2>
              {renderMetricsTab()}
            </section>

            {/* 因果解释 */}
            <section id="causal" className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4">因果解释</h2>

              {/* 注：按用户要求移除顶部模型评估卡片（蓝色横幅与误差棒图） */}
              <Card className="transition-all duration-200 hover:shadow-md border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>因果链条</CardTitle>
                    <CardDescription>展示特征之间的因果影响关系</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">TopN 边</span>
                      <Input type="range" min={1} max={10} value={topNEdges} onChange={(e) => setTopNEdges(Number(e.target.value))} className="w-32" />
                      <span className="text-xs text-gray-800 w-6 text-right">{topNEdges}</span>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDeepSeekOpen(true)}>
                      <Brain className="h-4 w-4 mr-2" />
                      大模型预测过程
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">因果关系示意图（包含影响强度）</div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <svg viewBox="0 0 500 320" className="w-full h-64">
                        {/* edges */}
                        {[...causalGraph.edges]
                          .sort((a,b) => b.strength - a.strength)
                          .slice(0, topNEdges)
                          .filter((e) => !selectedCausalNode || e.from === selectedCausalNode || e.to === selectedCausalNode)
                          .map((e, idx) => {
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
                          <g key={n.id} className="cursor-pointer" onClick={() => setSelectedCausalNode(selectedCausalNode === n.id ? null : n.id)}>
                            <circle cx={n.x} cy={n.y} r={selectedCausalNode === n.id ? 22 : 18} fill={selectedCausalNode === n.id ? '#16a34a' : '#1e40af'} />
                            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fill="#fff">{n.id}</text>
                          </g>
                        ))}
                      </svg>
                      <div className="text-xs text-gray-500">连线颜色/粗细代表影响强度，数值为强度标注；点击节点可查看该特征的因果贡献度</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">解释结果：</p>
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                      缺陷率升高的主要原因是温度参数偏高和设备老化。
                    </div>
                    {selectedCausalNode && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">{selectedCausalNode} 的因果贡献度（Top {topNEdges}）</p>
                          <Button size="sm" variant="outline" onClick={() => setSelectedCausalNode(null)}>清空选择</Button>
                        </div>
                        <div className="mt-2 space-y-1">
                          {[...causalGraph.edges]
                            .filter(e => e.from === selectedCausalNode || e.to === selectedCausalNode)
                            .sort((a,b) => b.strength - a.strength)
                            .slice(0, topNEdges)
                            .map((e, i) => (
                              <div key={`${selectedCausalNode}-edge-${i}`} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                                <span className="text-gray-700">{e.from} → {e.to}</span>
                                <span className="font-mono text-gray-900">{e.strength.toFixed(3)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* 大模型预测过程弹窗 */}
              <Dialog open={isDeepSeekOpen} onOpenChange={setDeepSeekOpen}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>大模型预测过程</DialogTitle>
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