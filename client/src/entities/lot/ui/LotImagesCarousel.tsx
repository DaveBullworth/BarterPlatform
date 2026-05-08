import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Group,
  Image,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { CameraOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getLotOriginalImageUrl, type LotImage } from '@/entities/lot';

import styles from '../Lot.module.scss';

type Props = {
  images: LotImage[];
};

export const LotImagesCarousel = ({ images }: Props) => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [openedImageId, setOpenedImageId] = useState<string | null>(null);

  const handleOpen = (id: string) => {
    setOpenedImageId(id);
    setOpened(true);
  };
  const handleClose = () => setOpened(false);

  if (images.length === 0) {
    return (
      <Card withBorder>
        <Stack
          gap="sm"
          align="center"
          style={{ height: 140, justifyContent: 'center' }}
        >
          <CameraOff size={42} />
          <Text size="sm">{t('lot.noImages')}</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <ScrollArea type="always" scrollHideDelay={500}>
          <Group wrap="nowrap" className={styles.carouselRow}>
            {images.map((image) => (
              <Box
                key={image.imageId}
                className={styles.carouselImageWrapper}
                onClick={() => handleOpen(image.imageId)}
              >
                <Image
                  className={styles.carouselImage}
                  src={`data:${image.mimeType};base64,${image.data}`}
                  alt="lot"
                />
              </Box>
            ))}
          </Group>
        </ScrollArea>
      </Card>

      <Modal
        opened={opened}
        onClose={handleClose}
        transitionProps={{ onExited: () => setOpenedImageId(null) }}
        withCloseButton={false}
        centered
        size="xl"
        className={styles.fullImageModal}
      >
        <ActionIcon
          onClick={handleClose}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          size="lg"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
        >
          <X size={18} />
        </ActionIcon>

        {openedImageId && (
          <Image
            src={getLotOriginalImageUrl(openedImageId)}
            alt="original lot"
            fit="contain"
            style={{ maxHeight: '90vh', cursor: 'pointer' }}
            onClick={() =>
              window.open(getLotOriginalImageUrl(openedImageId), '_blank')
            }
          />
        )}
      </Modal>
    </>
  );
};
