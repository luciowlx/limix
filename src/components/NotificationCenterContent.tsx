import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  Bell, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  FolderOpen,
  Database,
  CheckSquare,
  Brain,
  Settings,
  User,
  Calendar,
  ArrowRight,
  X
} from "lucide-react";

// 导入类型和数据
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  UserRole,
  Notification,
  NotificationStats
} from "./NotificationCenter";

// 使用相同的模拟数据和配置
const CURRENT_USER_ROLE = UserRole.PROJECT_MANAGER;

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: NotificationType.PROJECT,
    title: "项目状态变更",
    content: "AI智能客服系统项目已从开发阶段转入测试阶段，请相关人员及时跟进测试工作。",
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T10:30:00Z",
    sender: "系统管理员",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DEVELOPER],
    relatedEntityId: "proj_001",
    relatedEntityName: "AI智能客服系统",
    actionUrl: "/projects/proj_001",
    metadata: {
      previousStatus: "开发中",
      currentStatus: "测试中",
      changeReason: "开发阶段完成"
    }
  },
  {
    id: "2", 
    type: NotificationType.DATA,
    title: "数据集上传完成",
    content: "客户对话数据集（50万条记录）已成功上传并完成预处理，可用于模型训练。",
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-01-20T09:15:00Z",
    sender: "数据管理系统",
    targetRoles: [UserRole.ADMIN, UserRole.DATA_ANALYST, UserRole.PROJECT_MANAGER],
    relatedEntityId: "data_001",
    relatedEntityName: "客户对话数据集",
    actionUrl: "/data/data_001",
    metadata: {
      recordCount: 500000,
      fileSize: "2.3GB",
      processingTime: "45分钟"
    }
  },
  {
    id: "3",
    type: NotificationType.TASK,
    title: "任务即将到期",
    content: "模型性能优化任务将在2天后到期，当前进度75%，请及时完成剩余工作。",
    priority: NotificationPriority.URGENT,
    status: NotificationStatus.UNREAD,
    createdAt: "2024-01-20T08:00:00Z",
    updatedAt: "2024-01-20T08:00:00Z",
    sender: "任务管理系统",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DATA_ANALYST],
    relatedEntityId: "task_001",
    relatedEntityName: "模型性能优化",
    actionUrl: "/tasks/task_001",
    metadata: {
      dueDate: "2024-01-22T23:59:59Z",
      progress: 75,
      assignee: "张三"
    }
  },
  {
    id: "4",
    type: NotificationType.MODEL,
    title: "模型训练完成",
    content: "BERT-Large模型训练已完成，准确率达到94.2%，已自动部署到测试环境。",
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.READ,
    createdAt: "2024-01-19T16:45:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
    sender: "模型训练系统",
    targetRoles: [UserRole.ADMIN, UserRole.DATA_ANALYST, UserRole.PROJECT_MANAGER],
    relatedEntityId: "model_001",
    relatedEntityName: "BERT-Large情感分析模型",
    actionUrl: "/models/model_001",
    metadata: {
      accuracy: 94.2,
      trainingTime: "8小时30分钟",
      deploymentStatus: "已部署"
    }
  },
  {
    id: "5",
    type: NotificationType.SYSTEM,
    title: "系统维护通知",
    content: "系统将于今晚23:00-01:00进行例行维护，期间可能影响部分功能使用。",
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.READ,
    createdAt: "2024-01-19T14:00:00Z",
    updatedAt: "2024-01-19T15:30:00Z",
    sender: "运维团队",
    targetRoles: [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DATA_ANALYST, UserRole.DEVELOPER, UserRole.VIEWER],
    actionUrl: "/system/maintenance",
    metadata: {
      maintenanceStart: "2024-01-20T23:00:00Z",
      maintenanceEnd: "2024-01-21T01:00:00Z",
      affectedServices: ["模型训练", "数据上传"]
    }
  }
];

