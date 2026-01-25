import React from 'react';
import { Input, MantineProvider, createTheme } from '@mantine/core';
import { localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { DatesProvider } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import classes from '@/app/styles/Mantine.module.scss';

type Props = {
  children: React.ReactNode;
};

export const AppMantineProvider = ({ children }: Props) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: 'barter-color-scheme',
  });

  const theme = createTheme({
    components: {
      Input: Input.extend({ classNames: classes }),
    },
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
      <ModalsProvider />
      <DatesProvider settings={{ locale: lang }}>{children}</DatesProvider>
    </MantineProvider>
  );
};
