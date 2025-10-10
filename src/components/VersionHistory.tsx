import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowUpDown, Search, Eye, GitCompare, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import VersionDetail from './VersionDetail';
import VersionCompare from './VersionCompare';

interface Version {
  id: string;
  versionNumber: string;
  source: '上传' | '订阅' | '清洗';
  createTime: string;
  creator: string;
  size: string;
  status: '成功' | '失败';
  description?: string;
  fieldCount: number;
  sampleCount: number;
  missingRate: number;
  anomalyRate: number;
  rules?: string[];
}

interface VersionHistoryProps {
  datasetId: string;
  datasetName: string;
  onBack: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ datasetId, datasetName, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<Version | null>(null);
  const [isVersionDetailOpen, setIsVersionDetailOpen] = useState(false);
  const [selectedVersionForDetail, setSelectedVersionForDetail] = useState<Version | null>(null);
  const [isVersionCompareOpen, setIsVersionCompareOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[Version, Version] | null>(null);

  // 模拟版本数据
  const [versions] = useState<Version[]>([
    {
      id: '1',
      versionNumber: 'v1.0',
      source: '上传',
      createTime: '2024-01-15 10:30:00',
      creator: '张三',
      size: '2.5MB',
      status: '成功',
      description: '初始版本',
      fieldCount: 15,
      sampleCount: 10000,
      missingRate: 5.2,
      anomalyRate: 2.1,
      rules: ['缺失值填充', '异常值处理']
    },
    {
      id: '2',
      versionNumber: 'v1.1',
      source: '清洗',
      createTime: '2024-01-16 14:20:00',
      creator: '李四',
      size: '2.3MB',
      status: '成功',
      description: '数据清洗后版本',
      fieldCount: 15,
      sampleCount: 9800,
      missingRate: 0.8,
      anomalyRate: 0.5,
      rules: ['缺失值填充', '异常值处理', '数据标准化']
    },
    {
      id: '3',
      versionNumber: 'v1.2',
      source: '订阅',
      createTime: '2024-01-17 09:15:00',
      creator: '王五',
      size: '2.8MB',
      status: '成功',
      description: '订阅更新版本',
      fieldCount: 16,
      sampleCount: 11200,
      missingRate: 3.1,
      anomalyRate: 1.8,
      rules: ['自动同步']
    },
    {
      id: '4',
      versionNumber: 'v1.3',
      source: '清洗',
      createTime: '2024-01-18 16:45:00',
      creator: '赵六',
      size: '0MB',
      status: '失败',
      description: '清洗失败',
      fieldCount: 0,
      sampleCount: 0,
      missingRate: 0,
      anomalyRate: 0,
      rules: []
    }
  ]);

  // 筛选和排序逻辑
  const filteredVersions = versions
    .filter(version => {
      const matchesSearch = version.versionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           version.creator.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || version.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || version.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Version];
      let bValue: any = b[sortBy as keyof Version];
      
      if (sortBy === 'createTime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetail = (version: Version) => {
    setSelectedVersionForDetail(version);
    setIsVersionDetailOpen(true);
  };

  const handleCompare = () => {
    if (selectedVersions.length !== 2) {
      toast.error('请选择两个版本进行对比');
      return;
    }
    
    const version1 = versions.find(v => v.id === selectedVersions[0]);
    const version2 = versions.find(v => v.id === selectedVersions[1]);
    
    if (version1 && version2) {
      setCompareVersions([version1, version2]);
      setIsVersionCompareOpen(true);
    }
  };

  const handleRollback = (version: Version) => {
    setRollbackVersion(version);
    setIsRollbackDialogOpen(true);
  };

  const confirmRollback = () => {
    if (rollbackVersion) {
      toast.success(`已回退到版本 ${rollbackVersion.versionNumber}`);
      setIsRollbackDialogOpen(false);
      setRollbackVersion(null);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === '成功' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const variants = {
      '上传': 'secondary',
      '订阅': 'outline',
      '清洗': 'default'
    } as const;
    
    return (
      <Badge variant={variants[source as keyof typeof variants]}>
        {source}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">版本历史</h1>
            <p className="text-gray-600">{datasetName}</p>
          </div>
        </div>
        <Button 
          onClick={handleCompare}
          disabled={selectedVersions.length !== 2}
        >
          <GitCompare className="h-4 w-4 mr-2" />
          版本对比
        </Button>
      </div>

      {/* 筛选工具栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索版本号或创建人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="成功">成功</SelectItem>
                <SelectItem value="失败">失败</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="上传">上传</SelectItem>
                <SelectItem value="订阅">订阅</SelectItem>
                <SelectItem value="清洗">清洗</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 版本列表 */}
      <Card>
        <CardHeader>
          <CardTitle>版本列表 ({filteredVersions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedVersions.length === filteredVersions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVersions(filteredVersions.map(v => v.id));
                      } else {
                        setSelectedVersions([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('versionNumber')}
                >
                  版本号 <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>来源方式</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('createTime')}
                >
                  创建时间 <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>创建人</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('size')}
                >
                  数据大小 <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVersions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVersions([...selectedVersions, version.id]);
                        } else {
                          setSelectedVersions(selectedVersions.filter(id => id !== version.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{version.versionNumber}</TableCell>
                  <TableCell>{getSourceBadge(version.source)}</TableCell>
                  <TableCell>{version.createTime}</TableCell>
                  <TableCell>{version.creator}</TableCell>
                  <TableCell>{version.size}</TableCell>
                  <TableCell>{getStatusBadge(version.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(version)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRollback(version)}
                        disabled={version.status === '失败'}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 版本对比弹窗 */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>版本对比</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            {selectedVersions.slice(0, 2).map((versionId, index) => {
              const version = versions.find(v => v.id === versionId);
              if (!version) return null;
              
              return (
                <div key={versionId} className="space-y-4">
                  <h3 className="font-semibold text-lg">{version.versionNumber}</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>来源方式:</span>
                        <span>{version.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>创建时间:</span>
                        <span>{version.createTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>创建人:</span>
                        <span>{version.creator}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">统计信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>字段数:</span>
                        <span className={index === 1 && version.fieldCount !== versions.find(v => v.id === selectedVersions[0])?.fieldCount ? 'text-yellow-600 font-semibold' : ''}>
                          {version.fieldCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>样本数:</span>
                        <span>{version.sampleCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>缺失比例:</span>
                        <span>{version.missingRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>异常比例:</span>
                        <span>{version.anomalyRate}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">处理规则</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {version.rules?.map((rule, ruleIndex) => (
                          <div key={ruleIndex} className="text-sm">{rule}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 版本回退弹窗 */}
      <Dialog open={isRollbackDialogOpen} onOpenChange={setIsRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>版本回退确认</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>确认要回退到版本 <strong>{rollbackVersion?.versionNumber}</strong> 吗？</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>注意：</strong>回退将新建版本，不会覆盖现有版本。
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRollbackDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={confirmRollback}>
                确认回退
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 版本详情组件 */}
      {isVersionDetailOpen && selectedVersionForDetail && (
        <VersionDetail
          version={selectedVersionForDetail}
          datasetName={datasetName}
          onBack={() => setIsVersionDetailOpen(false)}
        />
      )}

      {/* 版本对比组件 */}
      {isVersionCompareOpen && compareVersions && (
        <VersionCompare
          version1={compareVersions[0]}
          version2={compareVersions[1]}
          datasetName={datasetName}
          onBack={() => setIsVersionCompareOpen(false)}
        />
      )}
    </div>
  );
};

export default VersionHistory;