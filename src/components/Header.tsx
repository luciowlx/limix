import { Bell, User, Settings, LogOut, Palette, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenPersonalCenter?: () => void;
  onOpenPersonalizationSettings?: () => void;
  onOpenNotificationCenter?: () => void;
  onLogout?: () => void;
}

export function Header({ activeTab, onTabChange, onOpenPersonalCenter, onOpenPersonalizationSettings, onOpenNotificationCenter, onLogout }: HeaderProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { name: "看板" },
    { name: "项目管理" },
    { name: "数据管理" },
    { name: "任务管理" },
    { name: "模型管理" },
    { name: "系统管理" },
  ];

  // 模拟获取未读通知数量
  useEffect(() => {
    // 这里应该从API获取未读通知数量
    // 现在使用模拟数据
    const mockUnreadCount = 3;
    setUnreadCount(mockUnreadCount);
  }, []);

  return (
    <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-medium">Limix</span>
            <span className="text-xs text-slate-400">大模型机器学习平台</span>
          </div>
        </div>
        
        <nav className="flex items-center space-x-6">
          {navItems.map((item, index) => (
            <button
              key={item.name}
              onClick={() => {
                console.log("点击导航项:", item.name); // 添加调试日志
                onTabChange(item.name);
              }}
              className={`px-3 py-2 rounded-md transition-colors ${
                activeTab === item.name
                  ? "bg-slate-700 text-white" 
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-300 hover:text-white relative"
          onClick={() => onOpenNotificationCenter?.()}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2 hover:bg-slate-700"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-600 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-300">lixin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg z-50">
            <DropdownMenuItem 
              onClick={() => {
                console.log("个人中心被点击");
                onTabChange("系统管理");
                onOpenPersonalCenter?.();
              }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>个人中心</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                console.log("个性化设置被点击");
                onOpenPersonalizationSettings?.();
              }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Palette className="h-4 w-4" />
              <span>个性化设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center space-x-2 cursor-default"
            >
              <Info className="h-4 w-4" />
              <span>v1.0</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                console.log("退出登录被点击");
                onLogout?.();
              }}
              className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}