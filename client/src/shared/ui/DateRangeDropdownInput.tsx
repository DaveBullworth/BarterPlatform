import { useState } from 'react';
import { Popover, TextInput, ActionIcon } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { X } from 'lucide-react';

interface Props {
  value?: [Date | null, Date | null];
  onChange: (range: [Date | null, Date | null]) => void;
  placeholder?: string;
  label?: string;
}

export function DateRangeDropdownInput({
  value,
  onChange,
  placeholder,
  label,
}: Props) {
  const [opened, setOpened] = useState(false);

  const displayValue =
    value && (value[0] || value[1])
      ? `${value[0] ? new Date(value[0]).toISOString().slice(0, 10) : ''} — ${value[1] ? new Date(value[1]).toISOString().slice(0, 10) : ''}`
      : '';

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // чтобы не открывался поповер
    onChange([null, null]);
  };

  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      position="bottom-start"
      width={300}
    >
      <Popover.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={displayValue}
          readOnly
          onClick={() => setOpened((o) => !o)}
          rightSection={
            displayValue ? (
              <ActionIcon onClick={handleClear} size="sm">
                <X size={16} />
              </ActionIcon>
            ) : null
          }
        />
      </Popover.Target>
      <Popover.Dropdown>
        <DatePicker
          type="range"
          value={
            value?.map((d) => {
              if (!d) return null;
              // если d уже Date, используем как есть, если строка — создаём Date
              const dateObj = d instanceof Date ? d : new Date(d);
              return dateObj.toISOString().slice(0, 10);
            }) as [string | null, string | null]
          }
          onChange={(range: [string | null, string | null]) =>
            onChange([
              range[0] ? new Date(range[0]) : null,
              range[1] ? new Date(range[1]) : null,
            ])
          }
        />
      </Popover.Dropdown>
    </Popover>
  );
}
