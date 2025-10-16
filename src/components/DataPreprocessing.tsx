import React, { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";
import { toast } from "sonner";
import { SoloDataCleaning } from "./SoloDataCleaning";

interface DataPreprocessingProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string;
  mode?: 'traditional' | 'solo';
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
  type: 'remove_null' | 'fill_null' | 'remove_duplicates' | 'format_date' | 'normalize_text' | 'validate_range' | 'resample' | 'custom';
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
   estimatedTimeMinutes?: number;
   rule: {
     field: string;
     type: CleaningRule['type'];
     config: any;
     description: string;
   };
   selected: boolean;
 }

interface ProcessingResult {
  originalRows: number;
  processedRows: number;
  removedRows: number;
  modifiedFields: string[];
  errors: Array<{
    field: string;
    message: string;
    count: number;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    count: number;
  }>;
}

  export function DataPreprocessing({ isOpen, onClose, datasetId, mode = 'traditional' }: DataPreprocessingProps) {
  const [currentMode, setCurrentMode] = useState<'traditional' | 'solo'>(mode);
  // 初始不加载字段信息，先进行“选择数据集”步骤
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [cleaningRules, setCleaningRules] = useState<CleaningRule[]>([]);
  // 新增 Step 0：选择数据集
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [jsonConfig, setJsonConfig] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recommendedStrategies, setRecommendedStrategies] = useState<RecommendedStrategy[]>([]);
  const [recommendedQuery, setRecommendedQuery] = useState('');

  // 数据集选择相关状态（mock 数据集列表）
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(datasetId);
  const datasetOptions = [
    { id: '1', name: '生产线传感器数据集', type: 'IoT传感器', size: '120MB', rows: '125,000', columns: '32', completeness: 92 },
    { id: '2', name: 'ERP系统数据集', type: '业务记录', size: '85MB', rows: '98,500', columns: '24', completeness: 88 },
    { id: '3', name: '设备维保日志', type: '日志数据', size: '40MB', rows: '250,000', columns: '12', completeness: 76 },
    { id: '4', name: '质量检测结果集', type: '检测记录', size: '65MB', rows: '45,200', columns: '16', completeness: 81 }
  ];

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
      { name: 'defect_rate', type: 'number' }
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

  // 当前选中数据集（用于展示信息面板）
  const selectedDataset = datasetOptions.find(d => d.id === selectedDatasetId);
  
  // 确认弹窗状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'apply' | 'preview' | null>(null);

  // 打开对话框时，如果来自具体数据集入口，预选该数据集；但仍停留在 Step 0
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setSelectedDatasetId(datasetId);
      setIsLoading(false);
    }
  }, [isOpen, datasetId]);

  // 进入字段选择步骤时，根据选中的数据集加载字段信息
  useEffect(() => {
    if (isOpen && currentStep === 1 && selectedDatasetId) {
      loadDatasetInfo(selectedDatasetId);
    }
  }, [isOpen, currentStep, selectedDatasetId]);

  const loadDatasetInfo = async (id: string) => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFields: FieldInfo[] = [
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
      
      setFields(mockFields);
      
      // 基于字段统计模拟生成 AI 推荐清洗策略（智能推荐清洗策略模块）
      const recommended: RecommendedStrategy[] = [
        {
          id: 'rs-1',
          key: 'deduplicate',
          title: '数据去重',
          description: '检测到重复记录，建议进行去重以提高数据质量',
          confidence: 0.95,
          impactLevel: '中',
          affectedRows: 3247,
          affectedFields: ['user_id', 'timestamp', 'action'],
          estimatedTimeMinutes: 2,
          // 映射到规则：remove_duplicates
          rule: { field: 'id', type: 'remove_duplicates', config: {}, description: '移除重复记录' },
          selected: true
        },
        {
          id: 'rs-2',
          key: 'fill_missing',
          title: '缺失值填充',
          description: '使用智能算法填充 age 和 location 字段的缺失值',
          confidence: 0.88,
          impactLevel: '高',
          affectedRows: 8934,
          affectedFields: ['age', 'location'],
          estimatedTimeMinutes: 5,
          rule: { field: 'email', type: 'fill_null', config: { fillValue: 'unknown@example.com' }, description: '用默认值填充邮箱空值' },
          selected: false
        },
        {
          id: 'rs-3',
          key: 'unique_check',
          title: '唯一值检测',
          description: '检测并处理关键字段中的唯一性问题',
          confidence: 0.76,
          impactLevel: '低',
          affectedRows: 234,
          affectedFields: ['purchase_amount'],
          estimatedTimeMinutes: 4,
          // 使用 remove_duplicates 作为唯一性问题处理的规则映射
          rule: { field: 'id', type: 'remove_duplicates', config: {}, description: '唯一值检测/去重' },
          selected: false
        },
        {
          id: 'rs-4',
          key: 'normalize_text',
          title: '文本标准化',
          description: '统一文本字段的大小写和编码格式',
          confidence: 0.85,
          impactLevel: '中',
          affectedRows: 45678,
          affectedFields: ['name', 'address', 'category'],
          estimatedTimeMinutes: 6,
          rule: { field: 'name', type: 'normalize_text', config: {}, description: '统一文本大小写与编码' },
          selected: true
        }
      ];
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
      
      // 生成JSON配置（与界面互操作：只输出必要字段）
      const jsonConfigTemplate = {
        fields: mockFields.filter(f => f.selected).map(f => f.name),
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

  // 从“选择数据集”进入下一步：字段选择
  const proceedToFieldSelection = () => {
    if (!selectedDatasetId) {
      toast.warning('请先选择目标数据集');
      return;
    }
    setCurrentStep(1);
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
    const newRule: CleaningRule = {
      id: 'rule-' + Date.now(),
      field: fields.find(f => f.selected)?.name || '',
      type: 'remove_null',
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

  // 更新清洗规则
  const updateCleaningRule = (ruleId: string, updates: Partial<CleaningRule>) => {
    setCleaningRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  // 预览处理结果
  // 显示确认弹窗
  const showConfirm = (action: 'apply' | 'preview') => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  // 确认执行操作
  const handleConfirm = () => {
    setShowConfirmDialog(false);
    if (confirmAction === 'preview') {
      executePreview();
    } else if (confirmAction === 'apply') {
      executeApply();
    }
    setConfirmAction(null);
  };

  const handlePreview = () => {
    showConfirm('preview');
  };

  const executePreview = async () => {
    setIsProcessing(true);
    try {
      // 模拟处理过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ProcessingResult = {
        originalRows: 10000,
        processedRows: 9500,
        removedRows: 500,
        modifiedFields: ['name', 'email', 'age', 'created_at'],
        errors: [
          { field: 'age', message: '年龄超出有效范围', count: 25 },
          { field: 'email', message: '邮箱格式无效', count: 15 }
        ],
        warnings: [
          { field: 'name', message: '包含特殊字符', count: 100 },
          { field: 'created_at', message: '日期格式不一致', count: 200 }
        ]
      };
      
      setProcessingResult(mockResult);
      
      // 模拟预览数据
      const mockPreview = [
        { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25, created_at: '2024-01-15' },
        { id: 2, name: '李四', email: 'lisi@example.com', age: 30, created_at: '2024-01-16' },
        { id: 3, name: '王五', email: 'wangwu@example.com', age: 28, created_at: '2024-01-17' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com', age: 35, created_at: '2024-01-18' },
        { id: 5, name: '钱七', email: 'qianqi@example.com', age: 22, created_at: '2024-01-19' }
      ];
      
      setPreviewData(mockPreview);
      setCurrentStep(3);
      
      toast.success('预处理完成');
    } catch (error) {
      toast.error('预处理失败，请检查配置');
    } finally {
      setIsProcessing(false);
    }
  };

  // 应用处理
  const handleApply = () => {
    showConfirm('apply');
  };

  const executeApply = async () => {
    setIsProcessing(true);
    try {
      // 模拟应用过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('数据预处理已完成', {
        description: `成功处理 ${processingResult?.processedRows} 条记录`
      });
      
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
    link.download = `preprocessing_config_${datasetId}.json`;
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
        fields: fields.filter(f => f.selected).map(f => f.name),
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
      'remove_null': '移除空值',
      'fill_null': '填充空值',
      'remove_duplicates': '去重',
      'format_date': '格式化日期',
      'normalize_text': '文本标准化',
      'validate_range': '范围验证',
      'resample': '重采样',
      'custom': '自定义规则'
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>数据预处理 - {currentMode === 'traditional' ? '传统模式' : 'Solo模式'}</span>
          </DialogTitle>
          <DialogDescription>
            {currentMode === 'traditional' 
              ? '手动配置数据清洗规则，精确控制数据处理过程'
              : '智能自动数据清洗，AI驱动的数据质量优化'
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg">加载数据集信息...</span>
          </div>
        ) : currentMode === 'solo' ? (
          <SoloDataCleaning
            isOpen={true}
            onClose={() => {}}
            datasetId={selectedDatasetId}
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
              <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="0">选择数据集</TabsTrigger>
                  <TabsTrigger value="1">字段选择</TabsTrigger>
                  <TabsTrigger value="2">规则配置</TabsTrigger>
                </TabsList>

                {/* 选择数据集（Step 0）*/}
                <TabsContent value="0" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>选择目标数据集</span>
                        {selectedDatasetId && (
                          <Badge variant="secondary">已选择：{datasetOptions.find(d => d.id === selectedDatasetId)?.name || selectedDatasetId}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>数据集</Label>
                          <Select value={selectedDatasetId} onValueChange={(v) => setSelectedDatasetId(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择数据集" />
                            </SelectTrigger>
                            <SelectContent>
                              {datasetOptions.map(ds => (
                                <SelectItem key={ds.id} value={ds.id}>
                                  {ds.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          {selectedDataset ? (
                            <div className="rounded-md border bg-muted/40 p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">{selectedDataset.name}</div>
                                <div className="flex items-center gap-2">
                                  {/* 复用全局隐藏的文件输入 */}
                                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    上传
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {`${selectedDataset.rows} 条记录 · ${(datasetFieldSchemas[selectedDatasetId!]?.length ?? Number(selectedDataset.columns))} 个字段 · ${selectedDataset.size}`}
                              </div>
                              <div className="mt-3">
                                <div className="text-xs font-medium mb-2">字段梳理</div>
                                <div className="max-h-40 overflow-auto rounded-sm border bg-background/60">
                                  <ul className="divide-y">
                                    {(datasetFieldSchemas[selectedDatasetId!] || []).map((f, idx) => (
                                      <li key={idx} className="px-2 py-1 flex items-center justify-between text-xs">
                                        <span className="text-gray-700">{f.name}</span>
                                        <span className="text-gray-500">{f.type}</span>
                                      </li>
                                    ))}
                                    {(!datasetFieldSchemas[selectedDatasetId!] || datasetFieldSchemas[selectedDatasetId!]!.length === 0) && (
                                      <li className="px-2 py-2 text-xs text-gray-500">暂未提供字段信息</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <p>提示：</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>从任意入口发起预处理，流程保持一致：先选择数据集，再进行字段与规则配置。</li>
                                <li>从数据集行内操作进入时，这里会自动预选对应数据集。</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button onClick={proceedToFieldSelection} disabled={!selectedDatasetId}>
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
                        <Badge variant="secondary">{fields.length} 个字段</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedDatasetId && (
                        <div className="text-sm text-orange-600 mb-2">⚠️ 未选择数据集，请返回上一步选择数据集。</div>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">选择</TableHead>
                            <TableHead>字段名</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>空值率</TableHead>
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
                                  onCheckedChange={(checked) => 
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
                                <Select value={field.type} onValueChange={(v) => handleFieldTypeChange(field.name, v as FieldInfo['type'])}>
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
                                {field.unique ? (
                                  <Badge variant="default">唯一</Badge>
                                ) : (
                                  <Badge variant="secondary">非唯一</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 max-w-48 truncate">
                                  {field.sampleValues.slice(0, 3).map(v => 
                                    v === null ? 'null' : String(v)
                                  ).join(', ')}
                                  {field.sampleValues.length > 3 && '...'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                  onCheckedChange={(checked) => toggleRecommendedStrategy(s.id, !!checked)}
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
                                    <div>预计时间：{s.estimatedTimeMinutes ?? 3} 分钟</div>
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
                          <Button size="sm" onClick={addCleaningRule}>
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
                                  <Select
                                    value={rule.field}
                                    onValueChange={(field) => 
                                      updateCleaningRule(rule.id, { field })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fields.filter(f => f.selected).map(field => (
                                        <SelectItem key={field.name} value={field.name}>
                                          {field.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label>规则类型</Label>
                                  <Select
                                    value={rule.type}
                                    onValueChange={(type) => {
                                      const t = type as CleaningRule['type'];
                                      if (t === 'resample') {
                                        const nextCfg = {
                                          mode: (rule.config?.mode as 'mode' | 'median' | 'custom') || 'mode',
                                          interval: typeof rule.config?.interval === 'number' ? rule.config.interval : 1,
                                          unit: (rule.config?.unit as 'days' | 'hours' | 'minutes' | 'seconds') || 'seconds'
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
                                      <SelectItem value="remove_null">移除空值</SelectItem>
                                      <SelectItem value="fill_null">填充空值</SelectItem>
                                      <SelectItem value="remove_duplicates">去重</SelectItem>
                                      <SelectItem value="format_date">格式化日期</SelectItem>
                                      <SelectItem value="normalize_text">文本标准化</SelectItem>
                                      <SelectItem value="validate_range">范围验证</SelectItem>
                                      <SelectItem value="resample">重采样</SelectItem>
                                      <SelectItem value="custom">自定义规则</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* 规则配置 */}
                              {rule.type === 'fill_null' && (
                                <div>
                                  <Label>填充值</Label>
                                  <Input
                                    value={rule.config.fillValue || ''}
                                    onChange={(e) => 
                                      updateCleaningRule(rule.id, {
                                        config: { ...rule.config, fillValue: e.target.value }
                                      })
                                    }
                                    placeholder="输入填充值"
                                  />
                                </div>
                              )}
                              
                              {rule.type === 'validate_range' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>最小值</Label>
                                    <Input
                                      type="number"
                                      value={rule.config.min || ''}
                                      onChange={(e) => 
                                        updateCleaningRule(rule.id, {
                                          config: { ...rule.config, min: Number(e.target.value) }
                                        })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>最大值</Label>
                                    <Input
                                      type="number"
                                      value={rule.config.max || ''}
                                      onChange={(e) => 
                                        updateCleaningRule(rule.id, {
                                          config: { ...rule.config, max: Number(e.target.value) }
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {rule.type === 'format_date' && (
                                <div>
                                  <Label>日期格式</Label>
                                  <Select
                                    value={rule.config.format || 'YYYY-MM-DD'}
                                    onValueChange={(format) => 
                                      updateCleaningRule(rule.id, {
                                        config: { ...rule.config, format }
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                                      <SelectItem value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {rule.type === 'resample' && (
                                <div className="space-y-3">
                                  <div>
                                    <Label>采样时间差模式</Label>
                                    <Select
                                      value={rule.config?.mode || 'mode'}
                                      onValueChange={(mode) =>
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
                                            onValueChange={(unit) =>
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
                    <Button 
                      onClick={handleApply}
                      disabled={isProcessing || cleaningRules.filter(r => r.enabled).length === 0}
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
                </TabsContent>
                
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
                    <Button size="lg" onClick={handlePreview} disabled={isProcessing}>
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
        <DialogContent className="sm:max-w-md max-w-md w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>确认操作</span>
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'preview' && (
                <div className="space-y-2">
                  <p>您即将执行数据预处理预览操作，这将：</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                    <li>分析当前配置的清洗规则</li>
                    <li>生成处理结果预览</li>
                    <li>显示数据质量报告</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">此操作不会修改原始数据。</p>
                </div>
              )}
              {confirmAction === 'apply' && (
                <div className="space-y-2">
                  <p>
                    您即将执行数据预处理：
                    <span className="font-medium">{(datasetOptions.find(d => d.id === selectedDatasetId)?.name) || selectedDatasetId || '未选择数据集'}</span>
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
              variant={confirmAction === 'apply' ? 'destructive' : 'default'}
            >
              {confirmAction === 'preview' ? '确认预览' : '确认开始'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}