import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
  Download,
  Mic,
  Square
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
  permission: 'team' | 'public';
  mode: 'traditional' | 'auto';
  tags: Array<{ name: string; color: string }>;
}

export function DataUpload({ isOpen, onClose, onUploadSuccess }: DataUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    projectId: '',
    permission: 'team',
    mode: 'traditional',
    tags: []
  });
  const [isUploading, setIsUploading] = useState(false);
  // 语义指令（仅 自动模式）
  const [semanticInstruction, setSemanticInstruction] = useState('');
  const [llmProcessing, setLlmProcessing] = useState(false);
  const [llmResult, setLlmResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语音指令输入相关状态与引用（自动模式）
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

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
      permission: 'team',
      mode: 'traditional',
      tags: []
    });
    setIsUploading(false);
    setIsDragOver(false);
    // 重置语音模块
    try {
      setSpeechText('');
      setSpeechStatus('idle');
      if (isListening) {
        stopVoiceInput();
      }
    } catch {}
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

  // 调用大模型：根据语义指令生成自动化处理方案（示例，支持 OpenAI 兼容接口或本地模拟）
  const callLLMForProcessing = useCallback(async (instruction: string) => {
    const firstParsed = files.find(f => f.parsedData);
    const schemaSummary = firstParsed?.parsedData
      ? `字段(${firstParsed.parsedData.fields.length}): ` +
        firstParsed.parsedData.fields.map(f => `${f.name}:${f.type}`).join(', ') +
        `；记录数: ${firstParsed.parsedData.rowCount}`
      : '尚未解析到结构信息（将以通用策略处理）。';

    setLlmProcessing(true);
    setLlmResult('');
    let prompt = instruction?.trim() ? instruction.trim() : '对上传的数据进行质量分析：去重、处理缺失值、检测异常值，并生成质量报告与汇总统计。';
    try {
      const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
      const baseUrl = (import.meta as any).env?.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = (import.meta as any).env?.VITE_OPENAI_MODEL || 'gpt-4o-mini';

      if (!apiKey) {
        // 无密钥时做本地模拟
        await new Promise(r => setTimeout(r, 1200));
        setLlmResult(
          `已根据指令自动生成处理方案（模拟）：\n` +
          `1) 去重并处理缺失值（均值/众数/前向填充）；\n` +
          `2) 异常值检测（IQR/Z-Score），标记并输出报告；\n` +
          `3) 依据业务字段进行聚合统计与报表导出。\n` +
          `指令: ${prompt}\n上下文: ${schemaSummary}`
        );
        toast.info('已使用本地模拟处理（未配置大模型 API 密钥）');
      } else {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: '你是数据工程与分析助手，请根据指令生成可执行的数据处理计划，用清晰的步骤说明，并简要解释每一步目的。' },
              { role: 'user', content: `指令: ${prompt}\n数据上下文: ${schemaSummary}\n请输出可执行的处理步骤与预期输出（以分点列表呈现）。` }
            ],
            temperature: 0.2
          })
        });
        if (!resp.ok) throw new Error(`LLM 请求失败: ${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '无返回内容';
        setLlmResult(content);
        toast.success('已根据语义指令生成处理方案');
      }
    } catch (err: any) {
      console.error(err);
      setLlmResult(`处理失败：${err?.message || '未知错误'}`);
      toast.error('语义指令处理失败');
    } finally {
      setLlmProcessing(false);
    }
  }, [files]);

  // 开始上传
  const handleStartUpload = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('请输入数据集名称');
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
  }, [formData, files, uploadFile, onUploadSuccess, onClose, resetState, callLLMForProcessing, semanticInstruction]);

  // 关闭对话框
  const handleClose = useCallback(() => {
    if (isUploading) {
      toast.warning('上传进行中，请稍候');
      return;
    }
    // 关闭对话框时停止语音采集与识别
    try {
      if (isListening) {
        stopVoiceInput();
      }
    } catch (e) {
      // 忽略关闭时的清理异常
    }
    onClose();
    resetState();
  }, [isUploading, onClose, resetState, isListening]);

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

  // 初始化语音识别（Web Speech API）
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('当前浏览器不支持语音识别', { description: '建议使用最新的 Chrome/Edge 浏览器' });
      setSpeechStatus('error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const results = event.results;
      let transcript = '';
      for (let i = event.resultIndex; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      setSpeechText(prev => {
        // 只保留最近的 1000 字符，避免无限增长
        const combined = (prev + ' ' + transcript).trim();
        return combined.length > 1000 ? combined.slice(combined.length - 1000) : combined;
      });
    };

    recognition.onstart = () => setSpeechStatus('listening');
    recognition.onend = () => {
      // 如果仍在监听，自动重启
      if (isListening) {
        try { recognition.start(); } catch {}
      } else {
        setSpeechStatus('idle');
      }
    };
    recognition.onerror = () => setSpeechStatus('error');

    recognitionRef.current = recognition;
  }, [isListening]);

  // 波形绘制
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = 96;
    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0-255 -> around 1
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      animationRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  // 开始语音输入
  const startVoiceInput = useCallback(async () => {
    if (isListening) return;
    try {
      setSpeechText('');
      setSpeechStatus('processing');
      // 麦克风采集
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      // 初始化识别并开始
      initSpeechRecognition();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }

      setIsListening(true);
      setSpeechStatus('listening');
      drawWaveform();
    } catch (err) {
      console.error(err);
      setSpeechStatus('error');
      toast.error('无法启动语音输入', { description: '请检查麦克风权限设置' });
    }
  }, [isListening, initSpeechRecognition, drawWaveform]);

  // 停止语音输入
  const stopVoiceInput = useCallback(() => {
    try {
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setSpeechStatus('idle');
    } catch {}
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="name">数据集名称 *</Label>
              <Input
                id="name"
                placeholder="请输入数据集名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">所属项目 *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, projectId: value }))}
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
                onValueChange={(value: 'team' | 'public') => 
                  setFormData(prev => ({ ...prev, permission: value }))
                }
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              placeholder="请输入数据集的详细描述，包括数据内容、用途等信息"
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


          {/* 自动模式：原型图示例 + 语音指令输入模块 */}
          {formData.mode === 'auto' && (
            <div className="space-y-4">
              {/* 原型图示例区块 */}
              <Card>
                <CardHeader>
                  <CardTitle>原型图示例（流程预览）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-sm font-medium">数据分析</div>
                      <p className="text-xs text-gray-600 mt-1">字段类型识别、缺失值/异常值检测</p>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-sm font-medium">策略选择</div>
                      <p className="text-xs text-gray-600 mt-1">按质量问题自动匹配最佳清洗方案</p>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-sm font-medium">执行清洗</div>
                      <p className="text-xs text-gray-600 mt-1">规范化、补全、去重、异常修正</p>
                    </div>
                    <div className="p-3 rounded-md border bg-white">
                      <div className="text-sm font-medium">查看结果</div>
                      <p className="text-xs text-gray-600 mt-1">报告与预览，支持回滚与导出</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">自动模式会自动分析并清洗数据，您也可以通过语音指令微调策略。</p>
                </CardContent>
              </Card>

              {/* 语音指令输入模块 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>语音指令输入</CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={
                      speechStatus === 'listening' ? 'text-green-600' :
                      speechStatus === 'processing' ? 'text-blue-600' :
                      speechStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                    }>
                      {speechStatus === 'idle' && '空闲'}
                      {speechStatus === 'listening' && '监听中'}
                      {speechStatus === 'processing' && '初始化中'}
                      {speechStatus === 'error' && '异常'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={startVoiceInput}
                      disabled={isListening}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" /> 开始录音
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopVoiceInput}
                      disabled={!isListening}
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" /> 停止
                    </Button>
                    <span className="text-xs text-gray-500">支持实时识别与显示，中文优先。</span>
                  </div>

                  {/* 波形可视化 */}
                  <div className="rounded-md border bg-white p-2">
                    <canvas ref={waveformCanvasRef} className="w-full h-24" />
                  </div>

                  {/* 实时识别文本 */}
                  <div className="space-y-2">
                    <Label>实时识别文本</Label>
                    <Textarea
                      value={speechText}
                      readOnly
                      placeholder="语音识别内容将实时显示在此，您可以继续录音或点击停止。"
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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

          {/* 已按需求移除 Solo 模式下的语义指令处理结果展示 */}

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