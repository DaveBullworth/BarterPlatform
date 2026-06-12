import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

// Чистые функции — для случаев когда navigate уже есть
export const navigationTo = {
  root: (navigate: ReturnType<typeof useNavigate>) => navigate(ROUTES.ROOT),

  auth: (navigate: ReturnType<typeof useNavigate>, replace?: boolean) =>
    navigate(ROUTES.AUTH, { replace }),

  profile: (navigate: ReturnType<typeof useNavigate>) =>
    navigate(ROUTES.PROFILE),

  admin: (navigate: ReturnType<typeof useNavigate>) => navigate(ROUTES.ADMIN),

  user: (navigate: ReturnType<typeof useNavigate>, id: string) =>
    navigate(`${ROUTES.USERS}/${id}`),

  lotCreate: (navigate: ReturnType<typeof useNavigate>) =>
    navigate(ROUTES.LOT_CREATE),

  lotEdit: (navigate: ReturnType<typeof useNavigate>, id: string) =>
    navigate(`${ROUTES.LOT_EDIT}/${id}`),

  lotView: (navigate: ReturnType<typeof useNavigate>, id: string) =>
    navigate(`${ROUTES.LOT_VIEW}/${id}`),

  myLots: (navigate: ReturnType<typeof useNavigate>) =>
    navigate(ROUTES.MY_LOTS),

  offers: (navigate: ReturnType<typeof useNavigate>) => navigate(ROUTES.OFFERS),

  offerView: (navigate: ReturnType<typeof useNavigate>, id: string) =>
    navigate(`${ROUTES.OFFERS}/${id}`),
};

// Хук — удобнее когда нужна навигация внутри компонента
// Не нужно каждый раз вызывать useNavigate и передавать его в функцию
export const useNavigation = () => {
  const navigate = useNavigate();

  return {
    toRoot: () => navigate(ROUTES.ROOT),
    toAuth: (replace?: boolean) => navigate(ROUTES.AUTH, { replace }),
    toProfile: () => navigate(ROUTES.PROFILE),
    toAdmin: () => navigate(ROUTES.ADMIN),
    toUser: (id: string) => navigate(`${ROUTES.USERS}/${id}`),
    toLotCreate: () => navigate(ROUTES.LOT_CREATE),
    toLotEdit: (id: string) => navigate(`${ROUTES.LOT_EDIT}/${id}`),
    toLotView: (id: string) => navigate(`${ROUTES.LOT_VIEW}/${id}`),
    toMyLots: () => navigate(ROUTES.MY_LOTS),
    toOffers: () => navigate(ROUTES.OFFERS),
    toOfferView: (id: string, asUserId?: string) =>
      navigate(
        asUserId
          ? `${ROUTES.OFFERS}/${id}?asUser=${asUserId}`
          : `${ROUTES.OFFERS}/${id}`,
      ),
    back: () => navigate(-1),
  };
};
