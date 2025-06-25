import React, { useEffect, useState } from 'react';
import JsonTextField from '@app/components/JsonTextField';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

interface ProviderConfigDialogProps {
  open: boolean;
  providerId: string;
  config?: Record<string, any>;
  onClose: () => void;
  onSave: (providerId: string, config: Record<string, any>) => void;
}

const ProviderConfigDialog: React.FC<ProviderConfigDialogProps> = ({
  open,
  providerId,
  config = {},
  onClose,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<Record<string, any>>(config);
  const isAzureProvider = providerId.startsWith('azure:');

  // Helper function to check if a value has content
  const hasContent = (val: any): boolean => {
    return val !== undefined && val !== null && val !== '';
  };

  const isDeploymentIdValid = !isAzureProvider || hasContent(localConfig.deployment_id);

  // Reset local config when the dialog opens or providerId changes
  useEffect(() => {
    setLocalConfig(config);
  }, [open, providerId, config]);

  const handleSave = () => {
    onSave(providerId, localConfig);
  };

  // Create an ordered list of keys with deployment_id first for Azure providers
  const configKeys = React.useMemo(() => {
    const keys = Object.keys(localConfig).filter(key => 
      !['stateful', 'sessionSource', 'sessionParser'].includes(key)
    );
    if (isAzureProvider) {
      return ['deployment_id', ...keys.filter((key) => key !== 'deployment_id')];
    }
    return keys;
  }, [localConfig, isAzureProvider]);

  const handleStatefulChange = (checked: boolean) => {
    setLocalConfig({ ...localConfig, stateful: checked });
  };

  const handleSessionSourceChange = (value: string) => {
    setLocalConfig({ ...localConfig, sessionSource: value || undefined });
  };

  const handleSessionParserChange = (value: string) => {
    setLocalConfig({ ...localConfig, sessionParser: value || undefined });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Provider Configuration
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ mt: 1, fontSize: '0.9rem', fontFamily: 'monospace' }}
        >
          {providerId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {isAzureProvider && (
          <Box mb={2}>
            <Alert severity={isDeploymentIdValid ? 'info' : 'warning'}>
              {isDeploymentIdValid
                ? 'Azure OpenAI requires a deployment ID that matches your deployment name in the Azure portal.'
                : 'You must specify a deployment ID for Azure OpenAI models. This is the name you gave your model deployment in the Azure portal.'}
            </Alert>
          </Box>
        )}

        {/* Stateful Configuration Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Stateful Configuration
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={localConfig.stateful || false}
                onChange={(e) => handleStatefulChange(e.target.checked)}
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
            sx={{ mb: 2 }}
          />

          {localConfig.stateful && (
            <Box sx={{ ml: 4, mb: 2 }}>
              <TextField
                fullWidth
                label="Session Source"
                value={localConfig.sessionSource || ''}
                onChange={(e) => handleSessionSourceChange(e.target.value)}
                placeholder="client or server (default: client)"
                helperText="Source of session management: 'client' for client-side, 'server' for server-side"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Session Parser"
                value={localConfig.sessionParser || ''}
                onChange={(e) => handleSessionParserChange(e.target.value)}
                placeholder="e.g., data.body.sessionId"
                helperText="JavaScript expression to extract sessionId from response (e.g., 'data.body.sessionId')"
                multiline
                rows={2}
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Regular Configuration Options */}
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Provider Settings
        </Typography>

        {configKeys.map((key) => {
          const value = localConfig[key];
          let handleChange;
          const isDeploymentId = isAzureProvider && key === 'deployment_id';
          const isRequired = isDeploymentId;
          const isValid = !isRequired || hasContent(value);

          if (
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            typeof value === 'string'
          ) {
            if (typeof value === 'number') {
              handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalConfig({ ...localConfig, [key]: Number.parseFloat(e.target.value) });
            } else if (typeof value === 'boolean') {
              handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalConfig({ ...localConfig, [key]: e.target.value === 'true' });
            } else {
              handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const trimmed = e.target.value.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  try {
                    setLocalConfig({ ...localConfig, [key]: JSON.parse(trimmed) });
                  } catch {
                    setLocalConfig({ ...localConfig, [key]: trimmed });
                  }
                } else if (trimmed === 'null') {
                  setLocalConfig({ ...localConfig, [key]: null });
                } else if (trimmed === 'undefined') {
                  setLocalConfig({ ...localConfig, [key]: undefined });
                } else {
                  setLocalConfig({ ...localConfig, [key]: trimmed });
                }
              };
            }

            return (
              <Box key={key} my={2}>
                <TextField
                  label={isRequired ? `${key} (Required)` : key}
                  value={value === undefined ? '' : value}
                  onChange={handleChange}
                  fullWidth
                  required={isRequired}
                  error={isRequired && !isValid}
                  helperText={
                    isRequired && !isValid ? 'This field is required for Azure OpenAI' : ''
                  }
                  InputLabelProps={{ shrink: true }}
                  type={typeof value === 'number' ? 'number' : 'text'}
                  variant={isRequired ? 'outlined' : undefined}
                  color={isRequired ? 'primary' : undefined}
                  focused={isRequired && !isValid}
                />
              </Box>
            );
          } else {
            return (
              <Box key={key} my={2}>
                <JsonTextField
                  label={key}
                  defaultValue={JSON.stringify(value)}
                  onChange={(parsed) => {
                    setLocalConfig({ ...localConfig, [key]: parsed });
                  }}
                  fullWidth
                  multiline
                  minRows={2}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            );
          }
        })}

        {/* Information Box for SessionId Usage */}
        {localConfig.stateful && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>SessionId Usage:</strong> When stateful mode is enabled, you can use <code>{'{{sessionId}}'}</code> in your HTTP headers, body, or other configuration. 
                The system will automatically generate unique session IDs for each evaluation run.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Example:</strong> Add <code>"x-session-id": "{'{{sessionId}}'}"</code> to headers for session tracking.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!isDeploymentIdValid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProviderConfigDialog;
