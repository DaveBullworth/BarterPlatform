import {
  ActionIcon,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Group,
  Image,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  AlertCircle,
  CameraOff,
  CheckCircle2,
  CircleDashed,
  Pencil,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import type { AppDispatch } from '@/store';
import {
  fetchTaxonomyIfNeeded,
  selectTaxonomy,
  selectTaxonomyStatus,
} from '@/store/taxonomySlice';
import { selectCurrentUser } from '@/store/userSlice';
import { getLotById } from '@/http/lots';
import {
  getLotImages,
  getLotOriginalImageUrl,
  type LotImageDto,
} from '@/http/media';
import { LOT_VISIBILITY_STATUS, type LotDto } from '@/types/lot';
import { USER_ROLES } from '@/shared/constants/user-role';
import { handleApiError } from '@/shared/utils/handleApiError';
import { goToUser, gotToLotEdit } from '@/shared/utils/navigation';

import styles from './LotPage.module.scss';

export const LotPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const currentUser = useSelector(selectCurrentUser);
  const taxonomy = useSelector(selectTaxonomy);
  const taxonomyStatus = useSelector(selectTaxonomyStatus);

  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState<LotDto | null>(null);
  const [images, setImages] = useState<LotImageDto[]>([]);
  const [openedImageId, setOpenedImageId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [lotData, lotImages] = await Promise.all([
          getLotById(id),
          getLotImages(id),
        ]);
        setLot(lotData);
        setImages(lotImages.images);
      } catch (error) {
        handleApiError(error, t);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t, id]);

  const taxonomyPath = useMemo(() => {
    if (!lot) return [];

    const chapter = taxonomy.find((item) => item.id === lot.chapterId);
    const category = chapter?.categories.find(
      (item) => item.id === lot.categoryId,
    );
    const subcategory = lot.subcategoryId
      ? category?.subcategories.find((item) => item.id === lot.subcategoryId)
      : null;

    return [chapter?.name, category?.name, subcategory?.name].filter(
      (part): part is string => Boolean(part),
    );
  }, [lot, taxonomy]);

  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const canEdit = Boolean(isAdmin || (lot && lot.userId === currentUser?.id));

  const visibilityMeta = useMemo(() => {
    if (!lot) return null;

    switch (lot.visibilityStatus) {
      case LOT_VISIBILITY_STATUS.ACTIVE:
        return {
          color: 'green',
          text: t('lot.visibility.active'),
          Icon: CheckCircle2,
        };
      case LOT_VISIBILITY_STATUS.HIDDEN:
        return {
          color: 'red',
          text: t('lot.visibility.hidden'),
          Icon: AlertCircle,
        };
      default:
        return {
          color: 'gray',
          text: t('lot.visibility.archived'),
          Icon: CircleDashed,
        };
    }
  }, [t, lot]);

  if (loading || taxonomyStatus === 'loading') {
    return (
      <Group justify="center" style={{ width: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (!lot) {
    return <Text>{t('lot.notFound')}</Text>;
  }

  return (
    <Stack gap="lg" maw={860} w={'100%'} mx="auto">
      <Breadcrumbs separator="→">
        {taxonomyPath.map((part) => (
          <Text key={part} c="dimmed" fw={500}>
            {part}
          </Text>
        ))}
      </Breadcrumbs>

      <Title order={1}>{lot.generalDescription}</Title>

      <Group>
        {visibilityMeta && (
          <Badge
            size="lg"
            color={visibilityMeta.color}
            leftSection={<visibilityMeta.Icon size={14} />}
          >
            {visibilityMeta.text}
          </Badge>
        )}
        <Text c="dimmed">
          {t('lot.createdAt')}:{' '}
          {new Date(lot.createdAt).toLocaleDateString('ru-RU')}
          {lot.visibilityStatus === LOT_VISIBILITY_STATUS.ARCHIVED && (
            <>
              {' / '}
              {t('lot.visibility.archived')}{' '}
              {lot?.archivationDate
                ? new Date(lot.archivationDate).toLocaleDateString('ru-RU')
                : '—'}
            </>
          )}
        </Text>
      </Group>

      <Card withBorder>
        {images.length === 0 ? (
          <Box
            style={{
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#868e96',
              fontSize: 14,
            }}
          >
            {' '}
            <Stack gap="sm" align="center">
              <CameraOff size={42} />
              <Text size="sm">{t('lot.noImages')}</Text>
            </Stack>
          </Box>
        ) : (
          <ScrollArea type="always" scrollHideDelay={500}>
            <Group wrap="nowrap" className={styles.carouselRow}>
              {images.map((image) => (
                <Box
                  key={image.imageId}
                  className={styles.carouselImageWrapper}
                  onClick={() => setOpenedImageId(image.imageId)}
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
        )}
      </Card>

      <Card withBorder>
        <Text fw={700}>{t('lot.description')}:</Text>
        <Text>{lot.characteristicsDescription}</Text>
      </Card>

      {lot.quantity !== 1 && (
        <Card withBorder>
          <Text fw={700}>{t('lot.quantity')}:</Text>
          <Text>{lot.quantity}</Text>
        </Card>
      )}

      <Group>
        {isAdmin && (
          <Button
            leftSection={<UserRound size={16} />}
            variant="default"
            onClick={() => goToUser(navigate, lot.userId)}
          >
            {t('lot.owner')}
          </Button>
        )}

        {canEdit && (
          <Button
            leftSection={<Pencil size={16} />}
            onClick={() => gotToLotEdit(navigate, lot.id)}
          >
            {t('lot.edit')}
          </Button>
        )}
      </Group>

      <Modal
        opened={Boolean(openedImageId)}
        onClose={() => setOpenedImageId(null)}
        withCloseButton={false}
        centered
        size="xl"
        className={styles.fullImageModal}
      >
        {/* Кнопка закрытия */}
        <ActionIcon
          onClick={() => setOpenedImageId(null)}
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          size="lg"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
          }}
        >
          <X size={18} />
        </ActionIcon>

        {openedImageId && (
          <Image
            src={getLotOriginalImageUrl(openedImageId)}
            alt="original lot"
            fit="contain"
            style={{
              maxHeight: '90vh',
              cursor: 'pointer',
            }}
            onClick={() => {
              window.open(getLotOriginalImageUrl(openedImageId), '_blank');
            }}
          />
        )}
      </Modal>
    </Stack>
  );
};
