import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Users, 
  Calendar, 
  Database, 
  CheckCircle, 
  Brain, 
  Upload, 
  BarChart3, 
  TrendingUp,
  FileText,
  Settings,
  Play,
  Download
} from 'lucide-react';

interface ProjectDetailCardsProps {
  project: any;
  mode: 'traditional' | 'solo';
  onNavigateToData?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToModels?: () => void;
  onQuickPredict?: () => void;
  onViewReports?: () => void;
}

export function ProjectDetailCards({ 
  project, 
  mode, 
  onNavigateToData,
  onNavigateToTasks,
  onNavigateToModels,
  onQuickPredict,
  onViewReports
}: ProjectDetailCardsProps) {
  
  if (mode === 'traditional') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息卡片 */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">名称:</span>
                  <span className="text-sm font-medium">{project?.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">描述:</span>
                  <span className="text-sm">{project?.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">周期:</span>
                  <span className="text-sm">{project?.projectCycle}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">负责人:</span>
                  <span className="text-sm">{project?.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">成员:</span>
                  <span className="text-sm">{project?.members} 人</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">状态:</span>
                  <Badge variant={project?.status === "进行中" ? "default" : "secondary"}>
                    {project?.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* 完成度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">项目完成度</span>
                <span className="font-medium">{project?.completeness}%</span>
              </div>
              <Progress value={project?.completeness} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 数据卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              数据管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-semibold text-green-600">{project?.stats?.datasets || 0}</div>
              <div className="text-sm text-gray-500">数据集</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">主要数据源:</div>
              <div className="text-sm font-medium">{project?.dataSource}</div>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={onNavigateToData}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入数据管理
              </Button>
              <Button 
                onClick={onNavigateToData}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                <Database className="h-4 w-4 mr-2" />
                进入数据管理
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 任务卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              任务管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{project?.totalTasks || 0}</div>
                <div className="text-xs text-gray-500">总任务</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{project?.completedTasks || 0}</div>
                <div className="text-xs text-gray-500">已完成</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">当前任务:</div>
              <div className="text-sm font-medium">{project?.task}</div>
            </div>
            <Button 
              onClick={onNavigateToTasks}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              进入任务管理
            </Button>
          </CardContent>
        </Card>

        {/* 模型卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              模型管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-semibold text-purple-600">{project?.stats?.models || 7}</div>
              <div className="text-sm text-gray-500">模型数量</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">主要模型:</div>
              <div className="text-sm font-medium">{project?.model || 'CNN神经模型'}</div>
            </div>
            <Button 
              onClick={onNavigateToModels}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              进入模型管理
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Solo模式
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 基本信息卡片 */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            基本信息
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-600">
              Solo模式
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">名称:</span>
                <span className="text-sm font-medium">{project?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">描述:</span>
                <span className="text-sm">{project?.description}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">类型:</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  智能数据分析
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">状态:</span>
                <Badge variant={project?.status === "进行中" ? "default" : "secondary"}>
                  {project?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速预测卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            快速预测
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-600 mb-2">拖拽或点击上传表格文件</div>
            <div className="text-xs text-gray-500">支持 CSV, Excel 格式</div>
          </div>
          <Button 
            onClick={onQuickPredict}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-2" />
            开始预测
          </Button>
          <div className="text-xs text-gray-500 text-center">
            AI将自动分析数据并生成预测结果
          </div>
        </CardContent>
      </Card>

      {/* 报表与因果分析卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            报表与因果分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">自动生成报表</div>
                <div className="text-xs text-gray-500">基于数据自动生成分析报告</div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-600">
                已生成
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">因果关系可视化</div>
                <div className="text-xs text-gray-500">智能识别变量间因果关系</div>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                可查看
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              onClick={onViewReports}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              查看报表
            </Button>
            <Button 
              variant="outline"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-1" />
              下载分析
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}