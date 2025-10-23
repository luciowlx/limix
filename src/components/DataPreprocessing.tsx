import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { 
  Settings,
  Database,
  Filter,
  Wand2,
  Code,
  Play,
  Save,
  Download,
  Upload,
  Eye,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  FileText,
  BarChart3,
  Zap,
  Target,
  Layers,
  RefreshCw,
  Copy,
  Edit,
  X,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { SoloDataCleaning } from "./SoloDataCleaning";
import { datasetPreviewRows } from "../mock/datasetPreview";

interface DataPreprocessingProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string;
  mode?: 'traditional' | 'auto';
}

interface FieldInfo {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  unique: boolean;
  sampleValues: any[];
  nullCount: number;
  totalCount: number;
  selected: boolean;
}

 interface CleaningRule {
  id: string;
  field: string;
  type: 'fill_null' | 'encode_categorical' | 'deduplicate' | 'normalize_unit' | 'split_range' | 'format_date' | 'resample' | 'numeric_transform';
  config: any;
  enabled: boolean;
  description: string;
   // 来源：推荐策略 or 自定义
   source?: 'recommended' | 'custom';
   // 若来源为推荐策略，记录推荐策略id，便于同步取消/启用
   refId?: string;
 }

 interface RecommendedStrategy {
   id: string;
   // 关键能力标识：用于 UI 图标与映射
   key: 'deduplicate' | 'fill_missing' | 'unique_check' | 'normalize_text';
   title: string;
   description: string;
   confidence: number; // 0~1
   impactLevel: '高' | '中' | '低';
   affectedRows: number;
   affectedFields: string[];
   rule: {
     field: string;
     type: CleaningRule['type'];
     config: any;
     description: string;
   };
   selected: boolean;
 }


