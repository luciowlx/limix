import React, { useState, useEffect } from "react";
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
  type: 'remove_null' | 'fill_null' | 'remove_duplicates' | 'format_date' | 'normalize_text' | 'validate_range' | 'custom';
  config: any;
  enabled: boolean;
  description: string;
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

  // 数据集选择相关状态（mock 数据集列表）
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(datasetId);
  const datasetOptions = [
    { id: '1', name: '生产线传感器数据集', type: 'IoT传感器', size: '120MB', rows: '125,000', columns: '32', completeness: 92 },
    { id: '2', name: 'ERP系统数据集', type: '业务记录', size: '85MB', rows: '98,500', columns: '24', completeness: 88 },
    { id: '3', name: '设备维保日志', type: '日志数据', size: '40MB', rows: '250,000', columns: '12', completeness: 76 },
    { id: '4', name: '质量检测结果集', type: '检测记录', size: '65MB', rows: '45,200', columns: '16', completeness: 81 }
  ];
  
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
      
      // 生成默认清洗规则
      const defaultRules: CleaningRule[] = [
        {
          id: 'rule-1',
          field: 'name',
          type: 'remove_null',
          config: {},
          enabled: true,
          description: '移除姓名字段的空值记录'
        },
        {
          id: 'rule-2',
          field: 'email',
          type: 'fill_null',
          config: { fillValue: 'unknown@example.com' },
          enabled: false,
          description: '用默认值填充邮箱空值'
        },
        {
          id: 'rule-3',
          field: 'age',
          type: 'validate_range',
          config: { min: 0, max: 120 },
          enabled: true,
          description: '验证年龄范围（0-120）'
        },
        {
          id: 'rule-4',
          field: 'created_at',
          type: 'format_date',
          config: { format: 'YYYY-MM-DD' },
          enabled: true,
          description: '统一日期格式'
        }
      ];
      
      setCleaningRules(defaultRules);
      
      // 生成JSON配置
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
    setCleaningRules(prev => prev.filter(rule => rule.id !== ruleId));
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
        
        // 更新清洗规则
        if (config.rules) {
          setCleaningRules(config.rules);
        }
        
        toast.success('配置已导入');
      } catch (error) {
        toast.error('配置文件格式错误');
      }
    };
    reader.readAsText(file);
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
            <div className="flex items-center space-x-2">
              <Button
                variant={currentMode === 'traditional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('traditional')}
              >
                <Settings className="h-4 w-4 mr-1" />
                传统模式
              </Button>
              <Button
                variant={currentMode === 'solo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('solo')}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                Solo模式
              </Button>
            </div>
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
                { step: 2, title: '规则配置', icon: Settings },
                { step: 3, title: '预览结果', icon: Eye }
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
                  {step < 3 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {currentMode === 'traditional' ? (
              <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="0">选择数据集</TabsTrigger>
                  <TabsTrigger value="1">字段选择</TabsTrigger>
                  <TabsTrigger value="2">规则配置</TabsTrigger>
                  <TabsTrigger value="3">预览结果</TabsTrigger>
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
                        <div className="text-sm text-gray-600">
                          <p>提示：</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>从任意入口发起预处理，流程保持一致：先选择数据集，再进行字段与规则配置。</li>
                            <li>从数据集行内操作进入时，这里会自动预选对应数据集。</li>
                          </ul>
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
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>
                                <Badge className={getFieldTypeColor(field.type)}>
                                  {field.type}
                                </Badge>
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
                    {/* 可视化规则配置 */}
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
                              <div className="flex items-center justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeCleaningRule(rule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                                    onValueChange={(type) => 
                                      updateCleaningRule(rule.id, { type: type as any })
                                    }
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

                    {/* JSON高级配置 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Code className="h-5 w-5" />
                          <span>JSON高级配置</span>
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
                          <div className="flex space-x-2">
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      上一步
                    </Button>
                    <Button 
                      onClick={handlePreview}
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
                          预览结果
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* 预览结果 */}
                <TabsContent value="3" className="space-y-4">
                  {processingResult ? (
                    <>
                      {/* 处理统计 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="text-sm text-gray-600">原始记录</p>
                                <p className="text-2xl font-bold">{processingResult.originalRows.toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="text-sm text-gray-600">处理后记录</p>
                                <p className="text-2xl font-bold">{processingResult.processedRows.toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <Trash2 className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="text-sm text-gray-600">移除记录</p>
                                <p className="text-2xl font-bold">{processingResult.removedRows.toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-5 w-5 text-purple-500" />
                              <div>
                                <p className="text-sm text-gray-600">保留率</p>
                                <p className="text-2xl font-bold">
                                  {Math.round((processingResult.processedRows / processingResult.originalRows) * 100)}%
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 错误和警告 */}
                      {(processingResult.errors.length > 0 || processingResult.warnings.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {processingResult.errors.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-red-600">
                                  <AlertCircle className="h-5 w-5" />
                                  <span>错误信息</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {processingResult.errors.map((error, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                                      <div>
                                        <p className="font-medium">{error.field}</p>
                                        <p className="text-sm text-gray-600">{error.message}</p>
                                      </div>
                                      <Badge variant="destructive">{error.count}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          {processingResult.warnings.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-yellow-600">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span>警告信息</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {processingResult.warnings.map((warning, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                      <div>
                                        <p className="font-medium">{warning.field}</p>
                                        <p className="text-sm text-gray-600">{warning.message}</p>
                                      </div>
                                      <Badge variant="secondary">{warning.count}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* 预览数据 */}
                      <Card>
                        <CardHeader>
                          <CardTitle>数据预览</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(previewData[0] || {}).map(key => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((row, index) => (
                                <TableRow key={index}>
                                  {Object.values(row).map((value, cellIndex) => (
                                    <TableCell key={cellIndex}>
                                      {String(value)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setCurrentStep(2)}>
                          返回修改
                        </Button>
                        <div className="flex space-x-2">
                          <Button variant="outline" onClick={handleExportConfig}>
                            <Download className="h-4 w-4 mr-2" />
                            导出结果
                          </Button>
                          <Button onClick={handleApply} disabled={isProcessing}>
                            {isProcessing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                应用中...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                应用处理
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Card>
                        <CardContent className="p-8">
                          <Eye className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-semibold mb-2 text-gray-700">还没有预览结果</h3>
                          <p className="text-gray-500 mb-6">
                            请先配置数据清洗规则，然后执行预览操作查看处理结果
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">1</div>
                                <span>配置清洗规则</span>
                              </div>
                              <div className="w-8 h-0.5 bg-gray-300"></div>
                              <div className="flex items-center space-x-1">
                                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs">2</div>
                                <span>执行预览</span>
                              </div>
                              <div className="w-8 h-0.5 bg-gray-300"></div>
                              <div className="flex items-center space-x-1">
                                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs">3</div>
                                <span>查看结果</span>
                              </div>
                            </div>
                            <div className="flex justify-center space-x-3 mt-6">
                              <Button 
                                variant="outline" 
                                onClick={() => setCurrentStep(2)}
                                className="flex items-center space-x-2"
                              >
                                <Settings className="h-4 w-4" />
                                <span>配置规则</span>
                              </Button>
                              <Button 
                                onClick={handlePreview}
                                disabled={isProcessing || cleaningRules.filter(r => r.enabled).length === 0}
                                className="flex items-center space-x-2"
                              >
                                {isProcessing ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>处理中...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4" />
                                    <span>执行预览</span>
                                  </>
                                )}
                              </Button>
                            </div>
                            {cleaningRules.filter(r => r.enabled).length === 0 && (
                              <p className="text-sm text-orange-600 mt-3">
                                ⚠️ 请先配置至少一个清洗规则
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
                  <p className="text-orange-600 font-medium">您即将应用数据预处理规则，这将：</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                    <li>永久修改数据集</li>
                    <li>应用所有配置的清洗规则</li>
                    <li>无法撤销此操作</li>
                  </ul>
                  <p className="text-sm text-red-500 mt-2 font-medium">
                    ⚠️ 建议在应用前先执行预览操作确认结果
                  </p>
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
              {confirmAction === 'preview' ? '确认预览' : '确认应用'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}