const notificationTypeConfig = {
  [NotificationType.PROJECT]: {
    label: "项目通知",
    icon: FolderOpen,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700"
  },
  [NotificationType.DATA]: {
    label: "数据通知", 
    icon: Database,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700"
  },
  [NotificationType.TASK]: {
    label: "任务通知",
    icon: CheckSquare,
    color: "bg-orange-500", 
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
  [NotificationType.MODEL]: {
    label: "模型通知",
    icon: Brain,
    color: "bg-purple-500",
    bgColor: "bg-purple-50", 
    textColor: "text-purple-700"
  },
  [NotificationType.SYSTEM]: {
    label: "系统通知",
    icon: Settings,
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700"
  }
};

const priorityConfig = {
  [NotificationPriority.LOW]: {
    label: "低",
    color: "bg-gray-100 text-gray-600",
    dotColor: "bg-gray-400"
  },
  [NotificationPriority.MEDIUM]: {
    label: "中",
    color: "bg-blue-100 text-blue-600", 
    dotColor: "bg-blue-400"
  },
  [NotificationPriority.HIGH]: {
    label: "高",
    color: "bg-orange-100 text-orange-600",
    dotColor: "bg-orange-400"
  },
  [NotificationPriority.URGENT]: {
    label: "紧急",
    color: "bg-red-100 text-red-600",
    dotColor: "bg-red-400"
  }
};

export function NotificationCenterContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<NotificationType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | "all">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 过滤通知
  const filteredNotifications = useMemo(() => {
    return mockNotifications.filter(notification => {
      // 角色过滤
      if (!notification.targetRoles.includes(CURRENT_USER_ROLE)) {
        return false;
      }
      
      // 搜索过滤
      if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !notification.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // 类型过滤
      if (selectedType !== "all" && notification.type !== selectedType) {
        return false;
      }
      
      // 状态过滤
      if (selectedStatus !== "all" && notification.status !== selectedStatus) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searchTerm, selectedType, selectedStatus]);

  // 统计信息
  const stats = useMemo(() => {
    const total = mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE)).length;
    const unread = mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE) && n.status === NotificationStatus.UNREAD).length;
    
    const byType = {} as Record<NotificationType, number>;
    const byPriority = {} as Record<NotificationPriority, number>;
    
    mockNotifications.filter(n => n.targetRoles.includes(CURRENT_USER_ROLE)).forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });
    
    return {
      total,
      unread,
      byType,
      byPriority
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    console.log("标记为已读:", notificationId);
  };

  const deleteNotification = (notificationId: string) => {
    console.log("删除通知:", notificationId);
  };

  const viewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    if (notification.status === NotificationStatus.UNREAD) {
      markAsRead(notification.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "刚刚";
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总通知</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">未读通知</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">今日通知</p>
                  <p className="text-2xl font-bold text-green-600">3</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">紧急通知</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.byPriority[NotificationPriority.URGENT] || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和过滤 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索通知..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as NotificationType | "all")}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">所有类型</option>
                  {Object.entries(notificationTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as NotificationStatus | "all")}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">所有状态</option>
                  <option value={NotificationStatus.UNREAD}>未读</option>
                  <option value={NotificationStatus.READ}>已读</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>通知列表</span>
              <Badge variant="secondary">{filteredNotifications.length} 条</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const typeConfig = notificationTypeConfig[notification.type];
                const priorityConfig_ = priorityConfig[notification.priority];
                const IconComponent = typeConfig.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status === NotificationStatus.UNREAD ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => viewDetails(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${typeConfig.textColor}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-sm font-medium ${
                            notification.status === NotificationStatus.UNREAD ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${priorityConfig_.color}`}>
                              {priorityConfig_.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              来自: {notification.sender}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {notification.status === NotificationStatus.UNREAD && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredNotifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无通知</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 通知详情对话框 */}
        {selectedNotification && (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${notificationTypeConfig[selectedNotification.type].bgColor}`}>
                    {React.createElement(notificationTypeConfig[selectedNotification.type].icon, {
                      className: `h-5 w-5 ${notificationTypeConfig[selectedNotification.type].textColor}`
                    })}
                  </div>
                  <span>{selectedNotification.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={priorityConfig[selectedNotification.priority].color}>
                    {priorityConfig[selectedNotification.priority].label}优先级
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatTime(selectedNotification.createdAt)}
                  </span>
                </div>
                
                <div className="prose max-w-none">
                  <p className="text-gray-700">{selectedNotification.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">发送者:</span>
                    <span className="ml-2">{selectedNotification.sender}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">类型:</span>
                    <span className="ml-2">{notificationTypeConfig[selectedNotification.type].label}</span>
                  </div>
                  {selectedNotification.relatedEntityName && (
                    <div>
                      <span className="font-medium text-gray-600">相关实体:</span>
                      <span className="ml-2">{selectedNotification.relatedEntityName}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  {selectedNotification.status === NotificationStatus.UNREAD && (
                    <Button
                      variant="outline"
                      onClick={() => markAsRead(selectedNotification.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      标记为已读
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => deleteNotification(selectedNotification.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}