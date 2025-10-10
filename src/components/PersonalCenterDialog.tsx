import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { 
  User, 
  Mail, 
  Lock, 
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  AlertCircle
} from "lucide-react";

interface PersonalCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  username: string;
  email: string;
  realName: string;
  department: string;
  role: string;
}

export function PersonalCenterDialog({ open, onOpenChange }: PersonalCenterDialogProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "lixin",
    email: "lixin@company.com",
    realName: "李鑫",
    department: "技术部",
    role: "项目经理"
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    verificationCode: "",
    isEmailSent: false,
    isEmailVerified: false
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    showNewPassword: false,
    showConfirmPassword: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 邮箱验证相关函数
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendVerificationCode = () => {
    if (!emailForm.newEmail) {
      setErrors({...errors, email: "请输入邮箱地址"});
      return;
    }
    
    if (!validateEmail(emailForm.newEmail)) {
      setErrors({...errors, email: "请输入有效的邮箱地址"});
      return;
    }

    // 模拟发送验证码
    setEmailForm({...emailForm, isEmailSent: true});
    setErrors({...errors, email: ""});
    console.log("发送验证码到:", emailForm.newEmail);
  };

  const handleVerifyEmail = () => {
    if (!emailForm.verificationCode) {
      setErrors({...errors, verificationCode: "请输入验证码"});
      return;
    }

    // 模拟验证码验证（这里假设验证码是"123456"）
    if (emailForm.verificationCode === "123456") {
      setEmailForm({...emailForm, isEmailVerified: true});
      setErrors({...errors, verificationCode: ""});
      console.log("邮箱验证成功");
    } else {
      setErrors({...errors, verificationCode: "验证码错误"});
    }
  };

  const handleUpdateEmail = () => {
    if (!emailForm.isEmailVerified) {
      setErrors({...errors, email: "请先验证邮箱"});
      return;
    }

    setUserProfile({...userProfile, email: emailForm.newEmail});
    setEmailForm({
      newEmail: "",
      verificationCode: "",
      isEmailSent: false,
      isEmailVerified: false
    });
    console.log("邮箱更新成功");
  };

  // 密码验证相关函数
  const validatePassword = (password: string): {isValid: boolean, message: string} => {
    if (password.length < 8) {
      return {isValid: false, message: "密码长度至少8位"};
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return {isValid: false, message: "密码必须包含小写字母"};
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return {isValid: false, message: "密码必须包含大写字母"};
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return {isValid: false, message: "密码必须包含数字"};
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {isValid: false, message: "密码必须包含特殊字符(@$!%*?&)"};
    }
    
    return {isValid: true, message: ""};
  };

  const handlePasswordChange = () => {
    const newErrors: {[key: string]: string} = {};

    // 验证新密码
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.message;
    }

    // 验证确认密码
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors({...errors, ...newErrors});
      return;
    }

    // 密码修改成功
    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
      showNewPassword: false,
      showConfirmPassword: false
    });
    setErrors({});
    console.log("密码修改成功");
  };

  const getPasswordStrength = (password: string): {level: number, text: string, color: string} => {
    if (password.length === 0) return {level: 0, text: "", color: ""};
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;

    if (score <= 2) return {level: 1, text: "弱", color: "text-red-500"};
    if (score <= 3) return {level: 2, text: "中", color: "text-yellow-500"};
    if (score <= 4) return {level: 3, text: "强", color: "text-green-500"};
    return {level: 4, text: "很强", color: "text-green-600"};
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>个人中心</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">基本信息</TabsTrigger>
            <TabsTrigger value="email">邮箱设置</TabsTrigger>
            <TabsTrigger value="password">密码修改</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>个人信息</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                      {userProfile.realName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">{userProfile.realName}</h3>
                    <p className="text-sm text-gray-500">@{userProfile.username}</p>
                    <Badge variant="secondary">{userProfile.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>用户名</Label>
                    <Input value={userProfile.username} disabled />
                  </div>
                  <div>
                    <Label>真实姓名</Label>
                    <Input value={userProfile.realName} disabled />
                  </div>
                  <div>
                    <Label>部门</Label>
                    <Input value={userProfile.department} disabled />
                  </div>
                  <div>
                    <Label>角色</Label>
                    <Input value={userProfile.role} disabled />
                  </div>
                  <div className="col-span-2">
                    <Label>当前邮箱</Label>
                    <Input value={userProfile.email} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>邮箱验证</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>当前邮箱</Label>
                  <Input value={userProfile.email} disabled />
                </div>

                <div>
                  <Label>新邮箱地址</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="请输入新的邮箱地址"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    <Button 
                      onClick={handleSendVerificationCode}
                      disabled={emailForm.isEmailSent}
                      variant="outline"
                    >
                      {emailForm.isEmailSent ? "已发送" : "发送验证码"}
                    </Button>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {emailForm.isEmailSent && (
                  <div>
                    <Label>验证码</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="请输入6位验证码"
                        value={emailForm.verificationCode}
                        onChange={(e) => setEmailForm({...emailForm, verificationCode: e.target.value})}
                        className={errors.verificationCode ? "border-red-500" : ""}
                      />
                      <Button 
                        onClick={handleVerifyEmail}
                        disabled={emailForm.isEmailVerified}
                        variant="outline"
                      >
                        {emailForm.isEmailVerified ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          "验证"
                        )}
                      </Button>
                    </div>
                    {errors.verificationCode && (
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.verificationCode}
                      </p>
                    )}
                    {emailForm.isEmailVerified && (
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        邮箱验证成功
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleUpdateEmail}
                  disabled={!emailForm.isEmailVerified}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  更新邮箱
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>密码修改</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>新密码</Label>
                  <div className="relative">
                    <Input
                      type={passwordForm.showNewPassword ? "text" : "password"}
                      placeholder="请输入新密码"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className={errors.newPassword ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setPasswordForm({...passwordForm, showNewPassword: !passwordForm.showNewPassword})}
                    >
                      {passwordForm.showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">密码强度:</span>
                        <span className={`text-sm font-medium ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                            passwordStrength.level === 2 ? 'bg-yellow-500 w-2/4' :
                            passwordStrength.level === 3 ? 'bg-green-500 w-3/4' :
                            'bg-green-600 w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {errors.newPassword && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <Label>确认新密码</Label>
                  <div className="relative">
                    <Input
                      type={passwordForm.showConfirmPassword ? "text" : "password"}
                      placeholder="请再次输入新密码"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setPasswordForm({...passwordForm, showConfirmPassword: !passwordForm.showConfirmPassword})}
                    >
                      {passwordForm.showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">密码安全要求：</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 长度至少8位字符</li>
                    <li>• 包含大写字母(A-Z)</li>
                    <li>• 包含小写字母(a-z)</li>
                    <li>• 包含数字(0-9)</li>
                    <li>• 包含特殊字符(@$!%*?&)</li>
                  </ul>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  className="w-full"
                  disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  修改密码
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}