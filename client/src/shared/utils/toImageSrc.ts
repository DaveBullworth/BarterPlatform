type ImageSourcePayload = {
  data?: string | null;
  mimeType?: string | null;
};

export const toImageSrc = (item?: ImageSourcePayload | null) => {
  if (!item?.data || !item?.mimeType) {
    return null;
  }

  return `data:${item.mimeType};base64,${item.data}`;
};
