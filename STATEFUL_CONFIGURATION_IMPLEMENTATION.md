# Stateful Configuration Implementation

## Overview
This implementation addresses the three key requirements for stateful configuration support in promptfoo:

1. ✅ **Stateful Configuration UI**
2. ✅ **Stateful true/false support**  
3. ✅ **SessionIds support**

## Implementation Details

### 1. Enhanced Provider Configuration Dialog

**File:** `src/app/src/pages/eval-creator/components/ProviderConfigDialog.tsx`

**Features Added:**
- **Stateful Configuration Section**: A dedicated UI section with clear labeling and description
- **Toggle Switch**: Enable/disable stateful mode with a user-friendly switch
- **Session Source Configuration**: Configure whether session management is client-side or server-side
- **Session Parser Configuration**: JavaScript expression to extract sessionId from responses
- **Usage Guidelines**: Informational alerts showing how to use `{{sessionId}}` template variables
- **Contextual Help**: Examples of how to add sessionId to headers and request bodies

**Key Components:**
```tsx
// Stateful toggle switch
<Switch
  checked={localConfig.stateful || false}
  onChange={(e) => handleStatefulChange(e.target.checked)}
  color="primary"
/>

// Session configuration fields
<TextField
  label="Session Source"
  placeholder="client or server (default: client)"
  helperText="Source of session management: 'client' for client-side, 'server' for server-side"
/>

<TextField
  label="Session Parser"
  placeholder="e.g., data.body.sessionId"
  helperText="JavaScript expression to extract sessionId from response"
/>
```

### 2. Enhanced Red Team Target Configuration

**File:** `src/app/src/pages/redteam/setup/components/Targets/CommonConfigurationOptions.tsx`

**Features Added:**
- **Stateful Configuration Accordion**: Expandable section for stateful settings
- **Auto-expand**: Automatically expands when stateful mode is enabled
- **Comprehensive Session Management**: Same features as provider dialog but integrated into redteam setup
- **Contextual Documentation**: Inline help text and examples

**Key Components:**
```tsx
// Stateful accordion section
<Accordion defaultExpanded={isStatefulEnabled}>
  <AccordionSummary>
    <Typography variant="h6">Stateful Configuration</Typography>
    <Typography variant="body2" color="text.secondary">
      Enable session state and conversation history tracking
    </Typography>
  </AccordionSummary>
  <AccordionDetails>
    {/* Configuration options */}
  </AccordionDetails>
</Accordion>
```

### 3. Existing SessionId Infrastructure

The codebase already had robust sessionId support:

**Core Types:** `src/types/providers.ts`
```typescript
export interface ProviderResponse {
  sessionId?: string;
  // ... other properties
}

export interface ApiProvider {
  getSessionId?: () => string;
  // ... other properties
}
```

**Usage Examples Found:**
- Template variable support: `{{sessionId}}`
- Automatic session generation: `transformVars: '{ ...vars, sessionId: context.uuid }'`
- HTTP header usage: `'x-session-id': '{{sessionId}}'`
- Request body usage: `'sessionId': '{{sessionId}}'`

## Configuration Options

### Stateful Mode Settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `stateful` | boolean | Enable/disable stateful mode | `false` |
| `sessionSource` | string | Session management source (`client` or `server`) | `client` |
| `sessionParser` | string | JavaScript expression to extract sessionId from response | `undefined` |

### SessionId Template Variables

When stateful mode is enabled, the following template variables are available:

- `{{sessionId}}` - Unique session identifier for each evaluation run
- Can be used in:
  - HTTP headers: `"x-session-id": "{{sessionId}}"`
  - Request body: `"sessionId": "{{sessionId}}"`
  - URL parameters: `?session={{sessionId}}`
  - Any other configuration field

## Usage Examples

### 1. HTTP Provider with SessionId Headers
```yaml
providers:
  - id: http
    config:
      url: https://api.example.com/chat
      method: POST
      headers:
        Content-Type: application/json
        x-session-id: "{{sessionId}}"
      body:
        message: "{{prompt}}"
        sessionId: "{{sessionId}}"
      stateful: true
      sessionParser: "data.body.sessionId"
```

### 2. Red Team Configuration with Stateful Mode
```yaml
targets:
  - id: http
    config:
      url: https://api.example.com/chat
      stateful: true
      sessionSource: client
      sessionParser: "response.sessionId"
```

### 3. Multi-Turn Strategy with Stateful Support
```yaml
redteam:
  strategies:
    - id: crescendo
      config:
        stateful: true
        maxTurns: 10
```

## UI Screenshots/Descriptions

### Provider Configuration Dialog
- **Section**: "Stateful Configuration" 
- **Toggle**: "Enable Stateful Mode" with description
- **Fields**: Session Source and Session Parser (shown when enabled)
- **Help**: Info box with usage examples and template variable documentation

### Red Team Setup - Target Configuration  
- **Accordion**: "Stateful Configuration" (expandable)
- **Auto-expand**: Opens automatically when stateful mode is enabled
- **Integration**: Seamlessly integrated with other target configuration options
- **Guidance**: Contextual help and examples

## Benefits

1. **User-Friendly**: Clear, intuitive UI for configuring stateful behavior
2. **Comprehensive**: Supports both general evaluation and red team scenarios
3. **Flexible**: Configurable session management (client/server-side)
4. **Well-Documented**: Inline help and examples guide users
5. **Template Support**: Full support for `{{sessionId}}` template variables
6. **Backwards Compatible**: Existing configurations continue to work

## Technical Notes

- **Type Safety**: Full TypeScript support with proper type definitions
- **Event Handling**: Proper React event handler typing
- **State Management**: React state management for UI components
- **Validation**: Input validation and error handling
- **Performance**: Efficient re-rendering with proper React patterns

## Future Enhancements

Potential future improvements could include:
- Session persistence across evaluation runs
- Custom session ID generation strategies
- Session analytics and reporting
- Advanced session lifecycle management