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
  Building2,
  CameraOff,
  CheckCircle2,
  CircleDashed,
  Home,
  MapPin,
  Pencil,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getApiErrorStatusCode } from '@/shared/utils/getApiErrorStatusCode';
import { ErrorStub } from '@/shared/ui/ErrorStub';
import StatusActionModal, {
  type LotStatusAction,
} from '@/shared/ui/StatusActionModal';
import styles from './LotPage.module.scss';
import { useLotStatus } from '../lot-form/hooks/useLotStatus';

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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const [statusActionModal, setStatusActionModal] =
    useState<LotStatusAction | null>(null);

  const { changeLotStatus } = useLotStatus({
    t,
    setLoading,
  });

  const load = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const [lotData, lotImages] = await Promise.all([
          getLotById(id),
          getLotImages(id),
        ]);
        setLot(lotData);
        setImages(lotImages.images);
      } catch (error) {
        const status = getApiErrorStatusCode(error);

        setErrorStatus(status);
        setIsError(true);
        handleApiError(error, t);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    dispatch(fetchTaxonomyIfNeeded());
  }, [dispatch]);

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [t, id, load]);

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

  const showDeactivateAction =
    Boolean(id) &&
    canEdit &&
    lot?.visibilityStatus !== LOT_VISIBILITY_STATUS.ARCHIVED;
  const showUnarchiveAction =
    Boolean(id) &&
    canEdit &&
    lot?.visibilityStatus === LOT_VISIBILITY_STATUS.ARCHIVED &&
    isAdmin;

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

  const handleConfirmStatusAction = async () => {
    if (!id || !statusActionModal) return;

    const updatedLot = await changeLotStatus({
      lotId: id,
      action: statusActionModal,
    });

    if (updatedLot) {
      setLot(updatedLot);
    } else return;

    setStatusActionModal(null);
  };

  if (loading || taxonomyStatus === 'loading') {
    return (
      <Group justify="center" style={{ width: '100%' }}>
        <Loader />
      </Group>
    );
  }

  if (isError || !lot) {
    return (
      <ErrorStub
        status={errorStatus ?? undefined}
        t={t}
        onRetry={() => {
          setIsError(false);
          setErrorStatus(null);
          if (id) load(id);
        }}
        onBack={() => navigate(-1)}
      />
    );
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
        <Badge mb={8} variant="light" color="orange">
          {t('lot.description')}
        </Badge>
        <Text>{lot.characteristicsDescription}</Text>
      </Card>

      <Card withBorder radius="md" p="md">
        <Badge mb={8} variant="light" color="blue">
          {t('lot.location')}
        </Badge>

        <Stack gap={10}>
          <Group gap={10}>
            <MapPin size={16} />
            <Text size="sm" display={'flex'}>
              <Box component="span" w="4rem" fw={700}>
                {t('lot.region')}:
              </Box>{' '}
              {lot.region?.name ?? '—'}
            </Text>
          </Group>

          <Group gap={10}>
            <Building2 size={16} />
            <Text size="sm" display={'flex'}>
              <Box component="span" w="4rem" fw={700}>
                {t('lot.city')}:{' '}
              </Box>{' '}
              {lot.city?.name ?? '—'}
            </Text>
          </Group>

          <Group gap={10}>
            <Home size={16} />
            <Text size="sm" display={'flex'}>
              <Box component="span" w="4rem" fw={700}>
                {t('lot.district')}:
              </Box>{' '}
              {lot.district?.name ?? '—'}
            </Text>
          </Group>
        </Stack>
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

        {showDeactivateAction && (
          <Button
            color="red"
            variant="light"
            loading={loading}
            onClick={() => setStatusActionModal('deactivate')}
          >
            {t('lotForm.actions.deactivate')}
          </Button>
        )}

        {showUnarchiveAction && (
          <Button
            loading={loading}
            onClick={() => setStatusActionModal('unarchive')}
          >
            {t('lotForm.actions.unarchive')}
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

      <StatusActionModal
        action={statusActionModal}
        loading={loading}
        onConfirm={handleConfirmStatusAction}
        onClose={() => setStatusActionModal(null)}
        t={t}
      />
    </Stack>
  );
};
