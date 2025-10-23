import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  MoreHorizontal,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  FolderPlus,
  Move,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// 用户接口定义
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  position: string;
  departmentId: string;
  status: "active" | "inactive";
  joinDate: string;
}

// 部门接口定义
interface Department {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  manager: string;
  memberCount: number;
  status: "active" | "inactive";
  createdAt: string;
  children?: Department[];
}

export function DepartmentManagement() {
  // 部门数据
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: "1",
      name: "华特迪士尼公司",
      description: "总公司",
      manager: "张三",
      memberCount: 50,
      status: "active",
      createdAt: "2024-01-15",
      children: [
        {
          id: "1-1",
          name: "董事会",
          description: "公司董事会",
          parentId: "1",
          manager: "李四",
          memberCount: 8,
          status: "active",
          createdAt: "2024-01-16"
        },
        {
          id: "1-2",
          name: "技术部",
          description: "负责技术开发",
          parentId: "1",
          manager: "王五",
          memberCount: 25,
          status: "active",
          createdAt: "2024-01-17",
          children: [
            {
              id: "1-2-1",
              name: "前端部门",
              description: "前端开发团队",
              parentId: "1-2",
              manager: "赵六",
              memberCount: 12,
              status: "active",
              createdAt: "2024-01-18"
            },
            {
              id: "1-2-2",
              name: "后端部门",
              description: "后端开发团队",
              parentId: "1-2",
              manager: "钱七",
              memberCount: 13,
              status: "active",
              createdAt: "2024-01-19"
            }
          ]
        }
      ]
    }
  ]);

  // 用户数据
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "张三",
      email: "zhangsan@company.com",
      phone: "13800138001",
      position: "总经理",
      departmentId: "1",
      status: "active",
      joinDate: "2024-01-01"
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@company.com",
      phone: "13800138002",
      position: "董事长",
      departmentId: "1-1",
      status: "active",
      joinDate: "2024-01-02"
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@company.com",
      phone: "13800138003",
      position: "技术总监",
      departmentId: "1-2",
      status: "active",
      joinDate: "2024-01-03"
    }
  ]);

  // 对话框状态
  const [isCreateDeptDialogOpen, setIsCreateDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isDeptChangeDialogOpen, setIsDeptChangeDialogOpen] = useState(false);
  const [isAddSubDeptDialogOpen, setIsAddSubDeptDialogOpen] = useState(false);
  const [isMoveDeptDialogOpen, setIsMoveDeptDialogOpen] = useState(false);

  // 选中的数据
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<string[]>(["1"]);

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 表单数据
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    manager: ""
  });

  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    departmentId: ""
  });

  // 部门操作函数
  const handleCreateDepartment = () => {
    const newDepartment: Department = {
      id: Date.now().toString(),
      name: deptFormData.name,
      description: deptFormData.description,
      parentId: deptFormData.parentId || undefined,
      manager: deptFormData.manager,
      memberCount: 0,
      status: "active",
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    if (deptFormData.parentId) {
      // 添加到父部门的children中
      const updateDepartments = (depts: Department[]): Department[] => {
        return depts.map(dept => {
          if (dept.id === deptFormData.parentId) {
            return {
              ...dept,
              children: [...(dept.children || []), newDepartment]
            };
          }
          if (dept.children) {
            return {
              ...dept,
              children: updateDepartments(dept.children)
            };
          }
          return dept;
        });
      };
      setDepartments(updateDepartments(departments));
    } else {
      setDepartments([...departments, newDepartment]);
    }
    
    setDeptFormData({ name: "", description: "", parentId: "", manager: "" });
    setIsCreateDeptDialogOpen(false);
  };

  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    
    const updateDepartments = (depts: Department[]): Department[] => {
      return depts.map(dept => {
        if (dept.id === selectedDepartment.id) {
          return { ...dept, ...deptFormData };
        }
        if (dept.children) {
          return {
            ...dept,
            children: updateDepartments(dept.children)
          };
        }
        return dept;
      });
    };
    
    setDepartments(updateDepartments(departments));
    setDeptFormData({ name: "", description: "", parentId: "", manager: "" });
    setIsEditDeptDialogOpen(false);
    setSelectedDepartment(null);
  };

  const handleDeleteDepartment = (id: string) => {
    const deleteDepartment = (depts: Department[]): Department[] => {
      return depts.filter(dept => {
        if (dept.id === id) return false;
        if (dept.children) {
          dept.children = deleteDepartment(dept.children);
        }
        return true;
      });
    };
    
    setDepartments(deleteDepartment(departments));
  };

  const handleAddSubDepartment = (parentId: string) => {
    setDeptFormData({ ...deptFormData, parentId });
    setIsAddSubDeptDialogOpen(true);
  };

  // 用户操作函数
  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: userFormData.name,
      email: userFormData.email,
      phone: userFormData.phone,
      position: userFormData.position,
      departmentId: userFormData.departmentId,
      status: "active",
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    setUsers([...users, newUser]);
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsAddUserDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, ...userFormData }
        : user
    ));
    
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsUserDetailDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDepartmentChange = () => {
    if (selectedUsers.length === 0 || !userFormData.departmentId) return;
    
    setUsers(users.map(user => 
      selectedUsers.includes(user.id)
        ? { ...user, departmentId: userFormData.departmentId }
        : user
    ));
    
    setSelectedUsers([]);
    setUserFormData({ name: "", email: "", phone: "", position: "", departmentId: "" });
    setIsDeptChangeDialogOpen(false);
  };

  // 辅助函数
  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setDeptFormData({
      name: department.name,
      description: department.description,
      parentId: department.parentId || "",
      manager: department.manager
    });
    setIsEditDeptDialogOpen(true);
  };

  const openUserDetailDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      departmentId: user.departmentId
    });
    setIsUserDetailDialogOpen(true);
  };

  const toggleDeptExpansion = (deptId: string) => {
    setExpandedDepts(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const getAllDepartments = (depts: Department[]): Department[] => {
    let result: Department[] = [];
    depts.forEach(dept => {
      result.push(dept);
      if (dept.children) {
        result = result.concat(getAllDepartments(dept.children));
      }
    });
    return result;
  };

  const getDepartmentName = (deptId: string): string => {
    const allDepts = getAllDepartments(departments);
    const dept = allDepts.find(d => d.id === deptId);
    return dept?.name || "未知部门";
  };

  const renderDepartmentTree = (depts: Department[], level = 0) => {
    return depts.map(dept => (
      <div key={dept.id} className="border rounded-lg mb-2">
        <div className={`p-4 flex items-center justify-between bg-gray-50 ${level > 0 ? 'ml-' + (level * 4) : ''}`}>
          <div className="flex items-center space-x-3">
            {dept.children && dept.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleDeptExpansion(dept.id)}
                className="p-1"
              >
                {expandedDepts.includes(dept.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            )}
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium">{dept.name}</h3>
              <p className="text-sm text-gray-600">{dept.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={dept.status === "active" ? "default" : "secondary"}>
              {dept.status === "active" ? "启用" : "停用"}
            </Badge>
            <span className="text-sm text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {dept.memberCount}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddSubDepartment(dept.id)}
                title="添加子部门"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(dept)}
                title="编辑部门"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMoveDeptDialogOpen(true)}
                title="移动部门"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDepartment(dept.id)}
                className="text-red-600 hover:text-red-700"
                title="删除部门"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {dept.children && dept.children.length > 0 && expandedDepts.includes(dept.id) && (
          <div className="pl-8 pb-2">
            {renderDepartmentTree(dept.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">部门管理</h2>
          <p className="text-gray-600 mt-1">管理组织架构，设置部门信息和权限</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>添加员工</span>
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isCreateDeptDialogOpen} onOpenChange={setIsCreateDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>新建部门</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索部门、员工姓名或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>
            {selectedUsers.length > 0 && (
              <Button
                onClick={() => setIsDeptChangeDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>变更部门 ({selectedUsers.length})</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 部门树形结构 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            组织架构
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderDepartmentTree(departments)}
        </CardContent>
      </Card>

      {/* 员工列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            员工列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>员工信息</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>所属部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>入职时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.position}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentName(user.departmentId)}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status === "active" ? "在职" : "离职"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      {user.joinDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUserDetailDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建部门对话框 */}
      <Dialog open={isCreateDeptDialogOpen} onOpenChange={setIsCreateDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">部门名称</Label>
              <Input
                id="dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="dept-parent">上级部门</Label>
              <Select value={deptFormData.parentId} onValueChange={(value: string) => setDeptFormData({ ...deptFormData, parentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择上级部门（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dept-description">部门描述</Label>
              <Textarea
                id="dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="dept-manager">部门负责人</Label>
              <Input
                id="dept-manager"
                value={deptFormData.manager}
                onChange={(e) => setDeptFormData({ ...deptFormData, manager: e.target.value })}
                placeholder="请输入负责人姓名"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateDepartment}>
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑部门对话框 */}
      <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dept-name">部门名称</Label>
              <Input
                id="edit-dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-description">部门描述</Label>
              <Textarea
                id="edit-dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-manager">部门负责人</Label>
              <Input
                id="edit-dept-manager"
                value={deptFormData.manager}
                onChange={(e) => setDeptFormData({ ...deptFormData, manager: e.target.value })}
                placeholder="请输入负责人姓名"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditDepartment}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加员工对话框 */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加员工</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">姓名</Label>
              <Input
                id="user-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="请输入员工姓名"
              />
            </div>
            <div>
              <Label htmlFor="user-email">邮箱</Label>
              <Input
                id="user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <Label htmlFor="user-phone">手机号</Label>
              <Input
                id="user-phone"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="请输入手机号码"
              />
            </div>
            <div>
              <Label htmlFor="user-position">职位</Label>
              <Input
                id="user-position"
                value={userFormData.position}
                onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                placeholder="请输入职位名称"
              />
            </div>
            <div>
              <Label htmlFor="user-department">所属部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择所属部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateUser}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 员工详情对话框 */}
      <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>员工详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="detail-user-name">姓名</Label>
              <Input
                id="detail-user-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="请输入员工姓名"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-email">邮箱</Label>
              <Input
                id="detail-user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-phone">手机号</Label>
              <Input
                id="detail-user-phone"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="请输入手机号码"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-position">职位</Label>
              <Input
                id="detail-user-position"
                value={userFormData.position}
                onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
                placeholder="请输入职位名称"
              />
            </div>
            <div>
              <Label htmlFor="detail-user-department">所属部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择所属部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUserDetailDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditUser}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 部门变更对话框 */}
      <Dialog open={isDeptChangeDialogOpen} onOpenChange={setIsDeptChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>变更部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选中员工 ({selectedUsers.length} 人)</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="flex items-center space-x-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="text-gray-500">({user.position})</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="change-department">目标部门</Label>
              <Select value={userFormData.departmentId} onValueChange={(value: string) => setUserFormData({ ...userFormData, departmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标部门" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDepartments(departments).map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeptChangeDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleDepartmentChange}>
                确认变更
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加子部门对话框 */}
      <Dialog open={isAddSubDeptDialogOpen} onOpenChange={setIsAddSubDeptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加子部门</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sub-dept-name">部门名称</Label>
              <Input
                id="sub-dept-name"
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <Label htmlFor="sub-dept-description">部门描述</Label>
              <Textarea
                id="sub-dept-description"
                value={deptFormData.description}
                onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                placeholder="请输入部门描述"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="sub-dept-manager">部门负责人</Label>
              <Input
                id="sub-dept-manager"
                value={deptFormData.manager}
                onChange={(e) => setDeptFormData({ ...deptFormData, manager: e.target.value })}
                placeholder="请输入负责人姓名"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddSubDeptDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => {
                handleCreateDepartment();
                setIsAddSubDeptDialogOpen(false);
              }}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}