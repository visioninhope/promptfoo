import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { PluginConfig } from '../types';
import SliderWithTooltip from './advancedConfig/SliderWithTooltip';
import {
  DEFAULT_NUM_TESTS,
  MIN_TESTS,
  MAX_TESTS,
  availableStrategies,
} from './advancedConfig/constants';

interface PluginAdvancedConfigProps {
  plugin: Plugin;
  isExpanded: boolean;
  config: PluginConfig;
  onUpdateConfig: (plugin: Plugin, newConfig: PluginConfig) => void;
}

const PluginAdvancedConfig = memo(
  ({ plugin, isExpanded, config, onUpdateConfig }: PluginAdvancedConfigProps) => {
    const currentAdvanced = config?.advanced || {};
    const currentStrategies = currentAdvanced.strategies || [];

    const handleNumTestsChange = useCallback(
      (event: Event, value: number | number[]) => {
        onUpdateConfig(plugin, {
          ...config,
          advanced: {
            ...currentAdvanced,
            numTests: value as number,
          },
        });
      },
      [plugin, config, currentAdvanced, onUpdateConfig],
    );

    const handleStrategyToggle = useCallback(
      (strategyId: string) => {
        const newStrategies = currentStrategies.includes(strategyId)
          ? currentStrategies.filter((s: string) => s !== strategyId)
          : [...currentStrategies, strategyId];

        onUpdateConfig(plugin, {
          ...config,
          advanced: {
            ...currentAdvanced,
            strategies: newStrategies,
          },
        });
      },
      [plugin, config, currentAdvanced, currentStrategies, onUpdateConfig],
    );

    return (
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ mt: 2, px: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Advanced Settings
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Number of Tests
              </Typography>
              <SliderWithTooltip
                value={currentAdvanced.numTests ?? DEFAULT_NUM_TESTS}
                onChange={handleNumTestsChange}
                min={MIN_TESTS}
                max={MAX_TESTS}
                valueLabelDisplay="auto"
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Strategies
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableStrategies.map((strategy) => (
                  <Chip
                    key={strategy.id}
                    label={strategy.name}
                    size="small"
                    onClick={() => handleStrategyToggle(strategy.id)}
                    color={currentStrategies.includes(strategy.id) ? 'primary' : 'default'}
                    variant={currentStrategies.includes(strategy.id) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    );
  },
);

PluginAdvancedConfig.displayName = 'PluginAdvancedConfig';

export default PluginAdvancedConfig;
