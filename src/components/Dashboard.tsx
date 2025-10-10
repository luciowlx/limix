import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { 
  Plus, 
  Upload, 
  Zap, 
  FileText, 
  TrendingUp, 
  Database, 
  Calendar,
  Activity,
  Cpu,
  HardDrive
} from "lucide-react";

interface DashboardProps {
  onNavigateToProjectManagement?: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToTaskManagement?: () => void;
  onNavigateToModelManagement?: () => void;
}

export function Dashboard({ 
  onNavigateToProjectManagement,
  onNavigateToDataManagement,
  onNavigateToTaskManagement,
  onNavigateToModelManagement
}: DashboardProps = {}) {
  const stats = [
    { label: "总项目数", value: 12, color: "text-blue-600", icon: TrendingUp },
    { label: "数据量", value: 8, color: "text-green-600", icon: Database },
    { label: "当天任务", value: 3, color: "text-orange-600", icon: Calendar },
    { label: "活跃模型", value: 5, color: "text-purple-600", icon: Activity }
  ];

  const quickActions = [
    { 
      label: "创建新项目", 
      description: "开始一个新的AI项目", 
      icon: Plus, 
      color: "bg-blue-50 text-blue-600",
      onClick: onNavigateToProjectManagement
    },
    { 
      label: "上传数据", 
      description: "导入训练数据集", 
      icon: Upload, 
      color: "bg-green-50 text-green-600",
      onClick: onNavigateToDataManagement
    },
    { 
      label: "创建任务", 
      description: "创建新的训练任务", 
      icon: FileText, 
      color: "bg-purple-50 text-purple-600",
      onClick: onNavigateToTaskManagement
    },
    { 
      label: "模型微调", 
      description: "优化和调整模型参数", 
      icon: Zap, 
      color: "bg-orange-50 text-orange-600",
      onClick: onNavigateToModelManagement
    }
  ];

  const recentProjects = [
    {
      name: "缺陷检测",
      description: "基于深度学习的产品缺陷检测系统",
      progress: 75,
      status: "进行中",
      members: ["L", "M", "K"],
      color: "blue"
    },
    {
      name: "电力预测",
      description: "个性化产品推荐系统优化",
      progress: 45,
      status: "进行中", 
      members: ["A", "B"],
      color: "green"
    },
    {
      name: "价格预测模型",
      description: "基于时间序列的价格预测分析",
      progress: 100,
      status: "已完成",
      members: ["C", "D", "E", "F", "G"],
      color: "purple"
    }
  ];

  const systemStatus = [
    { label: "CPU 使用率", value: 45, color: "bg-blue-500" },
    { label: "内存使用率", value: 62, color: "bg-green-500" },
    { label: "GPU 使用率", value: 78, color: "bg-orange-500" }
  ];

  const recentActivities = [
    {
      action: "模型 \"客户流失预测\" 训练完成",
      time: "30分钟前",
      type: "success"
    },
    {
      action: "数据集 \"用户行为数据\" 上传成功",
      time: "1小时前", 
      type: "info"
    },
    {
      action: "任务 \"商品推荐模型\" 开始执行",
      time: "2小时前",
      type: "info"
    },
    {
      action: "模型 \"价格预测模型\" 部署成功",
      time: "3小时前",
      type: "success"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 快速操作 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                      onClick={action.onClick}
                    >
                      <div className={`p-3 rounded-full ${action.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 最近项目 */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近项目</CardTitle>
              <Button variant="outline" size="sm">查看全部</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.map((project, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                    </div>
                    <Badge 
                      variant={project.status === "已完成" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>进度</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {project.members.slice(0, 4).map((member, memberIndex) => (
                        <Avatar key={memberIndex} className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200">
                            {member}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 4 && (
                        <div className="text-xs text-gray-500 ml-1">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="space-y-6">
          {/* 系统状态 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus.map((status, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">{status.label}</span>
                    <span className="font-medium">{status.value}%</span>
                  </div>
                  <Progress value={status.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 最近活动 */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}