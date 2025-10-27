import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
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
  Activity,
  Copy,
  Pencil
} from "lucide-react";
import VersionHistory from "./VersionHistory";

interface DataDetailFullPageProps {
  dataset: any;
  onClose: () => void;
  // 新增：支持外部传入初始 Tab，用于从列表直接跳转到指定页签
  initialTab?: "overview" | "missing" | "versions";
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

export function DataDetailFullPage({ dataset, onClose, initialTab }: DataDetailFullPageProps) {
  // 统一使用 mock 元数据，禁止显示空值或占位符
  const initialMeta = {
    name: "示例数据集",
    id: "1",
    version: "v1.2",
    source: "上传",
    createdAt: "2024-01-17T09:15:00",
    updatedAt: "2024-01-15T14:30:00",
    creator: "王五",
    sizeBytes: Math.round(2.8 * 1024 * 1024),
    status: "成功",
    description: "包含2023年客户营销记录，涵盖产品信息、客户数据、交易数据等关键信息",
    tags: ["订阅更新版本", "客户", "营销", "交易", "安全"],
    stats: { totalRows: 891 },
    permissions: { canEditDescription: true, canDownload: true },
    downloadUrl: "https://example.com/download/mock.csv",
  };
  const [meta, setMeta] = useState(initialMeta);
  // 新增：使用传入的 initialTab 初始化当前页签，默认为 overview
  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [selectedRows, setSelectedRows] = useState(20);
  // 新增：表格过滤相关状态
  const [missingOnly, setMissingOnly] = useState(false);
  const [uniqueOnly, setUniqueOnly] = useState(false);
  const [uniqueField, setUniqueField] = useState<keyof DataRow>("Cabin");
  // 新增：基本信息与权限控制
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editableDesc, setEditableDesc] = useState<string>(meta.description);
  const [copyTip, setCopyTip] = useState("");
  const canEditDesc = meta.permissions.canEditDescription;
  const canDownload = meta.permissions.canDownload;
  // 新增：缺失分析交互状态
  const [heatmapMode, setHeatmapMode] = useState<'sample' | 'column'>("sample");
  // 移除交互分析相关的状态，界面保持简洁
  // const [searchTerm, setSearchTerm] = useState("");
  // const [xVariable, setXVariable] = useState("");
  // const [yVariable, setYVariable] = useState("");
  // const [correlationData, setCorrelationData] = useState<{x: number, y: number}[]>([]);
  // const [correlationCoeff, setCorrelationCoeff] = useState<number | null>(null);

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
  
  // 计算“唯一值占比（字段平均）”：对每个字段计算非空值的唯一比例并取平均
  const getUniqueValueRatioPercent = () => {
    if (!mockData || mockData.length === 0) return 0;
    const fields = allVariables;
    let sumRatio = 0;
    let counted = 0;
    fields.forEach((field) => {
      const rawValues = mockData.map((row) => row[field as keyof DataRow]);
      const validValues = rawValues.filter((v) => v !== null && v !== undefined);
      if (validValues.length === 0) {
        sumRatio += 0; // 全为空，唯一占比记为 0
      } else {
        const uniqCount = new Set(validValues.map((v) => (typeof v === "string" ? v : String(v)))).size;
        sumRatio += uniqCount / validValues.length;
      }
      counted += 1;
    });
    const avg = counted === 0 ? 0 : sumRatio / counted;
    return avg * 100; // 转为百分比
  };

