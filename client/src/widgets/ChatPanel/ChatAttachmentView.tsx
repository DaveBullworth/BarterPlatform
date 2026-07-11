import { useState } from 'react';
import { Group, Image, Paper, Skeleton, Text } from '@mantine/core';
import { Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  chatApi,
  useChatAttachmentUrl,
  CHAT_ATTACHMENT_KIND,
  type ChatAttachment,
} from '@/entities/chat';
import { handleApiError } from '@/shared/lib';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type Props = {
  offerId: string;
  attachment: ChatAttachment;
  /** Тянуть приватный blob только когда панель открыта. */
  enabled: boolean;
};

const ChatImageAttachment = ({ offerId, attachment, enabled }: Props) => {
  const url = useChatAttachmentUrl(offerId, attachment.id, enabled);

  if (!url) return <Skeleton h={140} w={180} radius="md" />;

  return (
    <Image
      src={url}
      alt={attachment.originalName}
      radius="md"
      mah={220}
      maw={260}
      fit="cover"
      style={{ cursor: 'zoom-in' }}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
    />
  );
};

const ChatDocAttachment = ({ offerId, attachment }: Omit<Props, 'enabled'>) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await chatApi.getAttachmentBlob(offerId, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      handleApiError(err, t);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Paper
      withBorder
      radius="md"
      p="xs"
      maw={260}
      style={{ cursor: 'pointer', opacity: downloading ? 0.6 : 1 }}
      onClick={handleDownload}
    >
      <Group gap="xs" wrap="nowrap">
        <FileText size={22} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text size="sm" lineClamp={1}>
            {attachment.originalName}
          </Text>
          <Text size="xs" c="dimmed">
            {formatBytes(attachment.size)}
          </Text>
        </div>
        <Download size={16} />
      </Group>
    </Paper>
  );
};

export const ChatAttachmentView = ({ offerId, attachment, enabled }: Props) => {
  if (attachment.kind === CHAT_ATTACHMENT_KIND.IMAGE) {
    return (
      <ChatImageAttachment
        offerId={offerId}
        attachment={attachment}
        enabled={enabled}
      />
    );
  }
  return <ChatDocAttachment offerId={offerId} attachment={attachment} />;
};
