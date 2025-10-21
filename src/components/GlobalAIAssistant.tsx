import React, { useEffect, useRef, useState } from 'react';
import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
} from '@ant-design/x';
import { Avatar, Button, Space, Spin, message } from 'antd';
import CSVAnalysisDemo from './CSVAnalysisDemo';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';

const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: 'limix智能助手介绍',
    group: '今天',
  },
  {
    key: 'default-1',
    label: '如何创建新项目？',
    group: '今天',
  },
  {
    key: 'default-2',
    label: '团队协作最佳实践',
    group: '昨天',
  },
];

const HOT_TOPICS = {
  key: '1',
  label: '热门话题',
  children: [
    {
      key: '1-1',
      description: '项目管理系统有哪些新功能？',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: '如何高效管理团队项目？',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: '数据分析和报告功能介绍',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: '探索AI驱动的项目管理新范式',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: '如何快速上手系统功能？',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

const DESIGN_GUIDE = {
  key: '2',
  label: '功能指南',
  children: [
    {
      key: '2-1',
      icon: <HeartOutlined />,
      label: '项目创建',
      description: '快速创建和配置新项目',
    },
    {
      key: '2-2',
      icon: <SmileOutlined />,
      label: '团队管理',
      description: '管理团队成员和权限',
    },
    {
      key: '2-3',
      icon: <CommentOutlined />,
      label: '任务协作',
      description: '高效的任务分配和跟踪',
    },
    {
      key: '2-4',
      icon: <PaperClipOutlined />,
      label: '数据分析',
      description: '项目数据可视化和报告',
    },
  ],
};

const SENDER_PROMPTS = [
  {
    key: '1',
    description: '项目管理',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: '团队协作',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: '数据分析',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: '系统帮助',
    icon: <AppstoreAddOutlined />,
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `,
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background: #1677ff0f;
      border: 1px solid #1677ff34;
      height: 40px;
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    siderFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    chat: css`
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-block: ${token.paddingLG}px;
      gap: 16px;
    `,
    closeBtn: css`
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    sender: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      color: ${token.colorText};
    `,
  };
});

interface GlobalAIAssistantProps {
  onClose?: () => void;
}

const GlobalAIAssistant: React.FC<GlobalAIAssistantProps> = ({ onClose }) => {
  const { styles } = useStyle();
  const abortController = useRef<AbortController | null>(null);
  const replyTimerRef = useRef<number | null>(null);
  
  // ==================== State ====================
  const [messageHistory, setMessageHistory] = useState<Record<string, any[]>>({});
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  // ==================== Runtime（前端原型：使用模拟数据，不触发后端/网络请求） ====================
  // 不使用 useXAgent / useXChat，改为本地状态管理消息，避免配置校验导致运行时错误
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnalysisDemo, setShowAnalysisDemo] = useState(false);

  // ==================== Event ====================
  const buildMockReply = (input: string) => {
    const lower = input.toLowerCase();
    if (lower.includes('项目') || lower.includes('project')) {
      return '已为你整理项目管理关键流程：\n- 需求确认与范围界定\n- 里程碑与任务拆分（支持甘特图与看板）\n- 风险清单与应对方案\n- 数据/模型/任务三视图联动\n- 进度与质量指标（准确率/召回率/工期偏差）\n如需演示，我可以基于当前示例项目生成「项目进度报告」与可视化摘要。';
    }
    if (lower.includes('团队') || lower.includes('协作')) {
      return '团队协作建议如下：\n- 角色与权限：管理员/成员/访客分级\n- 评论与@提醒：支持任务、数据集与模型侧边栏讨论\n- 版本管理：数据集与模型支持版本标签与变更记录\n- 通知中心：合并未读提醒，支持筛选与跳转\n我也可以创建「协作清单」模板，帮助你快速分工与跟踪。';
    }
    if (lower.includes('数据') || lower.includes('分析')) {
      return '数据分析工作台示例：\n- 数据概览：样本量/缺失率/分布图\n- 质量检查：异常值与数据漂移监测\n- 可视化：折线/柱状/饼图与因果关系图\n- 报告导出：支持 Markdown/HTML 两种格式\n我已为你准备了演示数据，随时可以生成图表或报告。';
    }
    if (lower.includes('帮助') || lower.includes('使用')) {
      return '系统使用指南：\n- 左侧导航进入看板/项目/数据/任务/模型/系统管理\n- 右上角「智能助手」为统一入口，支持多会话、上传附件与快捷提示\n- 任何页面均可唤起助手获取解释或生成报告\n需要我按你的需求生成一个「快速上手清单」吗？';
    }
    return '我已收到你的请求：「' + input + '」。以下是可执行的演示动作：\n1) 生成任务配置草案（含参数与资源配额）\n2) 创建数据质量概览图并解释关键指标\n3) 输出项目周报模板并填写示例内容\n你也可以上传文件，我会在聊天中做要点提取与结构化摘要。';
  };

  const onSubmit = (val: string) => {
    if (!val) return;
    if (loading) {
      message.error('助手正在响应中，请稍后再试或取消当前回复。');
      return;
    }
    // 追加用户消息
    setMessages([...(messages || []), { role: 'user', content: val }]);
    setLoading(true);
    // 模拟思考，再追加 AI 回复
    const timer = window.setTimeout(() => {
      const reply = buildMockReply(val);
      setMessages([...(messages || []), { role: 'user', content: val }, { role: 'assistant', content: reply }]);
      setLoading(false);
    }, 800);
    replyTimerRef.current = timer;
  };

  // ==================== Nodes ====================
  const chatSider = (
    <div className={styles.sider}>
      {/* Logo */}
      <div className={styles.logo}>
        <div style={{ 
          width: 24, 
          height: 24, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          AI
        </div>
        <span>limix智能助手</span>
      </div>

      {/* 添加会话 */}
      <Button
        onClick={() => {
          // 当正在生成回复时，不允许切换来创建新会话
          if (loading) {
            message.error('消息正在响应中，请等待完成或取消当前回复');
            return;
          }
          const now = dayjs().valueOf().toString();
          setConversations([
            {
              key: now,
              label: `新对话 ${conversations.length + 1}`,
              group: '今天',
            },
            ...conversations,
          ]);
          setCurConversation(now);
          setMessages([]);
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
        新建对话
      </Button>

      {/* 会话管理 */}
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          abortController.current?.abort();
          setTimeout(() => {
            setCurConversation(val);
            setMessages(messageHistory?.[val] || []);
          }, 100);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: '重命名',
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: '删除',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                const newList = conversations.filter(item => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                setTimeout(() => {
                  if (conversation.key === curConversation) {
                    setCurConversation(newKey);
                    setMessages(messageHistory?.[newKey] || []);
                  }
                }, 200);
              },
            },
          ],
        })}
      />

      <div className={styles.siderFooter}>
        <Avatar size={24} />
        <Button type="text" icon={<QuestionCircleOutlined />} />
      </div>
    </div>
  );

  const chatList = (
    <div className={styles.chatList}>
      {messages?.length ? (
        <>
          <Bubble.List
            items={messages || []}
            style={{ height: '100%', paddingInline: 'calc(calc(100% - 700px) /2)' }}
            roles={{
              assistant: {
                placement: 'start',
                footer: (
                  <div style={{ display: 'flex' }}>
                    <Button type="text" size="small" icon={<ReloadOutlined />} />
                    <Button type="text" size="small" icon={<CopyOutlined />} />
                    <Button type="text" size="small" icon={<LikeOutlined />} />
                    <Button type="text" size="small" icon={<DislikeOutlined />} />
                  </div>
                ),
                loadingRender: () => <Spin size="small" />,
              },
              user: { placement: 'end' },
            }}
          />
          {showAnalysisDemo && (
            <div style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}>
              <CSVAnalysisDemo onClose={() => setShowAnalysisDemo(false)} />
            </div>
          )}
        </>
      ) : (
        <Space
          direction="vertical"
          size={16}
          style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}
          className={styles.placeholder}
        >
          <Welcome
            variant="borderless"
            icon={
              <div style={{ 
                width: 48, 
                height: 48, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                AI
              </div>
            }
            title="你好，我是 limix智能助手"
            description="基于AI技术，为您提供专业的项目管理建议和帮助~"
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
              </Space>
            }
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <Prompts
              items={[HOT_TOPICS]}
              styles={{
                list: { height: '100%' },
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description);
              }}
              className={styles.chatPrompt}
            />

            <Prompts
              items={[DESIGN_GUIDE]}
              styles={{
                item: {
                  flex: 1,
                  backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { background: '#ffffffa6' },
              }}
              onItemClick={(info) => {
                // 点击“数据分析”展示 CSV 演示工作台，其它项走常规聊天流程
                if (info?.data?.label === '数据分析' || String(info?.data?.description || '').includes('数据分析')) {
                  setShowAnalysisDemo(true);
                } else {
                  onSubmit(info.data.description);
                }
              }}
              className={styles.chatPrompt}
            />
          </div>
          {showAnalysisDemo && (
            <div style={{ paddingInline: 'calc(calc(100% - 700px) /2)' }}>
              <CSVAnalysisDemo onClose={() => setShowAnalysisDemo(false)} />
            </div>
          )}
        </Space>
      )}
    </div>
  );

  const senderHeader = (
    <Sender.Header
      title="上传文件"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: '拖拽文件到此处' }
            : {
                icon: <CloudUploadOutlined />,
                title: '上传文件',
                description: '点击或拖拽文件到此区域上传',
              }
        }
      />
    </Sender.Header>
  );

  const chatSender = (
    <>
      {/* 提示词 */}
      <Prompts
        items={SENDER_PROMPTS}
        onItemClick={(info) => {
          const text = String(info?.data?.description || '');
          if (text.includes('数据分析')) {
            setShowAnalysisDemo(true);
          } else {
            onSubmit(info.data.description);
          }
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className={styles.senderPrompt}
      />
      {/* 输入框 */}
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          // 取消当前模拟回复
          if (replyTimerRef.current) {
            clearTimeout(replyTimerRef.current);
            replyTimerRef.current = null;
          }
          setLoading(false);
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        className={styles.sender}
        allowSpeech
        actions={(_, info) => {
          const { SendButton, LoadingButton, SpeechButton } = info.components;
          return (
            <div style={{ display: 'flex', gap: 4 }}>
              <SpeechButton className={styles.speechButton} />
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </div>
          );
        }}
        placeholder="询问或输入 / 使用技能"
      />
    </>
  );

  useEffect(() => {
    // 历史记录模拟
    if (messages?.length) {
      setMessageHistory(prev => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages, curConversation]);

  // ==================== Render =================
  return (
    <div className={styles.layout}>
      {/* 关闭按钮（统一入口的浮层可随时关闭）*/}
      {onClose && (
        <Button type="text" className={styles.closeBtn} icon={<CloseOutlined />} onClick={onClose} />
      )}
      {chatSider}
      <div className={styles.chat}>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default GlobalAIAssistant;