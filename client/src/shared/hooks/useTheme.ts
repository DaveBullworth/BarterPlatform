import { useMantineColorScheme } from '@mantine/core';

export const useTheme = () => {
  const { colorScheme, setColorScheme, clearColorScheme } =
    useMantineColorScheme();

  return {
    colorScheme,
    setLight: () => setColorScheme('light'),
    setDark: () => setColorScheme('dark'),
    setSystem: () => clearColorScheme(),
    setColorScheme,
  };
};
