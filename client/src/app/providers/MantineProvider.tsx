import React from 'react';
import { Notifications } from '@mantine/notifications';
import { MantineProvider, createTheme } from '@mantine/core';
import { localStorageColorSchemeManager } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

type Props = {
  children: React.ReactNode;
};

export const AppMantineProvider = ({ children }: Props) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: 'barter-color-scheme',
  });

  const theme = createTheme({
    /** сюда позже: colors, fontFamily, radius, spacing */
  });

  const lang = localStorage.getItem('user-language') || 'en';

  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
      withCssVariables
      withGlobalClasses
    >
      <Notifications />
      <DatesProvider settings={{ locale: lang }}>{children}</DatesProvider>
    </MantineProvider>
  );
};
