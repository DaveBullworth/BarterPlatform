import { SegmentedControl, Center, useMantineColorScheme } from '@mantine/core';
import { Sun, Moon, MonitorCog } from 'lucide-react';
import { USER_THEMES, type UserTheme } from '@/shared/constants/user-theme';

const THEME_VALUES = Object.values(USER_THEMES) as UserTheme[];

export const ThemeSwitcher = () => {
  const { colorScheme, setColorScheme, clearColorScheme } =
    useMantineColorScheme();

  const value: UserTheme =
    colorScheme === 'light'
      ? USER_THEMES.LIGHT
      : colorScheme === 'dark'
        ? USER_THEMES.DARK
        : USER_THEMES.SYSTEM;

  const handleChange = (value: string) => {
    if (!THEME_VALUES.includes(value as UserTheme)) {
      return;
    }

    switch (value as UserTheme) {
      case USER_THEMES.LIGHT:
        setColorScheme('light');
        break;

      case USER_THEMES.DARK:
        setColorScheme('dark');
        break;

      case USER_THEMES.SYSTEM:
      default:
        clearColorScheme();
        break;
    }
  };

  return (
    <SegmentedControl
      size="xs"
      value={value}
      onChange={handleChange}
      data={[
        {
          value: USER_THEMES.LIGHT,
          label: (
            <Center>
              <Sun size={16} />
            </Center>
          ),
        },
        {
          value: USER_THEMES.DARK,
          label: (
            <Center>
              <Moon size={16} />
            </Center>
          ),
        },
        {
          value: USER_THEMES.SYSTEM,
          label: (
            <Center>
              <MonitorCog size={16} />
            </Center>
          ),
        },
      ]}
    />
  );
};
