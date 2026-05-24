import { useState } from 'react';
import { ActionIcon, Modal, Text } from '@mantine/core';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getLotOriginalImageUrl, type LotImage } from '@/entities/lot';

import styles from '../Lot.module.scss';

type Props = {
  images: LotImage[];
};

const buildSrc = (image: LotImage) =>
  `data:${image.mimeType};base64,${image.data}`;

export const LotImagesCarousel = ({ images }: Props) => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageId, setModalImageId] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className={styles.galleryEmpty}>
        <ImageOff size={42} strokeWidth={1.4} />
        <Text size="sm">{t('lot.noImages')}</Text>
      </div>
    );
  }

  // Если длина массива поменялась и текущий индекс вылетел — derive state
  // без useEffect (React-style derived state).
  const safeActive = Math.min(active, images.length - 1);
  const activeImage = images[safeActive];

  const handlePrev = () =>
    setActive((images.length + safeActive - 1) % images.length);
  const handleNext = () => setActive((safeActive + 1) % images.length);

  const openFull = () => {
    setModalImageId(activeImage.imageId);
    setModalOpen(true);
  };

  return (
    <div className={styles.galleryRoot}>
      <div
        className={styles.galleryMain}
        onClick={openFull}
        role="button"
        tabIndex={0}
        aria-label="open full size"
      >
        <img src={buildSrc(activeImage)} alt="lot" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.galleryNav} ${styles.galleryNavLeft}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={`${styles.galleryNav} ${styles.galleryNavRight}`}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <span className={styles.galleryCounter}>
          {safeActive + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className={styles.thumbsRow}>
          {images.map((image, idx) => (
            <button
              key={image.imageId}
              type="button"
              className={`${styles.thumb} ${
                idx === safeActive ? styles.thumbActive : ''
              }`}
              onClick={() => setActive(idx)}
              aria-label={`open image ${idx + 1}`}
            >
              <img src={buildSrc(image)} alt={`thumb ${idx + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        size="xl"
        centered
        withCloseButton={false}
        className={styles.fullImageModal}
        transitionProps={{ transition: 'fade', duration: 180 }}
      >
        <div className={styles.fullImageFrame}>
          <ActionIcon
            onClick={() => setModalOpen(false)}
            variant="filled"
            color="dark"
            size="lg"
            radius="xl"
            aria-label="close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <X size={18} />
          </ActionIcon>
          {modalImageId && (
            <img src={getLotOriginalImageUrl(modalImageId)} alt="original lot" />
          )}
        </div>
      </Modal>
    </div>
  );
};
