import { Eye, Play, Pencil, Trash2, Square, Download, Archive, Copy, RotateCcw } from 'lucide-react';

// Shared task status type across list and detail pages
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'archived' | 'paused';

export type TaskAction = { key: string; label: string; icon: any };

// Return available actions based on task status
export const getAvailableActions = (task: { status: TaskStatus }): TaskAction[] => {
  const mapping: Record<TaskStatus, TaskAction[]> = {
    pending: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'start', label: '开始', icon: Play },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    running: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'stop', label: '停止', icon: Square },
    ],
    completed: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'export', label: '导出', icon: Download },
      { key: 'archive', label: '归档', icon: Archive },
      { key: 'copy', label: '复制', icon: Copy },
    ],
    failed: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'retry', label: '重新运行', icon: RotateCcw },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    cancelled: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'edit', label: '编辑', icon: Pencil },
      { key: 'retry', label: '重新运行', icon: RotateCcw },
      { key: 'delete', label: '删除', icon: Trash2 },
    ],
    archived: [
      { key: 'view', label: '详情', icon: Eye },
    ],
    paused: [
      { key: 'view', label: '详情', icon: Eye },
      { key: 'start', label: '开始', icon: Play },
      { key: 'stop', label: '停止', icon: Square },
    ],
  };
  return mapping[task.status];
};

// Common actions to show directly (others go into a "more" dropdown)
export const getCommonActionKeys = (task: { status: TaskStatus }): string[] => {
  const mapping: Record<TaskStatus, string[]> = {
    pending: ['start', 'edit'],
    running: ['stop'],
    completed: ['export', 'archive'],
    failed: ['retry', 'edit'],
    cancelled: ['retry', 'edit'],
    archived: ['view'],
    paused: ['start', 'stop'],
  };
  return mapping[task.status];
};