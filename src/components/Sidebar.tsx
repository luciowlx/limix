import { ChevronRight, FolderPlus } from "lucide-react";
import { Button } from "./ui/button";

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">项目管理</h2>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mt-1">创建新的产品和功能项目</p>
      </div>
      
      <div className="p-4">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center space-x-2">
          <FolderPlus className="h-4 w-4" />
          <span>创建新项目</span>
        </Button>
        
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">项目分析信息</div>
          <div className="text-xs text-gray-400">
            基于人工智能数据智能化中的学习数据统计，赛场至关重要的体验统计
          </div>
        </div>
      </div>
    </div>
  );
}