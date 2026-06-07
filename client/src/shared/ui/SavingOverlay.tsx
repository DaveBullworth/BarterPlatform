import { Loader, Portal, Stack, Text } from '@mantine/core';

import styles from './SavingOverlay.module.scss';

type Props = {
  visible: boolean;
  label?: string;
};

/**
 * Полноэкранный блокирующий оверлей с размытием фона. Показывается во время
 * длительных операций (например, сохранение лота с обработкой изображений),
 * чтобы пользователь не мог тыкать в интерфейс до завершения.
 */
export const SavingOverlay = ({ visible, label }: Props) => {
  if (!visible) return null;

  return (
    <Portal>
      <div
        className={styles.overlay}
        role="alertdialog"
        aria-busy="true"
        aria-live="assertive"
        aria-modal="true"
      >
        <Stack align="center" gap="sm">
          <Loader size="lg" color="barter" />
          {label ? (
            <Text fw={600} c="white">
              {label}
            </Text>
          ) : null}
        </Stack>
      </div>
    </Portal>
  );
};
