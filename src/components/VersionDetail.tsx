import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, User, Database, FileText, BarChart3, Settings } from 'lucide-react';

interface Version {
  id: string;
  versionNumber: string;
  source: '上传' | '订阅' | '清洗';
  createTime: string;
  creator: string;
  size: string;
  status: '成功' | '失败';
  description?: string;
  fieldCount: number;
  sampleCount: number;
  missingRate: number;
  anomalyRate: number;
  rules?: string[];
  processingDetails?: {
    originalFields: number;
    processedFields: number;
    removedFields: string[];
    addedFields: string[];
    transformations: string[];
  };
}

interface VersionDetailProps {
  version: Version;
  datasetName: string;
  onBack: () => void;
}

const VersionDetail: React.FC<VersionDetailProps> = ({ version, datasetName, onBack }) => {
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === '成功' ? 'default' : 'destructive'}>
        {status}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const variants = {
      '上传': 'secondary',
      '订阅': 'outline',
      '清洗': 'default'
    } as const;
    
    return (
      <Badge variant={variants[source as keyof typeof variants]}>
        {source}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">版本详情</h1>
            <p className="text-gray-600">{datasetName} - {version.versionNumber}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {getStatusBadge(version.status)}
          {getSourceBadge(version.source)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">版本号</label>
                <p className="text-lg font-semibold">{version.versionNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">来源方式</label>
                <div className="mt-1">{getSourceBadge(version.source)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">创建时间</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.createTime}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">创建人</label>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.creator}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">数据大小</label>
                <div className="flex items-center mt-1">
                  <Database className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{version.size}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <div className="mt-1">{getStatusBadge(version.status)}</div>
              </div>
            </div>
            {version.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">描述</label>
                <p className="mt-1 text-gray-700">{version.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              统计信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{version.fieldCount}</div>
                <div className="text-sm text-blue-600">字段数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{version.sampleCount.toLocaleString()}</div>
                <div className="text-sm text-green-600">样本数</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{version.missingRate}%</div>
                <div className="text-sm text-yellow-600">缺失比例</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{version.anomalyRate}%</div>
                <div className="text-sm text-red-600">异常比例</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 规则摘要卡片 */}
      {version.rules && version.rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              处理规则摘要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {version.rules.map((rule, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 处理详情卡片 */}
      {version.processingDetails && (
        <Card>
          <CardHeader>
            <CardTitle>处理详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">字段变化</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">原始字段数:</span>
                    <span className="font-medium">{version.processingDetails.originalFields}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">处理后字段数:</span>
                    <span className="font-medium">{version.processingDetails.processedFields}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">数据转换</h4>
                <div className="space-y-1">
                  {version.processingDetails.transformations.map((transformation, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {transformation}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(version.processingDetails.removedFields.length > 0 || version.processingDetails.addedFields.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {version.processingDetails.removedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">删除的字段</h4>
                    <div className="space-y-1">
                      {version.processingDetails.removedFields.map((field, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {version.processingDetails.addedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">新增的字段</h4>
                    <div className="space-y-1">
                      {version.processingDetails.addedFields.map((field, index) => (
                        <div key={index} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VersionDetail;