import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { 
  ArrowLeft,
  Download,
  Settings,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Eye,
  FileText,
  Layers,
  Activity
} from "lucide-react";

interface DataDetailFullPageProps {
  dataset: any;
  onClose: () => void;
}

interface DataRow {
  PassengerId: number;
  Survived: number;
  Pclass: number;
  Name: string;
  Sex: string;
  Age: number | null;
  SibSp: number;
  Parch: number;
  Ticket: string;
  Fare: number;
  Cabin: string | null;
  Embarked: string;
}

export function DataDetailFullPage({ dataset, onClose }: DataDetailFullPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRows, setSelectedRows] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [xVariable, setXVariable] = useState("");
  const [yVariable, setYVariable] = useState("");
  const [correlationData, setCorrelationData] = useState<{x: number, y: number}[]>([]);
  const [correlationCoeff, setCorrelationCoeff] = useState<number | null>(null);

  // 模拟数据
  const mockData: DataRow[] = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: "Braund, Mr. Owen Harris", Sex: "male", Age: 22.0, SibSp: 1, Parch: 0, Ticket: "A/5 21171", Fare: 7.2500, Cabin: null, Embarked: "S" },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: "Cumings, Mrs. John Bradley (Florence Briggs Th...", Sex: "female", Age: 38.0, SibSp: 1, Parch: 0, Ticket: "PC 17599", Fare: 71.2833, Cabin: "C85", Embarked: "C" },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: "Heikkinen, Miss. Laina", Sex: "female", Age: 26.0, SibSp: 0, Parch: 0, Ticket: "STON/O2. 3101282", Fare: 7.9250, Cabin: null, Embarked: "S" },
    { PassengerId: 4, Survived: 1, Pclass: 1, Name: "Futrelle, Mrs. Jacques Heath (Lily May Peel)", Sex: "female", Age: 35.0, SibSp: 1, Parch: 0, Ticket: "113803", Fare: 53.1000, Cabin: "C123", Embarked: "S" },
    { PassengerId: 5, Survived: 0, Pclass: 3, Name: "Allen, Mr. William Henry", Sex: "male", Age: 35.0, SibSp: 0, Parch: 0, Ticket: "373450", Fare: 8.0500, Cabin: null, Embarked: "S" },
    { PassengerId: 887, Survived: 0, Pclass: 2, Name: "Montvila, Rev. Juozas", Sex: "male", Age: 27.0, SibSp: 0, Parch: 0, Ticket: "211536", Fare: 13.0000, Cabin: null, Embarked: "S" },
    { PassengerId: 888, Survived: 1, Pclass: 1, Name: "Graham, Miss. Margaret Edith", Sex: "female", Age: 19.0, SibSp: 0, Parch: 0, Ticket: "112053", Fare: 30.0000, Cabin: "B42", Embarked: "S" },
    { PassengerId: 889, Survived: 0, Pclass: 3, Name: "Johnston, Miss. Catherine Helen \"Carrie\"", Sex: "female", Age: null, SibSp: 1, Parch: 2, Ticket: "W./C. 6607", Fare: 23.4500, Cabin: null, Embarked: "S" },
    { PassengerId: 890, Survived: 1, Pclass: 1, Name: "Behr, Mr. Karl Howell", Sex: "male", Age: 26.0, SibSp: 0, Parch: 0, Ticket: "111369", Fare: 30.0000, Cabin: "C148", Embarked: "C" },
    { PassengerId: 891, Survived: 0, Pclass: 3, Name: "Dooley, Mr. Patrick", Sex: "male", Age: 32.0, SibSp: 0, Parch: 0, Ticket: "370376", Fare: 7.7500, Cabin: null, Embarked: "Q" }
  ];

  // 所有变量
  const allVariables = ["PassengerId", "Survived", "Pclass", "Name", "Sex", "Age", "SibSp", "Parch", "Ticket", "Fare", "Cabin", "Embarked"];
  
  // 只包含数值型变量
  const numericVariables = ["PassengerId", "Survived", "Pclass", "Age", "SibSp", "Parch", "Fare"];
  
  
  // 计算相关性和生成散点图数据
  const generateCorrelationData = (xVar: string, yVar: string) => {
    if (!xVar || !yVar) return;
    
    // 过滤掉缺失值的数据
    const validData = mockData.filter(row => {
      const xVal = row[xVar as keyof DataRow];
      const yVal = row[yVar as keyof DataRow];
      return xVal !== null && yVal !== null && typeof xVal === 'number' && typeof yVal === 'number';
    });
    
    // 生成散点图数据
    const scatterData = validData.map(row => ({
      x: row[xVar as keyof DataRow] as number,
      y: row[yVar as keyof DataRow] as number
    }));
    
    // 计算相关性系数
    if (scatterData.length > 1) {
      const n = scatterData.length;
      const sumX = scatterData.reduce((sum, point) => sum + point.x, 0);
      const sumY = scatterData.reduce((sum, point) => sum + point.y, 0);
      const sumXY = scatterData.reduce((sum, point) => sum + point.x * point.y, 0);
      const sumX2 = scatterData.reduce((sum, point) => sum + point.x * point.x, 0);
      const sumY2 = scatterData.reduce((sum, point) => sum + point.y * point.y, 0);
      
      const correlation = (n * sumXY - sumX * sumY) / 
        Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      setCorrelationCoeff(isNaN(correlation) ? null : correlation);
    } else {
      setCorrelationCoeff(null);
    }
    
    setCorrelationData(scatterData);
  };
  
  // 当变量选择改变时自动生成相关性分析
  useEffect(() => {
    if (xVariable && yVariable) {
      generateCorrelationData(xVariable, yVariable);
    } else {
      setCorrelationData([]);
      setCorrelationCoeff(null);
    }
  }, [xVariable, yVariable]);

  const renderDataOverview = () => (
    <div className="space-y-6">
      {/* 数据概览标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据概览</h2>
          <p className="text-gray-600 mt-1">查看和分析您的数据集详细信息</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">总记录数</p>
                <p className="text-2xl font-bold">891</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">字段数量</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">完整性</p>
                <p className="text-2xl font-bold">77.1%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">缺失值</p>
                <p className="text-2xl font-bold">22.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据表预览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>数据表预览</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">选择要查看的记录数:</span>
              <Select value={selectedRows.toString()} onValueChange={(value) => setSelectedRows(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">条/页</span>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                缺失值
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                异常值
              </Button>
              <Button size="sm">
                <Search className="h-4 w-4 mr-2" />
                空值
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            共计 <span className="font-semibold">7504</span> 行
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs">序号</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">PassengerId</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Survived</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Pclass</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Name</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Sex</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Age</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">SibSp</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Parch</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Ticket</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Fare</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Cabin</div>
                  </TableHead>
                  <TableHead>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Embarked</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.slice(0, selectedRows).map((row, index) => (
                  <TableRow key={row.PassengerId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{row.PassengerId}</TableCell>
                    <TableCell>{row.Survived}</TableCell>
                    <TableCell>{row.Pclass}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.Name}</TableCell>
                    <TableCell>{row.Sex}</TableCell>
                    <TableCell>{row.Age || <span className="text-red-500">NaN</span>}</TableCell>
                    <TableCell>{row.SibSp}</TableCell>
                    <TableCell>{row.Parch}</TableCell>
                    <TableCell>{row.Ticket}</TableCell>
                    <TableCell>{row.Fare}</TableCell>
                    <TableCell>{row.Cabin || <span className="text-red-500">NaN</span>}</TableCell>
                    <TableCell>{row.Embarked}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataInteraction = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">数据交互分析</h2>
        <p className="text-gray-600 mt-1">探索变量之间的关系和相关性</p>
      </div>

      {/* 变量选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">设定X轴变量</label>
            <Select value={xVariable} onValueChange={setXVariable}>
              <SelectTrigger>
                <SelectValue placeholder="选择X轴变量" />
              </SelectTrigger>
              <SelectContent>
                {numericVariables.map((variable) => (
                  <SelectItem key={variable} value={variable}>{variable}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">设定Y轴变量</label>
            <Select value={yVariable} onValueChange={setYVariable}>
              <SelectTrigger>
                <SelectValue placeholder="选择Y轴变量" />
              </SelectTrigger>
              <SelectContent>
                {numericVariables.map((variable) => (
                  <SelectItem key={variable} value={variable}>{variable}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* 散点图区域 */}
      <Card>
        <CardContent className="p-6">
          {/* 相关性系数显示 */}
          {correlationCoeff !== null && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">相关性系数 (r):</span>
                <span className={`text-lg font-bold ${
                  Math.abs(correlationCoeff) > 0.7 ? 'text-green-600' :
                  Math.abs(correlationCoeff) > 0.3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {correlationCoeff.toFixed(3)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.abs(correlationCoeff) > 0.7 ? '强相关' :
                 Math.abs(correlationCoeff) > 0.3 ? '中等相关' : '弱相关'}
              </div>
            </div>
          )}
          
          <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center relative">
            {/* 模拟散点图 */}
            <div className="absolute inset-8 border-l-2 border-b-2 border-gray-300">
              {/* Y轴标签 */}
              <div className="absolute -left-16 top-1/2 text-sm text-gray-600 transform -rotate-90 -translate-y-1/2">
                {yVariable || 'Y轴变量'}
              </div>
              {/* X轴标签 */}
              <div className="absolute -bottom-8 left-1/2 text-sm text-gray-600 transform -translate-x-1/2">
                {xVariable || 'X轴变量'}
              </div>
              
              {/* Y轴刻度 */}
              <div className="absolute -left-6 top-0 text-xs text-gray-500">800</div>
              <div className="absolute -left-6 top-1/4 text-xs text-gray-500">600</div>
              <div className="absolute -left-6 top-1/2 text-xs text-gray-500">400</div>
              <div className="absolute -left-6 top-3/4 text-xs text-gray-500">200</div>
              <div className="absolute -left-6 bottom-0 text-xs text-gray-500">0</div>
              
              {/* X轴刻度 */}
              <div className="absolute -bottom-6 left-0 text-xs text-gray-500">0</div>
              <div className="absolute -bottom-6 left-1/4 text-xs text-gray-500">20</div>
              <div className="absolute -bottom-6 left-1/2 text-xs text-gray-500">40</div>
              <div className="absolute -bottom-6 left-3/4 text-xs text-gray-500">60</div>
              <div className="absolute -bottom-6 right-0 text-xs text-gray-500">80</div>
              
              {/* 网格线 */}
              <div className="absolute inset-0">
                {/* 水平网格线 */}
                {[0, 25, 50, 75, 100].map(y => (
                  <div
                    key={`h-${y}`}
                    className="absolute w-full border-t border-gray-200"
                    style={{ bottom: `${y}%` }}
                  />
                ))}
                {/* 垂直网格线 */}
                {[0, 25, 50, 75, 100].map(x => (
                  <div
                    key={`v-${x}`}
                    className="absolute h-full border-l border-gray-200"
                    style={{ left: `${x}%` }}
                  />
                ))}
              </div>
              
              {/* 散点 */}
              {correlationData.length > 0 ? (
                correlationData.map((point, index) => {
                  const maxX = Math.max(...correlationData.map(d => d.x));
                  const maxY = Math.max(...correlationData.map(d => d.y));
                  return (
                    <div
                      key={index}
                      className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-200"
                      style={{
                        left: `${Math.min((point.x / maxX) * 85, 85)}%`,
                        bottom: `${Math.min((point.y / maxY) * 85, 85)}%`,
                      }}
                    />
                  );
                })
              ) : (
                Array.from({ length: 50 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-70 hover:opacity-100 transition-all duration-200"
                    style={{
                      left: `${Math.random() * 85}%`,
                      bottom: `${Math.random() * 85}%`,
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMissingAnalysis = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">缺失分析</h2>
        <p className="text-gray-600 mt-1">分析数据集中的缺失值模式和分布</p>
      </div>

      {/* 缺失值统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Count</div>
              <div className="text-sm text-gray-600 mt-1">计数统计</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Matrix</div>
              <div className="text-sm text-gray-600 mt-1">缺失矩阵</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">Heatmap</div>
              <div className="text-sm text-gray-600 mt-1">热力图</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Dendrogram</div>
              <div className="text-sm text-gray-600 mt-1">树状图</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 缺失值矩阵 */}
      <Card>
        <CardHeader>
          <CardTitle>数据缺失分析</CardTitle>
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm">
              详细展示页面见子页面
            </Button>
            <Button variant="outline" size="sm" className="ml-2">
              评估载图页面
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-50 rounded-lg p-4">
            {/* 模拟缺失值矩阵 */}
            <div className="flex flex-col h-full">
              {/* 列标题 */}
              <div className="flex mb-2 text-xs">
                <div className="w-16"></div>
                {allVariables.map((variable) => (
                  <div key={variable} className="flex-1 text-center transform -rotate-45 origin-center">
                    {variable}
                  </div>
                ))}
              </div>
              
              {/* 行数据 */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center mb-1">
                  <div className="w-16 text-xs text-gray-600">1</div>
                  {allVariables.map((variable, index) => (
                    <div key={variable} className="flex-1 h-4 mx-0.5">
                      <div 
                        className={`h-full ${
                          variable === 'Age' || variable === 'Cabin' 
                            ? 'bg-white border border-gray-300' 
                            : 'bg-blue-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                
                {/* 重复行模式 */}
                {Array.from({ length: 20 }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center mb-1">
                    <div className="w-16 text-xs text-gray-600">{rowIndex + 2}</div>
                    {allVariables.map((variable, index) => (
                      <div key={variable} className="flex-1 h-4 mx-0.5">
                        <div 
                          className={`h-full ${
                            (variable === 'Age' && Math.random() > 0.8) || 
                            (variable === 'Cabin' && Math.random() > 0.2)
                              ? 'bg-white border border-gray-300' 
                              : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                
                <div className="flex items-center">
                  <div className="w-16 text-xs text-gray-600">891</div>
                  {allVariables.map((variable, index) => (
                    <div key={variable} className="flex-1 h-4 mx-0.5">
                      <div className="h-full bg-blue-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-xl font-semibold">数据集详情分析</h1>
              <p className="text-sm text-gray-600">数据集: {dataset?.name || '未知数据集'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            数据概览及变量
          </button>
          <button
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "interaction"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("interaction")}
          >
            数据交互分析
          </button>
          <button
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "missing"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("missing")}
          >
            缺失分析
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="p-6">
        {activeTab === "overview" && renderDataOverview()}
        {activeTab === "interaction" && renderDataInteraction()}
        {activeTab === "missing" && renderMissingAnalysis()}
      </div>
    </div>
  );
}