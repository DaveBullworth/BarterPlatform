import React from 'react';
import {
  Input,
  MantineProvider,
  createTheme,
  Button,
  Card,
  Paper,
  Modal,
  Drawer,
  ActionIcon,
  Badge,
  Anchor,
  Title,
  SegmentedControl,
  type MantineColorsTuple,
} from '@mantine/core';
import { localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { DatesProvider } from '@mantine/dates';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';

import classes from '@/app/styles/Mantine.module.scss';

type Props = {
  children: React.ReactNode;
};

/**
 * Brand-палитра "barter" — тёплый бирюзово-зелёный.
 * Несёт ассоциации обмена, доверия и баланса; контрастна как в light, так и в dark теме.
 */
const barterColor: MantineColorsTuple = [
  '#e7faf2',
  '#d3f1e2',
  '#a4e1c1',
  '#71d29e',
  '#48c481',
  '#2fbb6e',
  '#1ea273',
  '#168760',
  '#126b4d',
  '#0a4d37',
];

/**
 * Дополнительный акцент — тёплый янтарный, для CTA-моментов
 * (например, "Создать лот") и подсветки активных состояний.
 */
const accentColor: MantineColorsTuple = [
  '#fff6e0',
  '#ffeac0',
  '#fad48d',
  '#f5be58',
  '#f0ab2c',
  '#eda013',
  '#ec9904',
  '#d28500',
  '#bb7600',
  '#a16600',
];

export const AppMantineProvider = ({ children }: Props) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: 'barter-color-scheme',
  });

  const theme = createTheme({
    primaryColor: 'barter',
    primaryShade: { light: 6, dark: 5 },
    colors: {
      barter: barterColor,
      accent: accentColor,
    },
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMonospace:
      'JetBrains Mono, ui-monospace, SFMono-Regular, "Liberation Mono", Menlo, monospace',
    headings: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '700',
      sizes: {
        h1: { fontSize: '1.875rem', lineHeight: '1.2' },
        h2: { fontSize: '1.5rem', lineHeight: '1.25' },
        h3: { fontSize: '1.25rem', lineHeight: '1.3' },
        h4: { fontSize: '1.125rem', lineHeight: '1.35' },
      },
    },
    defaultRadius: 'md',
    radius: {
      xs: '4px',
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
    },
    shadows: {
      xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
      sm: '0 2px 6px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
      md: '0 6px 16px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
      lg: '0 12px 32px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.05)',
      xl: '0 24px 48px rgba(15, 23, 42, 0.14), 0 8px 16px rgba(15, 23, 42, 0.06)',
    },
    cursorType: 'pointer',
    components: {
      Input: Input.extend({ classNames: classes }),
      Button: Button.extend({
        defaultProps: { radius: 'md' },
        styles: {
          root: { fontWeight: 600, letterSpacing: '0.005em' },
        },
      }),
      ActionIcon: ActionIcon.extend({
        defaultProps: { radius: 'md' },
      }),
      Badge: Badge.extend({
        defaultProps: { radius: 'sm' },
        styles: {
          root: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
        },
      }),
      Card: Card.extend({
        defaultProps: { radius: 'lg', padding: 'md', withBorder: true },
      }),
      Paper: Paper.extend({
        defaultProps: { radius: 'lg' },
      }),
      Modal: Modal.extend({
        defaultProps: {
          radius: 'lg',
          centered: true,
          overlayProps: { backgroundOpacity: 0.55, blur: 3 },
          transitionProps: { transition: 'pop', duration: 180 },
        },
      }),
      Drawer: Drawer.extend({
        defaultProps: {
          overlayProps: { backgroundOpacity: 0.45, blur: 2 },
        },
      }),
      Anchor: Anchor.extend({
        defaultProps: { underline: 'hover' },
      }),
      Title: Title.extend({
        styles: {
          root: { letterSpacing: '-0.01em' },
        },
      }),
      SegmentedControl: SegmentedControl.extend({
        defaultProps: {
          // Mantine 7 по умолчанию ставит 0 — возвращаем плавную анимацию ползунка.
          transitionDuration: 240,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
      }),
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
      <Notifications position="top-right" />
      <ModalsProvider>
        <DatesProvider settings={{ locale: lang }}>{children}</DatesProvider>
      </ModalsProvider>
    </MantineProvider>
  );
};
