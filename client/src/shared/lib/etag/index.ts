export const createEtagBuilder = (type: string) => (updatedAt?: string) => {
  if (!updatedAt) return undefined;

  const time = Date.parse(updatedAt);
  if (Number.isNaN(time)) return undefined;

  return `W/"${type}:${time}"`;
};
