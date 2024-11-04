import React, { memo } from 'react';
import Slider from '@mui/material/Slider';
import { useDebounce } from 'use-debounce';

interface SliderWithTooltipProps extends React.ComponentProps<typeof Slider> {
  value: number;
  onChange: (event: Event, value: number | number[]) => void;
}

const SliderWithTooltip = memo(({ value, onChange, ...props }: SliderWithTooltipProps) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [debouncedCallback] = useDebounce(onChange, 100);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setDisplayValue(newValue as number);
    debouncedCallback(event, newValue);
  };

  return <Slider {...props} value={displayValue} onChange={handleChange} />;
});

SliderWithTooltip.displayName = 'SliderWithTooltip';

export default SliderWithTooltip;
