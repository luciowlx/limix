import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Briefcase,
  Shield,
  Bell,
  Palette,
  Globe
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  avatar?: string;
  department: string;
  role: string;
  position: string;
  location: string;
  bio: string;
  joinDate: string;
  lastLogin: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemNotifications: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
}

interface SecurityLog {
  id: string;
  action: string;
  ip: string;
  location: string;
  device: string;
  timestamp: string;
  status: "success" | "failed";
}

export function PersonalCenter() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "1",
    username: "zhangsan",
    email: "zhangsan@company.com",
    phone: "13800138001",
    realName: "张三",
    department: "技术部",
    role: "项目经理",
    position: "高级项目经理",
    location: "北京市朝阳区",
    bio: "专注于AI项目管理，拥有5年项目管理经验",
    joinDate: "2024-01-15",
    lastLogin: "2024-03-15 10:30:00"
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    systemNotifications: true,
    projectUpdates: true,
    taskReminders: true
  });

  const [securityLogs] = useState<SecurityLog[]>([
    {
      id: "1",
      action: "登录",
      ip: "192.168.1.100",
      location: "北京市",
      device: "Chrome 浏览器",
      timestamp: "2024-03-15 10:30:00",
      status: "success"
    },
    {
      id: "2",
      action: "修改密码",
      ip: "192.168.1.100",
      location: "北京市",
      device: "Chrome 浏览器",
      timestamp: "2024-03-14 16:20:00",
      status: "success"
    },
    {
      id: "3",
      action: "登录失败",
      ip: "192.168.1.105",
      location: "上海市",
      device: "Firefox 浏览器",
      timestamp: "2024-03-13 09:15:00",
      status: "failed"
    }
  ]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  const handleProfileUpdate = () => {
    setUserProfile(editForm);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("新密码和确认密码不匹配");
      return;
    }
    // 这里应该调用API更新密码
    alert("密码修改成功");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">个人中心</h2>
        <p className="text-gray-600 mt-1">管理您的个人信息和账户设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">个人信息</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="logs">安全日志</TabsTrigger>
        </TabsList>

        {/* 个人信息 */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像部分 */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile.avatar} />
                    <AvatarFallback className="text-lg">{userProfile.realName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{userProfile.realName}</h3>
                  <p className="text-gray-600">@{userProfile.username}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <Badge variant="outline">{userProfile.role}</Badge>
                    <Badge variant="secondary">{userProfile.department}</Badge>
                  </div>
                </div>
              </div>

              {/* 信息表单 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="realName">真实姓名</Label>
                  <Input
                    id="realName"
                    value={isEditing ? editForm.realName : userProfile.realName}
                    onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={isEditing ? editForm.username : userProfile.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱地址</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? editForm.email : userProfile.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">手机号码</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      value={isEditing ? editForm.phone : userProfile.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="position">职位</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="position"
                      value={isEditing ? editForm.position : userProfile.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">所在地</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="location"
                      value={isEditing ? editForm.location : userProfile.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editForm.bio : userProfile.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="介绍一下自己..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      取消
                    </Button>
                    <Button onClick={handleProfileUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    编辑信息
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 账户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                账户信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">入职时间</span>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {userProfile.joinDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">最后登录</span>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {userProfile.lastLogin}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                修改密码
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">当前密码</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="请输入当前密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">新密码</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="请输入新密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="请再次输入新密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handlePasswordChange} className="w-full">
                修改密码
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                通知偏好
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                emailNotifications: "邮件通知",
                smsNotifications: "短信通知",
                systemNotifications: "系统通知",
                projectUpdates: "项目更新",
                taskReminders: "任务提醒"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{label}</span>
                    <p className="text-sm text-gray-600">
                      {key === "emailNotifications" && "接收重要系统邮件通知"}
                      {key === "smsNotifications" && "接收紧急事件短信提醒"}
                      {key === "systemNotifications" && "接收系统内消息通知"}
                      {key === "projectUpdates" && "接收项目状态更新通知"}
                      {key === "taskReminders" && "接收任务截止日期提醒"}
                    </p>
                  </div>
                  <Button
                    variant={notificationSettings[key as keyof NotificationSettings] ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNotificationChange(key as keyof NotificationSettings, !notificationSettings[key as keyof NotificationSettings])}
                  >
                    {notificationSettings[key as keyof NotificationSettings] ? "已开启" : "已关闭"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全日志 */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                安全日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-gray-600">
                          {log.device} • {log.ip} • {log.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{log.timestamp}</div>
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="mt-1">
                        {log.status === "success" ? "成功" : "失败"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}