import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ProviderOptions } from '@promptfoo/types';
import ExtensionEditor from './ExtensionEditor';
import 'prismjs/themes/prism.css';

interface CommonConfigurationOptionsProps {
  selectedTarget: ProviderOptions;
  updateCustomTarget: (field: string, value: any) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  extensions?: string[];
  onExtensionsChange?: (extensions: string[]) => void;
}

const CommonConfigurationOptions: React.FC<CommonConfigurationOptionsProps> = ({
  selectedTarget,
  updateCustomTarget,
  onValidationChange,
  extensions = [],
  onExtensionsChange,
}) => {
  const handleExtensionsChange = React.useCallback(
    (newExtensions: string[]) => {
      onExtensionsChange?.(newExtensions);
    },
    [onExtensionsChange],
  );

  const handleStatefulChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCustomTarget('stateful', e.target.checked);
  };

  const handleSessionSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCustomTarget('sessionSource', e.target.value || undefined);
  };

  const handleSessionParserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCustomTarget('sessionParser', e.target.value || undefined);
  };

  const isStatefulEnabled = selectedTarget.config?.stateful || false;

  return (
    <Box>
      {/* Stateful Configuration Section */}
      <Accordion defaultExpanded={isStatefulEnabled}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="h6">Stateful Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Enable session state and conversation history tracking
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isStatefulEnabled}
                  onChange={handleStatefulChange}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable Stateful Mode</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintain conversation history and session state across requests
                  </Typography>
                </Box>
              }
            />

            {isStatefulEnabled && (
              <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Session Source"
                  value={selectedTarget.config?.sessionSource || ''}
                  onChange={handleSessionSourceChange}
                  placeholder="client or server (default: client)"
                  helperText="Source of session management: 'client' for client-side, 'server' for server-side"
                />
                
                <TextField
                  fullWidth
                  label="Session Parser"
                  value={selectedTarget.config?.sessionParser || ''}
                  onChange={handleSessionParserChange}
                  placeholder="e.g., data.body.sessionId"
                  helperText="JavaScript expression to extract sessionId from response (e.g., 'data.body.sessionId')"
                  multiline
                  rows={2}
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>SessionId Usage:</strong> When stateful mode is enabled, you can use <code>{'{{sessionId}}'}</code> in your HTTP headers, body, or other configuration. 
                    The system will automatically generate unique session IDs for each evaluation run.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Example:</strong> Add <code>"x-session-id": "{'{{sessionId}}'}"</code> to headers or <code>"sessionId": "{'{{sessionId}}'}"</code> to request body.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={!!selectedTarget.delay}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="h6">Delay</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure the delay between requests
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Add a delay (ms) between requests to simulate a real user. See{' '}
            <a href="https://www.promptfoo.dev/docs/providers/http/#delay" target="_blank">
              docs
            </a>{' '}
            for more details.
          </Typography>
          <Box>
            <TextField
              value={selectedTarget.delay ?? ''}
              onChange={(e) => updateCustomTarget('delay', Number(e.target.value))}
            />
            <br />
            <Typography variant="caption">Delay in milliseconds (default: 0)</Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <ExtensionEditor
        extensions={extensions}
        onExtensionsChange={handleExtensionsChange}
        onValidationChange={onValidationChange}
      />
    </Box>
  );
};

export default CommonConfigurationOptions;