  // 基本信息工具函数与操作（组件内）
  const formatBytes = (size?: number) => {
    if (!size || isNaN(size)) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let num = size;
    while (num >= 1024 && idx < units.length - 1) { num /= 1024; idx++; }
    const digits = num >= 100 ? 0 : num >= 10 ? 1 : 2;
    return `${num.toFixed(digits)} ${units[idx]}`;
  };
  // 将如“2.8MB”解析为字节数
  const parseSizeToBytes = (sizeStr?: string) => {
    if (!sizeStr) return undefined;
    const m = String(sizeStr).trim().match(/([\d.]+)\s*(KB|MB|GB|TB)/i);
    if (!m) return undefined;
    const val = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    const mul = unit === "KB" ? 1024 : unit === "MB" ? 1024 ** 2 : unit === "GB" ? 1024 ** 3 : 1024 ** 4;
    return Math.round(val * mul);
  };
  // 切换查看指定版本：更新当前 meta 并回到“数据概览及变量”
  const handleSwitchVersion = (version: any) => {
    setMeta((prev) => ({
      ...prev,
      version: version.versionNumber ?? prev.version,
      source: version.source ?? prev.source,
      createdAt: version.createTime ?? prev.createdAt,
      creator: version.creator ?? prev.creator,
      sizeBytes: parseSizeToBytes(version.size) ?? prev.sizeBytes,
      status: version.status ?? prev.status,
      description: version.description ?? prev.description,
    }));
    setActiveTab("overview");
  };
  const formatDateTime = (v?: string | number | Date) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  const mapSourceLabel = (src?: string) => {
    if (!src) return "—";
    const s = String(src).toLowerCase();
    if (s.includes("upload") || s.includes("上传")) return "上传";
    if (s.includes("订阅") || s.includes("subscription")) return "订阅";
    if (s.includes("清洗") || s.includes("clean")) return "清洗";
    return src as string;
  };

  const getSourceClass = (label: string) => {
    switch (label) {
      case "上传": return "bg-blue-50 text-blue-700 border-blue-300";
      case "订阅": return "bg-purple-50 text-purple-700 border-purple-300";
      case "清洗": return "bg-green-50 text-green-700 border-green-300";
      default: return "bg-gray-50 text-gray-700 border-gray-300";
    }
  };

  const getStatusStyling = (status?: string) => {
    const s = status ? String(status).toLowerCase() : "";
    if (s.includes("success") || s.includes("成功")) return { cls: "bg-green-50 text-green-700 border-green-300", label: "成功" };
    if (s.includes("fail") || s.includes("失败")) return { cls: "bg-red-50 text-red-700 border-red-300", label: "失败" };
    // 兼容历史“处理中”字符串，但统一显示为“导入中”
    if (s.includes("process") || s.includes("处理中") || s.includes("running") || s.includes("导入中")) return { cls: "bg-yellow-50 text-yellow-700 border-yellow-300", label: "导入中" };
    return { cls: "bg-gray-50 text-gray-700 border-gray-300", label: status || "未知" };
  };

  // 已移除：LimiX质量评分相关逻辑

  // 已移除：LimiX质量评分样式分类函数

  const handleCopyId = async () => {
    const id = meta.id;
    try {
      await navigator.clipboard.writeText(String(id));
      setCopyTip("已复制");
      setTimeout(() => setCopyTip(""), 2000);
    } catch (e) {
      setCopyTip("复制失败");
      setTimeout(() => setCopyTip(""), 2000);
    }
  };

  const handleDownload = () => {
    const url = meta.downloadUrl;
    if (!url) {
      alert("暂无下载链接");
      return;
    }
    window.open(url, "_blank");
  };

