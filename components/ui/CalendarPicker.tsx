import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { addMonths, isSameDay, monthWeeks, startOfDay, WEEK_STARTS_ON } from '@/lib/dates/calendar';
import { useTheme } from '@/lib/design/use-theme';
import { formatDay, formatMonth, formatWeekday } from '@/lib/i18n/format';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { PickerSheet } from './PickerSheet';

type CalendarPickerProps = {
  visible: boolean;
  title: string;
  selected: Date | null;
  /** Jours avant celui-ci non sélectionnables (aujourd'hui pour un événement). */
  minDate: Date;
  onSelect: (day: Date) => void;
  onClose: () => void;
};

const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.35;

/** Calendrier d'un mois, avec mois précédent / suivant. */
export function CalendarPicker({
  visible,
  title,
  selected,
  minDate,
  onSelect,
  onClose,
}: CalendarPickerProps) {
  const { t } = useTranslation();
  const { colors, spacing, sizes, radius, language } = useTheme();
  const [month, setMonth] = useState(() => addMonths(selected ?? minDate, 0));
  const weeks = monthWeeks(month, WEEK_STARTS_ON[language]);
  const firstDay = startOfDay(minDate);
  const canGoBack = addMonths(month, 0) > addMonths(minDate, 0);
  // Une semaine type pour les noms des jours, dans l'ordre de la langue.
  const weekdays = (weeks.find((week) => week.every(Boolean)) ?? weeks[1]).filter(
    (day): day is Date => day !== null
  );

  return (
    <PickerSheet visible={visible} title={title} onClose={onClose}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <AppText variant="heading" style={{ flex: 1 }} accessibilityLiveRegion="polite">
            {formatMonth(month, language)}
          </AppText>
          {canGoBack ? (
            <IconButton
              icon={ChevronLeft}
              label={t('calendar.previous')}
              onPress={() => setMonth((current) => addMonths(current, -1))}
              flipInRTL
            />
          ) : null}
          <IconButton
            icon={ChevronRight}
            label={t('calendar.next')}
            onPress={() => setMonth((current) => addMonths(current, 1))}
            flipInRTL
          />
        </View>

        <View style={{ flexDirection: 'row' }}>
          {weekdays.map((day) => (
            <AppText
              key={day.getDay()}
              variant="label"
              color="textMuted"
              style={{ flex: 1, textAlign: 'center' }}>
              {formatWeekday(day, language)}
            </AppText>
          ))}
        </View>

        {weeks.map((week, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {week.map((day, column) => {
              if (!day) return <View key={column} style={{ flex: 1, height: sizes.touchMin }} />;
              const disabled = day < firstDay;
              const isSelected = selected !== null && isSameDay(day, selected);
              return (
                <View key={column} style={{ flex: 1, alignItems: 'center' }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={formatDay(day, language)}
                    accessibilityState={{ selected: isSelected, disabled }}
                    disabled={disabled}
                    onPress={() => {
                      onSelect(day);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      {
                        width: sizes.touchMin,
                        height: sizes.touchMin,
                        borderRadius: radius.pill,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      isSelected && { backgroundColor: colors.inverse },
                      pressed && { opacity: PRESSED_OPACITY },
                      disabled && { opacity: DISABLED_OPACITY },
                    ]}>
                    <AppText
                      variant={isSelected ? 'bodyStrong' : 'body'}
                      color={isSelected ? 'onInverse' : 'text'}>
                      {day.getDate()}
                    </AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </PickerSheet>
  );
}
