import { Select } from "./Select";
import { Input } from "./Input";
import {
  DATE_RANGE_PRESET_LABEL,
  resolvePresetRange,
  type DateRange,
  type DateRangePresetKey,
} from "../../utils/date-range";

const PRESET_ORDER: DateRangePresetKey[] = ["today", "this_week", "this_month", "last_month", "custom"];

interface DateRangePickerProps {
  preset: DateRangePresetKey;
  range: DateRange;
  onChange: (preset: DateRangePresetKey, range: DateRange) => void;
}

/**
 * Preset (Today / This week / This month / Last month) + custom from/to
 * date-range control. Used by Reports; safe to reuse anywhere else a
 * calendar range filter is needed instead of building a page-local one.
 */
export function DateRangePicker({ preset, range, onChange }: DateRangePickerProps) {
  const handlePresetChange = (next: DateRangePresetKey) => {
    if (next === "custom") {
      onChange("custom", range);
      return;
    }
    onChange(next, resolvePresetRange(next));
  };

  const rangeError = range.from && range.to && range.from > range.to
    ? "Start date must not be after end date."
    : undefined;

  return (
    <div className="mb-6">
      <Select
        label="Date range"
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value as DateRangePresetKey)}
      >
        {PRESET_ORDER.map((key) => (
          <option key={key} value={key}>
            {DATE_RANGE_PRESET_LABEL[key]}
          </option>
        ))}
      </Select>

      {preset === "custom" && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="From"
            value={range.from}
            max={range.to || undefined}
            onChange={(e) => onChange("custom", { ...range, from: e.target.value })}
            error={rangeError}
          />
          <Input
            type="date"
            label="To"
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => onChange("custom", { ...range, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