  // 新增：通用缺失与唯一过滤逻辑
  const isMissingValue = (v: any) => v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) || (typeof v === "string" && v.trim() === "");

  const rowHasMissing = (row: DataRow) => {
    return allVariables.some((field) => isMissingValue(row[field as keyof DataRow]));
  };

  const getFilteredData = () => {
    let data = [...mockData];
    if (missingOnly) {
      data = data.filter((row) => rowHasMissing(row));
    }
    if (uniqueOnly && uniqueField) {
      const counts = new Map<string, number>();
      mockData.forEach((row) => {
        const raw = row[uniqueField];
        const val = raw === null || raw === undefined ? "" : typeof raw === "string" ? raw.trim() : String(raw);
        if (val !== "" && !(typeof raw === "number" && Number.isNaN(raw))) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      });
      data = data.filter((row) => {
        const raw = row[uniqueField];
        const val = raw === null || raw === undefined ? "" : typeof raw === "string" ? raw.trim() : String(raw);
        if (val === "" || (typeof raw === "number" && Number.isNaN(raw))) return false;
        return (counts.get(val) || 0) === 1;
      });
    }
    return data;
  };
  
  
  // 新增：缺失分析 mock 指标计算
  const getMissingAnalysisMock = () => {
    const totalRows = mockData.length;
    const totalFields = allVariables.length;
  
    let missingCells = 0;
    let rowsWithMissing = 0;
    let singleMissingRows = 0;
    let multiMissingRows = 0;
  
    const fieldMissingCounts: Record<string, number> = {};
    allVariables.forEach((f) => { fieldMissingCounts[f] = 0; });
  
    mockData.forEach((row) => {
      let missingInRow = 0;
      allVariables.forEach((f) => {
        const v = row[f as keyof DataRow];
        const miss = isMissingValue(v);
        if (miss) {
          missingCells++;
          fieldMissingCounts[f] += 1;
          missingInRow++;
        }
      });
      if (missingInRow > 0) {
        rowsWithMissing++;
        if (missingInRow === 1) singleMissingRows++;
        else multiMissingRows++;
      }
    });
  
    const totalCells = totalRows * totalFields;
    const missingRatio = totalCells === 0 ? 0 : (missingCells / totalCells) * 100;
    const rowsWithMissingRatio = totalRows === 0 ? 0 : (rowsWithMissing / totalRows) * 100;
    const completeRows = totalRows - rowsWithMissing;
  
    // 计算缺失特征相关性（Jaccard 相似度）
    const indicators: Record<string, boolean[]> = {};
    allVariables.forEach((f) => {
      indicators[f] = mockData.map((row) => isMissingValue(row[f as keyof DataRow]));
    });
  
    let bestPair: [string, string] | null = null;
    let bestScore = -1;
    const pairScores: { pair: [string, string]; score: number }[] = [];
    for (let i = 0; i < allVariables.length; i++) {
      for (let j = i + 1; j < allVariables.length; j++) {
        const a = allVariables[i];
        const b = allVariables[j];
        const arrA = indicators[a];
        const arrB = indicators[b];
        let intersection = 0;
        let union = 0;
        for (let k = 0; k < arrA.length; k++) {
          const aMiss = arrA[k];
          const bMiss = arrB[k];
          if (aMiss || bMiss) union++;
          if (aMiss && bMiss) intersection++;
        }
        const jaccard = union === 0 ? 0 : intersection / union;
        if (jaccard > bestScore) {
          bestScore = jaccard;
          bestPair = [a, b];
        }
        pairScores.push({ pair: [a, b], score: jaccard });
      }
    }
  
    const topMissingFields = Object.entries(fieldMissingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f);

    const topPairs = pairScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ pair, score }) => ({ pair, scorePercent: score * 100 }));
  
    return {
      totalRows,
      totalFields,
      totalCells,
      missingCells,
      missingRatio,
      rowsWithMissing,
      rowsWithMissingRatio,
      completeRows,
      singleMissingRows,
      multiMissingRows,
      fieldMissingCounts,
      topMissingFields,
      correlationPair: bestPair,
      correlationScore: Math.max(0, bestScore) * 100,
      indicators,
      topPairs,
    };
  };
  
  // 数据交互分析功能已移除以简化界面
  const renderDataOverview = () => (
    <div className="space-y-6">
      {/* 数据概览标题（移除右侧操作按钮） */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据概览</h2>
          <p className="text-gray-600 mt-1">查看和分析您的数据集详细信息</p>
        </div>
        {/* 右侧按钮已按需求移除 */}
      </div>

      {/* 基本信息与统计信息（紧凑布局） */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>基本信息</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!canDownload}
                className={!canDownload ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Download className="h-4 w-4 mr-2" />
                下载当前版本
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：基本信息网格（更紧凑） */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {/* 置顶：数据名称 + 数据ID（左对齐垂直堆叠） */}
              <div className="col-span-2">
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <div className="text-sm text-gray-600">数据名称</div>
                    <div className="text-base font-semibold">{meta.name}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">数据ID</div>
                    <span className="text-base font-mono">{meta.id}</span>
                    <Button variant="ghost" size="sm" onClick={handleCopyId} className="h-7 px-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                    {copyTip && <span className="text-xs text-green-600">{copyTip}</span>}
                  </div>
                </div>
              </div>

              {/* 其它基础字段 */}
              <div>
                <div className="text-sm text-gray-600">版本号</div>
                <div className="text-base font-medium">{meta.version}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">来源方式</div>
                <div>
                  {(() => {
                    const label = mapSourceLabel(meta.source);
                    const cls = getSourceClass(label);
                    return <span className={`inline-block px-2 py-1 rounded border text-xs ${cls}`}>{label}</span>;
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">创建时间</div>
                <div className="text-base">{formatDateTime(meta.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">创建人</div>
                <div className="text-base">{meta.creator}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">数据大小</div>
                <div className="text-base">{formatBytes(meta.sizeBytes)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">状态</div>
                <div>
                  {(() => {
                    const { cls, label } = getStatusStyling(meta.status);
                    return <span className={`inline-block px-2 py-1 rounded border text-xs ${cls}`}>{label}</span>;
                  })()}
                </div>
              </div>

              {/* 描述 + 标签 */}
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">描述</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canEditDesc ? setIsEditingDesc(true) : null}
                    disabled={!canEditDesc}
                    className={!canEditDesc ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                </div>
                {!isEditingDesc ? (
                  <div className="text-gray-800">{editableDesc}</div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={editableDesc}
                      onChange={(e) => setEditableDesc(e.target.value)}
                      placeholder="请输入描述"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button size="sm" onClick={() => { setIsEditingDesc(false); }}>保存</Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditableDesc(meta.description); setIsEditingDesc(false); }}>取消</Button>
                    </div>
                  </div>
                )}
                {/* 数据标签 */}
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">数据标签</div>
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="px-2 py-0.5 rounded-full">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：统计信息（2 x 2 紧凑排版） */}
            <div>
              <div className="flex items-center mb-3">
                <BarChart3 className="h-5 w-5 text-gray-700 mr-2" />
                <div className="text-base font-semibold">统计信息</div>
              </div>
              {(() => {
                const m = getMissingAnalysisMock();
                const totalRows = meta.stats.totalRows;
                const tiles = [
                  { label: "总记录数", value: totalRows, icon: Database, cls: "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: "字段数量", value: allVariables.length, icon: Layers, cls: "bg-green-50 text-green-700 border-green-200" },
                  { label: "缺失值比例", value: `${m.missingRatio.toFixed(1)}%`, icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 border-orange-200" },
                  { label: "唯一值占比（字段平均）", value: `${getUniqueValueRatioPercent().toFixed(1)}%`, icon: BarChart3, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                ];
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {tiles.map((t, idx) => (
                      <div key={idx} className={`rounded-lg border px-3 py-3 flex items-center ${t.cls}`}>
                        <t.icon className="h-5 w-5 mr-2" />
                        <div>
                          <div className="text-xs">{t.label}</div>
                          <div className="text-xl font-bold leading-tight">{t.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Select value={selectedRows.toString()} onValueChange={(value: string) => setSelectedRows(Number(value))}>
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
              {/* 按钮改为两个：缺失值 与 唯一值（可叠加），并添加字段选择器 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMissingOnly((prev) => !prev)}
                className={missingOnly ? "bg-orange-50 border-orange-500 text-orange-600" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                缺失值
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUniqueOnly((prev) => !prev)}
                className={uniqueOnly ? "bg-indigo-50 border-indigo-500 text-indigo-600" : ""}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                唯一值
              </Button>
              <Select value={uniqueField as string} onValueChange={(value: string) => setUniqueField(value as keyof DataRow)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="选择字段" />
                </SelectTrigger>
                <SelectContent>
                  {allVariables.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {getFilteredData().slice(0, selectedRows).map((row, index) => (
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

  const renderMissingAnalysis = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">缺失分析</h2>
        <p className="text-gray-600 mt-1">分析数据集中的缺失值模式和分布</p>
      </div>

      {/* 缺失值统计（前端 mock 数据展示） */}
      <div className="overflow-x-auto">
        {(() => {
          const m = getMissingAnalysisMock();
          const pairLabel = m.correlationPair ? `${m.correlationPair[0]} ↔ ${m.correlationPair[1]}` : "无明显相关";
          return (
            <div className="flex items-stretch space-x-4 min-w-max">
              <Card className="flex-none w-[240px]">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">缺失值比例</p>
                      <p className="text-2xl font-bold">{m.missingRatio.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">缺失单元: {m.missingCells}/{m.totalCells}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-none w-[240px]">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">含缺失行比例</p>
                      <p className="text-2xl font-bold">{m.rowsWithMissingRatio.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">含缺失行: {m.rowsWithMissing}/{m.totalRows}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-none w-[300px]">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">缺失模式分布</p>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-gray-700">
                        <div>完整行占比: <span className="font-semibold">{((m.completeRows / m.totalRows) * 100).toFixed(1)}%</span></div>
                        <div>单字段缺失占比: <span className="font-semibold">{((m.singleMissingRows / m.totalRows) * 100).toFixed(1)}%</span></div>
                        <div>多字段缺失占比: <span className="font-semibold">{((m.multiMissingRows / m.totalRows) * 100).toFixed(1)}%</span></div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {Object.entries(m.fieldMissingCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([f, c]) => {
                            const ratio = m.totalRows === 0 ? 0 : c / m.totalRows;
                            return (
                              <div key={f} className="flex items-center gap-2">
                                <span className="w-20 text-xs text-gray-600">{f}</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded">
                                  <div className="h-2 bg-orange-500 rounded" style={{ width: `${(ratio * 100).toFixed(1)}%` }} />
                                </div>
                                <span className="text-xs text-gray-600">{(ratio * 100).toFixed(1)}%</span>
                              </div>
                            );
                          })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Top缺失字段: {m.topMissingFields.join(", ") || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-none w-[260px]">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">缺失特征相关性</p>
                      <p className="text-base font-semibold">{pairLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">Jaccard: {m.correlationScore.toFixed(1)}%</p>
                      <div className="mt-2 space-y-1 text-xs">
                        {m.topPairs.map(({ pair, scorePercent }, idx) => (
                          <div key={`${pair[0]}-${pair[1]}-${idx}`} className="flex items-center justify-between">
                            <span>{pair[0]} & {pair[1]}</span>
                            <span>{scorePercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </div>

      {/* 缺失值矩阵 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>数据缺失分析</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">显示模式:</span>
              <Button variant={heatmapMode === 'sample' ? 'default' : 'outline'} size="sm" onClick={() => setHeatmapMode('sample')}>按行抽样</Button>
              <Button variant={heatmapMode === 'column' ? 'default' : 'outline'} size="sm" onClick={() => setHeatmapMode('column')}>按列聚合</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const m = getMissingAnalysisMock();
            const sampleRows = Math.min(m.totalRows, 10000);
            if (heatmapMode === 'sample') {
              return (
                <div className="h-96 bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex mb-2 text-xs">
                      <div className="w-16"></div>
                      {allVariables.map((variable) => (
                        <div key={variable} className="flex-1 text-center transform -rotate-45 origin-center">
                          {variable}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 overflow-auto">
                      {Array.from({ length: sampleRows }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex items-center mb-1">
                          <div className="w-16 text-xs text-gray-600">{rowIndex + 1}</div>
                          {allVariables.map((variable) => (
                            <div key={variable} className="flex-1 h-4 mx-0.5">
                              <div className={`h-full ${m.indicators[variable]?.[rowIndex] ? 'bg-white border border-gray-300' : 'bg-blue-500'}`} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">抽样显示 {sampleRows} 行（上限 10k）</div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="h-64 bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex mb-2 text-xs">
                      <div className="w-16"></div>
                      {allVariables.map((variable) => (
                        <div key={variable} className="flex-1 text-center transform -rotate-45 origin-center">
                          {variable}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 text-xs text-gray-600">列聚合</div>
                      {allVariables.map((variable) => {
                        const c = m.fieldMissingCounts[variable] || 0;
                        const ratio = m.totalRows === 0 ? 0 : c / m.totalRows;
                        const alpha = 0.2 + 0.8 * ratio;
                        return (
                          <div key={variable} className="flex-1 h-6 mx-0.5 rounded relative">
                            <div className="h-full rounded" style={{ backgroundColor: `rgba(59,130,246,${alpha})` }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="w-16"></div>
                      {allVariables.map((variable) => {
                        const c = m.fieldMissingCounts[variable] || 0;
                        const ratio = m.totalRows === 0 ? 0 : c / m.totalRows;
                        return (
                          <div key={variable} className="flex-1 text-center text-xs text-gray-600">{(ratio * 100).toFixed(1)}%</div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }
          })()}
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
              <h1 className="text-xl font-semibold">{meta.name}</h1>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <span className="mr-2">数据ID: {meta.id}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyId} className="h-7 px-2">
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  复制ID
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航（新增“版本历史”在最前） */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "versions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("versions")}
          >
            版本树 / 版本历史
          </button>
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
        {activeTab === "versions" && (
          <VersionHistory
            datasetId={meta.id}
            datasetName={meta.name}
            onBack={() => setActiveTab("overview")}
            onSwitchVersion={handleSwitchVersion}
          />
        )}
        {activeTab === "overview" && renderDataOverview()}
        {activeTab === "missing" && renderMissingAnalysis()}
      </div>
    </div>
  );
}