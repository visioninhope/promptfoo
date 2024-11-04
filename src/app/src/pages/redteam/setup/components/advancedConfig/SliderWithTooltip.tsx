import React, { memo } from 'react';
import Slider from '@mui/material/Slider';
import { useDebouncedCallback } from 'use-debounce';

interface SliderWithTooltipProps extends React.ComponentProps<typeof Slider> {
  value: number;
  onChange: (event: Event, value: number | number[]) => void;
}

const SliderWithTooltip = memo(({ value, onChange, ...props }: SliderWithTooltipProps) => {
  const [displayValue, setDisplayValue] = React.useState(value);

  // Using useDebouncedCallback instead of custom debounce
  const debouncedOnChange = useDebouncedCallback((event: Event, newValue: number | number[]) => {
    onChange(event, newValue);
  }, 100);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setDisplayValue(newValue as number);
    debouncedOnChange(event, newValue);
  };

  // Update local display value when prop value changes
  React.useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return <Slider {...props} value={displayValue} onChange={handleChange} />;
});

SliderWithTooltip.displayName = 'SliderWithTooltip';

export default SliderWithTooltip;
