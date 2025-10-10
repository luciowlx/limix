import { ArrowLeft, X } from "lucide-react";
import { Button } from "./ui/button";
import { PersonalCenter } from "./PersonalCenter";
import { PersonalizationSettings } from "./PersonalizationSettings";
import { NotificationCenterContent } from "./NotificationCenterContent";
import { GlobalBotContent } from "./GlobalBotContent";

interface FullPageViewProps {
  type: 'personal-center' | 'personalization-settings' | 'notification-center' | 'global-bot' | null;
  onClose: () => void;
}

export function FullPageView({ type, onClose }: FullPageViewProps) {
  if (!type) return null;

  const getPageTitle = () => {
    switch (type) {
      case 'personal-center':
        return '个人中心';
      case 'personalization-settings':
        return '个性化设置';
      case 'notification-center':
        return '通知中心';
      case 'global-bot':
        return '智能助手';
      default:
        return '';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'personal-center':
        return <PersonalCenter />;
      case 'personalization-settings':
        return <PersonalizationSettings onBack={onClose} />;
      case 'notification-center':
        return <NotificationCenterContent />;
      case 'global-bot':
        return <GlobalBotContent />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 页面头部 */}
      <div className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">{getPageTitle()}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 页面内容 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {renderContent()}
      </div>
    </div>
  );
}