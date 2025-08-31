import { Alert } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export default function ProviderResponse({ providerResponse }: { providerResponse: any }) {
  const hasHeaders = Object.keys(providerResponse?.metadata?.headers || {}).length > 0;
  const hasHttpDetails = !!providerResponse?.metadata?.http;
  const httpDetails = providerResponse?.metadata?.http;

  return (
    <Box>
      {providerResponse && providerResponse.raw !== undefined ? (
        <>
          {/* Complete HTTP Transaction Details */}
          {hasHttpDetails && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                HTTP Transaction
              </Typography>

              {/* Request Details */}
              {httpDetails.request && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Request:
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
                      mb: 2,
                      fontFamily: 'monospace',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {httpDetails.request.method} {httpDetails.request.url}
                    </Typography>
                    {Object.entries(httpDetails.request.headers || {}).map(([key, value]) => (
                      <Typography key={key} variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {key}: {value as string}
                      </Typography>
                    ))}
                    {httpDetails.request.body && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                          Body:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                          {httpDetails.request.body}
                        </Typography>
                      </>
                    )}
                  </Paper>
                </>
              )}

              {/* Response Details */}
              <Typography variant="subtitle2" gutterBottom>
                Response:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
                  mb: 2,
                  fontFamily: 'monospace',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  HTTP {httpDetails.status} {httpDetails.statusText}
                  {httpDetails.timing && (
                    <span style={{ fontWeight: 'normal', marginLeft: '1rem' }}>
                      ({httpDetails.timing.duration}ms)
                    </span>
                  )}
                </Typography>
                {Object.entries(httpDetails.headers || {}).map(([key, value]) => (
                  <Typography key={key} variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {key}: {value as string}
                  </Typography>
                ))}
              </Paper>
            </>
          )}

          {/* Legacy Headers Display (for backward compatibility) */}
          {hasHeaders && !hasHttpDetails ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Headers:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
                  maxHeight: '200px',
                  overflow: 'auto',
                  mb: 2,
                }}
              >
                <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: 0 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            width: '30%',
                            minWidth: 0,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                            fontWeight: 'bold',
                            borderRadius: '4px 0 0 4px',
                          }}
                        >
                          Header
                        </TableCell>
                        <TableCell
                          sx={{
                            width: '70%',
                            minWidth: 0,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                            fontWeight: 'bold',
                          }}
                        >
                          Value
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(providerResponse?.metadata?.headers || {}).map(
                        ([key, value]) => (
                          <TableRow key={key}>
                            <TableCell
                              sx={{
                                wordBreak: 'break-word',
                              }}
                            >
                              {key}
                            </TableCell>
                            <TableCell
                              sx={{
                                wordBreak: 'break-all',
                                overflowWrap: 'anywhere',
                                overflow: 'hidden',
                                maxWidth: 0,
                              }}
                            >
                              {value as string}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </>
          ) : null}

          {/* Response Body */}
          <Typography variant="subtitle2" gutterBottom>
            Response Body:
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {typeof providerResponse?.raw === 'string'
                ? providerResponse?.raw
                : JSON.stringify(providerResponse?.raw, null, 2)}
            </pre>
          </Paper>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Transformed Output:
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {typeof providerResponse?.output === 'string'
                ? providerResponse?.output
                : JSON.stringify(providerResponse?.output, null, 2) || 'No parsed response'}
            </pre>
          </Paper>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Session ID:
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {providerResponse?.sessionId}
            </pre>
          </Paper>
        </>
      ) : (
        <Alert severity="error">{providerResponse?.error || 'No response from provider'}</Alert>
      )}
    </Box>
  );
}
