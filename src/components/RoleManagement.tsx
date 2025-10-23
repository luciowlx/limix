import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Shield, Users, Settings, Search, Eye } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: "active" | "inactive";
  createdAt: string;
}

const allPermissions: Permission[] = [
  { id: "project_view", name: "查看项目", description: "可以查看项目列表和详情", module: "项目管理" },
  { id: "project_create", name: "创建项目", description: "可以创建新项目", module: "项目管理" },
  { id: "project_edit", name: "编辑项目", description: "可以编辑项目信息", module: "项目管理" },
  { id: "project_delete", name: "删除项目", description: "可以删除项目", module: "项目管理" },
  { id: "data_view", name: "查看数据", description: "可以查看数据集", module: "数据管理" },
  { id: "data_upload", name: "上传数据", description: "可以上传数据集", module: "数据管理" },
  { id: "data_edit", name: "编辑数据", description: "可以编辑数据集", module: "数据管理" },
  { id: "data_delete", name: "删除数据", description: "可以删除数据集", module: "数据管理" },
  { id: "task_view", name: "查看任务", description: "可以查看任务列表", module: "任务管理" },
  { id: "task_create", name: "创建任务", description: "可以创建新任务", module: "任务管理" },
  { id: "task_edit", name: "编辑任务", description: "可以编辑任务", module: "任务管理" },
  { id: "task_delete", name: "删除任务", description: "可以删除任务", module: "任务管理" },
  { id: "model_view", name: "查看模型", description: "可以查看模型列表", module: "模型管理" },
  { id: "model_train", name: "训练模型", description: "可以训练和微调模型", module: "模型管理" },
  { id: "model_deploy", name: "部署模型", description: "可以部署模型", module: "模型管理" },
  { id: "config_view", name: "查看配置", description: "可以查看系统配置项", module: "配置管理" },
  { id: "config_create", name: "创建配置", description: "可以创建新的配置项", module: "配置管理" },
  { id: "config_edit", name: "编辑配置", description: "可以编辑配置项", module: "配置管理" },
  { id: "config_delete", name: "删除配置", description: "可以删除配置项", module: "配置管理" },
  { id: "config_template_export", name: "导出配置模板", description: "可以导出配置项为模板", module: "配置管理" },
  { id: "config_template_import", name: "导入配置模板", description: "可以从模板导入配置项", module: "配置管理" },
  { id: "config_category_view", name: "查看配置分类", description: "可以查看配置分类列表", module: "配置管理" },
  { id: "config_category_create", name: "创建配置分类", description: "可以创建新的配置分类", module: "配置管理" },
  { id: "config_category_edit", name: "编辑配置分类", description: "可以编辑配置分类信息", module: "配置管理" },
  { id: "config_category_delete", name: "删除配置分类", description: "可以删除配置分类", module: "配置管理" },
  { id: "system_manage", name: "系统管理", description: "可以管理系统设置", module: "系统管理" }
];

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "超级管理员",
      description: "拥有系统所有权限",
      permissions: allPermissions.map(p => p.id),
      userCount: 2,
      status: "active",
      createdAt: "2024-01-01"
    },
    {
      id: "2", 
      name: "项目经理",
      description: "负责项目管理相关工作",
      permissions: ["project_view", "project_create", "project_edit", "task_view", "task_create", "task_edit"],
      userCount: 5,
      status: "active",
      createdAt: "2024-01-02"
    },
    {
      id: "3",
      name: "数据分析师", 
      description: "负责数据分析和模型训练",
      permissions: ["data_view", "data_upload", "data_edit", "model_view", "model_train"],
      userCount: 8,
      status: "active",
      createdAt: "2024-01-03"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  });

  const operationLogs = [
    {
      id: "1",
      action: "创建角色",
      target: "数据分析师",
      operator: "admin",
      timestamp: "2024-01-03 10:30:00",
      details: "创建了数据分析师角色，分配了数据管理和模型训练权限"
    },
    {
      id: "2", 
      action: "编辑角色",
      target: "项目经理",
      operator: "admin",
      timestamp: "2024-01-02 15:20:00",
      details: "修改了项目经理角色的权限配置"
    }
  ];

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRole = () => {
    if (newRole.name.trim()) {
      const role: Role = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        userCount: 0,
        status: "active",
        createdAt: new Date().toISOString().split('T')[0]
      };
      setRoles([...roles, role]);
      setNewRole({ name: "", description: "", permissions: [] });
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditRole = () => {
    if (currentRole && newRole.name.trim()) {
      setRoles(roles.map(role => 
        role.id === currentRole.id 
          ? { ...role, name: newRole.name, description: newRole.description, permissions: newRole.permissions }
          : role
      ));
      setIsEditDialogOpen(false);
      setCurrentRole(null);
      setNewRole({ name: "", description: "", permissions: [] });
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(role => role.id !== roleId));
  };

  const handleBatchDelete = () => {
    setRoles(roles.filter(role => !selectedRoles.includes(role.id)));
    setSelectedRoles([]);
  };

  const openEditDialog = (role: Role) => {
    setCurrentRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionDialog = (role: Role) => {
    setCurrentRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsPermissionDialogOpen(true);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    }
  };

  const savePermissions = () => {
    if (currentRole) {
      setRoles(roles.map(role => 
        role.id === currentRole.id 
          ? { ...role, permissions: newRole.permissions }
          : role
      ));
      setIsPermissionDialogOpen(false);
      setCurrentRole(null);
    }
  };

  const getPermissionsByModule = () => {
    const modules: { [key: string]: Permission[] } = {};
    allPermissions.forEach(permission => {
      if (!modules[permission.module]) {
        modules[permission.module] = [];
      }
      modules[permission.module].push(permission);
    });
    return modules;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">角色管理</h2>
          <p className="text-gray-600 mt-1">管理系统角色和权限配置</p>
        </div>
        <div className="flex gap-3">
          {selectedRoles.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              批量删除 ({selectedRoles.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsLogDialogOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            操作日志
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建角色
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建角色</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">角色名称</Label>
                  <Input
                    id="name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入角色名称"
                  />
                </div>
                <div>
                  <Label htmlFor="description">角色描述</Label>
                  <Textarea
                    id="description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="请输入角色描述"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateRole}>
                    确定
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索角色名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            角色列表
            <Badge variant="secondary">{filteredRoles.length} 个角色</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRoles.length === filteredRoles.length && filteredRoles.length > 0}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedRoles(filteredRoles.map(role => role.id));
                      } else {
                        setSelectedRoles([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>用户数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role.id]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-gray-600">{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length} 个权限</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {role.userCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.status === "active" ? "default" : "secondary"}>
                      {role.status === "active" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{role.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPermissionDialog(role)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">角色名称</Label>
              <Input
                id="edit-name"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入角色名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">角色描述</Label>
              <Textarea
                id="edit-description"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditRole}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>权限配置 - {currentRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(getPermissionsByModule()).map(([module, permissions]) => (
              <div key={module} className="space-y-3">
                <h4 className="font-medium text-lg border-b pb-2">{module}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={permission.id}
                        checked={newRole.permissions.includes(permission.id)}
                        onCheckedChange={(checked: boolean) => handlePermissionChange(permission.id, checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                          {permission.name}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={savePermissions}>
                保存权限
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>操作日志</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作</TableHead>
                  <TableHead>目标</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.target}</TableCell>
                    <TableCell>{log.operator}</TableCell>
                    <TableCell className="text-gray-600">{log.timestamp}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}