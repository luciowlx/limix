import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface DataUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (datasetId: string) => void;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'parsing' | 'success' | 'error';
  error?: string;
  parsedData?: {
    fields: Array<{
      name: string;
      type: string;
      sampleValues: string[];
      nullCount: number;
      uniqueCount: number;
    }>;
    rowCount: number;
    preview: Array<Record<string, any>>;
  };
}

interface FormData {
  name: string;
  description: string;
  projectId: string; // 所属项目（必填）
  permission: 'private' | 'team' | 'public';
  mode: 'traditional' | 'solo';
  tags: Array<{ name: string; color: string }>;
}

export function DataUpload({ isOpen, onClose, onUploadSuccess }: DataUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    projectId: '',
    permission: 'private',
    mode: 'traditional',
    tags: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 模拟项目列表（后续可替换为真实项目数据）
  const mockProjects = [
    { id: 'proj_001', name: '钢铁缺陷预测' },
    { id: 'proj_002', name: '电力能源预测' },
    { id: 'proj_003', name: '工艺时序预测' },
    { id: 'proj_004', name: '设备故障预测' }
  ];

  const getProjectName = (id: string) => mockProjects.find(p => p.id === id)?.name || '未选择项目';

  // 重置状态
  const resetState = useCallback(() => {
    setFiles([]);
    setFormData({
      name: '',
      description: '',
      projectId: '',
      permission: 'private',
      mode: 'traditional',
      tags: []
    });
    setIsUploading(false);
    setIsDragOver(false);
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));

    // 验证文件类型和大小
    const validFiles = newFiles.filter(fileItem => {
      const { file } = fileItem;
      const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
      const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
      const isValidSize = file.size <= 1024 * 1024 * 1024; // 1GB

      if (!isValidType) {
        toast.error(`文件 ${file.name} 格式不支持`, {
          description: '支持的格式：CSV、Excel、JSON'
        });
        return false;
      }

      if (!isValidSize) {
        toast.error(`文件 ${file.name} 大小超过限制`, {
          description: '文件大小不能超过 1GB'
        });
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // 模拟文件上传和解析
  const uploadFile = useCallback(async (fileItem: UploadFile) => {
    const { id, file } = fileItem;

    // 更新状态为上传中
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'uploading' as const } : f
    ));

    // 模拟上传进度
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress } : f
      ));
    }

    // 更新状态为解析中
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'parsing' as const } : f
    ));

    // 模拟文件解析
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟解析结果
    const mockParsedData = {
      fields: [
        {
          name: 'id',
          type: 'integer',
          sampleValues: ['1', '2', '3'],
          nullCount: 0,
          uniqueCount: 1000
        },
        {
          name: 'name',
          type: 'string',
          sampleValues: ['张三', '李四', '王五'],
          nullCount: 5,
          uniqueCount: 995
        },
        {
          name: 'age',
          type: 'integer',
          sampleValues: ['25', '30', '35'],
          nullCount: 2,
          uniqueCount: 50
        },
        {
          name: 'email',
          type: 'string',
          sampleValues: ['zhang@example.com', 'li@example.com', 'wang@example.com'],
          nullCount: 10,
          uniqueCount: 990
        }
      ],
      rowCount: 1000,
      preview: [
        { id: 1, name: '张三', age: 25, email: 'zhang@example.com' },
        { id: 2, name: '李四', age: 30, email: 'li@example.com' },
        { id: 3, name: '王五', age: 35, email: 'wang@example.com' }
      ]
    };

    // 更新状态为成功
    setFiles(prev => prev.map(f => 
      f.id === id ? { 
        ...f, 
        status: 'success' as const, 
        parsedData: mockParsedData 
      } : f
    ));
  }, []);

  // 重试上传
  const retryUpload = useCallback((fileId: string) => {
    const fileItem = files.find(f => f.id === fileId);
    if (fileItem) {
      uploadFile(fileItem);
    }
  }, [files, uploadFile]);

  // 标签管理
  const [newTagName, setNewTagName] = useState('');
  
  // 预定义的标签颜色
  const tagColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  // 添加标签
  const addTag = useCallback(() => {
    if (!newTagName.trim()) return;
    
    // 检查是否已存在相同名称的标签
    if (formData.tags.some(tag => tag.name === newTagName.trim())) {
      toast.error('标签已存在');
      return;
    }

    const newTag = {
      name: newTagName.trim(),
      color: tagColors[formData.tags.length % tagColors.length]
    };

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag]
    }));
    
    setNewTagName('');
  }, [newTagName, formData.tags, tagColors]);

  // 删除标签
  const removeTag = useCallback((tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }));
  }, []);

  // 开始上传
  const handleStartUpload = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('请输入数据源名称');
      return;
    }

    if (!formData.projectId) {
      toast.error('请选择所属项目');
      return;
    }

    if (files.length === 0) {
      toast.error('请选择要上传的文件');
      return;
    }

    setIsUploading(true);

    try {
      // 并行上传所有文件
      await Promise.all(files.map(uploadFile));
      
      toast.success('数据上传成功', {
        description: `已成功上传 ${files.length} 个文件`
      });

      // 调用成功回调
      if (onUploadSuccess) {
        onUploadSuccess('dataset-' + Date.now());
      }

      // 延迟关闭对话框，让用户看到成功状态
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);

    } catch (error) {
      toast.error('上传失败', {
        description: '请检查网络连接后重试'
      });
    } finally {
      setIsUploading(false);
    }
  }, [formData, files, uploadFile, onUploadSuccess, onClose, resetState]);

  // 关闭对话框
  const handleClose = useCallback(() => {
    if (isUploading) {
      toast.warning('上传进行中，请稍候');
      return;
    }
    onClose();
    resetState();
  }, [isUploading, onClose, resetState]);

  // 获取文件状态图标
  const getFileStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'parsing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // 获取文件状态文本
  const getFileStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return '上传中';
      case 'parsing':
        return '解析中';
      case 'success':
        return '完成';
      case 'error':
        return '失败';
      default:
        return '等待上传';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>数据上传</DialogTitle>
          <DialogDescription>
            支持 CSV、Excel、JSON 格式，单文件最大 1GB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息表单 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">数据源名称 *</Label>
              <Input
                id="name"
                placeholder="请输入数据源名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">所属项目 *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择所属项目" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission">权限设置</Label>
              <Select
                value={formData.permission}
                onValueChange={(value: 'private' | 'team' | 'public') => 
                  setFormData(prev => ({ ...prev, permission: value }))
              }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">私有</SelectItem>
                  <SelectItem value="team">团队</SelectItem>
                  <SelectItem value="public">公开</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 可见性预览与说明 */}
          <div className="rounded-md border p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              {formData.permission === 'public' ? (
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">公开数据</Badge>
              ) : (
                <Badge variant="outline" className="border-purple-300 text-purple-700">项目内数据</Badge>
              )}
              <span className="text-sm text-gray-700">
                {formData.permission === 'public'
                  ? '公开权限将允许非项目成员查看该数据（覆盖项目归属限制）'
                  : `仅项目“${getProjectName(formData.projectId)}”成员可见`}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              注意：所属项目为必填项；默认仅对项目成员可见；将权限设置为“公开”后，任何用户均可查看。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="请输入数据源的详细描述，包括数据内容、用途等信息"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addTag}
                  disabled={!newTagName.trim()}
                  size="sm"
                >
                  添加
                </Button>
              </div>
              
              {/* 已添加的标签 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                      style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                    >
                      {tag.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeTag(tag.name)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>处理模式</Label>
            <RadioGroup
              value={formData.mode}
              onValueChange={(value: 'traditional' | 'solo') => 
                setFormData(prev => ({ ...prev, mode: value }))
              }
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="traditional" id="traditional" />
                <Label htmlFor="traditional">传统模式（手动配置清洗规则）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solo" id="solo" />
                <Label htmlFor="solo">Solo模式（自动清洗）</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 文件上传区域 */}
          <div className="space-y-4">
            <Label>文件上传</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  拖拽文件到此处，或
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    点击选择文件
                  </Button>
                </p>
                <p className="text-sm text-gray-500">
                  支持 CSV、Excel、JSON 格式，单文件最大 1GB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-4">
              <Label>文件列表</Label>
              <div className="space-y-3">
                {files.map((fileItem) => (
                  <Card key={fileItem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getFileStatusIcon(fileItem.status)}
                          <div>
                            <p className="font-medium">{fileItem.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB • {getFileStatusText(fileItem.status)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {fileItem.status === 'error' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryUpload(fileItem.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              重试
                            </Button>
                          )}
                          {fileItem.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(fileItem.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 进度条 */}
                      {(fileItem.status === 'uploading' || fileItem.status === 'parsing') && (
                        <div className="space-y-2">
                          <Progress value={fileItem.progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {fileItem.status === 'uploading' 
                              ? `上传进度: ${fileItem.progress}%` 
                              : '正在解析文件结构...'}
                          </p>
                        </div>
                      )}

                      {/* 错误信息 */}
                      {fileItem.status === 'error' && fileItem.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                          {fileItem.error}
                        </div>
                      )}

                      {/* 解析结果 */}
                      {fileItem.status === 'success' && fileItem.parsedData && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">解析结果</h4>
                            <Badge variant="secondary">
                              {fileItem.parsedData.rowCount} 行 • {fileItem.parsedData.fields.length} 列
                            </Badge>
                          </div>
                          
                          {/* 字段信息 */}
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>字段名</TableHead>
                                  <TableHead>类型</TableHead>
                                  <TableHead>缺失值</TableHead>
                                  <TableHead>唯一值</TableHead>
                                  <TableHead>示例</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {fileItem.parsedData.fields.map((field, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{field.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{field.type}</Badge>
                                    </TableCell>
                                    <TableCell>{field.nullCount}</TableCell>
                                    <TableCell>{field.uniqueCount}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                      {field.sampleValues.join(', ')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* 数据预览 */}
                          <div className="space-y-2">
                            <h5 className="font-medium">数据预览</h5>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {fileItem.parsedData.fields.map((field) => (
                                      <TableHead key={field.name}>{field.name}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {fileItem.parsedData.preview.map((row, index) => (
                                    <TableRow key={index}>
                                      {fileItem.parsedData!.fields.map((field) => (
                                        <TableCell key={field.name}>
                                          {row[field.name]?.toString() || '-'}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              取消
            </Button>
            <Button onClick={handleStartUpload} disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  开始上传
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}