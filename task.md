# HTTP Provider Complete Transaction Details Feature

## Executive Summary

This feature enhances the HTTP provider to capture and display complete HTTP transaction details in the UI, providing users with comprehensive debugging information beyond just the transformed response.

## User Request Analysis

**Original Request**: "help me brainstorm a feature in promptfoo where we remember the entire http provider response and display it in the ui, not just the transformed part"

**What Was Missing**: Users could see response headers and response body, but lacked complete HTTP transaction context for debugging, including:
- HTTP request details (method, URL, headers, body)  
- Request/response timing information
- Complete HTTP transaction flow

## Solution Overview

### Backend Implementation

#### Enhanced ProviderResponse Metadata (`src/types/providers.ts`)
Extended the `metadata.http` interface to include complete transaction details:
```typescript
http?: {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  // NEW: Complete HTTP transaction details
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
};
```

#### HTTP Provider Enhancement (`src/providers/http.ts`)
- **Request Timing**: Capture timestamps before and after HTTP requests
- **Request Details**: Store method, URL, headers, and body for debugging
- **Transaction Context**: Preserve complete HTTP transaction in metadata

Both `callApi()` and `callApiWithRawRequest()` methods now capture:
- Request start/end timestamps  
- Request method, URL, headers, and body
- Response timing calculations
- Complete transaction context

### Frontend Implementation

#### Enhanced ProviderResponse Component (`src/app/src/pages/redteam/setup/components/Targets/ProviderResponse.tsx`)

**New "HTTP Transaction" Section** displays:

1. **Request Details**:
   - HTTP method and URL (e.g., "POST https://api.example.com/chat")
   - All request headers
   - Request body (when present)

2. **Response Details**:
   - HTTP status line with timing (e.g., "HTTP 200 OK (245ms)")
   - All response headers

3. **Existing Sections** (unchanged):
   - Response Body (raw server response)
   - Transformed Output (processed by transform functions)
   - Session ID (when available)

**Backward Compatibility**: Maintains legacy headers display for older responses without complete transaction details.

## User Experience

### Before
- Response headers in a table
- "Raw Result" (response body)
- "Parsed Result" (transformed output)
- Session ID

### After  
- **HTTP Transaction** section showing:
  - Complete request details (method, URL, headers, body)
  - Response status with timing
  - All response headers in monospace format
- **Response Body** (same as before)
- **Transformed Output** (same as before)
- Session ID (same as before)

## Technical Details

### Request Capture
```typescript
const requestStart = Date.now();
const requestOptions = { method, headers, body };
const response = await fetchWithCache(url, requestOptions, ...);
const requestEnd = Date.now();

// Store complete transaction details
ret.metadata.http = {
  status: response.status,
  statusText: response.statusText,
  headers: response.headers,
  request: {
    method: renderedConfig.method || 'GET',
    url: this.url,
    headers: renderedConfig.headers || {},
    body: requestOptions.body,
  },
  timing: {
    start: requestStart,
    end: requestEnd,
    duration: requestEnd - requestStart,
  },
};
```

### UI Display
```tsx
{/* Request Details */}
<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
  {httpDetails.request.method} {httpDetails.request.url}
</Typography>
{/* Request headers, body, response status with timing */}
<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
  HTTP {httpDetails.status} {httpDetails.statusText} ({httpDetails.timing.duration}ms)
</Typography>
```

## Benefits

1. **Complete HTTP Debugging**: Users can see the entire HTTP transaction flow
2. **Request Visibility**: Debug what was actually sent to the server  
3. **Timing Information**: Identify performance issues with request duration
4. **Professional Display**: Monospace formatting mimics HTTP debugging tools
5. **Backward Compatible**: Existing functionality remains unchanged
6. **No Breaking Changes**: All existing APIs and displays work as before

## Implementation Summary

### Files Changed
- `src/types/providers.ts` - Extended metadata interface
- `src/providers/http.ts` - Capture complete transaction details  
- `src/app/src/pages/redteam/setup/components/Targets/ProviderResponse.tsx` - Enhanced UI display

### Key Features
- ✅ Complete HTTP request details (method, URL, headers, body)
- ✅ Response timing information 
- ✅ Professional HTTP transaction display
- ✅ Backward compatibility
- ✅ Zero breaking changes
- ✅ Enhanced debugging capabilities

This implementation provides users with the "entire HTTP provider response" debugging information they requested, offering complete visibility into HTTP transactions for effective debugging and troubleshooting.