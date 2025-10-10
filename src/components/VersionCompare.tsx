import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

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
}

interface VersionCompareProps {
  version1: Version;
  version2: Version;
  datasetName: string;
  onBack: () => void;
}

const VersionCompare: React.FC<VersionCompareProps> = ({ version1, version2, datasetName, onBack }) => {
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

  const getChangeIcon = (value1: number, value2: number) => {
    if (value1 === value2) return <Minus className="h-4 w-4 text-gray-400" />;
    if (value1 < value2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (value1: number, value2: number, isGoodWhenHigher: boolean = true) => {
    if (value1 === value2) return 'text-gray-600';
    const isIncreasing = value1 < value2;
    if (isGoodWhenHigher) {
      return isIncreasing ? 'text-green-600' : 'text-red-600';
    } else {
      return isIncreasing ? 'text-red-600' : 'text-green-600';
    }
  };

  const calculateChange = (value1: number, value2: number) => {
    if (value1 === 0) return value2 === 0 ? 0 : 100;
    return ((value2 - value1) / value1 * 100);
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
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
            <h1 className="text-2xl font-bold">版本对比</h1>
            <p className="text-gray-600">{datasetName}</p>
          </div>
        </div>
      </div>

      {/* 版本对比概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{version1.versionNumber}</span>
              <div className="flex space-x-2">
                {getStatusBadge(version1.status)}
                {getSourceBadge(version1.source)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">创建时间:</span>
              <span>{version1.createTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">创建人:</span>
              <span>{version1.creator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">文件大小:</span>
              <span>{version1.size}</span>
            </div>
            {version1.description && (
              <div className="flex justify-between">
                <span className="text-gray-600">描述:</span>
                <span className="text-right">{version1.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{version2.versionNumber}</span>
              <div className="flex space-x-2">
                {getStatusBadge(version2.status)}
                {getSourceBadge(version2.source)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">创建时间:</span>
              <span>{version2.createTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">创建人:</span>
              <span>{version2.creator}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">文件大小:</span>
              <span>{version2.size}</span>
            </div>
            {version2.description && (
              <div className="flex justify-between">
                <span className="text-gray-600">描述:</span>
                <span className="text-right">{version2.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 统计数据对比 */}
      <Card>
        <CardHeader>
          <CardTitle>统计数据对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 字段数对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">字段数</div>
                {getChangeIcon(version1.fieldCount, version2.fieldCount)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.fieldCount}</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.fieldCount}</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.fieldCount, version2.fieldCount)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.fieldCount, version2.fieldCount))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 样本数对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">样本数</div>
                {getChangeIcon(version1.sampleCount, version2.sampleCount)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.sampleCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.sampleCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.sampleCount, version2.sampleCount)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.sampleCount, version2.sampleCount))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 缺失比例对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">缺失比例</div>
                {getChangeIcon(version1.missingRate, version2.missingRate)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.missingRate}%</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.missingRate}%</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.missingRate, version2.missingRate, false)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.missingRate, version2.missingRate))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>

            {/* 异常比例对比 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold">异常比例</div>
                {getChangeIcon(version1.anomalyRate, version2.anomalyRate)}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{version1.anomalyRate}%</div>
                  <div className="text-sm text-gray-600">{version1.versionNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg text-gray-400">→</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{version2.anomalyRate}%</div>
                  <div className="text-sm text-gray-600">{version2.versionNumber}</div>
                </div>
                <div className={`text-center ${getChangeColor(version1.anomalyRate, version2.anomalyRate, false)}`}>
                  <div className="text-lg font-semibold">
                    {formatChange(calculateChange(version1.anomalyRate, version2.anomalyRate))}
                  </div>
                  <div className="text-sm">变化</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 处理规则对比 */}
      {(version1.rules || version2.rules) && (
        <Card>
          <CardHeader>
            <CardTitle>处理规则对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">{version1.versionNumber}</h4>
                {version1.rules && version1.rules.length > 0 ? (
                  <div className="space-y-2">
                    {version1.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">无处理规则</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-purple-600">{version2.versionNumber}</h4>
                {version2.rules && version2.rules.length > 0 ? (
                  <div className="space-y-2">
                    {version2.rules.map((rule, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">无处理规则</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 对比总结 */}
      <Card>
        <CardHeader>
          <CardTitle>对比总结</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">主要改进</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {version2.fieldCount > version1.fieldCount && (
                  <li>• 字段数增加了 {version2.fieldCount - version1.fieldCount} 个</li>
                )}
                {version2.sampleCount > version1.sampleCount && (
                  <li>• 样本数增加了 {(version2.sampleCount - version1.sampleCount).toLocaleString()} 个</li>
                )}
                {version2.missingRate < version1.missingRate && (
                  <li>• 缺失比例降低了 {(version1.missingRate - version2.missingRate).toFixed(1)}%</li>
                )}
                {version2.anomalyRate < version1.anomalyRate && (
                  <li>• 异常比例降低了 {(version1.anomalyRate - version2.anomalyRate).toFixed(1)}%</li>
                )}
              </ul>
            </div>
            
            {(version2.fieldCount < version1.fieldCount || 
              version2.sampleCount < version1.sampleCount || 
              version2.missingRate > version1.missingRate || 
              version2.anomalyRate > version1.anomalyRate) && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">需要关注</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {version2.fieldCount < version1.fieldCount && (
                    <li>• 字段数减少了 {version1.fieldCount - version2.fieldCount} 个</li>
                  )}
                  {version2.sampleCount < version1.sampleCount && (
                    <li>• 样本数减少了 {(version1.sampleCount - version2.sampleCount).toLocaleString()} 个</li>
                  )}
                  {version2.missingRate > version1.missingRate && (
                    <li>• 缺失比例增加了 {(version2.missingRate - version1.missingRate).toFixed(1)}%</li>
                  )}
                  {version2.anomalyRate > version1.anomalyRate && (
                    <li>• 异常比例增加了 {(version2.anomalyRate - version1.anomalyRate).toFixed(1)}%</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionCompare;