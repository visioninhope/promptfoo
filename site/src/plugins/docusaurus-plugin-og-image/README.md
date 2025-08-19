# Promptfoo OG Image Plugin

Production-ready OG image generation for Docusaurus with rich styling options, proper error handling, and performance optimizations.

## Features

- 🎨 **Multiple Style Modes**: Choose between `clean` and `rich` styling
- 🖼️ **Image Support**: Automatic image processing with size limits and caching
- ⚡ **Performance Optimized**: Asset caching, timeouts, and resource limits
- 🛡️ **Security**: Input validation and path traversal protection
- 🧪 **CLI Testing**: Standalone CLI for testing individual images
- 📊 **Error Handling**: Graceful degradation and detailed logging

## Usage

### Plugin Configuration

Add to your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      './src/plugins/docusaurus-plugin-og-image',
      {
        styleMode: 'rich', // 'clean' or 'rich' (default: 'rich')
        timeout: 30000,    // Generation timeout in ms (default: 30000)
      }
    ]
  ]
};
```

### Style Modes

#### Rich Mode (Default)
- Gradient backgrounds and decorative elements
- Content cards with subtle shadows
- Page type badges and visual hierarchy
- Best for marketing and blog content

#### Clean Mode
- Minimal, professional styling
- Solid backgrounds with clean typography
- No decorative elements
- Best for technical documentation

### CLI Usage

```bash
# Basic usage
node src/plugins/docusaurus-plugin-og-image/index.js \
  --title "My Page Title" \
  --output "./my-og-image.png"

# Rich mode with full metadata
node src/plugins/docusaurus-plugin-og-image/index.js \
  --title "AI Red Teaming Guide" \
  --description "Comprehensive security testing methodologies" \
  --author "Security Team" \
  --date "2024-08-19" \
  --image "static/img/blog/hero.jpg" \
  --route "/blog/red-teaming/" \
  --style-mode "rich" \
  --output "./red-teaming-og.png"

# Clean mode for documentation
node src/plugins/docusaurus-plugin-og-image/index.js \
  --title "Configuration Reference" \
  --description "Complete API configuration guide" \
  --route "/docs/config/" \
  --style-mode "clean" \
  --output "./config-docs-og.png"
```

### CLI Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--title` | Page title | Yes | - |
| `--description` | Page description | No | "" |
| `--author` | Author name | No | "" |
| `--date` | Publication date (YYYY-MM-DD) | No | null |
| `--image` | Path to image file | No | null |
| `--route` | Route path for page type detection | No | "/test/" |
| `--style-mode` | Styling mode (`clean` or `rich`) | No | "rich" |
| `--output` | Output file path | No | "./test-og-image.png" |

## Performance & Security

### Resource Limits
- **Image size limit**: 10MB maximum
- **Image dimensions**: 2048x2048 maximum
- **Generation timeout**: 30 seconds (configurable)
- **Text length limits**: Title (150 chars), Description (300 chars)

### Security Features
- Path traversal protection
- Input sanitization and validation
- Safe XML entity escaping
- Controlled file system access

### Performance Optimizations
- Asset caching (5-minute TTL)
- Parallel resource loading
- Sharp image processing with optimization
- Minimal SVG generation

## Architecture

The plugin is built with a modular architecture:

- **`Validator`**: Input validation and sanitization
- **`ResourceManager`**: Asset loading with caching
- **`LayoutEngine`**: Typography and layout calculations
- **`TemplateGenerator`**: SVG template generation
- **`OGImageGenerator`**: Main generation orchestrator
- **`CLI`**: Command-line interface

## Error Handling

The plugin gracefully handles various error conditions:

- Missing or invalid images → Falls back to text-only layout
- Font loading failures → Uses system fonts
- Invalid paths → Validates and sanitizes inputs
- Generation timeouts → Returns error with logging
- Resource limits → Prevents memory exhaustion

## Development

### Testing

```bash
# Test rich mode
npm run test-og-rich

# Test clean mode  
npm run test-og-clean

# Test error handling
npm run test-og-errors
```

### Debugging

Enable detailed logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development node src/plugins/docusaurus-plugin-og-image/index.js --title "Debug Test"
```

## Migration from Original

The improved version maintains backward compatibility while adding new features:

1. **Style modes**: Set `styleMode: 'rich'` for original appearance
2. **Performance**: Automatic caching and optimization
3. **Error handling**: Graceful degradation replaces crashes
4. **Security**: Input validation prevents exploits

To use the original minimal styling, set `styleMode: 'clean'`.