export function DataPreprocessing({ isOpen, onClose, datasetId, mode = 'traditional' }: DataPreprocessingProps) {
  const [currentMode, setCurrentMode] = useState<'traditional' | 'auto'>(mode);
  // 初始不加载字段信息，先进行“选择数据集”步骤
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [cleaningRules, setCleaningRules] = useState<CleaningRule[]>([]);
  // 新增 Step 0：选择数据集
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  // 已移除：processingResult 与 previewData 状态（不再使用结果预览）
  const [jsonConfig, setJsonConfig] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recommendedStrategies, setRecommendedStrategies] = useState<RecommendedStrategy[]>([]);
  const [recommendedQuery, setRecommendedQuery] = useState('');
  // 多选数据集：搜索与筛选（支持模糊）
  const [datasetSearch, setDatasetSearch] = useState('');
  // Step 0 预览：分页设置（展示原始结构和数据）
  const [previewPage, setPreviewPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Step 1（字段选择）：多数据源拼接支持
  const [primaryDatasetId, setPrimaryDatasetId] = useState<string | null>(null);
  const [datasetFieldsMap, setDatasetFieldsMap] = useState<Record<string, FieldInfo[]>>({});
  // 缓存失效触发器（用于强制刷新聚合计算）
  const [cacheBuster, setCacheBuster] = useState(0);
  // 记录上一次的去重规则签名，用于比对变化以清理缓存
  const prevDedupSignatureRef = useRef<string | null>(null);
  
  interface AggregatedField {
    name: string;
    type: FieldInfo['type'];
    missingRate: number; // 0~1 缺失率
    duplicateRate: number; // 0~1 重复率
    isUnique: boolean; // 是否完全唯一
    sampleValues: any[]; // 前 N 条示例值
    selected: boolean;
    // 可选：类型冲突与覆盖范围（用于“显示全部字段”场景）
    hasTypeConflict?: boolean;
    conflictTypes?: FieldInfo['type'][];
    presentInCount?: number; // 该字段在多少个数据集中出现
  }
  const [aggregatedFields, setAggregatedFields] = useState<AggregatedField[]>([]);
  // 多数据源视图：显示公共字段或全部字段
  const [showCommonOnly, setShowCommonOnly] = useState<boolean>(true);

  // Step2（规则配置）也需要在同一数据集的多版本或多源场景下选择主/从表并展示公共/全部字段
  const [step2ShowCommonOnly, setStep2ShowCommonOnly] = useState<boolean>(true);
  const [step2PrimaryDatasetId, setStep2PrimaryDatasetId] = useState<string | null>(null);
  const [step2PrimaryVersionId, setStep2PrimaryVersionId] = useState<string | undefined>(undefined);
  const [step2SecondaryDatasetId, setStep2SecondaryDatasetId] = useState<string | null>(null);
  const [step2SecondaryVersionId, setStep2SecondaryVersionId] = useState<string | undefined>(undefined);
  const [step2AggregatedFields, setStep2AggregatedFields] = useState<AggregatedField[]>([]);
  const [oneHotMaxCols, setOneHotMaxCols] = useState(100); // One-Hot 最大支持100列

  // 工具函数：获取字段的唯一值/类别数估算
  const getUniqueValueCount = (fieldName: string): number | undefined => {
    const isMultiSource = selectedSourcesForView.length > 1;
    const sourceFields = isMultiSource ? step2AggregatedFields : fields;
    const fieldInfo = sourceFields.find(f => f.name === fieldName) as (FieldInfo | AggregatedField | undefined);
    
    if (!fieldInfo) return undefined;
    
    // 多源聚合字段，直接使用其 sampleValues
    if (isMultiSource && fieldInfo) {
      const uniqueValues = new Set(fieldInfo.sampleValues.filter(v => v !== null && v !== undefined && v !== ''));
      return uniqueValues.size;
    }

    // 单源字段，从原始 FieldInfo 中获取
    const singleFieldInfo = fieldInfo as FieldInfo;
    if (singleFieldInfo && Array.isArray(singleFieldInfo.sampleValues)) {
      const uniqueValues = new Set(singleFieldInfo.sampleValues.filter(v => v !== null && v !== undefined && v !== ''));
      return uniqueValues.size;
    }
    
    return undefined;
  };

  // ===== 数值单位标准化：单位合法性与量纲校验工具 =====
  // 维度定义：length（长度）、mass（重量）
  const UNIT_DIMENSIONS: Record<string, 'length' | 'mass'> = {
    mm: 'length',
    cm: 'length',
    m: 'length',
    km: 'length',
    in: 'length',
    ft: 'length',
    mg: 'mass',
    g: 'mass',
    kg: 'mass',
    lb: 'mass'
  };

  // 转换到基准单位的比例：length 使用 m；mass 使用 kg
  const UNIT_FACTORS_TO_BASE: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    lb: 0.45359237
  };

  const BASE_UNIT_BY_DIM: Record<'length' | 'mass', string> = {
    length: 'm',
    mass: 'kg'
  };

  const isValidUnitSymbol = (u: string): boolean => !!UNIT_DIMENSIONS[u];
  const areConvertibleUnits = (a: string, b: string): boolean => (UNIT_DIMENSIONS[a] && UNIT_DIMENSIONS[a] === UNIT_DIMENSIONS[b]);

  const validateCustomMappingText = (jsonText: string): { ok: boolean; error?: string } => {
    try {
      const obj = JSON.parse(jsonText);
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return { ok: false, error: 'JSON 必须是对象（键为原单位，值为包含 to 与 factor 的对象）' };
      }
      for (const [from, conf] of Object.entries(obj)) {
        if (typeof conf !== 'object' || conf === null) {
          return { ok: false, error: `单位 ${from} 的配置必须是对象` };
        }
        const to = (conf as any).to;
        const factor = (conf as any).factor;
        if (typeof to !== 'string' || typeof factor !== 'number' || !Number.isFinite(factor)) {
          return { ok: false, error: `单位 ${from} 的配置需包含合法的 to(string) 与 factor(number)` };
        }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'JSON 解析失败，请检查格式是否正确' };
    }
  };

  // ===== 范围值拆分：解析与校验辅助工具 =====
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const tryParseNumber = (raw: string): number | null => {
    const s = (raw ?? '').toString().trim().replace(/,/g, '');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseRangeWithDelimiter = (text: string, delimiter?: string): [number, number] | null => {
    if (!delimiter) return null;
    const parts = (text ?? '').toString().split(new RegExp(`\\s*${escapeRegExp(delimiter)}\\s*`));
    if (parts.length !== 2) return null;
    const a = tryParseNumber(parts[0]);
    const b = tryParseNumber(parts[1]);
    if (a === null || b === null) return null;
    return [a, b];
  };

  const parseRangeWithRegex = (text: string, pattern?: string): [number, number] | null => {
    if (!pattern) return null;
    try {
      const re = new RegExp(pattern);
      const m = re.exec((text ?? '').toString());
      if (!m || m.length < 3) return null;
      const a = tryParseNumber(m[1]);
      const b = tryParseNumber(m[2]);
      if (a === null || b === null) return null;
      return [a, b];
    } catch {
      return null;
    }
  };

  const parseRangeValue = (text: string, delimiter?: string, pattern?: string): [number, number] | null => {
    // 正则优先；否则按分隔符解析
    return parseRangeWithRegex(text, pattern) || parseRangeWithDelimiter(text, delimiter) || null;
  };

  const suggestRangeDelimiterFromSamples = (samples: any[]): string | undefined => {
    const candidates = ['-', '~', '～', '至', 'to', '—', '–'];
    const counts: Record<string, number> = {};
    samples.forEach(v => {
      const s = (v ?? '').toString();
      candidates.forEach(d => {
        if (s.includes(d)) counts[d] = (counts[d] || 0) + 1;
      });
    });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] > 0 ? best[0] : undefined;
  };

  const computeRangeMatchRate = (fieldName: string, delimiter?: string, pattern?: string): { total: number; matchedCount: number; examples: Array<{ raw: string; parsed: [number, number] | null }> } => {
    const isMultiSource = selectedSourcesForView.length > 1;
    const sourceFields = isMultiSource ? step2AggregatedFields : fields;
    const fi: any = sourceFields.find((f: any) => f.name === fieldName);
    const samples: any[] = (fi?.sampleValues || []).slice(0, 20);
    let matched = 0;
    const examples: Array<{ raw: string; parsed: [number, number] | null }> = [];
    samples.forEach(raw => {
      const s = (raw ?? '').toString();
      const parsed = parseRangeValue(s, delimiter, pattern);
      if (parsed) matched++;
      examples.push({ raw: s, parsed });
    });
    return { total: samples.length, matchedCount: matched, examples };
  };

  // 数据集选择相关状态（支持多选 + 标签切换预览）
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>(datasetId ? [datasetId] : []);
  const [activeDatasetId, setActiveDatasetId] = useState<string | undefined>(datasetId);
  // 版本选择：为每个已选数据集记录“已选择的多个版本”
  const [selectedDatasetVersions, setSelectedDatasetVersions] = useState<Record<string, string[]>>({});
  // 当前预览版本：按数据集记录一个“活动版本”，用于底部信息与进入下一步字段加载
  const [activeVersionByDataset, setActiveVersionByDataset] = useState<Record<string, string | undefined>>({});
  // Step1 主表版本选择（与主表数据集联动）
  const [primaryVersionId, setPrimaryVersionId] = useState<string | undefined>(undefined);
  const datasetOptions = [
    { id: '1', name: '生产线传感器数据集', type: 'IoT传感器', size: '120MB', rows: '125,000', columns: '32', completeness: 92,
      versions: [
        { id: 'v1.2', label: 'v1.2（稳定）', rows: '125,000', columns: '32', size: '120MB', createdAt: '2024-12-12', note: '修正温湿度单位与缺失值填充', tags: ['stable'] , isDefault: true },
        { id: 'v1.1', label: 'v1.1', rows: '120,000', columns: '31', size: '115MB', createdAt: '2024-10-02', note: '新增 vibration 字段', tags: ['archived'] },
        { id: 'v1.0', label: 'v1.0', rows: '100,500', columns: '30', size: '98MB', createdAt: '2024-06-18', note: '初始采集版本', tags: ['archived'] }
      ] },
    { id: '2', name: 'ERP系统数据集', type: '业务记录', size: '85MB', rows: '98,500', columns: '24', completeness: 88,
      versions: [
        { id: 'v2.0', label: 'v2.0（最新）', rows: '98,500', columns: '24', size: '85MB', createdAt: '2025-03-31', note: '对账完成；新增渠道字段', tags: ['latest'], isDefault: true },
        { id: 'v1.0', label: 'v1.0（稳定）', rows: '92,300', columns: '23', size: '80MB', createdAt: '2024-12-31', note: '清洗订单异常记录', tags: ['stable'] }
      ] },
    { id: '3', name: '设备维保日志', type: '日志数据', size: '40MB', rows: '250,000', columns: '12', completeness: 76,
      versions: [
        { id: 'v2.0', label: 'v2.0', rows: '250,000', columns: '12', size: '40MB', createdAt: '2025-02-15', note: '统一 error_code 与 module 枚举', tags: ['stable'], isDefault: true },
        { id: 'v1.0', label: 'v1.0', rows: '210,000', columns: '12', size: '35MB', createdAt: '2024-11-20', note: '补充 stack 字段', tags: ['archived'] }
      ] },
    { id: '4', name: '质量检测结果集', type: '检测记录', size: '65MB', rows: '45,200', columns: '16', completeness: 81,
      versions: [
        { id: 'v2.0', label: 'v2.0', rows: '45,200', columns: '16', size: '65MB', createdAt: '2025-01-28', note: '新增 image_url 字段', tags: ['stable'], isDefault: true },
        { id: 'v1.0', label: 'v1.0', rows: '41,000', columns: '15', size: '58MB', createdAt: '2024-09-02', note: '修订判定规则', tags: ['archived'] }
      ] }
  ];

  // 工具：获取某数据集的默认版本ID
  const getDefaultVersionId = (dsId: string): string | undefined => {
    const ds = datasetOptions.find(d => d.id === dsId);
    const def = ds?.versions?.find(v => v.isDefault) || ds?.versions?.[0];
    return def?.id;
  };

  // 计算当前已选择的数据源（数据集-版本对），用于多源/多版本判断
  const selectedSourcesForView = useMemo(() => {
    const arr: Array<{ id: string; verId: string }> = [];
    selectedDatasetIds.forEach(id => {
      const vers = selectedDatasetVersions[id];
      const def = getDefaultVersionId(id);
      if (vers && vers.length > 0) {
        vers.forEach(v => arr.push({ id, verId: v }));
      } else if (def) {
        arr.push({ id, verId: def });
      }
    });
    return arr;
  }, [selectedDatasetIds, selectedDatasetVersions]);

  const getSelectedFieldNamesForStep1 = (): string[] => {
    if (selectedSourcesForView.length > 1) {
      return aggregatedFields.filter(f => f.selected).map(f => f.name);
    }
    return fields.filter(f => f.selected).map(f => f.name);
  };

  const getCurrentViewSelectedFieldNames = (): string[] => {
    // Step2 使用成对的视图（主/从表）
    if (currentStep === 2 && selectedSourcesForView.length > 1) {
      return step2AggregatedFields.filter(f => f.selected).map(f => f.name);
    }
    // 其他情况回退到 Step1 的集合或单源字段
    return getSelectedFieldNamesForStep1();
  };

  // 轻量模糊匹配评分：支持按顺序子序列匹配与连续匹配加权
  const fuzzyScore = (text: string, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    const t = (text || '').toLowerCase();
    // 连续匹配优先
    let score = t.includes(q) ? q.length * 2 : 0;
    // 子序列匹配（按字符顺序出现）
    let ti = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const found = t.indexOf(q[qi], ti);
      if (found === -1) return -1; // 不匹配
      // 距离越近得分越高
      const gap = Math.max(0, found - ti);
      score += Math.max(1, 5 - gap);
      ti = found + 1;
    }
    // 起始匹配加成
    if (t.startsWith(q)) score += 3;
    return score;
  };

  // 根据搜索关键词过滤并按模糊评分排序
  const filteredDatasets = useMemo(() => {
    const q = datasetSearch.trim();
    if (!q) return datasetOptions;
    return datasetOptions
      .map(ds => ({ ds, score: fuzzyScore(ds.name, q) }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.ds);
  }, [datasetOptions, datasetSearch]);

  // 基于 schema 生成示例原始数据（仅用于预览，不代表真实数据）
  const generateSampleRows = (schema: Array<{ name: string; type: FieldInfo['type'] }>, count: number) => {
    const rows: any[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const row: Record<string, any> = {};
      for (const col of schema) {
        switch (col.type) {
          case 'number':
            row[col.name] = Math.floor(Math.random() * 1000);
            break;
          case 'boolean':
            row[col.name] = Math.random() > 0.5;
            break;
          case 'date':
            const d = new Date(now.getTime() - i * 86400000);
            row[col.name] = d.toISOString().slice(0, 10);
            break;
          case 'object':
            row[col.name] = { k: i, v: `val_${i % 7}` };
            break;
          case 'array':
            row[col.name] = [i, i + 1];
            break;
          default:
            row[col.name] = `${col.name}_${i}`;
        }
      }
      rows.push(row);
    }
    return rows;
  };


  // 为示例数据集提供字段梳理（schema）映射，用于在“选择数据集（Step 0）”即时展示
  const datasetFieldSchemas: Record<string, Array<{ name: string; type: FieldInfo['type'] }>> = {
    '1': [
      { name: 'timestamp', type: 'date' },
      { name: 'device_id', type: 'string' },
      { name: 'temperature', type: 'number' },
      { name: 'humidity', type: 'number' },
      { name: 'pressure', type: 'number' },
      { name: 'vibration', type: 'number' },
      { name: 'current', type: 'number' },
      { name: 'voltage', type: 'number' },
      { name: 'status', type: 'string' },
      { name: 'alarm_code', type: 'string' },
      { name: 'operator', type: 'string' },
      { name: 'shift', type: 'string' },
      { name: 'line_no', type: 'string' },
      { name: 'product_id', type: 'string' },
      { name: 'batch_no', type: 'string' },
      { name: 'process', type: 'string' },
      { name: 'station', type: 'string' },
      { name: 'remarks', type: 'string' },
      { name: 'tags', type: 'array' },
      { name: 'meta', type: 'object' },
      { name: 'location', type: 'string' }
    ],
    '2': [
      { name: 'order_id', type: 'string' },
      { name: 'customer', type: 'string' },
      { name: 'sku', type: 'string' },
      { name: 'quantity', type: 'number' },
      { name: 'unit_price', type: 'number' },
      { name: 'total', type: 'number' },
      { name: 'order_date', type: 'date' },
      { name: 'status', type: 'string' },
      { name: 'warehouse', type: 'string' },
      { name: 'province', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'channel', type: 'string' },
      { name: 'operator_id', type: 'string' },
      { name: 'updated_at', type: 'date' }
    ],
    '3': [
      { name: 'log_id', type: 'string' },
      { name: 'device_id', type: 'string' },
      { name: 'event', type: 'string' },
      { name: 'level', type: 'string' },
      { name: 'message', type: 'string' },
      { name: 'created_at', type: 'date' },
      { name: 'duration_ms', type: 'number' },
      { name: 'error_code', type: 'string' },
      { name: 'stack', type: 'string' },
      { name: 'module', type: 'string' },
      { name: 'ip', type: 'string' }
    ],
    '4': [
      { name: 'sample_id', type: 'string' },
      { name: 'inspection_item', type: 'string' },
      { name: 'result', type: 'string' },
      { name: 'value', type: 'number' },
      { name: 'unit', type: 'string' },
      { name: 'spec_lower', type: 'number' },
      { name: 'spec_upper', type: 'number' },
      { name: 'judge', type: 'string' },
      { name: 'inspector', type: 'string' },
      { name: 'station', type: 'string' },
      { name: 'batch_no', type: 'string' },
      { name: 'lot_no', type: 'string' },
      { name: 'timestamp', type: 'date' },
      { name: 'method', type: 'string' },
      { name: 'image_url', type: 'string' },
      { name: 'remarks', type: 'string' }
    ]
  };

  // 依赖 schema 的预览表格数据与分页逻辑（必须在 datasetFieldSchemas 定义之后）
  const previewSchema = useMemo(() => (activeDatasetId ? (datasetFieldSchemas[activeDatasetId] || []) : []), [activeDatasetId]);
  const rawPreviewRows = useMemo(() => {
    if (!activeDatasetId) return [];
    // 优先使用预置的 mock 行数据；若不存在则按 schema 生成
    const preset = datasetPreviewRows?.[activeDatasetId as string];
    const rows = Array.isArray(preset) && preset.length > 0 ? preset.slice(0, 100) : generateSampleRows(previewSchema, 100);
    const schemaNames = previewSchema.map(s => s.name);
    const dedupRules = cleaningRules.filter(r => r.type === 'deduplicate' && r.enabled);
    const likelyKeys = ['id','order_id','device_id','sample_id','log_id','product_id','operator_id'];
    const dedupKeys = (() => {
      if (dedupRules.length > 0) {
        const anyAll = dedupRules.some(r => (r.config?.useAllFields ?? true));
        if (anyAll) return schemaNames;
        const keys = Array.from(new Set(dedupRules.flatMap(r => Array.isArray(r.config?.keyFields) ? r.config.keyFields : [])));
        return keys.filter(k => schemaNames.includes(k));
      }
      return schemaNames.filter(n => likelyKeys.includes(n));
    })();
    const typeByName: Record<string, FieldInfo['type']> = {};
    previewSchema.forEach(col => { typeByName[col.name] = col.type; });
    rows.forEach(row => {
      dedupKeys.forEach(k => {
        const t = typeByName[k];
        row[k] = t === 'number' ? 1000 : '1000';
      });
    });
    return rows;
  }, [activeDatasetId, previewSchema, cleaningRules]);
  const totalPreviewPages = useMemo(() => Math.max(1, Math.ceil(rawPreviewRows.length / rowsPerPage)), [rawPreviewRows.length, rowsPerPage]);
  const pagedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * rowsPerPage;
    return rawPreviewRows.slice(start, start + rowsPerPage);
  }, [rawPreviewRows, previewPage, rowsPerPage]);

  useEffect(() => {
    // 切换数据集时重置到第 1 页
    setPreviewPage(1);
  }, [activeDatasetId]);

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  // 当前预览数据集（用于展示信息面板）
  const selectedDataset = datasetOptions.find(d => d.id === activeDatasetId);
  
  // 确认弹窗状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'apply' | null>(null);

  // 规则级确认弹窗状态（用于填充方式等敏感操作）
  const [showRuleConfirmDialog, setShowRuleConfirmDialog] = useState(false);
  const [ruleConfirmPayload, setRuleConfirmPayload] = useState<{ ruleId: string; nextUpdates: Partial<CleaningRule>; message: string } | null>(null);

  // 打开对话框时，如果来自具体数据集入口，预选该数据集；但仍停留在 Step 0
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      const defaultId = datasetId || datasetOptions[0]?.id;
      setSelectedDatasetIds(defaultId ? [defaultId] : []);
      setActiveDatasetId(defaultId);
      setIsLoading(false);
      // 默认选择其默认版本并设为活动版本
      if (defaultId) {
        const defVerId = getDefaultVersionId(defaultId);
        if (defVerId) {
          setSelectedDatasetVersions(prev => ({ ...prev, [defaultId]: [defVerId] }));
          setActiveVersionByDataset(prev => ({ ...prev, [defaultId]: defVerId }));
        }
      }
    }
  }, [isOpen, datasetId]);

  // 进入字段选择步骤时，根据选中的数据集加载字段信息
  useEffect(() => {
    if (isOpen && currentStep === 1 && activeDatasetId) {
      const verId = activeVersionByDataset[activeDatasetId] || (selectedDatasetVersions[activeDatasetId]?.[0]) || getDefaultVersionId(activeDatasetId);
      loadDatasetInfo(activeDatasetId, verId);
    }
  }, [isOpen, currentStep, activeDatasetId, activeVersionByDataset, selectedDatasetVersions]);

  // 抽取：构造 mock 字段信息（供单数据源与多数据源复用）
  const buildMockFields = (): FieldInfo[] => {
    return [
      {
        name: 'id',
        type: 'number',
        nullable: false,
        unique: true,
        sampleValues: [1, 2, 3, 4, 5],
        nullCount: 0,
        totalCount: 10000,
        selected: true
      },
      {
        name: 'name',
        type: 'string',
        nullable: true,
        unique: false,
        sampleValues: ['张三', '李四', '', '王五', null],
        nullCount: 150,
        totalCount: 10000,
        selected: true
      },
      {
        name: 'email',
        type: 'string',
        nullable: true,
        unique: true,
        sampleValues: ['user@example.com', 'test@test.com', '', null, 'invalid-email'],
        nullCount: 50,
        totalCount: 10000,
        selected: true
      },
      {
        name: 'age',
        type: 'number',
        nullable: true,
        unique: false,
        sampleValues: [25, 30, null, -5, 150],
        nullCount: 200,
        totalCount: 10000,
        selected: true
      },
      {
        name: 'created_at',
        type: 'date',
        nullable: false,
        unique: false,
        sampleValues: ['2024-01-15', '2024/01/16', '15-01-2024', '2024-01-17T10:30:00Z', 'invalid-date'],
        nullCount: 0,
        totalCount: 10000,
        selected: true
      },
      {
        name: 'metadata',
        type: 'object',
        nullable: true,
        unique: false,
        sampleValues: [{ key: 'value' }, null, {}, { nested: { data: 'test' } }, 'invalid-json'],
        nullCount: 300,
        totalCount: 10000,
        selected: false
      }
    ];
  };

  const loadDatasetInfo = async (id: string, versionId?: string) => {
    setIsLoading(true);
    try {
      // 模拟 API 调用（真实环境下应请求后端获取字段统计与示例值）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 按数据集/版本联动生成字段信息（优先使用 datasetFieldSchemas）
      const infos: FieldInfo[] = ensureFieldInfosForDatasetVersion(id, versionId);
      setFields(infos);

      // 缓存当前数据集的字段信息，便于多数据源聚合
      const key = versionId ? `${id}:${versionId}` : id;
      setDatasetFieldsMap(prev => ({ ...prev, [key]: infos }));
      
      // 基于当前字段动态生成一条示例性的 AI 推荐清洗策略（符合允许的规则类型）
      const emailField = infos.find(f => f.name.toLowerCase().includes('email'));
      const firstString = infos.find(f => f.type === 'string');
      const targetField = (emailField || firstString || infos[0]);
      const total = targetField?.totalCount || 10000;
      const missingRate = targetField ? (targetField.nullCount / Math.max(1, total)) : 0.12;
      const confidence = Math.max(0.6, Math.min(0.95, 0.5 + missingRate));
      const impactLevel: '高' | '中' | '低' = missingRate > 0.2 ? '高' : (missingRate > 0.05 ? '中' : '低');

      const recommended: RecommendedStrategy[] = targetField ? [
        {
          id: `rs-fill-${key}`,
          key: 'fill_missing',
          title: '缺失值填充',
          description: `建议对 ${targetField.name} 字段进行缺失值填充`,
          confidence,
          impactLevel,
          affectedRows: Math.round(total * missingRate),
          affectedFields: [targetField.name],
          rule: {
            field: targetField.name,
            type: 'fill_null',
            config: { fillValue: emailField ? 'unknown@example.com' : 'N/A' },
            description: '填充缺失值'
          },
          selected: false
        }
      ] : [];
      setRecommendedStrategies(recommended);

      // 将已勾选的推荐策略同步到清洗规则区域
      const defaultRules: CleaningRule[] = recommended
        .filter(r => r.selected)
        .map((r, idx) => ({
          id: `rule-${idx + 1}`,
          field: r.rule.field,
          type: r.rule.type,
          config: r.rule.config,
          enabled: true,
          description: r.rule.description,
          source: 'recommended',
          refId: r.id
        }));

      setCleaningRules(defaultRules);
      
      // 生成 JSON 配置（与界面互操作：只输出必要字段）
      const jsonConfigTemplate = {
        fields: infos.filter(f => f.selected).map(f => f.name),
        rules: defaultRules.filter(r => r.enabled).map(r => ({
          field: r.field,
          type: r.type,
          config: r.config
        })),
        output: {
          format: 'csv',
          encoding: 'utf-8',
          includeHeader: true
        },
        validation: {
          strictMode: false,
          skipErrors: true,
          maxErrors: 100
        }
      };

      setJsonConfig(JSON.stringify(jsonConfigTemplate, null, 2));
      
    } catch (error) {
      toast.error('加载数据集信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 工具：给定数据集ID，生成该数据集的字段信息（若未缓存则基于 schema 动态生成）
  const ensureFieldInfosForDatasetVersion = (id: string, versionId?: string): FieldInfo[] => {
    const key = versionId ? `${id}:${versionId}` : id;
    const cached = datasetFieldsMap[key];
    if (cached && cached.length > 0) return cached;
    const schema = datasetFieldSchemas[id] || buildMockFields().map(f => ({ name: f.name, type: f.type }));
    const rows = generateSampleRows(schema, 5);
    // 模拟重复值注入：将判定为去重的字段全部设为 1000
    const schemaNames: string[] = schema.map(s => s.name);
    const dedupRules = cleaningRules.filter(r => r.type === 'deduplicate' && r.enabled);
    const defaultLikelyKeys = ['id','order_id','device_id','sample_id','log_id','product_id','operator_id'];
    const dedupKeys: string[] = (() => {
      if (dedupRules.length > 0) {
        const anyAll = dedupRules.some(r => (r.config?.useAllFields ?? true));
        if (anyAll) return schemaNames;
        const keys = Array.from(new Set(dedupRules.flatMap(r => Array.isArray(r.config?.keyFields) ? r.config.keyFields : [])));
        return keys.filter(k => schemaNames.includes(k));
      }
      return schemaNames.filter(n => defaultLikelyKeys.includes(n));
    })();
    const typeByName: Record<string, FieldInfo['type']> = {};
    schema.forEach(col => { typeByName[col.name] = col.type; });
    rows.forEach(row => {
      dedupKeys.forEach(k => {
        const t = typeByName[k];
        row[k] = t === 'number' ? 1000 : '1000';
      });
    });

    const hashCode = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
      return Math.abs(h);
    };

    const infos: FieldInfo[] = schema.map(col => {
      const samples = rows.map(r => r[col.name]);
      const total = 10000;
      const nulls = samples.filter(v => v === null || v === undefined || v === '').length;
      // 基于样本的重复估计：样本长度-去重后的大小（不含空值）
      const nonNull = samples.filter(v => v !== null && v !== undefined && v !== '');
      const setSize = new Set(nonNull.map(v => JSON.stringify(v))).size;
      const dupEst = Math.max(0, nonNull.length - setSize);
      const seedAdjust = (hashCode(id + ':' + (versionId || 'default') + ':' + col.name) % 3) / 100; // 0~0.02 微调（纳入版本差异）
      const missingRate = Math.min(1, (nulls / samples.length) + seedAdjust);
      const duplicateRate = Math.min(1, (dupEst / Math.max(1, nonNull.length)) + seedAdjust);
      const unique = duplicateRate === 0;
      return {
        name: col.name,
        type: col.type,
        nullable: missingRate > 0,
        unique,
        sampleValues: samples,
        nullCount: Math.round(total * missingRate),
        totalCount: total,
        selected: true
      };
    });
    // 缓存以便后续聚合使用
    setDatasetFieldsMap(prev => ({ ...prev, [key]: infos }));
    return infos;
  };

  // 当去重规则变化时，使字段信息缓存失效并重算示例值
  useEffect(() => {
    const dedupSig = JSON.stringify(
      cleaningRules
        .filter(r => r.type === 'deduplicate')
        .map(r => ({
          enabled: r.enabled,
          field: r.field,
          useAllFields: r.config?.useAllFields ?? true,
          keyFields: Array.isArray(r.config?.keyFields) ? [...r.config.keyFields].sort() : []
        }))
    );
    if (prevDedupSignatureRef.current === null) {
      prevDedupSignatureRef.current = dedupSig;
      return;
    }
    if (prevDedupSignatureRef.current !== dedupSig) {
      setDatasetFieldsMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          const idPart = k.split(':')[0];
          if (selectedDatasetIds.includes(idPart)) {
            delete next[k];
          }
        });
        return next;
      });
      const dsId = activeDatasetId || selectedDatasetIds[0];
      if (dsId) {
        const verId = activeVersionByDataset[dsId] || (selectedDatasetVersions[dsId]?.[0]) || getDefaultVersionId(dsId);
        const infos = ensureFieldInfosForDatasetVersion(dsId, verId);
        setFields(infos);
      }
      setCacheBuster(prev => prev + 1);
      prevDedupSignatureRef.current = dedupSig;
    }
  }, [cleaningRules, selectedDatasetIds, selectedDatasetVersions, activeDatasetId, activeVersionByDataset]);

  // 多数据源：公共字段聚合 / 全部字段视图（缺失率、重复率、唯一性、示例值、类型冲突）
  useEffect(() => {
    if (currentStep !== 1) return;
    // 构造“数据源”列表（数据集-版本对），支持同一数据集选择多个版本
    const selectedSources: Array<{ id: string; verId: string }> = [];
    selectedDatasetIds.forEach(id => {
      const vers = selectedDatasetVersions[id];
      const def = getDefaultVersionId(id);
      if (vers && vers.length > 0) {
        vers.forEach(v => selectedSources.push({ id, verId: v }));
      } else if (def) {
        selectedSources.push({ id, verId: def });
      }
    });

    if (selectedSources.length <= 1) {
      setAggregatedFields([]);
      return;
    }
    const baseId = primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
    if (!primaryDatasetId && baseId) setPrimaryDatasetId(baseId);
    // 主表版本：优先已设置，其次当前数据集的活动版本，再次该数据集的第一个已选版本，最后默认版本
    const baseVer = primaryVersionId 
      || activeVersionByDataset[baseId!]
      || (selectedDatasetVersions[baseId!]?.[0])
      || getDefaultVersionId(baseId!);
    if (!primaryVersionId && baseVer) setPrimaryVersionId(baseVer);

    const fieldSets = selectedSources.map(src => ensureFieldInfosForDatasetVersion(src.id, src.verId));
    if (fieldSets.length === 0) {
      setAggregatedFields([]);
      return;
    }
    // 计算交集/并集字段名
    let common: Set<string> = new Set<string>(fieldSets[0].map((f) => f.name));
    for (let i = 1; i < fieldSets.length; i++) {
      const names: Set<string> = new Set<string>(fieldSets[i].map((f) => f.name));
      common = new Set<string>(Array.from(common).filter((n: string) => names.has(n)));
    }
    // 并集
    const union: Set<string> = new Set<string>();
    fieldSets.forEach(set => set.forEach(f => union.add(f.name)));

    const baseSet: FieldInfo[] = ensureFieldInfosForDatasetVersion(baseId!, baseVer);
    const commonList: AggregatedField[] = Array.from(common).map((name: string): AggregatedField => {
      const parts: FieldInfo[] = fieldSets
        .map((set) => set.find((f) => f.name === name))
        .filter((p): p is FieldInfo => !!p);
      const missingRates: number[] = parts.map((p) => p.nullCount / Math.max(1, p.totalCount));
      const duplicateRates: number[] = parts.map((p) => {
        // 根据 unique 字段估算重复率（若无明确重复统计）
        const est = p.unique ? 0 : p.nullCount > 0 ? 0.01 : 0.02;
        return Math.max(est, 0);
      });
      const avgMissing = missingRates.reduce((a, b) => a + b, 0) / missingRates.length;
      const avgDuplicate = duplicateRates.reduce((a, b) => a + b, 0) / duplicateRates.length;
      const baseField: FieldInfo = baseSet.find((f) => f.name === name) || parts[0];
      const samplesRaw: any[] = Array.isArray(baseField.sampleValues)
        ? baseField.sampleValues.slice(0, 5)
        : [];
      // 若该字段唯一，则示例值也应唯一（去重显示）
      const seen = new Set<string>();
      const samples: any[] = (avgDuplicate === 0 ? samplesRaw.filter(v => {
        const key = typeof v === 'string' ? `s:${v}` : JSON.stringify(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) : samplesRaw);
      return {
        name,
        type: baseField.type,
        missingRate: avgMissing,
        duplicateRate: avgDuplicate,
        isUnique: avgDuplicate === 0,
        sampleValues: samples,
        selected: true,
      };
    }).sort((a: AggregatedField, b: AggregatedField) => a.name.localeCompare(b.name));

    // 全部字段视图（并集）：计算类型冲突与覆盖范围
    const unionList: AggregatedField[] = Array.from(union).map((name: string): AggregatedField => {
      const parts: FieldInfo[] = fieldSets
        .map((set) => set.find((f) => f.name === name))
        .filter((p): p is FieldInfo => !!p);
      const missingRates: number[] = parts.map((p) => p.nullCount / Math.max(1, p.totalCount));
      const duplicateRates: number[] = parts.map((p) => {
        const est = p.unique ? 0 : p.nullCount > 0 ? 0.01 : 0.02;
        return Math.max(est, 0);
      });
      const avgMissing = missingRates.length > 0 ? missingRates.reduce((a, b) => a + b, 0) / missingRates.length : 0;
      const avgDuplicate = duplicateRates.length > 0 ? duplicateRates.reduce((a, b) => a + b, 0) / duplicateRates.length : 0;
      const baseField: FieldInfo | undefined = baseSet.find((f) => f.name === name) || parts[0];
      const typeSet = new Set<FieldInfo['type']>(parts.map(p => p.type));
      const hasTypeConflict = typeSet.size > 1;
      const samplesRaw: any[] = Array.isArray(baseField?.sampleValues)
        ? (baseField!.sampleValues).slice(0, 5)
        : [];
      const seen = new Set<string>();
      const samples: any[] = (avgDuplicate === 0 ? samplesRaw.filter(v => {
        const key = typeof v === 'string' ? `s:${v}` : JSON.stringify(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) : samplesRaw);
      return {
        name,
        type: (baseField?.type ?? (parts[0]?.type ?? 'string')) as FieldInfo['type'],
        missingRate: avgMissing,
        duplicateRate: avgDuplicate,
        isUnique: avgDuplicate === 0,
        sampleValues: samples,
        selected: true,
        hasTypeConflict,
        conflictTypes: Array.from(typeSet),
        presentInCount: parts.length,
      };
    }).sort((a: AggregatedField, b: AggregatedField) => a.name.localeCompare(b.name));

    setAggregatedFields(showCommonOnly ? commonList : unionList);
    
    // 联动：主表选择后生成字段映射/类型对齐建议（追加到推荐策略）
    try {
      const mappingSuggestions: RecommendedStrategy[] = [];
      const totalSets = selectedSources.length;
      const sourceName = datasetOptions.find(d => d.id === baseId)?.name || baseId!;
      const targetIds = selectedSources.filter(s => s.id !== baseId).map(s => `${s.id}:${s.verId}`);
      unionList.forEach(item => {
        const inAll = (item.presentInCount ?? 0) === totalSets;
        if (!inAll || item.hasTypeConflict) {
          const title = !inAll ? `字段覆盖率不足：${item.name}` : `类型冲突：${item.name}`;
          const desc = !inAll
            ? `主表「${sourceName}」字段「${item.name}」在其他数据集中不存在或命名不一致，建议建立字段映射。`
            : `主表「${sourceName}」字段「${item.name}」在多数据集出现类型不一致（${(item.conflictTypes || []).join(', ')}），建议统一类型或建立转换规则。`;
          mappingSuggestions.push({
            id: `rs-map-${baseId}-${baseVer}-${item.name}`,
            key: 'normalize_text', // 复用现有枚举，不影响展示
            title,
            description: desc,
            confidence: 0.75,
            impactLevel: '中',
            affectedRows: 0,
            affectedFields: [item.name],
            rule: {
              field: item.name,
              type: 'numeric_transform',
              config: {
                mappingFrom: { datasetId: baseId, versionId: baseVer, field: item.name },
                mappingTo: targetIds.map(idv => {
                  const [did, vid] = idv.split(':');
                  return { datasetId: did, versionId: vid, field: item.name };
                }),
                typeConflict: item.hasTypeConflict ? (item.conflictTypes || []) : undefined,
              },
              description: '字段映射/类型统一建议',
            },
            selected: false,
          });
        }
      });
      if (mappingSuggestions.length > 0) {
        setRecommendedStrategies(prev => {
          // 避免重复插入：以 id 去重
          const existingIds = new Set(prev.map(p => p.id));
          const merged = [...prev];
          mappingSuggestions.forEach(ms => {
            if (!existingIds.has(ms.id)) merged.push(ms);
          });
          return merged;
        });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedDatasetIds, selectedDatasetVersions, primaryDatasetId, primaryVersionId, activeDatasetId, activeVersionByDataset, showCommonOnly, cacheBuster]);

  // Step 2：主/从表聚合视图（多源/多版本）- 计算公共字段或全部字段
  useEffect(() => {
    if (currentStep !== 2) return;
    // 若没有多源/多版本，不需要聚合
    const multiSelected = selectedSourcesForView.length > 1;
    if (!multiSelected) {
      setStep2AggregatedFields([]);
      return;
    }

    // 主表（数据集 + 版本）默认联动 Step1/预览选择
    const baseId = step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
    if (!step2PrimaryDatasetId && baseId) setStep2PrimaryDatasetId(baseId);
    const baseSelectedVers = baseId ? (selectedDatasetVersions[baseId] || []) : [];
    const baseOptionVers = baseSelectedVers.length > 0 ? baseSelectedVers : (datasetOptions.find(d => d.id === baseId)?.versions?.map(v => v.id) || []);
    const baseVer = step2PrimaryVersionId || primaryVersionId || activeVersionByDataset[baseId!] || baseOptionVers[0] || getDefaultVersionId(baseId!);
    if (!step2PrimaryVersionId && baseVer) setStep2PrimaryVersionId(baseVer);

    // 从表（数据集 + 版本）：有其他数据集就选其他；否则与主表同数据集选择另一个版本
    const otherIds = selectedDatasetIds.filter(id => id !== baseId);
    const secId = step2SecondaryDatasetId || (otherIds.length ? otherIds[0] : baseId);
    if (!step2SecondaryDatasetId && secId) setStep2SecondaryDatasetId(secId);
    const secSelectedVers = secId ? (selectedDatasetVersions[secId] || []) : [];
    let secOptionVers = secSelectedVers.length > 0 ? secSelectedVers : (datasetOptions.find(d => d.id === secId)?.versions?.map(v => v.id) || []);
    // 同数据集时避免与主表版本重复（优先选择另一个版本）
    if (secId === baseId && baseVer) {
      const filtered = secOptionVers.filter(v => v !== baseVer);
      if (filtered.length > 0) secOptionVers = filtered;
    }
    const secVer = step2SecondaryVersionId || activeVersionByDataset[secId!] || secOptionVers[0] || getDefaultVersionId(secId!);
    if (!step2SecondaryVersionId && secVer) setStep2SecondaryVersionId(secVer);

    const baseFields = ensureFieldInfosForDatasetVersion(baseId!, baseVer!);
    const secFields = ensureFieldInfosForDatasetVersion(secId!, secVer!);
    if (baseFields.length === 0 && secFields.length === 0) {
      setStep2AggregatedFields([]);
      return;
    }

    const nameSet1 = new Set(baseFields.map(f => f.name));
    const nameSet2 = new Set(secFields.map(f => f.name));
    const commonNames = Array.from(nameSet1).filter(n => nameSet2.has(n));
    const unionNames = Array.from(new Set([...Array.from(nameSet1), ...Array.from(nameSet2)]));
    const pickNames = step2ShowCommonOnly ? commonNames : unionNames;

    const aggList: AggregatedField[] = pickNames.map(name => {
      const bf = baseFields.find(f => f.name === name);
      const sf = secFields.find(f => f.name === name);
      const parts: FieldInfo[] = [bf, sf].filter(Boolean) as FieldInfo[];
      const missingRates = parts.map(p => p.nullCount / Math.max(1, p.totalCount));
      const duplicateRates = parts.map(p => {
        const est = p.unique ? 0 : p.nullCount > 0 ? 0.01 : 0.02;
        return Math.max(est, 0);
      });
      const avgMissing = missingRates.reduce((a, b) => a + b, 0) / Math.max(1, missingRates.length);
      const avgDuplicate = duplicateRates.reduce((a, b) => a + b, 0) / Math.max(1, duplicateRates.length);
      const baseField = bf || sf!;
      const samplesRaw: any[] = Array.isArray(baseField.sampleValues) ? baseField.sampleValues.slice(0, 5) : [];
      const seen = new Set<string>();
      const samples = (avgDuplicate === 0 ? samplesRaw.filter(v => {
        const key = typeof v === 'string' ? `s:${v}` : JSON.stringify(v);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) : samplesRaw);
      const hasTypeConflict = !!(bf && sf && bf.type !== sf.type);
      const conflictTypes = hasTypeConflict ? [bf!.type, sf!.type] : undefined;
      const presentInCount = (bf ? 1 : 0) + (sf ? 1 : 0);
      return {
        name,
        type: baseField.type,
        missingRate: avgMissing,
        duplicateRate: avgDuplicate,
        isUnique: avgDuplicate === 0,
        sampleValues: samples,
        selected: step2ShowCommonOnly ? presentInCount === 2 : true,
        hasTypeConflict,
        conflictTypes,
        presentInCount
      };
    });

    setStep2AggregatedFields(aggList);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedDatasetIds, selectedDatasetVersions, step2PrimaryDatasetId, step2PrimaryVersionId, step2SecondaryDatasetId, step2SecondaryVersionId, activeDatasetId, activeVersionByDataset, step2ShowCommonOnly, primaryDatasetId, primaryVersionId, cacheBuster]);

  // 从“选择数据集”进入下一步：字段选择
  const proceedToFieldSelection = () => {
    if (!activeDatasetId) {
      // 若未设置预览数据集，但只选择了一个数据集，则自动将其设为预览
      if (selectedDatasetIds.length === 1) {
        setActiveDatasetId(selectedDatasetIds[0]);
      } else {
        toast.warning('请先选择至少一个数据集并切换到要预览的数据集');
        return;
      }
    }
    const dsId = activeDatasetId || selectedDatasetIds[0];
    const vers = selectedDatasetVersions[dsId] || [];
    const verId = activeVersionByDataset[dsId] || vers[0] || getDefaultVersionId(dsId);
    if (!verId) {
      toast.warning('请在当前数据集下选择至少一个版本');
      return;
    }
    // 同步下一步的基础数据源与版本，确保前后步骤数据关联
    setPrimaryDatasetId(dsId);
    setPrimaryVersionId(verId);
    setStep2PrimaryDatasetId(dsId);
    setStep2PrimaryVersionId(verId);
    setCurrentStep(1);
  };

  // 数据集多选切换
  const toggleDatasetSelection = (id: string, checked: boolean) => {
    setSelectedDatasetIds(prev => {
      let next = checked ? Array.from(new Set([...prev, id])) : prev.filter(d => d !== id);
      // 勾选时直接切换预览到当前数据集；取消勾选且当前预览为该数据集时，回退到剩余列表的第一个
      if (checked) {
        setActiveDatasetId(id);
      } else if (!checked && activeDatasetId === id) {
        setActiveDatasetId(next[0]);
      }
      return next;
    });
    // 版本映射维护
    const ds = datasetOptions.find(d => d.id === id);
    setSelectedDatasetVersions(prev => {
      const next = { ...prev };
      if (checked) {
        const defVer = ds?.versions?.find(v => v.isDefault) || ds?.versions?.[0];
        if (defVer) next[id] = [defVer.id];
      } else {
        delete next[id];
      }
      return next;
    });
    if (checked) {
      const defVerId = (ds?.versions?.find(v => v.isDefault) || ds?.versions?.[0])?.id;
      if (defVerId) setActiveVersionByDataset(prev => ({ ...prev, [id]: defVerId }));
    } else {
      setActiveVersionByDataset(prev => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  // 切换某数据集下的某个版本勾选状态
  const toggleVersionSelection = (datasetId: string, versionId: string, checked: boolean) => {
    setSelectedDatasetVersions(prev => {
      const arr = prev[datasetId] || [];
      const nextArr = checked ? Array.from(new Set([...arr, versionId])) : arr.filter(v => v !== versionId);
      const next = { ...prev, [datasetId]: nextArr };
      // 勾选时即将该版本设为当前预览版本；取消时若取消的是当前预览则回退到剩余的第一个
      setActiveVersionByDataset(prevActive => {
        const active = prevActive[datasetId];
        if (checked) return { ...prevActive, [datasetId]: versionId };
        if (!checked && active === versionId) return { ...prevActive, [datasetId]: nextArr[0] };
        return prevActive;
      });
      return next;
    });
  };

  const selectAllDatasets = () => {
    const all = datasetOptions.map(ds => ds.id);
    setSelectedDatasetIds(all);
    setActiveDatasetId(all[0]);
  };

  const clearSelectedDatasets = () => {
    setSelectedDatasetIds([]);
    setActiveDatasetId(undefined);
  };

  // 字段选择处理
  const handleFieldSelection = (fieldName: string, selected: boolean) => {
    setFields(prev => prev.map(field => 
      field.name === fieldName ? { ...field, selected } : field
    ));
  };

  // 字段名修改（在表格中可编辑）
  const handleFieldNameChange = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    setFields(prev => {
      // 校验空值
      if (!trimmed) {
        toast.error('字段名不能为空');
        return prev;
      }
      // 校验重复（允许保持原名）
      const exists = prev.some(f => f.name === trimmed && trimmed !== oldName);
      if (exists) {
        toast.error('字段名重复，请使用唯一名称');
        return prev;
      }
      const next = prev.map(f => (f.name === oldName ? { ...f, name: trimmed } : f));
      // 同步更新清洗规则里引用的字段名
      setCleaningRules(rules => rules.map(r => (r.field === oldName ? { ...r, field: trimmed } : r)));
      return next;
    });
  };

  // 字段类型修改（下拉选择）
  const handleFieldTypeChange = (fieldName: string, newType: FieldInfo['type']) => {
    setFields(prev => prev.map(f => (f.name === fieldName ? { ...f, type: newType } : f)));
  };

  // 添加清洗规则
  const addCleaningRule = () => {
    // 当前视图下的可选字段（Step2 聚合 or Step1 单源）
    const viewFieldNames = getCurrentViewSelectedFieldNames();
    // 若当前视图为空（例如 Step2 公共字段为空），尝试回退到 Step1 的已选字段
    const fallbackField = fields.filter(f => f.selected)[0]?.name;
    const firstField = viewFieldNames[0] || fallbackField || '';
    if (!firstField) {
      toast.warning('当前视图下暂无可选字段，请切换视图或选择字段后再添加规则');
      return;
    }
    const newRule: CleaningRule = {
      id: 'rule-' + Date.now(),
      field: firstField,
      type: 'fill_null',
      config: {},
      enabled: true,
      description: '新的清洗规则'
    };
    setCleaningRules(prev => [...prev, newRule]);
  };

  // 删除清洗规则
  const removeCleaningRule = (ruleId: string) => {
    // 若删除的是推荐策略生成的规则，同时同步取消推荐策略勾选
    setCleaningRules(prev => {
      const rule = prev.find(r => r.id === ruleId);
      if (rule?.source === 'recommended' && rule.refId) {
        setRecommendedStrategies(list => list.map(s => s.id === rule.refId ? { ...s, selected: false } : s));
      }
      return prev.filter(r => r.id !== ruleId);
    });
  };

  // 更新清洗规则（含 encode_categorical 限制与联动）
  const updateCleaningRule = (ruleId: string, updates: Partial<CleaningRule>) => {
    setCleaningRules(prev => prev.map((rule) => {
      if (rule.id !== ruleId) return rule;
      // 预合并，便于判断类型/字段
      const next: CleaningRule = { ...rule, ...updates } as CleaningRule;
      const isEncode = (next.type || rule.type) === 'encode_categorical';

      // 当前视图字段源
      const isMultiSource = selectedSourcesForView.length > 1;
      const sourceFields = isMultiSource ? step2AggregatedFields : fields;
      const nextFieldName = (updates.field ?? next.field);
      const fieldInfo: any = sourceFields.find((f: any) => f.name === nextFieldName);
      const fieldType = fieldInfo?.type as FieldInfo['type'] | undefined;

      // 若字段变更且为字符编码，重置方法选择
      if (updates.field && isEncode) {
        next.config = { ...(next.config || {}), method: '' };
      }

      // 数值型字段禁止字符编码（阻止更新）
      if (isEncode && fieldType === 'number') {
        toast.error('数值型字段不支持字符编码，请选择文本/分类字段');
        return rule; // 保持原值，不应用更新
      }

      return next;
    }));
  };

  // 预览处理结果
  // 显示确认弹窗
  const showConfirm = (action: 'apply') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  // 规则级确认：打开
  const openRuleConfirm = (payload: { ruleId: string; nextUpdates: Partial<CleaningRule>; message: string }) => {
    setRuleConfirmPayload(payload);
    setShowRuleConfirmDialog(true);
  };

  // 后台执行版本：不依赖组件状态（用于确认后立即关闭弹窗）
  const startApplyDetached = async () => {
    toast.info('已开始执行数据处理任务（后台执行）');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('数据预处理已完成');
    } catch (error) {
      toast.error('应用预处理失败');
    }
  };

  // 确认执行操作（全局）
  const handleConfirm = () => {
    setShowConfirmDialog(false);
    setShowRuleConfirmDialog(false);
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'apply') {
      // 关闭所有弹窗并后台执行任务
      onClose();
      startApplyDetached();
    }
  };

  // 规则级确认（确定/取消）
  const handleRuleConfirm = (confirm: boolean) => {
    if (confirm && ruleConfirmPayload) {
      updateCleaningRule(ruleConfirmPayload.ruleId, ruleConfirmPayload.nextUpdates);
    }
    setShowRuleConfirmDialog(false);
    setRuleConfirmPayload(null);
  };



  // 应用处理
  const handleApply = () => {
    // 基本校验：确保必填配置已完成
    const enabledRules = cleaningRules.filter(r => r.enabled);

    // 缺失值填充：必须选择填充方式；若为自定义需填写值
    const missingFillMethod = enabledRules.some(r => r.type === 'fill_null' && (!r.config?.method || (r.config.method === 'custom' && (r.config.customValue === '' || r.config.customValue === undefined))));
    if (missingFillMethod) {
      toast.error('缺失值填充：请先选择填充方式（若为自定义需填写值）');
      return;
    }

    // 日期格式化：必须选择当前格式与非法日期处理策略
    const missingFormat = enabledRules.some(r => r.type === 'format_date' && (!r.config?.format));
    if (missingFormat) {
      toast.error('日期格式化：请先选择或输入当前格式');
      return;
    }
    const missingInvalidHandling = enabledRules.some(r => r.type === 'format_date' && (!r.config?.invalidHandling || !['drop','set_null'].includes(r.config.invalidHandling)));
    if (missingInvalidHandling) {
      toast.error('日期格式化：请为非法日期选择处理策略（删除该行或设为空）');
      return;
    }

    // 时间序列重采样：自定义间隔需为正整数，单位在支持列表
    const resampleInvalid = enabledRules.some(r => r.type === 'resample' && ((r.config?.mode === 'custom') && (!(r.config?.interval > 0) || !Number.isInteger(r.config?.interval) || !['days','hours','minutes','seconds'].includes(r.config?.unit))));
    if (resampleInvalid) {
      toast.error('时间序列重采样：请检查自定义间隔和单位（正整数，单位为日/小时/分钟/秒）');
      return;
    }

    // 数据转换：需至少选择一个数值字段且选择方法
    const numericInvalid = enabledRules.some(r => r.type === 'numeric_transform' && ((!Array.isArray(r.config?.fields) || r.config.fields.length === 0) || !r.config?.method));
    if (numericInvalid) {
      toast.error('数据转换：请至少选择一个数值字段并选择转换方法');
      return;
    }

    // 数据转换：字段类型必须为数值型
    const numericTypeInvalid = enabledRules.some(r => r.type === 'numeric_transform' && (() => {
      const isMulti = selectedSourcesForView.length > 1;
      const srcFields = isMulti ? step2AggregatedFields : fields;
      const selected = Array.isArray(r.config?.fields) ? r.config.fields : [];
      return selected.some((fname: string) => {
        const fi: any = srcFields.find((f: any) => f.name === fname);
        return fi?.type !== 'number';
      });
    })());
    if (numericTypeInvalid) {
      toast.error('数据转换：所选字段必须为数值型');
      return;
    }

    // 数据转换：方法参数校验
    let numericParamError: string | null = null;
    enabledRules.forEach(r => {
      if (numericParamError || r.type !== 'numeric_transform') return;
      const method = r.config?.method;
      const p = r.config?.params || {};
      if (method === 'minmax') {
        const mi = Number(p.min);
        const ma = Number(p.max);
        if (!Number.isFinite(mi) || !Number.isFinite(ma) || mi >= ma) {
          numericParamError = '数据转换[Min-Max]：目标区间最小值应小于最大值，且均为数值';
        }
      } else if (method === 'zscore') {
        if (!['sample','population'].includes(p.stdType)) {
          numericParamError = '数据转换[Z-score]：标准差类型必须为“样本(n-1)”或“总体(n)”';
        }
      } else if (method === 'robust') {
        const q1 = Number(p.q1);
        const q3 = Number(p.q3);
        if (!Number.isFinite(q1) || !Number.isFinite(q3) || q1 <= 0 || q3 >= 100 || q1 >= q3) {
          numericParamError = '数据转换[Robust]：Q1/Q3需为0-100之间的数值且Q1<Q3';
        }
      } else if (method === 'decimal_scaling') {
        const auto = !!p.auto;
        if (!auto) {
          const digits = Number(p.digits);
          if (!Number.isInteger(digits) || digits < 0) {
            numericParamError = '数据转换[小数缩放]：移动位数需为非负整数';
          }
        }
      } else if (method === 'unit_vector') {
        if (!['row','column'].includes(p.axis)) {
          numericParamError = '数据转换[单位向量]：归一化维度需为按样本(行)或按特征(列)';
        }
      }
    });
    if (numericParamError) {
      toast.error(numericParamError);
      return;
    }

    // 数据转换：单位向量归一化（行）建议选择多个字段（非阻塞提示）
    const uvRowWarn = enabledRules.some(r => r.type === 'numeric_transform' && r.config?.method === 'unit_vector' && ((r.config?.params?.axis || 'row') === 'row') && ((Array.isArray(r.config?.fields) ? r.config.fields.length : 0) < 2));
    if (uvRowWarn) {
      toast.warning('数据转换[单位向量]：按样本（行）归一化建议选择多个字段');
    }

    // 字符编码：需选择编码方法
    const encInvalid = enabledRules.some(r => r.type === 'encode_categorical' && (!r.config?.method));
    if (encInvalid) {
      toast.error('字符编码：请先选择编码方法');
      return;
    }

    // 字符编码：禁止数值型字段
    const encNumInvalid = enabledRules.some(r => {
      if (r.type !== 'encode_categorical') return false;
      const isMulti = selectedSourcesForView.length > 1;
      const srcFields = isMulti ? step2AggregatedFields : fields;
      const fi: any = srcFields.find((f: any) => f.name === r.field);
      return fi?.type === 'number';
    });
    if (encNumInvalid) {
      toast.error('字符编码：数值型字段不支持字符编码，请选择文本/分类字段');
      return;
    }

    // 字符编码：One-Hot 上限校验
    const encOneHotLimitInvalid = enabledRules.some(r => {
      if (r.type !== 'encode_categorical') return false;
      if (r.config?.method !== 'one-hot') return false;
      const cnt = getUniqueValueCount(r.field);
      return typeof cnt === 'number' && cnt > oneHotMaxCols;
    });
    if (encOneHotLimitInvalid) {
      toast.error(`字符编码：One-Hot 的类别数超过上限（${oneHotMaxCols}），请改用标签编码或减少类别`);
      return;
    }

    // 字符编码：类别数较大（>100）给出警告但不阻塞
    const encHighCardinality = enabledRules.some(r => r.type === 'encode_categorical' && r.config?.method === 'one-hot' && ((getUniqueValueCount(r.field) ?? 0) > 100));
    if (encHighCardinality) {
      toast.warning('字符编码：类别数较多（>100），One-Hot 可能引入大量列');
    }

    // 去重：若不使用所有列，需至少选择一个字段
    const dedupInvalid = enabledRules.some(r => r.type === 'deduplicate' && (!r.config?.useAllFields && (!Array.isArray(r.config?.keyFields) || r.config.keyFields.length === 0)));
    if (dedupInvalid) {
      toast.error('去重：请至少选择一个字段作为重复判定键或选择使用所有列');
      return;
    }

    // 范围值拆分：至少填写分隔符或正则
    const splitFormatMissing = enabledRules.some(r => r.type === 'split_range' && (!r.config?.delimiter && !r.config?.regex));
    if (splitFormatMissing) {
      toast.error('范围值拆分：请填写分隔符或正则模式（至少一项）');
      return;
    }

    // 范围值拆分：字段类型建议为字符串（非阻塞提示）
    const splitNotStringWarn = enabledRules.some(r => {
      if (r.type !== 'split_range') return false;
      const isMulti = selectedSourcesForView.length > 1;
      const srcFields = isMulti ? step2AggregatedFields : fields;
      const fi: any = srcFields.find((f: any) => f.name === r.field);
      return fi && fi.type !== 'string';
    });
    if (splitNotStringWarn) {
      toast.warning('范围值拆分：所选字段类型为非字符串，可能影响解析，请确认');
    }

    // 范围值拆分：样例匹配率校验（若全部不匹配则阻塞，匹配率低则警告）
    let splitAllZero = false;
    let splitLowRate = false;
    enabledRules.forEach(r => {
      if (r.type !== 'split_range') return;
      const metric = computeRangeMatchRate(r.field, r.config?.delimiter, r.config?.regex);
      if (metric.total === 0) return; // 无样例值时不做强制校验
      const rate = metric.matchedCount / metric.total;
      if (metric.matchedCount === 0) splitAllZero = true;
      else if (rate < 0.5) splitLowRate = true;
    });
    if (splitAllZero) {
      toast.error('范围值拆分：样例数据与指定格式完全不匹配，无法拆分，请调整分隔符或正则');
      return;
    }
    if (splitLowRate) {
      toast.warning('范围值拆分：样例匹配率较低（<50%），执行时将无法解析的值置为空并记录');
    }

    // 数值单位标准化：必填校验
    const normMissing = enabledRules.some(r => r.type === 'normalize_unit' && (!r.config?.sourceUnit || !r.config?.targetUnit));
    if (normMissing) {
      toast.error('数值单位标准化：请填写原始单位与目标单位');
      return;
    }

    // 数值单位标准化：单位合法性
    const normIllegal = enabledRules.some(r => r.type === 'normalize_unit' && (!!r.config?.sourceUnit && !!r.config?.targetUnit) && (!isValidUnitSymbol(r.config.sourceUnit) || !isValidUnitSymbol(r.config.targetUnit)));
    if (normIllegal) {
      toast.error('数值单位标准化：单位符号不合法（支持 mm/cm/m/km/in/ft 与 mg/g/kg/lb），或请使用自定义换算表');
      return;
    }

    // 数值单位标准化：量纲一致性
    const normDimMismatch = enabledRules.some(r => r.type === 'normalize_unit' && (!!r.config?.sourceUnit && !!r.config?.targetUnit) && (!areConvertibleUnits(r.config.sourceUnit, r.config.targetUnit)));
    if (normDimMismatch) {
      toast.error('数值单位标准化：原始单位与目标单位量纲不一致，无法转换');
      return;
    }

    // 数值单位标准化：自定义换算表合法性（如提供）
    const normCustomInvalid = enabledRules.some(r => r.type === 'normalize_unit' && (typeof r.config?.customMappingText === 'string' && r.config.customMappingText.trim().length > 0) && !validateCustomMappingText(r.config.customMappingText).ok);
    if (normCustomInvalid) {
      toast.error('数值单位标准化：自定义换算表 JSON 不合法，请点击“校验配置”修复');
      return;
    }

    // 数值单位标准化：字段类型为数值时的非阻塞提示
    const normNumFieldWarn = enabledRules.some(r => {
      if (r.type !== 'normalize_unit') return false;
      const isMulti = selectedSourcesForView.length > 1;
      const srcFields = isMulti ? step2AggregatedFields : fields;
      const fi: any = srcFields.find((f: any) => f.name === r.field);
      return fi?.type === 'number';
    });
    if (normNumFieldWarn) {
      toast.warning('数值单位标准化：当前字段为数值型，通常不需要单位标准化；若数据中包含单位符号，请确认。');
    }

    // 所有校验通过，进入确认
    showConfirm('apply');
  };

  const executeApply = async () => {
    setIsProcessing(true);
    try {
      // 模拟应用过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('数据预处理已完成');
      
      onClose();
    } catch (error) {
      toast.error('应用预处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    const config = {
      fields: fields.filter(f => f.selected).map(f => f.name),
      rules: cleaningRules.filter(r => r.enabled),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preprocessing_config_${activeDatasetId || 'multi'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('配置已导出');
  };

  // 导入配置
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        // 更新字段选择
        setFields(prev => prev.map(field => ({
          ...field,
          selected: config.fields?.includes(field.name) || false
        })));
        
        // 更新清洗规则（生成完整结构，来源默认为 custom；若与推荐策略匹配则标记为 recommended 并自动勾选推荐项）
        if (config.rules) {
          const imported: CleaningRule[] = (config.rules as Array<any>).map((r: any, idx: number) => ({
            id: `rule-import-${Date.now()}-${idx}`,
            field: r.field,
            type: r.type,
            config: r.config ?? {},
            enabled: true,
            description: r.description ?? `${r.type} - ${r.field}`,
            source: 'custom'
          }));

          // 与推荐策略互操作：匹配并同步选择状态
          setRecommendedStrategies(prev => {
            let next = [...prev];
            imported.forEach(rule => {
              const matched = next.find(s => s.rule.field === rule.field && s.rule.type === rule.type);
              if (matched) {
                // 勾选推荐策略，并将规则标记来源信息
                matched.selected = true;
                rule.source = 'recommended';
                rule.refId = matched.id;
              }
            });
            return next;
          });

          setCleaningRules(imported);
        }
        
        toast.success('配置已导入');
      } catch (error) {
        toast.error('配置文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  // 将当前界面配置同步到 JSON 文本
  const syncUIToJson = () => {
    try {
      const config = {
        // 根据当前视图（Step2 多源/多版本聚合或 Step1 单源）导出已选字段
        fields: getCurrentViewSelectedFieldNames(),
        rules: cleaningRules.filter(r => r.enabled).map(r => ({
          field: r.field,
          type: r.type,
          config: r.config,
          description: r.description
        }))
      };
      setJsonConfig(JSON.stringify(config, null, 2));
      toast.success('已同步界面配置到 JSON');
    } catch (err) {
      toast.error('同步失败');
    }
  };

  // 应用 JSON 到界面（无需文件导入，直接使用下方文本框内容）
  const applyJsonToUI = () => {
    try {
      const config = JSON.parse(jsonConfig);
      // 字段
      setFields(prev => prev.map(field => ({
        ...field,
        selected: config.fields?.includes(field.name) || false
      })));
      // 规则（与导入逻辑一致）
      if (config.rules) {
        const imported: CleaningRule[] = (config.rules as Array<any>).map((r: any, idx: number) => ({
          id: `rule-json-${Date.now()}-${idx}`,
          field: r.field,
          type: r.type,
          config: r.config ?? {},
          enabled: true,
          description: r.description ?? `${r.type} - ${r.field}`,
          source: 'custom'
        }));

        setRecommendedStrategies(prev => {
          let next = [...prev];
          imported.forEach(rule => {
            const matched = next.find(s => s.rule.field === rule.field && s.rule.type === rule.type);
            if (matched) {
              matched.selected = true;
              rule.source = 'recommended';
              rule.refId = matched.id;
            }
          });
          return next;
        });

        setCleaningRules(imported);
      }
      toast.success('已应用 JSON 到界面配置');
    } catch (error) {
      toast.error('JSON 内容解析失败');
    }
  };

  // 勾选/取消勾选推荐策略 -> 同步到清洗规则区域
  const toggleRecommendedStrategy = (id: string, selected: boolean) => {
    setRecommendedStrategies(prev => {
      const strategy = prev.find(s => s.id === id);
      const next = prev.map(s => s.id === id ? { ...s, selected } : s);
      if (strategy) {
        if (selected) {
          setCleaningRules(prevRules => {
            // 若已存在，直接启用
            const exist = prevRules.find(r => r.refId === id);
            if (exist) {
              return prevRules.map(r => r.refId === id ? { ...r, enabled: true } : r);
            }
            const newRule: CleaningRule = {
              id: `rule-${Date.now()}`,
              field: strategy.rule.field,
              type: strategy.rule.type,
              config: strategy.rule.config,
              description: strategy.rule.description,
              enabled: true,
              source: 'recommended',
              refId: strategy.id
            };
            return [...prevRules, newRule];
          });
        } else {
          setCleaningRules(prevRules => prevRules.filter(r => r.refId !== id));
        }
      }
      return next;
    });
  };

  // 影响等级样式
  const impactLevelClass = (level: '高' | '中' | '低') => {
    switch (level) {
      case '高':
        return 'bg-red-100 text-red-700';
      case '中':
        return 'bg-yellow-100 text-yellow-700';
      case '低':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 获取规则类型的显示名称
  const getRuleTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      'fill_null': '缺失值填充',
      'normalize_unit': '数值单位标准化',
      'split_range': '范围值拆分',
      'format_date': '日期格式化',
      'resample': '时间序列重采样',
      'numeric_transform': '数据转换'
    };
    return typeNames[type] || type;
  };

  // 获取字段类型的颜色
  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'string': 'bg-blue-100 text-blue-800',
      'number': 'bg-green-100 text-green-800',
      'boolean': 'bg-purple-100 text-purple-800',
      'date': 'bg-orange-100 text-orange-800',
      'object': 'bg-gray-100 text-gray-800',
      'array': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // 单字段样本估算重复率（仅前端 mock，用于展示“重复率”列）
  const estimateDuplicateRate = (samples: any[]) => {
    const nonNull = (samples || []).filter(v => v !== null && v !== undefined && v !== '');
    const setSize = new Set(nonNull.map(v => JSON.stringify(v))).size;
    const dupCount = Math.max(0, nonNull.length - setSize);
    return dupCount / Math.max(1, nonNull.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[1800px] max-w-[1800px] w-[98vw] sm:w-[1800px] min-w-[800px] max-h-[90vh] overflow-y-auto overflow-x-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>数据预处理</span>
          </DialogTitle>
          <DialogDescription>
            数据清洗与预处理，支持规则配置与智能优化
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg">加载数据集信息...</span>
          </div>
        ) : currentMode === 'auto' ? (
          <SoloDataCleaning
            isOpen={true}
            onClose={() => {}}
            datasetId={activeDatasetId}
          />
        ) : (
          <div className="space-y-6">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center space-x-4">
              {[
                { step: 0, title: '选择数据集', icon: Database },
                { step: 1, title: '字段选择', icon: Layers },
                { step: 2, title: '规则配置', icon: Settings }
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {title}
                  </span>
                  {step < 2 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {currentMode === 'traditional' ? (
              <Tabs value={currentStep.toString()} onValueChange={(value: string) => setCurrentStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="0">选择数据集</TabsTrigger>
                  <TabsTrigger value="1">字段选择</TabsTrigger>
                  <TabsTrigger value="2">规则配置</TabsTrigger>
                </TabsList>

                {/* 选择数据集（Step 0） - 上下布局 + 多选 + 标签切换预览 */}
                <TabsContent value="0" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Database className="h-5 w-5" />
                          <span>选择目标数据集</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          已选 {selectedDatasetIds.length} 个{activeDatasetId ? ` · 当前预览：${datasetOptions.find(d => d.id === activeDatasetId)?.name || activeDatasetId}` : ''}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 顶部：数据集多选列表（支持模糊搜索 + 大量数据滚动显示） */}
                      <div className="rounded-md border bg-muted/40 p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">数据集列表（支持多选）</Label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-56 sm:w-72">
                              <Search className="pointer-events-none h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                aria-label="搜索数据集名称（支持模糊）"
                                value={datasetSearch}
                                onChange={(e) => setDatasetSearch(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && filteredDatasets.length > 0) {
                                    const top = filteredDatasets[0];
                                    const included = selectedDatasetIds.includes(top.id);
                                    toggleDatasetSelection(top.id, !included);
                                    setActiveDatasetId(top.id);
                                  }
                                }}
                                placeholder="搜索数据集名称（支持模糊）"
                                className="pl-8"
                              />
                            </div>
                            <Button size="sm" variant="outline" onClick={() => {
                              // 全选当前筛选结果（与已选合并去重）
                              const ids = filteredDatasets.map(ds => ds.id);
                              setSelectedDatasetIds(prev => {
                                const all = Array.from(new Set([...prev, ...ids]));
                                if (!activeDatasetId && all.length > 0) setActiveDatasetId(all[0]);
                                return all;
                              });
                            }}>全选当前结果</Button>
                            <Button size="sm" variant="ghost" onClick={clearSelectedDatasets}>清空</Button>
                          </div>
                        </div>
                        <div className="mt-2 max-h-64 overflow-auto divide-y rounded-sm border bg-background/60">
                          {filteredDatasets.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-gray-500">未匹配到数据集</div>
                          ) : (
                            filteredDatasets.map(ds => (
                              <div key={ds.id} className="flex items-center justify-between px-2 py-2 hover:bg-muted/50 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedDatasetIds.includes(ds.id)}
                                    onCheckedChange={(checked: boolean) => toggleDatasetSelection(ds.id, !!checked)}
                                  />
                                  <div className="text-sm font-medium">{ds.name}</div>
                                  {/* 版本多选：仅在该数据集被勾选时显示 */}
                                  {selectedDatasetIds.includes(ds.id) && (ds.versions?.length ? (
                                    <div className="ml-2 flex flex-col gap-1 text-xs">
                                      <div className="text-gray-500">版本：</div>
                                      <div className="flex flex-col gap-1">
                                        {ds.versions.map(v => {
                                          const checked = (selectedDatasetVersions[ds.id] || []).includes(v.id);
                                          return (
                                            <label key={v.id} className="flex items-center gap-2">
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(c: boolean) => toggleVersionSelection(ds.id, v.id, !!c)}
                                              />
                                              <span>{v.label}</span>
                                              <span className="text-gray-400">{v.rows} · {v.columns} 字段 · {v.size}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(() => {
                                    const sel = selectedDatasetVersions[ds.id] || [];
                                    const activeVerId = activeVersionByDataset[ds.id] || sel[0];
                                    const ver = ds.versions?.find(v => v.id === activeVerId) || ds.versions?.find(v => v.isDefault) || ds.versions?.[0];
                                    const rows = ver?.rows || ds.rows;
                                    const cols = ver?.columns || ds.columns;
                                    const size = ver?.size || ds.size;
                                    const suffix = sel.length > 1 ? ` · 已选 ${sel.length} 个版本` : '';
                                    return `${rows} · ${cols} 字段 · ${size}${suffix}`;
                                  })()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 标签栏：已选数据集，可点击切换预览 */}
                      {selectedDatasetIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedDatasetIds.map(id => {
                            const ds = datasetOptions.find(d => d.id === id);
                            const active = activeDatasetId === id;
                            const selVers = selectedDatasetVersions[id] || [];
                            const activeVerId = activeVersionByDataset[id] || selVers[0];
                            const ver = ds?.versions?.find(v => v.id === activeVerId) || ds?.versions?.find(v => v.isDefault) || ds?.versions?.[0];
                            const suffix = selVers.length > 1 ? ` · 预览：${ver?.label || ''} · 已选 ${selVers.length} 版本` : (ver ? ` · ${ver.label}` : '');
                            return (
                              <Badge
                                key={id}
                                variant={active ? 'default' : 'outline'}
                                className={`cursor-pointer flex items-center gap-1 ${active ? 'bg-blue-600 text-white' : ''}`}
                                onClick={() => setActiveDatasetId(id)}
                              >
                                {ds?.name || id}
                                {suffix}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* 底部：当前预览数据集信息 */}
                      <div>
                        {selectedDataset ? (
                          <div className="rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{selectedDataset.name}</div>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {(() => {
                                const selVers = selectedDatasetVersions[activeDatasetId!] || [];
                                const activeVerId = activeVersionByDataset[activeDatasetId!] || selVers[0];
                                const ver = selectedDataset.versions?.find(v => v.id === activeVerId) || selectedDataset.versions?.find(v => v.isDefault) || selectedDataset.versions?.[0];
                                const rows = ver?.rows || selectedDataset.rows;
                                const cols = ver?.columns || selectedDataset.columns;
                                const size = ver?.size || selectedDataset.size;
                                const suffix = selVers.length > 1 ? ` · 已选 ${selVers.length} 版本` : '';
                                return `${rows} 条记录 · ${(datasetFieldSchemas[activeDatasetId!]?.length ?? Number(cols))} 个字段 · ${size}${ver ? ` · 预览版本：${ver.label}` : ''}${suffix}`;
                              })()}
                            </div>
                            {selectedDataset.versions?.length ? (
                              <div className="mt-2 text-xs text-gray-600">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1">
                                    <div className="mb-1">选择版本：</div>
                                    <div className="flex flex-col gap-1">
                                      {selectedDataset.versions.map(v => {
                                        const checked = (selectedDatasetVersions[activeDatasetId!] || []).includes(v.id);
                                        return (
                                          <label key={v.id} className="flex items-center gap-2">
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(c: boolean) => toggleVersionSelection(activeDatasetId!, v.id, !!c)}
                                            />
                                            <span>{v.label}</span>
                                            <span className="text-gray-400">{v.rows} · {v.columns} 字段 · {v.size}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>预览版本：</span>
                                    {(() => {
                                      const options = (selectedDatasetVersions[activeDatasetId!] || []);
                                      const curr = activeVersionByDataset[activeDatasetId!] || options[0];
                                      return (
                                        <Select value={curr} onValueChange={(v: string) => setActiveVersionByDataset(prev => ({ ...prev, [activeDatasetId!]: v }))}>
                                          <SelectTrigger className="h-8 w-44">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {options.length > 0 ? options.map(vid => {
                                              const vv = selectedDataset.versions?.find(x => x.id === vid);
                                              return <SelectItem key={vid} value={vid}>{vv?.label || vid}</SelectItem>;
                                            }) : (
                                              selectedDataset.versions?.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                                              ))
                                            )}
                                          </SelectContent>
                                        </Select>
                                      );
                                    })()}
                                  </div>
                                </div>
                                {(() => {
                                  const selVers = selectedDatasetVersions[activeDatasetId!] || [];
                                  const activeVerId = activeVersionByDataset[activeDatasetId!] || selVers[0];
                                  const ver = selectedDataset.versions?.find(v => v.id === activeVerId);
                                  if (!ver) return null;
                                  return (
                                    <div className="mt-2 text-[11px] text-gray-500">
                                      {ver.createdAt ? `创建时间：${ver.createdAt}；` : ''}
                                      {ver.note ? `说明：${ver.note}` : ''}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : null}
                            <div className="mt-3">
                              <div className="text-xs font-medium mb-2">数据表预览（原始结构与数据）</div>
                              <div className="rounded-sm border bg-background/60 overflow-x-auto">
                                <div className="min-w-[1200px]">
                                  <Table>
                                    <TableHeader className="sticky top-0 bg-muted z-10">
                                      <TableRow>
                                        {(previewSchema || []).map((col, idx) => (
                                          <TableHead key={idx} className="whitespace-nowrap text-xs">{col.name}</TableHead>
                                        ))}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {pagedPreviewRows.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={Math.max(1, previewSchema.length)} className="text-center text-xs text-gray-500">暂无预览数据</TableCell>
                                        </TableRow>
                                      ) : (
                                        pagedPreviewRows.map((row, rIdx) => (
                                          <TableRow key={rIdx}>
                                            {previewSchema.map((col, cIdx) => (
                                              <TableCell key={cIdx} className="whitespace-nowrap text-xs">{formatCellValue(row[col.name])}</TableCell>
                                            ))}
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span>每页</span>
                                  <Select value={String(rowsPerPage)} onValueChange={(v: string) => { setRowsPerPage(Number(v)); setPreviewPage(1); }}>
                                    <SelectTrigger className="h-7 w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="10">10</SelectItem>
                                      <SelectItem value="20">20</SelectItem>
                                      <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <span>共 {rawPreviewRows.length} 条</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => setPreviewPage(Math.max(1, previewPage - 1))} disabled={previewPage === 1}>‹</Button>
                                  {/* 动态页码，最多显示 5 个，带省略号 */}
                                  {(() => {
                                    const pages: number[] = [];
                                    const start = Math.max(1, previewPage - 2);
                                    const end = Math.min(totalPreviewPages, start + 4);
                                    for (let p = start; p <= end; p++) pages.push(p);
                                    return (
                                      <div className="flex items-center gap-1">
                                        {start > 1 && (
                                          <>
                                            <Button size="sm" variant={previewPage === 1 ? 'default' : 'ghost'} onClick={() => setPreviewPage(1)}>1</Button>
                                            <span className="px-1">…</span>
                                          </>
                                        )}
                                        {pages.map(p => (
                                          <Button key={p} size="sm" variant={previewPage === p ? 'default' : 'ghost'} onClick={() => setPreviewPage(p)}>{p}</Button>
                                        ))}
                                        {end < totalPreviewPages && (
                                          <>
                                            <span className="px-1">…</span>
                                            <Button size="sm" variant={previewPage === totalPreviewPages ? 'default' : 'ghost'} onClick={() => setPreviewPage(totalPreviewPages)}>{totalPreviewPages}</Button>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <Button size="sm" variant="ghost" onClick={() => setPreviewPage(Math.min(totalPreviewPages, previewPage + 1))} disabled={previewPage === totalPreviewPages}>›</Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            <p>提示：</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>从任意入口发起预处理，流程保持一致：先选择数据集（可多选），再进行字段与规则配置。</li>
                              <li>点击上方标签可切换预览不同数据集的字段信息。</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button onClick={proceedToFieldSelection} disabled={!activeDatasetId}>
                      下一步：字段选择
                    </Button>
                  </div>
                </TabsContent>

                {/* 字段选择 */}
                <TabsContent value="1" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Layers className="h-5 w-5" />
                        <span>字段信息</span>
                        <Badge variant="secondary">{(selectedDatasetIds.length > 1 ? aggregatedFields.length : fields.length)} 个字段</Badge>
                      </CardTitle>
                      {selectedDatasetIds.length > 1 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 overflow-x-auto">
                          <span className="whitespace-nowrap">已选择多个数据集，以下展示公共字段聚合视图。</span>
                          <div className="flex items-center gap-2">
                            <span>主表：</span>
                            <Select value={primaryDatasetId || activeDatasetId || selectedDatasetIds[0]} onValueChange={(v: string) => setPrimaryDatasetId(v)}>
                              <SelectTrigger className="h-8 min-w-[9rem] sm:w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDatasetIds.map(id => (
                                  <SelectItem key={id} value={id}>{datasetOptions.find(d => d.id === id)?.name || id}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* 主表版本选择（联动主表数据集） */}
                            <span>版本：</span>
                            {(() => {
                              const baseId = primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
                              const ds = datasetOptions.find(d => d.id === baseId);
                              const selectedVers = (baseId ? (selectedDatasetVersions[baseId] || []) : []);
                              const optionIds = selectedVers.length > 0 ? selectedVers : (ds?.versions?.map(v => v.id) || []);
                              const curr = primaryVersionId || activeVersionByDataset[baseId!] || optionIds[0];
                              return (
                                <Select value={curr} onValueChange={(v: string) => setPrimaryVersionId(v)}>
                                  <SelectTrigger className="h-8 min-w-[8rem] sm:w-44">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {optionIds.map(vid => {
                                      const vobj = ds?.versions?.find(v => v.id === vid);
                                      return <SelectItem key={vid} value={vid}>{vobj?.label || vid}</SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto order-last sm:order-none">
                            <span>显示：</span>
                            <Button size="sm" variant={showCommonOnly ? 'default' : 'outline'} onClick={() => setShowCommonOnly(true)}>仅公共字段</Button>
                            <Button size="sm" variant={!showCommonOnly ? 'default' : 'outline'} onClick={() => setShowCommonOnly(false)}>显示全部字段</Button>
                          </div>
                          <Badge variant="outline" className="shrink-0">{showCommonOnly ? '公共字段' : '全部字段'}</Badge>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {!activeDatasetId && (
                        <div className="text-sm text-orange-600 mb-2">⚠️ 未选择数据集，请返回上一步选择数据集。</div>
                      )}
                      {selectedDatasetIds.length > 1 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">选择</TableHead>
                              <TableHead>字段名</TableHead>
                              <TableHead>类型</TableHead>
                              <TableHead>空值率</TableHead>
                              <TableHead>重复率</TableHead>
                              <TableHead>唯一性</TableHead>
                              <TableHead>示例值</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aggregatedFields.map((af) => (
                              <TableRow key={af.name} className="hover:bg-yellow-50/40">
                                <TableCell>
                                  <Checkbox
                                    checked={af.selected}
                                    onCheckedChange={(checked: boolean) => {
                                      setAggregatedFields(prev => prev.map(f => f.name === af.name ? { ...f, selected: !!checked } : f));
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {/* 多数据源模式下暂不支持改名，避免跨表不一致 */}
                                  <Input value={af.name} disabled className="h-8" />
                                  {af.presentInCount !== undefined && af.presentInCount < selectedDatasetIds.length && (
                                    <Badge variant="outline" className="ml-2">非公共</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select value={af.type} disabled>
                                    <SelectTrigger className={`h-8 ${getFieldTypeColor(af.type)}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">string</SelectItem>
                                      <SelectItem value="number">number</SelectItem>
                                      <SelectItem value="boolean">boolean</SelectItem>
                                      <SelectItem value="date">date</SelectItem>
                                      <SelectItem value="object">object</SelectItem>
                                      <SelectItem value="array">array</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {af.hasTypeConflict && (
                                    <div className="mt-1 text-[11px] text-orange-600 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>类型冲突：{(af.conflictTypes || []).join(', ')}</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Progress value={af.missingRate * 100} className="w-16 h-2" />
                                    <span className="text-sm text-gray-600">{(af.missingRate * 100).toFixed(1)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Progress value={af.duplicateRate * 100} className="w-16 h-2" />
                                    <span className="text-sm text-gray-600">{(af.duplicateRate * 100).toFixed(1)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {af.isUnique ? (
                                    <Badge variant="default">唯一</Badge>
                                  ) : (
                                    <Badge variant="secondary">非唯一</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600 max-w-48 truncate">
                                    {(af.sampleValues || []).slice(0, 3).map(v => formatCellValue(v)).join(', ')}
                                    {(af.sampleValues || []).length > 3 && '...'}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">选择</TableHead>
                              <TableHead>字段名</TableHead>
                              <TableHead>类型</TableHead>
                              <TableHead>空值率</TableHead>
                              <TableHead>重复率</TableHead>
                              <TableHead>唯一性</TableHead>
                              <TableHead>示例值</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field) => (
                              <TableRow key={field.name}>
                                <TableCell>
                                  <Checkbox
                                    checked={field.selected}
                                    onCheckedChange={(checked: boolean) => 
                                      handleFieldSelection(field.name, checked as boolean)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <Input
                                    defaultValue={field.name}
                                    onBlur={(e) => handleFieldNameChange(field.name, e.target.value)}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select value={field.type} onValueChange={(v: string) => handleFieldTypeChange(field.name, v as FieldInfo['type'])}>
                                    <SelectTrigger className={`h-8 ${getFieldTypeColor(field.type)}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">string</SelectItem>
                                      <SelectItem value="number">number</SelectItem>
                                      <SelectItem value="boolean">boolean</SelectItem>
                                      <SelectItem value="date">date</SelectItem>
                                      <SelectItem value="object">object</SelectItem>
                                      <SelectItem value="array">array</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Progress 
                                      value={(field.nullCount / field.totalCount) * 100} 
                                      className="w-16 h-2"
                                    />
                                    <span className="text-sm text-gray-600">
                                      {((field.nullCount / field.totalCount) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const rate = field.unique ? 0 : estimateDuplicateRate(field.sampleValues);
                                    return (
                                      <div className="flex items-center space-x-2">
                                        <Progress value={rate * 100} className="w-16 h-2" />
                                        <span className="text-sm text-gray-600">{(rate * 100).toFixed(1)}%</span>
                                      </div>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {field.unique ? (
                                    <Badge variant="default">唯一</Badge>
                                  ) : (
                                    <Badge variant="secondary">非唯一</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600 max-w-48 truncate">
                                    {(() => {
                                      const raw = field.sampleValues || [];
                                      const seen = new Set<string>();
                                      const arr = field.unique ? raw.filter(v => {
                                        const key = typeof v === 'string' ? `s:${v}` : JSON.stringify(v);
                                        if (seen.has(key)) return false;
                                        seen.add(key);
                                        return true;
                                      }) : raw;
                                      const head = arr.slice(0, 3).map(v => formatCellValue(v)).join(', ');
                                      return (
                                        <>
                                          {head}
                                          {arr.length > 3 && '...'}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={fields.filter(f => f.selected).length === 0}
                    >
                      下一步：配置规则
                    </Button>
                  </div>
                </TabsContent>

                {/* 规则配置 */}
                <TabsContent value="2" className="space-y-4">
                  {/* 多源/多版本：主/从表与字段视图切换（规则配置阶段） */}
                  {selectedSourcesForView.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Layers className="h-5 w-5" />
                          <span>字段视图（规则配置）</span>
                          <Badge variant="secondary">{step2AggregatedFields.length} 个字段</Badge>
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 overflow-x-auto">
                          <span className="whitespace-nowrap">已选择多个数据集或多个版本，以下展示公共字段聚合视图。</span>
                          <div className="flex items-center gap-2">
                            <span>主表：</span>
                            <Select value={step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0]} onValueChange={(v: string) => setStep2PrimaryDatasetId(v)}>
                              <SelectTrigger className="h-8 min-w-[9rem] sm:w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDatasetIds.map(id => (
                                  <SelectItem key={id} value={id}>{datasetOptions.find(d => d.id === id)?.name || id}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>版本：</span>
                            {(() => {
                              const baseId = step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
                              const ds = datasetOptions.find(d => d.id === baseId);
                              const selectedVers = (baseId ? (selectedDatasetVersions[baseId] || []) : []);
                              const optionIds = selectedVers.length > 0 ? selectedVers : (ds?.versions?.map(v => v.id) || []);
                              const curr = step2PrimaryVersionId || primaryVersionId || activeVersionByDataset[baseId!] || optionIds[0];
                              return (
                                <Select value={curr} onValueChange={(v: string) => setStep2PrimaryVersionId(v)}>
                                  <SelectTrigger className="h-8 min-w-[8rem] sm:w-44">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {optionIds.map(vid => {
                                      const vobj = ds?.versions?.find(v => v.id === vid);
                                      return <SelectItem key={vid} value={vid}>{vobj?.label || vid}</SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            <span>从表：</span>
                            <Select value={step2SecondaryDatasetId || (selectedDatasetIds.find(id => id !== (step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0])) || (step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0]))} onValueChange={(v: string) => setStep2SecondaryDatasetId(v)}>
                              <SelectTrigger className="h-8 min-w-[9rem] sm:w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDatasetIds.map(id => (
                                  <SelectItem key={id} value={id}>{datasetOptions.find(d => d.id === id)?.name || id}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>版本：</span>
                            {(() => {
                              const baseId = step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
                              const secId = step2SecondaryDatasetId || (selectedDatasetIds.find(id => id !== baseId) || baseId);
                              const ds = datasetOptions.find(d => d.id === secId);
                              const selectedVers = (secId ? (selectedDatasetVersions[secId] || []) : []);
                              let optionIds = selectedVers.length > 0 ? selectedVers : (ds?.versions?.map(v => v.id) || []);
                              const avoidVer = step2PrimaryVersionId || primaryVersionId || activeVersionByDataset[baseId!];
                              if (secId === baseId && avoidVer) {
                                const filtered = optionIds.filter(v => v !== avoidVer);
                                if (filtered.length > 0) optionIds = filtered;
                              }
                              const curr = step2SecondaryVersionId || activeVersionByDataset[secId!] || optionIds[0];
                              return (
                                <Select value={curr} onValueChange={(v: string) => setStep2SecondaryVersionId(v)}>
                                  <SelectTrigger className="h-8 min-w-[8rem] sm:w-44">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {optionIds.map(vid => {
                                      const vobj = ds?.versions?.find(v => v.id === vid);
                                      return <SelectItem key={vid} value={vid}>{vobj?.label || vid}</SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto order-last sm:order-none">
                            <span>显示：</span>
                            <Button size="sm" variant={step2ShowCommonOnly ? 'default' : 'outline'} onClick={() => setStep2ShowCommonOnly(true)}>仅公共字段</Button>
                            <Button size="sm" variant={!step2ShowCommonOnly ? 'default' : 'outline'} onClick={() => setStep2ShowCommonOnly(false)}>显示全部字段</Button>
                          </div>
                          <Badge variant="outline" className="shrink-0">{step2ShowCommonOnly ? '公共字段' : '全部字段'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {step2AggregatedFields.length > 0 ? (
                          <div className="overflow-x-auto">
                            <div className="min-w-[640px] flex sm:flex-wrap flex-nowrap gap-2 whitespace-nowrap">
                              {step2AggregatedFields.map((af) => (
                                <Badge key={af.name} variant={'outline'} className={`shrink-0 ${getFieldTypeColor(af.type)} hover:opacity-80`}>
                                  {af.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full rounded-md border border-amber-200 bg-amber-50 p-3 sm:p-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm sm:text-xs">当前公共字段为空。</span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                <Badge variant="outline">提示</Badge>
                                <span className="whitespace-nowrap">可尝试以下操作：</span>
                              </div>
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setStep2ShowCommonOnly(false)}>显示全部字段</Button>
                                <Button size="sm" variant="outline" onClick={() => setCurrentStep(1)}>返回字段选择</Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  const baseId = step2PrimaryDatasetId || primaryDatasetId || activeDatasetId || selectedDatasetIds[0];
                                  const secId = step2SecondaryDatasetId || (selectedDatasetIds.find(id => id !== baseId) || baseId);
                                  setStep2SecondaryDatasetId(baseId);
                                  setStep2PrimaryDatasetId(secId);
                                }}>交换主/从表</Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 智能推荐清洗策略（左侧） */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wand2 className="h-5 w-5" />
                            <span>智能推荐清洗策略</span>
                            <Badge variant="secondary">基于AI分析</Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 文本指令输入，用于筛选/排序推荐策略 */}
                        <div>
                          <Label className="mb-1 block">策略指令（文本输入）</Label>
                          <Input
                            value={recommendedQuery}
                            onChange={(e) => setRecommendedQuery(e.target.value)}
                            placeholder="请输入自然语言指令，例如：去重、缺失值填充（均值/众数/前向填充）等"
                          />
                          <p className="mt-1 text-xs text-gray-500">输入的自然语言指令可用于筛选或排序推荐策略</p>
                        </div>
                        <div className="space-y-3">
                          {(recommendedStrategies.filter(s => {
                            const q = recommendedQuery.trim().toLowerCase();
                            if (!q) return true;
                            const text = `${s.title} ${s.description} ${s.affectedFields.join(', ')}`.toLowerCase();
                            return text.includes(q);
                          })).map((s) => (
                            <div key={s.id} className="border rounded-md p-4 bg-white">
                              <div className="flex items-start">
                                <Checkbox
                                  checked={!!s.selected}
                                  onCheckedChange={(checked: boolean) => toggleRecommendedStrategy(s.id, !!checked)}
                                  className="mr-3 mt-1"
                                />
                                <div className="flex-1">
                                  {/* 标题与标签 */}
                                  <div className="flex items-center flex-wrap gap-2">
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    <span className="font-medium">{s.title}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${impactLevelClass(s.impactLevel)}`}>{s.impactLevel}影响</span>
                                    <Badge variant="outline">置信度：{Math.round(s.confidence * 100)}%</Badge>
                                  </div>
                                  {/* 指标行 */}
                                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700">
                                    {/* 预计时间已移除 */}
                                    <div>影响行数：{s.affectedRows.toLocaleString()}</div>
                                    <div>影响字段：{s.affectedFields.join(', ')}</div>
                                  </div>
                                  {/* 说明 */}
                                  <p className="mt-2 text-sm text-gray-600">{s.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {recommendedStrategies.length === 0 && (
                            <div className="text-sm text-gray-500">暂无推荐策略</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 清洗规则管理（右侧，统一展示推荐与自定义） */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Settings className="h-5 w-5" />
                            <span>清洗规则</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={addCleaningRule}
                            disabled={(selectedSourcesForView.length > 1
                              ? step2AggregatedFields.filter(f => f.selected).length === 0
                              : fields.filter(f => f.selected).length === 0)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            添加规则
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {cleaningRules.map((rule) => (
                          <Card key={rule.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant={rule.source === 'recommended' ? 'default' : 'secondary'}>
                                  {rule.source === 'recommended' ? '推荐策略' : '自定义'}</Badge>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeCleaningRule(rule.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>字段</Label>
                                  {(() => {
                                    const optionNames = (selectedSourcesForView.length > 1
                                      ? step2AggregatedFields.filter(f => f.selected).map(f => f.name)
                                      : fields.filter(f => f.selected).map(f => f.name)
                                    );
                                    if (optionNames.length === 0) {
                                      return (
                                        <Input disabled placeholder="暂无可选字段（请切换为全部字段或选择字段）" />
                                      );
                                    }
                                    return (
                                      <Select
                                        value={rule.field}
                                        onValueChange={(field: string) => 
                                          updateCleaningRule(rule.id, { field })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {optionNames.map(name => (
                                            <SelectItem key={name} value={name}>{name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    );
                                  })()}
                                </div>
                                
                                <div>
                                  <Label>规则类型</Label>
                                  <Select
                                    value={rule.type}
                                    onValueChange={(type: string) => {
                                      const t = type as CleaningRule['type'];
                                      if (t === 'resample') {
                                        const nextCfg = {
                                          mode: (rule.config?.mode as 'mode' | 'median' | 'custom') || 'median',
                                          interval: typeof rule.config?.interval === 'number' ? rule.config.interval : 1,
                                          unit: (rule.config?.unit as 'days' | 'hours' | 'minutes' | 'seconds') || 'seconds'
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'fill_null') {
                                        const nextCfg = {
                                          method: '',
                                          customValue: ''
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'normalize_unit') {
                                        const nextCfg = {
                                          sourceUnit: '',
                                          targetUnit: '',
                                          customMappingText: ''
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'split_range') {
                                        const nextCfg = {
                                          delimiter: '-',
                                          keepOriginal: false,
                                          regex: ''
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'numeric_transform') {
                                        const nextCfg = {
                                          method: '',
                                          fields: [],
                                          params: {}
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'encode_categorical') {
                                        const nextCfg = {
                                          method: ''
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else if (t === 'deduplicate') {
                                        const nextCfg = {
                                          useAllFields: true,
                                          keyFields: []
                                        };
                                        updateCleaningRule(rule.id, { type: t, config: nextCfg });
                                      } else {
                                        updateCleaningRule(rule.id, { type: t });
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fill_null">缺失值填充</SelectItem>
                                      <SelectItem value="encode_categorical">字符编码</SelectItem>
                                      <SelectItem value="deduplicate">去重</SelectItem>
                                      <SelectItem value="normalize_unit">数值单位标准化</SelectItem>
                                      <SelectItem value="split_range">范围值拆分</SelectItem>
                                      <SelectItem value="format_date">日期格式化</SelectItem>
                                      <SelectItem value="resample">时间序列重采样</SelectItem>
                                      <SelectItem value="numeric_transform">数据转换</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* 规则配置 */}
                              {rule.type === 'fill_null' && (
                                <div className="space-y-3">
                                  <div>
                                    <Label>填充方式</Label>
                                    <Select
                                      value={rule.config?.method || ''}
                                      onValueChange={(method: string) => {
                                        const fieldInfo = fields.find(f => f.name === rule.field);
                                        const missingRate = (fieldInfo as any)?.missingRate ?? (fieldInfo ? fieldInfo.nullCount / Math.max(1, fieldInfo.totalCount) : 0);
                                        if (method) {
                                          openRuleConfirm({
                                            ruleId: rule.id,
                                            nextUpdates: { config: { ...rule.config, method } },
                                            message: '填充可能改变数据分布，请谨慎使用'
                                          });
                                        } else {
                                          updateCleaningRule(rule.id, { config: { ...rule.config, method } });
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="请选择填充方式" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mean">均值填充</SelectItem>
                                        <SelectItem value="median">中位数填充</SelectItem>
                                        <SelectItem value="mode">众数填充</SelectItem>
                                        <SelectItem value="custom">自定义值填充</SelectItem>
                                        <SelectItem value="limix">LimiX模型填充</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {(() => {
                                      const fieldInfo = fields.find(f => f.name === rule.field);
                                      const rate = (fieldInfo as any)?.missingRate ?? (fieldInfo ? fieldInfo.nullCount / Math.max(1, fieldInfo.totalCount) : 0);
                                      if (rate > 0.8) {
                                        return (
                                          <div className="mt-2 flex items-start gap-2 text-yellow-700">
                                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                                            <span>该字段缺失率较高（{(rate*100).toFixed(1)}%），建议删除该列而非填充。</span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  {(rule.config?.method === 'custom') && (
                                    <div>
                                      <Label>自定义填充值</Label>
                                      <Input
                                        type={(() => {
                                          const f = fields.find(x => x.name === rule.field);
                                          return f?.type === 'number' ? 'number' : 'text';
                                        })()}
                                        value={rule.config?.customValue || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                          updateCleaningRule(rule.id, { config: { ...rule.config, customValue: e.target.value } })
                                        }
                                        placeholder="请输入与字段类型一致的值"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {rule.type === 'encode_categorical' && (
                                <div className="space-y-3">
                                  <div>
                                    <Label>编码方式</Label>
                                    <Select
                                      value={rule.config?.method || ''}
                                      onValueChange={(method: string) => {
                                        const uniqueCount = getUniqueValueCount(rule.field) ?? 0;
                                        if (method === 'one-hot' && uniqueCount > 10) {
                                          openRuleConfirm({
                                            ruleId: rule.id,
                                            nextUpdates: { config: { ...rule.config, method } },
                                            message: '类别较多，One-Hot 可能引入大量列，请确认继续'
                                          });
                                        } else {
                                          updateCleaningRule(rule.id, { config: { ...rule.config, method } });
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="请选择编码方式" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="one-hot">One-Hot 编码</SelectItem>
                                        <SelectItem value="label">标签编码</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {(() => {
                                    const isMulti = selectedSourcesForView.length > 1;
                                    const srcFields = isMulti ? step2AggregatedFields : fields;
                                    const fi: any = srcFields.find((f: any) => f.name === rule.field);
                                    const fType = fi?.type;
                                    const uniqueCount = getUniqueValueCount(rule.field);
                                    const method = rule.config?.method;

                                    if (fType === 'number') {
                                      return (
                                        <div className="mt-2 flex items-start gap-2 text-red-700">
                                          <AlertCircle className="w-4 h-4 mt-0.5" />
                                          <span>数值型字段不支持字符编码，请选择文本/分类字段</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-2">
                                        {typeof uniqueCount === 'number' && (
                                          <div className="text-sm text-gray-600">预估类别数：{uniqueCount}</div>
                                        )}
                                        {method === 'one-hot' && (
                                          <>
                                            {typeof uniqueCount === 'number' && uniqueCount > oneHotMaxCols && (
                                              <div className="mt-1 flex items-start gap-2 text-red-700">
                                                <AlertCircle className="w-4 h-4 mt-0.5" />
                                                <span>类别数超过系统上限（{oneHotMaxCols}），请改用标签编码或减少类别</span>
                                              </div>
                                            )}
                                            {typeof uniqueCount === 'number' && uniqueCount > 100 && (
                                              <div className="mt-1 flex items-start gap-2 text-yellow-700">
                                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                                <span>类别较多（&gt;100），One-Hot 可能引入大量列</span>
                                              </div>
                                            )}
                                            {typeof uniqueCount === 'number' && uniqueCount > 10 && uniqueCount <= 100 && (
                                              <div className="mt-1 flex items-start gap-2 text-yellow-700">
                                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                                <span>类别较多（&gt;10），请谨慎使用 One-Hot</span>
                                              </div>
                                            )}
                                            <div className="text-xs text-gray-500">系统 One-Hot 列数上限：{oneHotMaxCols}</div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {rule.type === 'deduplicate' && (() => {
                                const optionNames = (selectedSourcesForView.length > 1
                                  ? step2AggregatedFields.filter(f => f.selected).map(f => f.name)
                                  : fields.filter(f => f.selected).map(f => f.name)
                                );
                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={!!(rule.config?.useAllFields ?? true)}
                                        onCheckedChange={(checked: boolean) =>
                                          updateCleaningRule(rule.id, {
                                            config: { ...rule.config, useAllFields: checked, keyFields: checked ? [] : (rule.config?.keyFields || []) }
                                          })
                                        }
                                      />
                                      <Label>使用所有列进行重复判定（默认）</Label>
                                    </div>

                                    {!((rule.config?.useAllFields ?? true)) && (
                                      <div>
                                        <Label>判定重复的字段集（可多选，悬停字段名可预览重复值）</Label>
                                        <div className="flex flex-wrap gap-2">
                                          {optionNames.map(name => (
                                            <div key={name} className="flex items-center space-x-2">
                                              <Checkbox
                                                checked={Array.isArray(rule.config?.keyFields) && rule.config.keyFields.includes(name)}
                                                onCheckedChange={(checked: boolean) => {
                                                  const prevKeys = Array.isArray(rule.config?.keyFields) ? rule.config.keyFields : [];
                                                  const nextKeys = checked ? Array.from(new Set([...prevKeys, name])) : prevKeys.filter((k: string) => k !== name);
                                                  updateCleaningRule(rule.id, { config: { ...rule.config, keyFields: nextKeys } });
                                                }}
                                              />
                                              <HoverCard>
                                                <HoverCardTrigger asChild>
                                                  <span className="text-sm cursor-help hover:underline decoration-dotted">{name}</span>
                                                </HoverCardTrigger>
                                                <HoverCardContent align="start" className="w-[420px] p-3">
                                                  {(() => {
                                                    const isMulti = selectedSourcesForView.length > 1;
                                                    const srcFields: any[] = isMulti ? step2AggregatedFields : fields;
                                                    const f: any = srcFields.find((ff: any) => ff.name === name);
                                                    const raw: any[] = Array.isArray(f?.sampleValues) ? f.sampleValues : [];
                                                    const nonNull = raw.filter(v => v !== null && v !== undefined && v !== '');
                                                    const counts: Record<string, number> = {};
                                                    nonNull.forEach(v => {
                                                      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
                                                      counts[s] = (counts[s] || 0) + 1;
                                                    });
                                                    const total = nonNull.length;
                                                    const unique = Object.keys(counts).length;
                                                    const sumDup = Object.values(counts).reduce((acc, c) => acc + (c > 1 ? c - 1 : 0), 0);
                                                    const dupRatio = total > 0 ? sumDup / total : 0;
                                                    const top = Object.entries(counts)
                                                      .filter(([_, c]) => c > 1)
                                                      .sort((a, b) => b[1] - a[1])
                                                      .slice(0, 5)
                                                      .map(([v, c]) => ({ value: v, count: c, pct: total > 0 ? c / total : 0 }));
                                                    return (
                                                      <div className="space-y-2">
                                                        <div className="text-sm font-medium">列预览：{name}</div>
                                                        <div className="text-xs text-gray-600">样本量：{total}；唯一值：{unique}；重复占比：{(dupRatio * 100).toFixed(1)}%</div>
                                                        {top.length > 0 ? (
                                                          <div className="space-y-1">
                                                            {top.map((item, idx) => (
                                                              <div key={idx} className="flex items-center gap-2">
                                                                <Popover>
                                                                  <PopoverTrigger asChild>
                                                                    <span className="flex-1 truncate cursor-pointer hover:underline decoration-dotted" title={item.value}>{item.value}</span>
                                                                  </PopoverTrigger>
                                                                  <PopoverContent align="start" className="w-[820px] max-w-[90vw] p-3">
                                                                    {(() => {
                                                                      const allCols: string[] = Array.isArray(previewSchema) && previewSchema.length > 0
                                                                        ? (previewSchema as any[]).map((s: any) => s.name)
                                                                        : (Array.isArray(srcFields) ? (srcFields as any[]).map((f: any) => f.name) : []);
                                                                      const displayCols: string[] = allCols; // 展示所有列，满足“一整行数据”的需求
                                                                      const rows: any[] = Array.isArray(rawPreviewRows)
                                                                        ? (rawPreviewRows as any[]).filter((r: any) => {
                                                                            const v = r?.[name];
                                                                            const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
                                                                            return s === item.value;
                                                                          }).slice(0, 5)
                                                                        : [];
                                                                      return (
                                                                        <div className="space-y-2">
                                                                          <div className="text-sm font-medium">行详情：{name} = {item.value}</div>
                                                                          {rows.length > 0 ? (
                                                                            <div className="border rounded overflow-auto max-h-[420px] max-w-full">
                                                                              <Table>
                                                                                <TableHeader>
                                                                                  <TableRow>
                                                                                    {displayCols.map((col: string) => (
                                                                                      <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>
                                                                                    ))}
                                                                                  </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                  {rows.map((row: any, ridx: number) => (
                                                                                    <TableRow key={ridx}>
                                                                                      {displayCols.map((col: string) => (
                                                                                        <TableCell key={col} className="text-xs whitespace-nowrap">{formatCellValue(row?.[col])}</TableCell>
                                                                                      ))}
                                                                                    </TableRow>
                                                                                  ))}
                                                                                </TableBody>
                                                                              </Table>
                                                                            </div>
                                                                          ) : (
                                                                            <div className="text-xs text-gray-600">当前数据集未提供符合该值的预览行。</div>
                                                                          )}
                                                                          <div className="text-[11px] text-gray-500">提示：行详情基于预览样本展示，最多显示5条；若列过多或内容较长，可在上方容器内滚动查看完整行。</div>
                                                                        </div>
                                                                      );
                                                                    })()}
                                                                  </PopoverContent>
                                                                </Popover>
                                                                <span className="text-xs text-gray-600 w-14 text-right">×{item.count}</span>
                                                                <div className="h-1.5 w-24 bg-gray-200 rounded">
                                                                  <div className="h-1.5 bg-primary rounded" style={{ width: `${Math.max(4, Math.round(item.pct * 100))}%` }} />
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <div className="text-xs text-gray-600">当前样本未发现重复值</div>
                                                        )}
                                                        <div className="text-[11px] text-gray-500">提示：以上统计基于示例值进行估算，仅用于配置参考。</div>
                                                      </div>
                                                    );
                                                  })()}
                                                </HoverCardContent>
                                              </HoverCard>
                                            </div>
                                          ))}
                                        </div>
                                        {(!Array.isArray(rule.config?.keyFields) || rule.config.keyFields.length === 0) && (
                                          <div className="mt-2 flex items-start gap-2 text-red-700">
                                            <AlertCircle className="w-4 h-4 mt-0.5" />
                                            <span>请至少选择一个字段作为重复判定键，或勾选“使用所有列”。</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                      系统会保留首次出现的记录并移除后续重复记录；去重前后记录数变化将记录在日志中。对于“所有判定字段均为空”的记录组，若其他字段不同，将不会视为完全重复。
                                    </div>
                                  </div>
                                );
                              })()}

                              {rule.type === 'normalize_unit' && (() => {
                                const isMulti = selectedSourcesForView.length > 1;
                                const srcFields = isMulti ? step2AggregatedFields : fields;
                                const f = srcFields.find((f: any) => f.name === rule.field) as any;
                                const fType = f?.type === 'number' ? 'number' : 'text';
                                const sourceUnit = (rule.config?.sourceUnit || '').trim();
                                const targetUnit = (rule.config?.targetUnit || '').trim();
                                const hasSource = sourceUnit.length > 0;
                                const hasTarget = targetUnit.length > 0;
                                const validSource = hasSource ? isValidUnitSymbol(sourceUnit) : true;
                                const validTarget = hasTarget ? isValidUnitSymbol(targetUnit) : true;
                                const convertible = hasSource && hasTarget ? areConvertibleUnits(sourceUnit, targetUnit) : true;
                                return (
                                  <div className="space-y-3">
                                    {fType === 'number' && (
                                      <div className="flex items-start gap-2 text-amber-700">
                                        <AlertCircle className="w-4 h-4 mt-0.5" />
                                        <span>当前字段类型为数值型，通常无需单位标准化；若数据中实际包含单位符号，请确认。</span>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <Label>原始单位（必填）</Label>
                                        <Input
                                          value={sourceUnit}
                                          placeholder="例如：kg、cm、in"
                                          onChange={(e) =>
                                            updateCleaningRule(rule.id, {
                                              config: { ...rule.config, sourceUnit: e.target.value }
                                            })
                                          }
                                        />
                                        {!hasSource && (
                                          <div className="mt-1 text-xs text-red-700">请填写原始单位</div>
                                        )}
                                        {hasSource && !validSource && (
                                          <div className="mt-1 text-xs text-red-700">单位符号不合法（支持 mm/cm/m/km/in/ft 与 mg/g/kg/lb）</div>
                                        )}
                                      </div>

                                      <div>
                                        <Label>目标单位（必填）</Label>
                                        <Input
                                          value={targetUnit}
                                          placeholder="例如：g、m、ft"
                                          onChange={(e) =>
                                            updateCleaningRule(rule.id, {
                                              config: { ...rule.config, targetUnit: e.target.value }
                                            })
                                          }
                                        />
                                        {!hasTarget && (
                                          <div className="mt-1 text-xs text-red-700">请填写目标单位</div>
                                        )}
                                        {hasTarget && !validTarget && (
                                          <div className="mt-1 text-xs text-red-700">单位符号不合法（支持 mm/cm/m/km/in/ft 与 mg/g/kg/lb）</div>
                                        )}
                                      </div>
                                    </div>

                                    {hasSource && hasTarget && !convertible && (
                                      <div className="flex items-start gap-2 text-red-700">
                                        <AlertCircle className="w-4 h-4 mt-0.5" />
                                        <span>原始单位与目标单位量纲不一致，无法转换</span>
                                      </div>
                                    )}

                                    <div>
                                      <Label>自定义换算表（JSON，选填）</Label>
                                      <Textarea
                                        value={rule.config?.customMappingText || ''}
                                        placeholder='例如：{"oz": {"to":"g", "factor": 28.3495}}'
                                        rows={4}
                                        onChange={(e) =>
                                          updateCleaningRule(rule.id, {
                                            config: { ...rule.config, customMappingText: e.target.value }
                                          })
                                        }
                                      />
                                      <div className="mt-2">
                                        <Button
                                          variant="secondary"
                                          onClick={() => {
                                            const txt = (rule.config?.customMappingText || '').trim();
                                            if (!txt) {
                                              toast.info('未提供自定义换算表，将使用系统内置换算');
                                              return;
                                            }
                                            const res = validateCustomMappingText(txt);
                                            if (res.ok) {
                                              toast.success('自定义换算表格式校验通过');
                                            } else {
                                              toast.error(`自定义换算表校验失败：${res.error}`);
                                            }
                                          }}
                                        >
                                          校验配置
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                      系统内置常见单位换算：长度（mm、cm、m、km、in、ft）、重量（mg、g、kg、lb）。执行后将识别字符串中的数值与单位，转换到目标单位并移除单位符号，输出为数值型；未识别的单位或格式将跳过并记录警告。
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              {rule.type === 'split_range' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label>分隔符</Label>
                                      <Input
                                        value={rule.config.delimiter || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                          updateCleaningRule(rule.id, {
                                            config: { ...rule.config, delimiter: e.target.value }
                                          })
                                        }
                                        placeholder="例如: '-'、'~'、'～'、'至'"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2 mt-6">
                                      <Checkbox
                                        checked={!!rule.config.keepOriginal}
                                        onCheckedChange={(checked: boolean) => 
                                          updateCleaningRule(rule.id, {
                                            config: { ...rule.config, keepOriginal: checked }
                                          })
                                        }
                                      />
                                      <Label>保留原始字段</Label>
                                    </div>
                                    <div className="col-span-2">
                                      <Label>正则模式（可选，优先于分隔符）</Label>
                                      <Input
                                        value={rule.config.regex || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                          updateCleaningRule(rule.id, {
                                            config: { ...rule.config, regex: e.target.value }
                                          })
                                        }
                                        placeholder="例如: (-?\\d+(?:\\.\\d+)?)\\s*[-~～至]\\s*(-?\\d+(?:\\.\\d+)?)"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        const isMulti = selectedSourcesForView.length > 1;
                                        const srcFields = isMulti ? step2AggregatedFields : fields;
                                        const fi: any = srcFields.find((f: any) => f.name === rule.field);
                                        const samples = (fi?.sampleValues || []).slice(0, 20);
                                        const suggestion = suggestRangeDelimiterFromSamples(samples);
                                        if (suggestion) {
                                          updateCleaningRule(rule.id, { config: { ...rule.config, delimiter: suggestion } });
                                          toast.success(`已建议分隔符：${suggestion}`);
                                        } else {
                                          toast.info('未检测到常见分隔符，请手动填写或使用正则模式');
                                        }
                                      }}
                                    >
                                      自动建议分隔符
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      onClick={() => {
                                        const metric = computeRangeMatchRate(rule.field, rule.config?.delimiter, rule.config?.regex);
                                        if (metric.total === 0) {
                                          toast.info('无可用样例值用于检测');
                                          return;
                                        }
                                        const rate = metric.matchedCount / metric.total;
                                        const pct = Math.round(rate * 100);
                                        if (metric.matchedCount === 0) {
                                          toast.error(`样例匹配率 0%（${metric.matchedCount}/${metric.total}），请调整分隔符或正则`);
                                        } else if (pct < 60) {
                                          toast.warning(`样例匹配率 ${pct}%（${metric.matchedCount}/${metric.total}），可能存在较多无法解析的值`);
                                        } else {
                                          toast.success(`样例匹配率 ${pct}%（${metric.matchedCount}/${metric.total}）`);
                                        }
                                      }}
                                    >
                                      检测样例
                                    </Button>
                                  </div>

                                  <div className="text-xs text-gray-500">
                                    范围格式（必填）：请填写分隔符或正则（二选一，正则优先）。执行后将把值拆分为“{rule.field}_min”和“{rule.field}_max”，类型为数值；无法解析的值在新字段中记为空并在日志提示。
                                  </div>
                                </div>
                              )}
                              
                              {rule.type === 'format_date' && (
                                <div className="space-y-3">
                                  <div>
                                    <Label>日期时间格式</Label>
                                    <Select
                                      value={rule.config?.format || ''}
                                      onValueChange={(format: string) =>
                                        updateCleaningRule(rule.id, { config: { ...rule.config, format, isCustomFormat: format === 'custom' } })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="请选择当前使用的日期格式" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                                        <SelectItem value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</SelectItem>
                                        <SelectItem value="custom">自定义</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {rule.config?.isCustomFormat && (
                                    <div>
                                      <Label>自定义格式或解析方案（支持格式字符串或JSON）</Label>
                                      <Textarea
                                        value={rule.config?.customFormat ?? ''}
                                        onChange={(e) => updateCleaningRule(rule.id, { config: { ...rule.config, customFormat: e.target.value } })}
                                        placeholder='例如：YYYY/MM/DD 或 {"regex": "^\\\\d{4}-\\\\d{2}-\\\\d{2}$"}'
                                      />
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        // 简单样例校验：检查样例值与所选格式是否大致匹配
                                        const fieldInfo = fields.find(f => f.name === rule.field);
                                        const samples = fieldInfo?.sampleValues?.slice(0, 20) || [];
                                        const fmt = rule.config?.format;
                                        const isCustom = rule.config?.isCustomFormat;
                                        const customFmt = rule.config?.customFormat;
                                        let okCount = 0;
                                        const reByFormat = (format: string) => {
                                          // 仅提供常用格式的简易匹配，可在后续接入 dayjs/自定义解析器
                                          const map: Record<string, RegExp> = {
                                            'YYYY-MM-DD': new RegExp('^\\d{4}-\\d{2}-\\d{2}$'),
                                            'MM/DD/YYYY': new RegExp('^\\d{2}/\\d{2}/\\d{4}$'),
                                            'DD-MM-YYYY': new RegExp('^\\d{2}-\\d{2}-\\d{4}$'),
                                            'YYYY-MM-DD HH:mm:ss': new RegExp('^\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}$'),
                                          };
                                          return map[format] || new RegExp('.*');
                                        };
                                        let reg: RegExp;
                                        if (isCustom && customFmt) {
                                          try {
                                            if (customFmt.trim().startsWith('{')) {
                                              const obj = JSON.parse(customFmt);
                                              reg = new RegExp(obj.regex || obj.pattern || '.*');
                                            } else {
                                              reg = reByFormat(customFmt);
                                            }
                                          } catch {
                                            toast.error('自定义格式JSON解析失败');
                                            return;
                                          }
                                        } else {
                                          reg = reByFormat(fmt || '');
                                        }
                                        samples.forEach(v => {
                                          const s = String(v ?? '');
                                          if (reg.test(s)) okCount++;
                                        });
                                        const rate = samples.length ? okCount / samples.length : 0;
                                        if (rate < 0.6) {
                                          toast.warning('样例解析失败率较高，格式可能不匹配');
                                        } else {
                                          toast.success('样例解析通过');
                                        }
                                      }}
                                    >
                                      校验样例
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {rule.type === 'numeric_transform' && (() => {
                                const isMulti = selectedSourcesForView.length > 1;
                                const srcFields = isMulti ? step2AggregatedFields : fields;
                                const numericFieldOptions = srcFields.filter((f: any) => f.type === 'number').map((f: any) => f.name);
                                const selectedFields: string[] = Array.isArray(rule.config?.fields) ? rule.config.fields : [];
                                const method: string = rule.config?.method || '';
                                const params: any = rule.config?.params || {};
                                return (
                                  <div className="space-y-3">
                                    <div>
                                      <Label>选择字段（可多选，仅显示数值型）</Label>
                                      {numericFieldOptions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {numericFieldOptions.map(name => (
                                            <div key={name} className="flex items-center space-x-2">
                                              <Checkbox
                                                checked={selectedFields.includes(name)}
                                                onCheckedChange={(checked: boolean) => {
                                                  const prev = selectedFields;
                                                  const next = checked ? Array.from(new Set([...prev, name])) : prev.filter(n => n !== name);
                                                  updateCleaningRule(rule.id, { config: { ...rule.config, fields: next } });
                                                }}
                                              />
                                              <span className="text-sm">{name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="mt-2 flex items-start gap-2 text-red-700">
                                          <AlertCircle className="w-4 h-4 mt-0.5" />
                                          <span>当前数据集中没有数值型字段可选</span>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <Label>转换方法</Label>
                                      <Select
                                        value={method}
                                        onValueChange={(m: string) => {
                                          let nextParams: any = {};
                                          switch (m) {
                                            case 'minmax':
                                              nextParams = { min: 0, max: 1 };
                                              break;
                                            case 'zscore':
                                            nextParams = { stdType: 'sample' };
                                              break;
                                            case 'robust':
                                              nextParams = { q1: 25, q3: 75 };
                                              break;
                                            case 'maxabs':
                                              nextParams = { preserveSign: true };
                                              break;
                                            case 'decimal_scaling':
                                              nextParams = { auto: true, digits: 0 };
                                              break;
                                            case 'unit_vector':
                                              nextParams = { axis: 'row' };
                                              break;
                                            default:
                                              nextParams = {};
                                          }
                                          updateCleaningRule(rule.id, { config: { ...rule.config, method: m, params: nextParams } });
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="请选择转换方法" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="minmax">Min-Max归一化</SelectItem>
                                          <SelectItem value="zscore">Z-score标准化</SelectItem>
                                          <SelectItem value="robust">Robust标准化</SelectItem>
                                          <SelectItem value="maxabs">Max-Abs缩放</SelectItem>
                                          <SelectItem value="decimal_scaling">小数缩放</SelectItem>
                                          <SelectItem value="unit_vector">单位向量归一化</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {method === 'minmax' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>目标区间最小值</Label>
                                          <Input
                                            type="number"
                                            value={Number.isFinite(Number(params.min)) ? params.min : ''}
                                            onChange={(e) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, min: Number(e.target.value) } } })
                                            }
                                            placeholder="默认 0"
                                          />
                                        </div>
                                        <div>
                                          <Label>目标区间最大值</Label>
                                          <Input
                                            type="number"
                                            value={Number.isFinite(Number(params.max)) ? params.max : ''}
                                            onChange={(e) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, max: Number(e.target.value) } } })
                                            }
                                            placeholder="默认 1"
                                          />
                                        </div>
                                        {(Number.isFinite(Number(params.min)) && Number.isFinite(Number(params.max)) && Number(params.min) >= Number(params.max)) && (
                                          <div className="md:col-span-2 flex items-start gap-2 text-red-700">
                                            <AlertCircle className="w-4 h-4 mt-0.5" />
                                            <span>最小值应小于最大值</span>
                                          </div>
                                        )}
                                        <div className="md:col-span-2 text-xs text-gray-500">将数值线性缩放到指定区间（默认[0,1]）。</div>
                                      </div>
                                    )}

                                    {method === 'zscore' && (
                                      <div className="space-y-2">
                                        <Label>标准差类型</Label>
                                        <Select
                                          value={params.stdType || 'sample'}
                                          onValueChange={(v: string) =>
                                            updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, stdType: v } } })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="sample">样本标准差 (n-1)</SelectItem>
                                            <SelectItem value="population">总体标准差 (n)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="text-xs text-gray-500">按均值0、标准差1进行标准化。</div>
                                      </div>
                                    )}

                                    {method === 'robust' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>Q1百分位</Label>
                                          <Input
                                            type="number"
                                            value={Number.isFinite(Number(params.q1)) ? params.q1 : ''}
                                            onChange={(e) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, q1: Number(e.target.value) } } })
                                            }
                                            placeholder="默认 25"
                                          />
                                        </div>
                                        <div>
                                          <Label>Q3百分位</Label>
                                          <Input
                                            type="number"
                                            value={Number.isFinite(Number(params.q3)) ? params.q3 : ''}
                                            onChange={(e) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, q3: Number(e.target.value) } } })
                                            }
                                            placeholder="默认 75"
                                          />
                                        </div>
                                        {((Number(params.q1) >= Number(params.q3)) || (Number(params.q1) <= 0) || (Number(params.q3) >= 100)) && (
                                          <div className="md:col-span-2 flex items-start gap-2 text-red-700">
                                            <AlertCircle className="w-4 h-4 mt-0.5" />
                                            <span>Q1/Q3需在(0,100)之间且Q1&lt;Q3</span>
                                          </div>
                                        )}
                                        <div className="md:col-span-2 text-xs text-gray-500">基于中位数与IQR进行标准化，降低异常值影响。</div>
                                      </div>
                                    )}

                                    {method === 'maxabs' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={!!params.preserveSign}
                                            onCheckedChange={(checked: boolean) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, preserveSign: checked } } })
                                            }
                                          />
                                          <Label>保留正负符号（默认）</Label>
                                        </div>
                                        <div className="text-xs text-gray-500">按最大绝对值缩放至[-1,1]。关闭保留符号将先取绝对值再缩放为[0,1]。</div>
                                      </div>
                                    )}

                                    {method === 'decimal_scaling' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={!!params.auto}
                                            onCheckedChange={(checked: boolean) =>
                                              updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, auto: checked } } })
                                            }
                                          />
                                          <Label>自动计算位数（默认）</Label>
                                        </div>
                                        {!params.auto && (
                                          <div>
                                            <Label>移动位数</Label>
                                            <Input
                                              type="number"
                                              value={Number.isFinite(Number(params.digits)) ? params.digits : ''}
                                              onChange={(e) =>
                                                updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, digits: Number(e.target.value) } } })
                                              }
                                              placeholder="请输入非负整数"
                                            />
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500">通过移动小数点进行缩放，自动模式会根据最大绝对值确定位数。</div>
                                      </div>
                                    )}

                                    {method === 'unit_vector' && (
                                      <div className="space-y-2">
                                        <Label>归一化维度</Label>
                                        <Select
                                          value={params.axis || 'row'}
                                          onValueChange={(v: string) =>
                                            updateCleaningRule(rule.id, { config: { ...rule.config, params: { ...params, axis: v } } })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="row">按样本（行）</SelectItem>
                                            <SelectItem value="column">按特征（列）</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {((params.axis || 'row') === 'row') && (selectedFields.length < 2) && (
                                          <div className="mt-2 flex items-start gap-2 text-yellow-700">
                                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                                            <span>按样本归一化建议选择多个字段</span>
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500">将选定字段按L2范数归一为长度1。</div>
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                      各方法参数均有默认值：Min-Max默认[0,1]；Z-score默认样本标准差；Robust默认Q1=25%、Q3=75%；Max-Abs默认保留符号；小数缩放默认自动；单位向量默认按样本归一化。
                                    </div>
                                  </div>
                                );
                              })()}

                              {rule.type === 'resample' && (
                                <div className="space-y-3">
                                  <div>
                                    <Label>采样时间差模式</Label>
                                    <Select
                                      value={rule.config?.mode || 'mode'}
                                      onValueChange={(mode: string) =>
                                        updateCleaningRule(rule.id, {
                                          config: { ...rule.config, mode }
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mode">众数模式</SelectItem>
                                        <SelectItem value="median">中位数模式</SelectItem>
                                        <SelectItem value="custom">自定义值模式</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {((rule.config?.mode || 'mode') === 'custom') && (
                                    <div>
                                      <Label>采样时间差</Label>
                                      <div className="grid grid-cols-2 gap-3 items-center">
                                        <div>
                                          <Input
                                            type="number"
                                            value={typeof rule.config?.interval === 'number' ? rule.config.interval : ''}
                                            onChange={(e) =>
                                              updateCleaningRule(rule.id, {
                                                config: { ...rule.config, interval: Number(e.target.value) }
                                              })
                                            }
                                            placeholder={`采样间隔（${(() => {
                                              const unitMap: Record<string,string> = { days: '天', hours: '小时', minutes: '分钟', seconds: '秒' };
                                              const u = (rule.config?.unit || 'seconds') as string;
                                              return unitMap[u] || '秒';
                                            })()}）`}
                                          />
                                        </div>
                                        <div>
                                          <Select
                                            value={rule.config?.unit || 'seconds'}
                                            onValueChange={(unit: string) =>
                                              updateCleaningRule(rule.id, {
                                                config: { ...rule.config, unit }
                                              })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="days">天</SelectItem>
                                              <SelectItem value="hours">小时</SelectItem>
                                              <SelectItem value="minutes">分钟</SelectItem>
                                              <SelectItem value="seconds">秒</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div>
                                <Label>描述</Label>
                                <Input
                                  value={rule.description}
                                  onChange={(e) => 
                                    updateCleaningRule(rule.id, { description: e.target.value })
                                  }
                                  placeholder="规则描述"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {cleaningRules.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>暂无清洗规则</p>
                            <p className="text-sm">点击"添加规则"开始配置</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    </div>
                  </div>

                  {/* JSON高级配置（底部整行，提供导入/导出与互操作） */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Code className="h-5 w-5" />
                          <span>JSON高级配置</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={syncUIToJson}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            同步界面到JSON
                          </Button>
                          <Button variant="outline" size="sm" onClick={applyJsonToUI}>
                            <Play className="h-4 w-4 mr-1" />
                            应用JSON至界面
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label>配置JSON</Label>
                        <Textarea
                          value={jsonConfig}
                          onChange={(e) => setJsonConfig(e.target.value)}
                          className="font-mono text-sm h-96"
                          placeholder="输入JSON配置..."
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                const formatted = JSON.stringify(JSON.parse(jsonConfig), null, 2);
                                setJsonConfig(formatted);
                                toast.success('JSON格式化完成');
                              } catch (error) {
                                toast.error('JSON格式错误');
                              }
                            }}
                          >
                            格式化
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(jsonConfig);
                              toast.success('已复制到剪贴板');
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            复制
                          </Button>
                          {/* 隐藏原生文件输入，改为按钮触发 */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json"
                            onChange={handleImportConfig}
                            className="hidden"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            导入JSON文件
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportConfig}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            导出JSON配置
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      上一步
                    </Button>
                    <div className="flex items-center gap-2">

                      <Button 
                        onClick={handleApply}
                        disabled={
                          isProcessing ||
                          cleaningRules.filter(r => r.enabled).length === 0 ||
                          (selectedSourcesForView.length > 1 && step2ShowCommonOnly && step2AggregatedFields.filter(f => f.selected).length === 0)
                        }
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            处理中...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            开始执行数据处理
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* 结果预览（Step 3）— 已移除，根据需求彻底删除相关功能与入口 */}
                
              </Tabs>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wand2 className="h-5 w-5" />
                      <span>智能数据清洗</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-12">
                    <Zap className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold mb-2">AI驱动的自动清洗</h3>
                    <p className="text-gray-600 mb-6">
                      系统将自动分析数据质量问题，应用最佳清洗策略
                    </p>
                    <Button size="lg" onClick={handleApply} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          智能处理中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5 mr-2" />
                          开始智能清洗
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {/* 确认弹窗 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="sm:max-w-[1800px] max-w-[1800px] w-[98vw] sm:w-[1800px] min-w-[800px] max-h-[90vh] overflow-y-auto overflow-x-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>确认操作</span>
            </DialogTitle>
            <DialogDescription>

              {confirmAction === 'apply' && (
                <div className="space-y-2">
                    <p>
                      您即将执行数据预处理：
                      <span className="font-medium">{(datasetOptions.find(d => d.id === activeDatasetId)?.name) || activeDatasetId || '未选择数据集'}</span>
                      ，操作，这将：
                    </p>
                  <div className="bg-black text-blue-400 rounded-md px-3 py-2 font-medium space-y-1">
                    <div>分析当前配置清洗规则</div>
                    <div>对选择的数据集进行数据处理</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">此操作不会修改原始数据。</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirm}
              variant={'destructive'}
            >
              {'确认开始'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* 规则级确认弹窗 */}
      <Dialog open={showRuleConfirmDialog} onOpenChange={setShowRuleConfirmDialog}>
        <DialogContent className="sm:max-w-[680px] w-[90vw] max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>规则确认</span>
            </DialogTitle>
            <DialogDescription>
              {(ruleConfirmPayload?.message) || '是否确认执行该规则相关的敏感操作？'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowRuleConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRuleConfirm} variant={'destructive'}>
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}