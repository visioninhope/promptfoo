import * as React from 'react';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  onEmailSet: (email: string) => void;
}

export default function EmailModal({ open, onClose, onEmailSet }: EmailModalProps) {
  const theme = useTheme();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    try {
      await onEmailSet(email);
      setEmail('');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setEmail('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 500,
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: theme.palette.text.primary,
        }}
      >
        <EmailIcon sx={{ color: theme.palette.primary.main }} />
        Email Required
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            color: theme.palette.text.secondary,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon fontSize="small" color="info" />
            <Typography variant="subtitle2" color="info.main">
              Why do we need your email?
            </Typography>
          </Box>
          <Typography variant="body2">
            Your email address is used to:
            <ul style={{ marginTop: 4, marginBottom: 0 }}>
              <li>Manage shared evaluation URLs</li>
              <li>Set the default author for future evaluations</li>
              <li>Enable collaboration features</li>
            </ul>
          </Typography>
        </Box>
        <TextField
          autoFocus
          fullWidth
          label="Work Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error}
          disabled={isSubmitting}
          InputProps={{
            sx: {
              '&.Mui-focused': {
                boxShadow: `${alpha(theme.palette.primary.main, 0.15)} 0 0 0 2px`,
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ color: theme.palette.text.secondary }}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!email || isSubmitting}>
          {isSubmitting ? 'Setting Email...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
