import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { 
  Upload,
  Database,
  Eye,
  Settings,
  Download,
  FileText,
  Clock,
  TrendingUp,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
  BarChart3,
  Grid3X3,
  List,
  Columns,
  Trash2,
  Edit,
  Copy,
  History,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal,
  Archive,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import VersionHistory from "./VersionHistory";
import { DataUpload } from "./DataUpload";
import { DataSubscription } from "./DataSubscription";
import { SubscriptionList } from "./SubscriptionList";
import { DataPreprocessing } from "./DataPreprocessing";
import { DataDetailDialog } from "./DataDetailDialog";

interface DataManagementProps {
  onNavigateToPreprocessing?: () => void;
  isUploadDialogOpen?: boolean;
  onUploadDialogClose?: () => void;
  onOpenDataDetailFullPage?: (dataset: any) => void;
}

interface ColumnSettings {
  id: boolean;
  name: boolean;
  description: boolean;
  categories: boolean;
  format: boolean;
  size: boolean;
  rows: boolean;
  columns: boolean;
  completeness: boolean;
  source: boolean;
  version: boolean;
  updateTime: boolean;
  status: boolean;
  actions: boolean;
}

interface Dataset {
  id: number;
  title: string;
  description: string;
  categories: Array<{ name: string; color: string }>;
  tags: Array<{ name: string; color: string }>;
  format: string;
  size: string;
  rows: string;
  columns: string;
  completeness: number;
  source: string;
  version: string;
  updateTime: string;
  status: 'success' | 'processing' | 'failed';
  color: string;
  // 为DataDetailDialog添加的字段
  type?: string;
  fieldCount?: number;
  sampleCount?: number;
}

export function DataManagement({ 
  onNavigateToPreprocessing,
  isUploadDialogOpen = false,
  onUploadDialogClose,
  onOpenDataDetailFullPage
}: DataManagementProps = {}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLocalUploadDialogOpen, setIsLocalUploadDialogOpen] = useState(false);
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] = useState(false);
  const [isDataSubscriptionOpen, setIsDataSubscriptionOpen] = useState(false);
  const [isSubscriptionListOpen, setIsSubscriptionListOpen] = useState(false);
  const [isDataPreprocessingOpen, setIsDataPreprocessingOpen] = useState(false);
  const [selectedDatasetForPreprocessing, setSelectedDatasetForPreprocessing] = useState<Dataset | null>(null);
  const [preprocessingMode, setPreprocessingMode] = useState<'traditional' | 'solo'>('traditional');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [selectedDatasetForHistory, setSelectedDatasetForHistory] = useState<Dataset | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyingDataset, setCopyingDataset] = useState<Dataset | null>(null);
  const [isDataDetailDialogOpen, setIsDataDetailDialogOpen] = useState(false);
  const [selectedDatasetForDetail, setSelectedDatasetForDetail] = useState<Dataset | null>(null);
  
  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('updateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 批量操作状态
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch', ids: number[] }>({ type: 'single', ids: [] });

  // 列设置状态
  const [columnSettings, setColumnSettings] = useState<ColumnSettings>({
    id: true,
    name: true,
    description: true,
    categories: true,
    format: true,
    size: true,
    rows: true,
    columns: true,
    completeness: true,
    source: true,
    version: true,
    updateTime: true,
    status: true,
    actions: true
  });

  // 高级筛选状态
  const [advancedFilters, setAdvancedFilters] = useState({
    sizeRange: [0, 1000] as [number, number],
    rowsRange: [0, 1000000] as [number, number],
    completenessRange: [0, 100] as [number, number],
    dateRange: null as { from: Date; to: Date } | null,
    categories: [] as string[],
    formats: [] as string[]
  });

  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const [dataSourceFormData, setDataSourceFormData] = useState({
    name: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    description: ""
  });

  const [taskFormData, setTaskFormData] = useState({
    name: "",
    description: "",
    datasetId: "",
    operations: [] as string[]
  });

  // 二级菜单状态
  const [activeSubmenu, setActiveSubmenu] = useState<'datasets' | 'preprocessing'>('datasets');

  useEffect(() => {
    setIsLocalUploadDialogOpen(isUploadDialogOpen);
  }, [isUploadDialogOpen]);

  // 模拟数据
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: 1,
      title: "销售数据集",
      description: "包含2023年全年销售记录，涵盖产品信息、客户数据、交易金额等关键指标",
      categories: [
        { name: "销售", color: "bg-blue-100 text-blue-800" },
        { name: "财务", color: "bg-green-100 text-green-800" }
      ],
      tags: [
        { name: "CSV", color: "bg-gray-100 text-gray-800" },
        { name: "已清洗", color: "bg-green-100 text-green-800" }
      ],
      format: "CSV",
      size: "2.5MB",
      rows: "10,234",
      columns: "15",
      completeness: 95,
      source: "文件上传",
      version: "v1.2",
      updateTime: "2024-01-15 14:30",
      status: 'success',
      color: "border-l-blue-500"
    },
    {
      id: 2,
      title: "用户行为数据",
      description: "网站用户行为追踪数据，包含页面访问、点击事件、停留时间等用户交互信息",
      categories: [
        { name: "用户行为", color: "bg-purple-100 text-purple-800" },
        { name: "网站分析", color: "bg-orange-100 text-orange-800" }
      ],
      tags: [
        { name: "JSON", color: "bg-gray-100 text-gray-800" },
        { name: "实时", color: "bg-blue-100 text-blue-800" }
      ],
      format: "JSON",
      size: "15.8MB",
      rows: "45,678",
      columns: "12",
      completeness: 88,
      source: "API接口",
      version: "v2.1",
      updateTime: "2024-01-14 09:15",
      status: 'processing',
      color: "border-l-purple-500"
    },
    {
      id: 3,
      title: "产品库存数据",
      description: "实时产品库存信息，包含商品编码、库存数量、仓库位置、供应商信息等",
      categories: [
        { name: "库存管理", color: "bg-green-100 text-green-800" },
        { name: "供应链", color: "bg-yellow-100 text-yellow-800" }
      ],
      tags: [
        { name: "Excel", color: "bg-gray-100 text-gray-800" },
        { name: "需清洗", color: "bg-red-100 text-red-800" }
      ],
      format: "Excel",
      size: "8.2MB",
      rows: "23,456",
      columns: "18",
      completeness: 72,
      source: "数据库同步",
      version: "v1.0",
      updateTime: "2024-01-13 16:45",
      status: 'failed',
      color: "border-l-green-500"
    }
  ]);

  // 获取所有可用的标签和格式选项
  const availableTags = Array.from(new Set(datasets.flatMap(d => d.tags.map(t => t.name))));
  const availableFormats = Array.from(new Set(datasets.map(d => d.format)));

  const stats = [
    {
      label: "总数据集",
      value: "156",
      icon: Database
    },
    {
      label: "今日上传",
      value: "12",
      icon: Upload
    },
    {
      label: "处理中",
      value: "8",
      icon: Clock
    },
    {
      label: "总存储",
      value: "2.4TB",
      icon: FileText
    }
  ];

  // 筛选和排序逻辑
  const filteredAndSortedDatasets = datasets
    .filter(dataset => {
      const matchesSearch = dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || 
                           (statusFilter === 'active' && dataset.status === 'success') ||
                           (statusFilter === 'processing' && dataset.status === 'processing') ||
                           (statusFilter === 'error' && dataset.status === 'failed');
      const matchesSource = !sourceFilter || 
                           (sourceFilter === 'upload' && dataset.source.includes('上传')) ||
                           (sourceFilter === 'api' && dataset.source.includes('API')) ||
                           (sourceFilter === 'database' && dataset.source.includes('数据库'));
      
      // 高级筛选
      const sizeInMB = parseFloat(dataset.size.replace('MB', ''));
      const rowsCount = parseInt(dataset.rows.replace(/,/g, ''));
      const matchesAdvanced = 
        sizeInMB >= advancedFilters.sizeRange[0] && sizeInMB <= advancedFilters.sizeRange[1] &&
        rowsCount >= advancedFilters.rowsRange[0] && rowsCount <= advancedFilters.rowsRange[1] &&
        dataset.completeness >= advancedFilters.completenessRange[0] && dataset.completeness <= advancedFilters.completenessRange[1] &&
        (advancedFilters.categories.length === 0 || dataset.tags.some(t => advancedFilters.categories.includes(t.name))) &&
        (advancedFilters.formats.length === 0 || advancedFilters.formats.includes(dataset.format));

      return matchesSearch && matchesStatus && matchesSource && matchesAdvanced;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'size':
          aValue = parseFloat(a.size.replace('MB', ''));
          bValue = parseFloat(b.size.replace('MB', ''));
          break;
        case 'rows':
          aValue = parseInt(a.rows.replace(/,/g, ''));
          bValue = parseInt(b.rows.replace(/,/g, ''));
          break;
        default:
          aValue = new Date(a.updateTime);
          bValue = new Date(b.updateTime);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedDatasets.length / itemsPerPage);
  const paginatedDatasets = filteredAndSortedDatasets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 批量选择逻辑
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDatasets([]);
    } else {
      setSelectedDatasets(paginatedDatasets.map(d => d.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectDataset = (id: number) => {
    if (selectedDatasets.includes(id)) {
      setSelectedDatasets(selectedDatasets.filter(datasetId => datasetId !== id));
    } else {
      setSelectedDatasets([...selectedDatasets, id]);
    }
  };

  // 功能处理函数
  const handleSingleDelete = (id: number) => {
    setDeleteTarget({ type: 'single', ids: [id] });
    setIsDeleteConfirmOpen(true);
  };

  const handleBatchDelete = () => {
    setDeleteTarget({ type: 'batch', ids: selectedDatasets });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    toast.success(`已删除 ${deleteTarget.ids.length} 个数据集`);
    setSelectedDatasets([]);
    setIsDeleteConfirmOpen(false);
  };

  const handleEdit = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setEditingDataset(dataset);
      setIsEditDialogOpen(true);
    }
  };

  // 保存编辑的数据集
  const handleSaveEdit = () => {
    if (!editingDataset) return;

    // 更新数据集列表
    setDatasets(prevDatasets => 
      prevDatasets.map(dataset => 
        dataset.id === editingDataset.id 
          ? { ...editingDataset, updateTime: new Date().toLocaleString() }
          : dataset
      )
    );

    toast.success("数据集已更新");
    setIsEditDialogOpen(false);
    setEditingDataset(null);
  };

  const handleCopy = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setCopyingDataset({
        ...dataset,
        title: `${dataset.title}-副本`
      });
      setIsCopyDialogOpen(true);
    }
  };

  // 保存复制的数据集
  const handleSaveCopy = () => {
    if (!copyingDataset) return;

    // 生成新的ID（取当前最大ID + 1）
    const maxId = Math.max(...datasets.map(d => d.id));
    const newDataset = {
      ...copyingDataset,
      id: maxId + 1,
      updateTime: new Date().toLocaleString(),
      status: 'success' as const
    };

    // 添加到数据集列表
    setDatasets(prevDatasets => [...prevDatasets, newDataset]);

    toast.success(`已复制数据集：${newDataset.title}`);
    setIsCopyDialogOpen(false);
    setCopyingDataset(null);
  };

  // 编辑弹窗的标签管理
  const [editNewTagName, setEditNewTagName] = useState('');
  
  // 预定义的标签颜色
  const editTagColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  // 编辑弹窗添加标签
  const addEditTag = () => {
    if (!editNewTagName.trim() || !editingDataset) return;
    
    // 检查是否已存在相同名称的标签
    if (editingDataset.tags.some(tag => tag.name === editNewTagName.trim())) {
      toast.error('标签已存在');
      return;
    }

    const newTag = {
      name: editNewTagName.trim(),
      color: editTagColors[editingDataset.tags.length % editTagColors.length]
    };

    setEditingDataset({
      ...editingDataset,
      tags: [...editingDataset.tags, newTag]
    });
    
    setEditNewTagName('');
  };

  // 编辑弹窗删除标签
  const removeEditTag = (tagName: string) => {
    if (!editingDataset) return;
    
    setEditingDataset({
      ...editingDataset,
      tags: editingDataset.tags.filter(tag => tag.name !== tagName)
    });
  };

  const handleViewVersionHistory = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset) {
      setSelectedDatasetForHistory(dataset);
      setIsVersionHistoryOpen(true);
    }
  };

  const handleViewDataDetail = (id: number) => {
    const dataset = datasets.find(d => d.id === id);
    if (dataset && onOpenDataDetailFullPage) {
      onOpenDataDetailFullPage(dataset);
    }
  };

  const handleDownload = (id: number) => {
    toast.success(`开始下载数据集 ${id}`);
  };

  const handleBatchDownload = () => {
    toast.success(`开始批量下载 ${selectedDatasets.length} 个数据集`);
  };

  const handleBatchArchive = () => {
    toast.success(`已归档 ${selectedDatasets.length} 个数据集`);
    setSelectedDatasets([]);
  };

  const handleRefreshData = () => {
    toast.success("数据已刷新");
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSourceFilter('');
    setSortBy('updateTime');
    setSortOrder('desc');
    setAdvancedFilters({
      sizeRange: [0, 1000],
      rowsRange: [0, 1000000],
      completenessRange: [0, 100],
      dateRange: null,
      categories: [],
      formats: []
    });
    toast.success("筛选条件已重置");
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">数据管理</h1>
          <p className="text-gray-600 mt-2">上传、管理和分析您的数据集，支持多种格式的结构化数据</p>
        </div>
        
        {/* 二级菜单 */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveSubmenu('datasets')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubmenu === 'datasets'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>数据集</span>
          </button>
          <button
            onClick={() => setActiveSubmenu('preprocessing')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubmenu === 'preprocessing'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>数据预处理</span>
          </button>
        </div>
      </div>

      {/* 根据选中的菜单显示不同内容 */}
      {activeSubmenu === 'datasets' && (
        <>
          {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="w-[200px]">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 筛选和搜索工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索数据集..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">所有状态</option>
            <option value="active">活跃</option>
            <option value="processing">处理中</option>
            <option value="error">错误</option>
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">所有来源</option>
            <option value="upload">上传</option>
            <option value="api">API</option>
            <option value="database">数据库</option>
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updateTime">更新时间</option>
            <option value="name">名称</option>
            <option value="size">大小</option>
            <option value="rows">行数</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedFilterOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
          >
            重置
          </Button>
        </div>
      </div>

      {/* 操作工具栏 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setIsLocalUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上传数据集
          </Button>
          <Button variant="outline" onClick={() => setIsDataSubscriptionOpen(true)}>
            <Database className="h-4 w-4 mr-2" />
            新增数据源
          </Button>
          <Button variant="outline" onClick={() => setIsSubscriptionListOpen(true)}>
            <List className="h-4 w-4 mr-2" />
            订阅管理
          </Button>
          {selectedDatasets.length > 0 && (
            <>
              <Button variant="outline" onClick={handleBatchDownload}>
                <Download className="h-4 w-4 mr-2" />
                批量下载
              </Button>
              <Button variant="outline" onClick={handleBatchArchive}>
                <Archive className="h-4 w-4 mr-2" />
                批量归档
              </Button>
              <Button variant="outline" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                批量删除
              </Button>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsColumnSettingsOpen(true)}>
            <Columns className="h-4 w-4" />
          </Button>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 数据展示区域 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDatasets.map((dataset) => (
            <Card key={dataset.id} className={`hover:shadow-lg transition-shadow border-l-4 ${dataset.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedDatasets.includes(dataset.id)}
                      onChange={() => handleSelectDataset(dataset.id)}
                      className="rounded"
                    />
                    <CardTitle className="text-lg">{dataset.title}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(dataset.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(dataset.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSingleDelete(dataset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{dataset.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {dataset.categories.map((category, index) => (
                    <Badge key={index} className={category.color}>
                      {category.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {dataset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className={tag.color}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">格式:</span>
                    <span className="ml-1 font-medium">{dataset.format}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">大小:</span>
                    <span className="ml-1 font-medium">{dataset.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">行数:</span>
                    <span className="ml-1 font-medium">{dataset.rows}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">列数:</span>
                    <span className="ml-1 font-medium">{dataset.columns}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">完整度</span>
                    <span className="font-medium">{dataset.completeness}%</span>
                  </div>
                  <Progress value={dataset.completeness} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDataDetail(dataset.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewVersionHistory(dataset.id)}>
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigateToPreprocessing?.()}>
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(dataset.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant={dataset.status === 'success' ? 'default' : dataset.status === 'processing' ? 'secondary' : 'destructive'}>
                    {dataset.status === 'success' ? '成功' : dataset.status === 'processing' ? '处理中' : '失败'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                {columnSettings.name && <TableHead>名称</TableHead>}
                {columnSettings.description && <TableHead>描述</TableHead>}
                {columnSettings.categories && <TableHead>标签</TableHead>}
                {columnSettings.format && <TableHead>格式</TableHead>}
                {columnSettings.size && <TableHead>大小</TableHead>}
                {columnSettings.rows && <TableHead>行数</TableHead>}
                {columnSettings.columns && <TableHead>列数</TableHead>}
                {columnSettings.completeness && <TableHead>完整度</TableHead>}
                {columnSettings.source && <TableHead>来源</TableHead>}
                {columnSettings.version && <TableHead>版本</TableHead>}
                {columnSettings.updateTime && <TableHead>更新时间</TableHead>}
                {columnSettings.status && <TableHead>状态</TableHead>}
                {columnSettings.actions && <TableHead>操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDatasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedDatasets.includes(dataset.id)}
                      onChange={() => handleSelectDataset(dataset.id)}
                      className="rounded"
                    />
                  </TableCell>
                  {columnSettings.name && (
                    <TableCell className="font-medium">{dataset.title}</TableCell>
                  )}
                  {columnSettings.description && (
                    <TableCell className="max-w-xs truncate">{dataset.description}</TableCell>
                  )}
                  {columnSettings.categories && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dataset.tags.map((tag, index) => (
                          <Badge key={index} className={tag.color}>
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {columnSettings.format && <TableCell>{dataset.format}</TableCell>}
                  {columnSettings.size && <TableCell>{dataset.size}</TableCell>}
                  {columnSettings.rows && <TableCell>{dataset.rows}</TableCell>}
                  {columnSettings.columns && <TableCell>{dataset.columns}</TableCell>}
                  {columnSettings.completeness && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={dataset.completeness} className="h-2 w-16" />
                        <span className="text-sm">{dataset.completeness}%</span>
                      </div>
                    </TableCell>
                  )}
                  {columnSettings.source && <TableCell>{dataset.source}</TableCell>}
                  {columnSettings.version && <TableCell>{dataset.version}</TableCell>}
                  {columnSettings.updateTime && <TableCell>{dataset.updateTime}</TableCell>}
                  {columnSettings.status && (
                    <TableCell>
                      <Badge variant={dataset.status === 'success' ? 'default' : dataset.status === 'processing' ? 'secondary' : 'destructive'}>
                        {dataset.status === 'success' ? '成功' : dataset.status === 'processing' ? '处理中' : '失败'}
                      </Badge>
                    </TableCell>
                  )}
                  {columnSettings.actions && (
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDataDetail(dataset.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleViewVersionHistory(dataset.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedDatasetForPreprocessing(dataset);
                          setIsDataPreprocessingOpen(true);
                        }}>
                          <Zap className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(dataset.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(dataset.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(dataset.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSingleDelete(dataset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 分页控件 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            显示 {(currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, filteredAndSortedDatasets.length)} 条，共 {filteredAndSortedDatasets.length} 条
          </span>
          <select
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <span className="flex items-center px-3 py-1 text-sm">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
        </>
      )}

      {/* 高级筛选弹窗 */}
      {isAdvancedFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">高级筛选</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdvancedFilterOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* 数据大小范围 */}
              <div>
                <label className="block text-sm font-medium mb-2">数据大小 (MB)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="最小值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.sizeRange[0]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      sizeRange: [Number(e.target.value), prev.sizeRange[1]]
                    }))}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="最大值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.sizeRange[1]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      sizeRange: [prev.sizeRange[0], Number(e.target.value)]
                    }))}
                  />
                </div>
              </div>

              {/* 行数范围 */}
              <div>
                <label className="block text-sm font-medium mb-2">行数</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="最小值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.rowsRange[0]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      rowsRange: [Number(e.target.value), prev.rowsRange[1]]
                    }))}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="最大值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.rowsRange[1]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      rowsRange: [prev.rowsRange[0], Number(e.target.value)]
                    }))}
                  />
                </div>
              </div>

              {/* 完整度范围 */}
              <div>
                <label className="block text-sm font-medium mb-2">完整度 (%)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最小值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.completenessRange[0]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      completenessRange: [Number(e.target.value), prev.completenessRange[1]]
                    }))}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最大值"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={advancedFilters.completenessRange[1]}
                    onChange={(e) => setAdvancedFilters(prev => ({
                      ...prev,
                      completenessRange: [prev.completenessRange[0], Number(e.target.value)]
                    }))}
                  />
                </div>
              </div>

              {/* 标签筛选 */}
              <div>
                <label className="block text-sm font-medium mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.categories.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvancedFilters(prev => ({
                              ...prev,
                              categories: [...prev.categories, tag]
                            }));
                          } else {
                            setAdvancedFilters(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c !== tag)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 格式筛选 */}
              <div>
                <label className="block text-sm font-medium mb-2">格式</label>
                <div className="flex flex-wrap gap-2">
                  {availableFormats.map(format => (
                    <label key={format} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={advancedFilters.formats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvancedFilters(prev => ({
                              ...prev,
                              formats: [...prev.formats, format]
                            }));
                          } else {
                            setAdvancedFilters(prev => ({
                              ...prev,
                              formats: prev.formats.filter(f => f !== format)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setAdvancedFilters({
                    sizeRange: [0, 1000],
                    rowsRange: [0, 1000000],
                    completenessRange: [0, 100],
                    dateRange: null,
                    categories: [],
                    formats: []
                  });
                }}
              >
                重置
              </Button>
              <Button onClick={() => setIsAdvancedFilterOpen(false)}>
                应用筛选
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 列设置弹窗 */}
      {isColumnSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">列设置</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsColumnSettingsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(columnSettings).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setColumnSettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  <span className="text-sm">
                    {key === 'id' ? 'ID' :
                     key === 'name' ? '名称' :
                     key === 'description' ? '描述' :
                     key === 'categories' ? '标签' :
                     key === 'format' ? '格式' :
                     key === 'size' ? '大小' :
                     key === 'rows' ? '行数' :
                     key === 'columns' ? '列数' :
                     key === 'completeness' ? '完整度' :
                     key === 'source' ? '来源' :
                     key === 'version' ? '版本' :
                     key === 'updateTime' ? '更新时间' :
                     key === 'status' ? '状态' :
                     key === 'actions' ? '操作' : key}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                 variant="outline"
                 onClick={() => {
                   setColumnSettings({
                     id: true,
                     name: true,
                     description: true,
                     categories: true,
                     format: true,
                     size: true,
                     rows: true,
                     columns: true,
                     completeness: true,
                     source: true,
                     version: true,
                     updateTime: true,
                     status: true,
                     actions: true
                   });
                 }}
               >
                 全选
               </Button>
              <Button onClick={() => setIsColumnSettingsOpen(false)}>
                确定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">确认删除</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {deleteTarget.type === 'single' 
                ? '确定要删除这个数据集吗？此操作不可撤销。'
                : `确定要删除选中的 ${deleteTarget.ids.length} 个数据集吗？此操作不可撤销。`
              }
            </p>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 版本历史页面 */}
      {isVersionHistoryOpen && selectedDatasetForHistory && (
        <VersionHistory
          datasetId={selectedDatasetForHistory.id.toString()}
          datasetName={selectedDatasetForHistory.title}
          onBack={() => {
            setIsVersionHistoryOpen(false);
            setSelectedDatasetForHistory(null);
          }}
        />
      )}

      {/* 数据上传对话框 */}
      <DataUpload
        isOpen={isLocalUploadDialogOpen}
        onClose={() => {
          setIsLocalUploadDialogOpen(false);
          if (onUploadDialogClose) {
            onUploadDialogClose();
          }
        }}
        onUploadSuccess={(datasetId) => {
          toast.success('数据上传成功', {
            description: `数据集 ${datasetId} 已成功创建`
          });
          // 刷新数据列表
          handleRefreshData();
        }}
      />

      {/* 数据订阅对话框 */}
      <DataSubscription
        isOpen={isDataSubscriptionOpen}
        onClose={() => setIsDataSubscriptionOpen(false)}
        onSubscriptionSuccess={(subscriptionId) => {
          toast.success('数据源创建成功', {
            description: `数据源 ${subscriptionId} 已成功创建并开始同步`
          });
          // 刷新数据列表
          handleRefreshData();
        }}
      />

      {/* 订阅管理对话框 */}
      <SubscriptionList
        isOpen={isSubscriptionListOpen}
        onClose={() => setIsSubscriptionListOpen(false)}
      />

      {/* 数据预处理对话框 */}
      <DataPreprocessing
        isOpen={isDataPreprocessingOpen}
        onClose={() => {
          setIsDataPreprocessingOpen(false);
          setSelectedDatasetForPreprocessing(null);
        }}
        datasetId={selectedDatasetForPreprocessing?.id?.toString()}
        mode={preprocessingMode}
      />

      {/* 数据详情对话框 */}
      {selectedDatasetForDetail && (
        <DataDetailDialog
          isOpen={isDataDetailDialogOpen}
          onClose={() => {
            setIsDataDetailDialogOpen(false);
            setSelectedDatasetForDetail(null);
          }}
          dataset={{
            id: selectedDatasetForDetail.id.toString(),
            name: selectedDatasetForDetail.title,
            type: selectedDatasetForDetail.type || 'IoT传感器',
            source: selectedDatasetForDetail.source,
            size: selectedDatasetForDetail.size,
            version: selectedDatasetForDetail.version,
            updateTime: selectedDatasetForDetail.updateTime,
            status: selectedDatasetForDetail.status,
            description: selectedDatasetForDetail.description,
            fieldCount: selectedDatasetForDetail.fieldCount || parseInt(selectedDatasetForDetail.columns) || 5,
            sampleCount: selectedDatasetForDetail.sampleCount || parseInt(selectedDatasetForDetail.rows.replace(/,/g, '')) || 125000,
            completeness: selectedDatasetForDetail.completeness
          }}
        />
      )}

      {/* 编辑数据集对话框 */}
      {editingDataset && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑数据集</DialogTitle>
              <DialogDescription>
                修改数据集的基本信息和配置
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">数据集名称</Label>
                  <Input
                    id="edit-title"
                    value={editingDataset.title}
                    onChange={(e) => setEditingDataset({
                      ...editingDataset,
                      title: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-source">数据源</Label>
                  <Select
                    value={editingDataset.source}
                    onValueChange={(value) => setEditingDataset({
                      ...editingDataset,
                      source: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="上传">上传</SelectItem>
                      <SelectItem value="订阅">订阅</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="数据库">数据库</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">描述</Label>
                <Textarea
                  id="edit-description"
                  value={editingDataset.description}
                  onChange={(e) => setEditingDataset({
                    ...editingDataset,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>

              {/* 数据标签 */}
              <div className="space-y-2">
                <Label>数据标签</Label>
                <div className="space-y-3">
                  {/* 标签输入 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入标签名称"
                      value={editNewTagName}
                      onChange={(e) => setEditNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEditTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addEditTag}
                      disabled={!editNewTagName.trim()}
                      size="sm"
                    >
                      添加
                    </Button>
                  </div>
                  
                  {/* 已添加的标签 */}
                  {editingDataset.tags && editingDataset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editingDataset.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                          style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                        >
                          {tag.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeEditTag(tag.name)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-format">数据格式</Label>
                  <Select
                    value={editingDataset.format}
                    onValueChange={(value) => setEditingDataset({
                      ...editingDataset,
                      format: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="Excel">Excel</SelectItem>
                      <SelectItem value="Parquet">Parquet</SelectItem>
                      <SelectItem value="XML">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-version">版本</Label>
                  <Input
                    id="edit-version"
                    value={editingDataset.version}
                    onChange={(e) => setEditingDataset({
                      ...editingDataset,
                      version: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingDataset(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 复制数据集对话框 */}
      {isCopyDialogOpen && copyingDataset && (
        <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>复制数据集</DialogTitle>
              <DialogDescription>
                创建数据集的副本
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="copy-title">数据集名称</Label>
                <Input
                  id="copy-title"
                  value={copyingDataset.title}
                  onChange={(e) => setCopyingDataset({
                    ...copyingDataset,
                    title: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="copy-description">描述</Label>
                <Textarea
                  id="copy-description"
                  value={copyingDataset.description}
                  onChange={(e) => setCopyingDataset({
                    ...copyingDataset,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCopyDialogOpen(false);
                    setCopyingDataset(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleSaveCopy}>
                  创建副本
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 数据预处理内容 */}
      {activeSubmenu === 'preprocessing' && (
        <div className="space-y-6">
          <DataPreprocessing
            isOpen={true}
            onClose={() => {}}
            datasetId={selectedDatasetForPreprocessing?.id?.toString()}
            mode={preprocessingMode}
          />
        </div>
      )}
    </div>
  );
}