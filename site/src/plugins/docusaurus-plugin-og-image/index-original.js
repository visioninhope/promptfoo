const path = require('path');
const fs = require('fs').promises;
const { Resvg } = require('@resvg/resvg-js');
const matter = require('gray-matter');
const sharp = require('sharp');

// Constants for image generation
const WIDTH = 1200;
const HEIGHT = 630;

// Helper function to escape HTML/XML entities
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Smart text wrapping that preserves all content
function wrapText(text, maxWidth, fontSize) {
  if (!text) {
    return [];
  }
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  const avgCharWidth = fontSize * 0.5;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const estimatedWidth = testLine.length * avgCharWidth;

    if (estimatedWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Dynamic font sizing - much more aggressive scaling
function calculateOptimalFontSize(text, hasImage = false, isTitle = true) {
  if (!text) {
    return 48;
  }
  const length = text.length;

  if (isTitle) {
    // Title sizing - MUCH larger when space allows
    if (hasImage) {
      // With image - slightly smaller
      if (length <= 30) {
        return 48;
      }
      if (length <= 50) {
        return 42;
      }
      if (length <= 70) {
        return 36;
      }
      if (length <= 100) {
        return 32;
      }
      return 28;
    } else {
      // No image - we have lots of space
      if (length <= 20) {
        return 72;
      }
      if (length <= 30) {
        return 64;
      }
      if (length <= 50) {
        return 56;
      }
      if (length <= 70) {
        return 48;
      }
      if (length <= 100) {
        return 40;
      }
      return 32;
    }
  } else {
    // Description sizing
    return Math.min(22, Math.max(16, 24 - Math.floor(length / 60)));
  }
}

// Helper function to convert SVG logo to base64
async function getLogoAsBase64() {
  try {
    // Try different possible paths for the logo
    const possiblePaths = [
      path.join(process.cwd(), 'static/img/logo-panda.svg'),
      path.join(process.cwd(), 'site/static/img/logo-panda.svg'),
      path.join(process.cwd(), '../../../static/img/logo-panda.svg'), // From plugin dir
    ];
    
    for (const logoPath of possiblePaths) {
      try {
        const logoContent = await fs.readFile(logoPath, 'utf8');
        return `data:image/svg+xml;base64,${Buffer.from(logoContent).toString('base64')}`;
      } catch (_e) {
        // Try next path
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Could not load logo:', error.message);
    return '';
  }
}

// Helper function to convert image to base64
async function getImageAsBase64(imagePath, maxWidth = 520, maxHeight = 430) {
  try {
    // Handle relative paths from frontmatter
    // Check if we're already in the site directory
    const cwd = process.cwd();
    const inSiteDir = cwd.endsWith('/site');

    let fullPath;
    if (imagePath.startsWith('/')) {
      // Absolute path from static directory
      if (inSiteDir) {
        fullPath = path.join(cwd, 'static', imagePath);
      } else {
        fullPath = path.join(cwd, 'site/static', imagePath);
      }
    } else {
      // Relative path
      if (inSiteDir) {
        fullPath = path.join(cwd, imagePath);
      } else {
        fullPath = path.join(cwd, 'site', imagePath);
      }
    }

    const ext = path.extname(fullPath).toLowerCase().replace('.', '');

    // For SVG files, don't use sharp
    if (ext === 'svg') {
      const imageBuffer = await fs.readFile(fullPath);
      return `data:image/svg+xml;base64,${imageBuffer.toString('base64')}`;
    }

    // Use sharp to resize and resample images with high quality
    const resizedBuffer = await sharp(fullPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3, // High-quality resampling
      })
      .png({
        quality: 95,
        compressionLevel: 6,
      })
      .toBuffer();

    return `data:image/png;base64,${resizedBuffer.toString('base64')}`;
  } catch (error) {
    console.warn(`Could not load image ${imagePath}:`, error.message);
    return null;
  }
}

// Get page type label - simplified
function getPageTypeLabel(routePath) {
  if (routePath.includes('/blog/')) {
    return 'Blog';
  }
  if (routePath.includes('/guides/')) {
    return 'Guide';
  }
  if (routePath.includes('/red-team')) {
    return 'Security';
  }
  if (routePath.includes('/providers/')) {
    return 'Provider';
  }
  if (routePath.includes('/integrations/')) {
    return 'Integration';
  }
  if (routePath.includes('/api-reference/')) {
    return 'API';
  }
  return null; // Don't show generic "Documentation"
}

// Helper function to convert font to base64
async function getFontAsBase64() {
  try {
    // Try different possible paths for the font
    const possiblePaths = [
      path.join(process.cwd(), 'static/fonts/Inter-SemiBold.ttf'),
      path.join(process.cwd(), '../../../static/fonts/Inter-SemiBold.ttf'), // From plugin dir
      path.join(process.cwd(), 'site/static/fonts/Inter-SemiBold.ttf'), // From project root
    ];
    
    for (const fontPath of possiblePaths) {
      try {
        const fontBuffer = await fs.readFile(fontPath);
        return fontBuffer.toString('base64');
      } catch (_e) {
        // Try next path
      }
    }
    
    // If no font found, return null (will use system fonts)
    return null;
  } catch (error) {
    console.warn('Could not load Inter font for embedding:', error.message);
    return null;
  }
}

// RICH VISUAL OG IMAGE TEMPLATE WITH METADATA
async function generateSvgTemplate(metadata = {}) {
  const {
    title = 'Promptfoo',
    description = '',
    breadcrumbs = [],
    routePath = '',
    ogTitle = null,
    ogDescription = null,
    date = null,
    author = null,
    image = null,
  } = metadata;

  const logoBase64 = await getLogoAsBase64();
  const fontBase64 = await getFontAsBase64();

  // Use custom OG title if provided
  const displayTitle = ogTitle || title;
  const displayDescription = ogDescription || description;

  const escapedTitle = escapeXml(displayTitle);
  const escapedDescription = escapeXml(displayDescription);

  // Check if we have a valid image
  const hasImage = image && !image.startsWith('http');
  let imageBase64 = null;
  let hasValidImage = false;
  
  if (hasImage) {
    imageBase64 = await getImageAsBase64(image);
    hasValidImage = imageBase64 !== null && typeof imageBase64 === 'string';
    
    if (hasImage && !hasValidImage) {
      console.warn(`Could not load image for template: ${image}`);
    }
  }

  // Get page type
  const pageType = getPageTypeLabel(routePath);

  // Format date and author
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const authorDisplay = author || '';
  const metadataLine = [formattedDate, authorDisplay].filter(Boolean).join(' • ');

  // Format breadcrumbs - limit to 2 levels for cleaner look
  const breadcrumbText =
    breadcrumbs.length > 0 ? escapeXml(breadcrumbs.slice(0, 2).join(' › ')) : pageType;

  let contentLayout = '';
  let mainY = 240;

  if (hasValidImage) {
    // WITH IMAGE LAYOUT
    const maxImageWidth = 360;  // Smaller than before to fit with content card
    const maxImageHeight = HEIGHT - 280;
    const imageX = 100; // Align with content card padding
    const contentStartX = maxImageWidth + 140;
    const maxTextWidth = WIDTH - contentStartX - 100;

    const titleFontSize = calculateOptimalFontSize(escapedTitle, true, true);
    const descFontSize = calculateOptimalFontSize(escapedDescription, true, false);

    const titleLines = wrapText(escapedTitle, maxTextWidth, titleFontSize);
    const descriptionLines = escapedDescription
      ? wrapText(escapedDescription, maxTextWidth, descFontSize)
      : [];

    const totalTextHeight =
      titleLines.length * titleFontSize * 1.2 +
      (descriptionLines.length > 0 ? 20 + descriptionLines.length * descFontSize * 1.4 : 0);
    const textStartY = Math.max(180, (HEIGHT - totalTextHeight) / 2);
    const imageY = 120;

    contentLayout = `
      <!-- Image with subtle styling -->
      <g>
        <clipPath id="imageClip">
          <rect x="${imageX}" y="${imageY}" width="${maxImageWidth}" height="${maxImageHeight}" rx="12"/>
        </clipPath>
        <!-- Subtle background behind image -->
        <rect x="${imageX - 4}" y="${imageY - 4}" width="${maxImageWidth + 8}" height="${maxImageHeight + 8}" 
              rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        <image href="${imageBase64}" 
               x="${imageX}" y="${imageY}" 
               width="${maxImageWidth}" height="${maxImageHeight}" 
               preserveAspectRatio="xMidYMid meet"
               clip-path="url(#imageClip)"
               opacity="0.95"/>
      </g>
      
      <!-- Text content -->
      <g transform="translate(${contentStartX}, ${textStartY})">
        ${titleLines
          .map(
            (line, index) => `
        <text x="0" y="${index * titleFontSize * 1.2}" 
              font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" 
              font-size="${titleFontSize}" 
              font-weight="700" 
              fill="white">
          ${line}
        </text>`,
          )
          .join('')}
        
        ${
          descriptionLines.length > 0
            ? `
        ${descriptionLines
          .map(
            (line, index) => `
        <text x="0" y="${titleLines.length * titleFontSize * 1.2 + 20 + index * descFontSize * 1.4}" 
              font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" 
              font-size="${descFontSize}" 
              font-weight="400" 
              fill="#94a3b8">
          ${line}
        </text>`,
          )
          .join('')}
        `
            : ''
        }
      </g>
    `;
  } else {
    // NO IMAGE LAYOUT - RICH STYLING
    const titleFontSize = calculateOptimalFontSize(escapedTitle, false, true);
    const descFontSize = calculateOptimalFontSize(escapedDescription, false, false);

    const titleLines = wrapText(escapedTitle, WIDTH - 240, titleFontSize);
    const descriptionLines = escapedDescription
      ? wrapText(escapedDescription, WIDTH - 240, descFontSize)
      : [];
    const breadcrumbLines =
      !escapedDescription && breadcrumbs.length > 0 ? [breadcrumbs.join(' › ')] : [];

    const totalHeight =
      titleLines.length * titleFontSize * 1.2 +
      (descriptionLines.length > 0 ? 30 + descriptionLines.length * descFontSize * 1.4 : 0) +
      (breadcrumbLines.length > 0 ? 30 + breadcrumbLines.length * 24 : 0);

    mainY = (HEIGHT - totalHeight) / 2;

    contentLayout = `
      <!-- Centered content with rich styling -->
      <g transform="translate(${WIDTH / 2}, ${mainY})">
        ${titleLines
          .map(
            (line, index) => `
        <text x="0" y="${index * titleFontSize * 1.2}" 
              text-anchor="middle"
              font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" 
              font-size="${titleFontSize}" 
              font-weight="700" 
              fill="white">
          ${line}
        </text>`,
          )
          .join('')}
        
        ${
          descriptionLines.length > 0
            ? `
        ${descriptionLines
          .map(
            (line, index) => `
        <text x="0" y="${titleLines.length * titleFontSize * 1.2 + 30 + index * descFontSize * 1.4}" 
              text-anchor="middle"
              font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" 
              font-size="${descFontSize}" 
              font-weight="400" 
              fill="rgba(255,255,255,0.7)">
          ${line}
        </text>`,
          )
          .join('')}
        `
            : breadcrumbLines.length > 0
              ? `
        <text x="0" y="${titleLines.length * titleFontSize * 1.2 + 30}" 
              text-anchor="middle"
              font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" 
              font-size="20" 
              font-weight="400" 
              fill="rgba(255,255,255,0.5)">
          ${escapeXml(breadcrumbLines[0])}
        </text>
        `
              : ''
        }
      </g>
    `;
  }

  // RICH VISUAL DESIGN RESTORED
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${
      fontBase64
        ? `
    <style type="text/css">
      @font-face {
        font-family: 'InterSemiBold';
        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
        font-weight: 600;
        font-style: normal;
      }
    </style>
    `
        : ''
    }
    
    <!-- Brand gradient using Promptfoo colors -->
    <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10191c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#17252b;stop-opacity:1" />
    </linearGradient>
    
    <!-- Red accent gradient -->
    <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e53a3a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#cb3434;stop-opacity:1" />
    </linearGradient>
    
    <!-- Subtle pattern -->
    <pattern id="dotPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.02)"/>
      <circle cx="22" cy="22" r="1" fill="rgba(255,255,255,0.02)"/>
    </pattern>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#backgroundGradient)"/>
  
  <!-- Dot pattern -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dotPattern)"/>
  
  <!-- Top accent bar -->
  <rect x="0" y="0" width="${WIDTH}" height="4" fill="url(#redGradient)"/>
  
  <!-- Content card background with subtle gradient -->
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="12" fill="rgba(255,255,255,0.02)"/>
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="12" fill="rgba(23,37,43,0.4)"/>
  
  <!-- Left accent stripe -->
  <rect x="40" y="40" width="6" height="${HEIGHT - 80}" rx="3" fill="url(#redGradient)"/>
  
  <!-- Top highlight -->
  <rect x="46" y="40" width="${WIDTH - 86}" height="1" fill="rgba(255,255,255,0.08)"/>
  
  <!-- Header section -->
  <g transform="translate(80, 80)">
    <!-- Logo -->
    ${logoBase64 ? `<image href="${logoBase64}" width="48" height="48" opacity="0.9"/>` : ''}
    
    <!-- Brand name -->
    <text x="60" y="28" font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="24" font-weight="600" fill="#ff7a7a">promptfoo</text>
    
    <!-- Page type badge -->
    ${pageType ? `
    <rect x="200" y="6" width="${pageType.length * 9 + 24}" height="28" rx="14" fill="rgba(229, 58, 58, 0.15)" stroke="#e53a3a" stroke-width="1"/>
    <text x="${200 + (pageType.length * 9 + 24) / 2}" y="24" text-anchor="middle" font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="13" font-weight="600" fill="#ff7a7a">${pageType}</text>
    ` : ''}
  </g>
  
  <!-- Breadcrumbs with better styling -->
  <g transform="translate(80, 140)">
    <text font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="16" fill="rgba(255,255,255,0.5)" letter-spacing="0.5">${breadcrumbText}</text>
  </g>
  
  ${contentLayout}
  
  <!-- Bottom section with metadata and call-to-action -->
  <g transform="translate(80, ${HEIGHT - 100})">
    <text font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="16" fill="rgba(255,255,255,0.6)">Secure and reliable LLM applications</text>
    ${metadataLine ? `<text x="0" y="20" font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="14" fill="rgba(255,122,122,0.7)">${escapeXml(metadataLine)}</text>` : ''}
    <text x="0" y="${metadataLine ? 40 : 20}" font-family="${fontBase64 ? 'InterSemiBold' : 'system-ui, -apple-system, sans-serif'}" font-size="14" fill="rgba(255,122,122,0.8)">promptfoo.dev</text>
  </g>
  
  <!-- Decorative elements -->
  <circle cx="${WIDTH - 120}" cy="120" r="180" fill="rgba(229, 58, 58, 0.03)"/>
  <circle cx="${WIDTH - 80}" cy="160" r="100" fill="rgba(229, 58, 58, 0.02)"/>
  <circle cx="${WIDTH - 160}" cy="100" r="60" fill="rgba(255, 122, 122, 0.02)"/>
  
  <!-- Grid decoration in bottom right -->
  <g transform="translate(${WIDTH - 200}, ${HEIGHT - 200})" opacity="0.08">
    ${Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => {
        const size = i === 3 && j === 3 ? 35 : 30;
        const opacity = 1 - (i + j) * 0.1;
        return `<rect x="${i * 40}" y="${j * 40}" width="${size}" height="${size}" fill="#e53a3a" rx="4" opacity="${opacity}"/>`;
      }).join(''),
    ).join('')}
  </g>
  
  <!-- Additional decorative lines -->
  <line x1="${WIDTH - 400}" y1="${HEIGHT - 40}" x2="${WIDTH - 200}" y2="${HEIGHT - 40}" stroke="#e53a3a" stroke-width="1" opacity="0.1"/>
  <line x1="${WIDTH - 40}" y1="${HEIGHT - 400}" x2="${WIDTH - 40}" y2="${HEIGHT - 200}" stroke="#e53a3a" stroke-width="1" opacity="0.1"/>
  
  <!-- Bottom accent -->
  <rect x="40" y="${HEIGHT - 44}" width="${WIDTH - 80}" height="4" rx="2" fill="url(#redGradient)" opacity="0.4"/>
</svg>`;

  return svg;
}

// Generate OG image from SVG
async function generateOgImage(metadata, outputPath) {
  try {
    const svg = await generateSvgTemplate(metadata);

    // Convert SVG to PNG using resvg
    // Since we're embedding the font in the SVG, we don't need to load external fonts
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: WIDTH,
      },
      font: {
        loadSystemFonts: true, // Keep system fonts as fallback
        fontFiles: [], // No external fonts needed
        defaultFontFamily: 'sans-serif',
      },
      dpi: 96,
      background: 'transparent',
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write PNG file
    await fs.writeFile(outputPath, pngBuffer);

    return true;
  } catch (error) {
    console.error(`Failed to generate OG image for "${title}":`, error);
    return false;
  }
}

// Extract breadcrumbs from the doc path and sidebar structure
function extractBreadcrumbs(docPath, sidebarItems) {
  const breadcrumbs = [];
  const pathParts = docPath.split('/').filter((part) => part && part !== 'docs');

  // Try to build breadcrumbs from the path
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    // Convert kebab-case to Title Case
    const breadcrumb = part
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    breadcrumbs.push(breadcrumb);
  }

  return breadcrumbs;
}

// Try to read the actual markdown file and extract metadata
async function extractMetadataFromMarkdown(routePath, outDir) {
  try {
    // Try different possible paths for the markdown file
    const possiblePaths = [
      path.join(
        process.cwd(),
        'site/docs',
        routePath.replace('/docs/', '').replace(/\/$/, '') + '.md',
      ),
      path.join(
        process.cwd(),
        'site/docs',
        routePath.replace('/docs/', '').replace(/\/$/, '') + '.mdx',
      ),
      path.join(
        process.cwd(),
        'site/docs',
        routePath.replace('/docs/', '').replace(/\/$/, ''),
        'index.md',
      ),
      path.join(
        process.cwd(),
        'site/docs',
        routePath.replace('/docs/', '').replace(/\/$/, ''),
        'index.mdx',
      ),
      path.join(
        process.cwd(),
        'site/blog',
        routePath.replace('/blog/', '').replace(/\/$/, '') + '.md',
      ),
      path.join(
        process.cwd(),
        'site/blog',
        routePath.replace('/blog/', '').replace(/\/$/, '') + '.mdx',
      ),
      // Additional blog path pattern for routes ending with /
      path.join(
        process.cwd(),
        'site/blog',
        routePath.replace('/blog/', '').replace(/\/$/, '').replace(/-$/, '') + '.md',
      ),
      path.join(
        process.cwd(),
        'site/blog',
        routePath.replace('/blog/', '').replace(/\/$/, '').replace(/-$/, '') + '.mdx',
      ),
      // Fallback without 'site' prefix
      path.join(process.cwd(), 'docs', routePath.replace('/docs/', '').replace(/\/$/, '') + '.md'),
      path.join(process.cwd(), 'docs', routePath.replace('/docs/', '').replace(/\/$/, '') + '.mdx'),
      path.join(process.cwd(), 'blog', routePath.replace('/blog/', '').replace(/\/$/, '') + '.md'),
      path.join(process.cwd(), 'blog', routePath.replace('/blog/', '').replace(/\/$/, '') + '.mdx'),
    ];

    for (const filePath of possiblePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const { data, content: markdownContent } = matter(content);

        // Extract all metadata
        const metadata = {
          title: data.title || null,
          description: data.description || null,
          author:
            data.author ||
            (data.authors && Array.isArray(data.authors)
              ? data.authors.map((a) => (typeof a === 'object' ? a.name : a)).join(' & ')
              : data.authors) ||
            null,
          date: data.date || null,
          image: data.image || null,
          tags: data.tags || [],
          keywords: data.keywords || [],
          ogTitle: data.og_title || data.ogTitle || null,
          ogDescription: data.og_description || data.ogDescription || null,
        };

        // If no frontmatter title, try to extract H1 from markdown
        if (!metadata.title) {
          const h1Match = markdownContent.match(/^#\s+(.+)$/m);
          if (h1Match) {
            metadata.title = h1Match[1].trim();
          }
        }

        return metadata;
      } catch (_e) {
        // File doesn't exist, try next
      }
    }
  } catch (_error) {
    // Couldn't read file
  }

  return { title: null };
}

// CLI interface for testing individual OG images
async function generateSingleImage(options = {}) {
  const {
    title = 'Test Title',
    description = '',
    author = '',
    date = '',
    image = '',
    routePath = '/test/',
    output = './test-og-image.png'
  } = options;

  console.log('Generating OG image with options:', options);

  const metadata = {
    title,
    description,
    author,
    date: date ? new Date(date) : null,
    image,
    routePath,
    breadcrumbs: routePath.split('/').filter(Boolean).slice(0, -1)
  };

  try {
    const success = await generateOgImage(metadata, output);
    if (success) {
      console.log(`✅ Generated OG image: ${output}`);
      return true;
    } else {
      console.error('❌ Failed to generate OG image');
      return false;
    }
  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    return false;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node index.js [options]

Options:
  --title "Your Title Here"          Title for the OG image
  --description "Description text"   Description text (optional)
  --author "Author Name"             Author name (optional) 
  --date "2024-01-15"               Date in YYYY-MM-DD format (optional)
  --image "path/to/image.jpg"       Path to image file (optional)
  --route "/blog/my-post/"          Route path for page type detection (optional)
  --output "./my-image.png"         Output file path (default: ./test-og-image.png)

Examples:
  # Basic usage
  node index.js --title "My Blog Post" --output "./blog-post-og.png"
  
  # Full metadata
  node index.js --title "Advanced Testing" --description "Learn how to test your applications" --author "John Doe" --date "2024-01-15" --route "/blog/advanced-testing/" --output "./advanced-testing.png"
  
  # With image
  node index.js --title "Featured Post" --image "static/img/hero.jpg" --output "./featured.png"
`);
    process.exit(0);
  }

  // Parse CLI arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  // Run the generator
  generateSingleImage(options)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Export helper functions for CLI usage
module.exports = function (context, options) {
  return {
    name: 'docusaurus-plugin-og-image',

    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;

      // Store plugin data globally so it can be accessed by theme components
      setGlobalData({
        ogImagePlugin: true,
      });
    },

    async postBuild({ siteConfig, routesPaths, outDir, plugins, content, routes }) {
      console.log('Generating OG images for documentation pages...');

      const generatedImages = new Map();
      let successCount = 0;
      let failureCount = 0;

      // Create a map of routes to their metadata
      const routeMetadata = new Map();

      // Process routes to extract metadata
      if (routes) {
        for (const route of routes) {
          if (route.path && route.modules && Array.isArray(route.modules)) {
            // Look for metadata in route modules
            const metadataModule = route.modules.find(
              (m) => m && (m.metadata || m.__metadata || (typeof m === 'object' && m.title)),
            );

            if (metadataModule) {
              const metadata =
                metadataModule.metadata || metadataModule.__metadata || metadataModule;
              routeMetadata.set(route.path, {
                title: metadata.title || metadata.frontMatter?.title,
                description: metadata.description || metadata.frontMatter?.description,
                breadcrumbs: metadata.breadcrumbs || [],
              });
            }
          }
        }
      }

      // Also try to get metadata from docs plugin
      const docsPlugin = plugins.find(
        (plugin) => plugin.name === '@docusaurus/plugin-content-docs',
      );
      if (docsPlugin && docsPlugin.content) {
        const { loadedVersions } = docsPlugin.content;
        if (loadedVersions && loadedVersions.length > 0) {
          const version = loadedVersions[0];
          version.docs.forEach((doc) => {
            routeMetadata.set(doc.permalink, {
              title: doc.title || doc.frontMatter?.title || doc.label,
              description: doc.description || doc.frontMatter?.description,
              breadcrumbs: doc.sidebar?.breadcrumbs || [],
            });
          });
        }
      }

      // Get blog plugin metadata
      const blogPlugin = plugins.find(
        (plugin) => plugin.name === '@docusaurus/plugin-content-blog',
      );
      if (blogPlugin && blogPlugin.content) {
        const { blogPosts } = blogPlugin.content;
        if (blogPosts) {
          blogPosts.forEach((post) => {
            // Extract author information
            const authors = post.metadata.authors || [];
            const authorNames = authors
              .map((a) => (typeof a === 'object' ? a.name || a.key : a))
              .filter(Boolean)
              .join(' & ');

            routeMetadata.set(post.metadata.permalink, {
              title: post.metadata.title,
              description: post.metadata.description,
              author: authorNames || null,
              date: post.metadata.date || post.metadata.formattedDate || null,
              image: post.metadata.frontMatter?.image || post.metadata.image || null,
              breadcrumbs: ['Blog'],
            });
          });
        }
      }

      // Process all documentation routes
      for (const routePath of routesPaths) {
        if (routePath.startsWith('/docs/') || routePath.startsWith('/blog/')) {
          try {
            // Get metadata for this route
            const metadata = routeMetadata.get(routePath) || {};

            // Try to get metadata from multiple sources
            let fileMetadata = { title: metadata.title };

            // For blog posts, always try to read the markdown file to get the image
            // Blog plugin doesn't expose custom frontmatter fields like image
            if (routePath.startsWith('/blog/')) {
              fileMetadata = await extractMetadataFromMarkdown(routePath, outDir);
            } else if (!fileMetadata.title) {
              // For docs, only read if we don't have a title
              fileMetadata = await extractMetadataFromMarkdown(routePath, outDir);
            }

            // Merge route metadata with file metadata
            const fullMetadata = {
              ...fileMetadata,
              ...metadata,
              title: metadata.title || fileMetadata.title,
              description: metadata.description || fileMetadata.description,
              author: fileMetadata.author || metadata.author,
              date: fileMetadata.date || metadata.date,
              image: fileMetadata.image || metadata.image,
            };

            // Debug for specific blog posts
            if (
              routePath.includes('/blog/') &&
              (routePath.includes('100k') || routePath.includes('excessive'))
            ) {
              console.log(`\nProcessing ${routePath}:`);
              console.log('  Image from file:', fileMetadata.image);
              console.log('  Image from metadata:', metadata.image);
              console.log('  Final image:', fullMetadata.image);
            }

            // Final fallback for title to path parsing
            if (!fullMetadata.title) {
              const pathParts = routePath.split('/').filter(Boolean);
              const lastPart = pathParts[pathParts.length - 1];
              fullMetadata.title = lastPart
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }

            // Extract breadcrumbs from metadata or path
            const breadcrumbs =
              metadata.breadcrumbs && metadata.breadcrumbs.length > 0
                ? metadata.breadcrumbs.map((b) => b.label || b)
                : extractBreadcrumbs(routePath, []);

            // Add route path to metadata
            fullMetadata.routePath = routePath;
            fullMetadata.breadcrumbs = breadcrumbs;

            // Generate unique filename for this route
            const imageFileName =
              routePath
                .replace(/^\//, '')
                .replace(/\//g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '') + '-og.png';

            const imagePath = path.join(outDir, 'img', 'og', imageFileName);
            const imageUrl = `/img/og/${imageFileName}`;

            // Generate the OG image with full metadata
            const success = await generateOgImage(fullMetadata, imagePath);

            if (success) {
              generatedImages.set(routePath, imageUrl);
              successCount++;

              // Inject meta tags into the HTML for this route
              const htmlPath = path.join(outDir, routePath.slice(1), 'index.html');
              try {
                if (
                  await fs
                    .stat(htmlPath)
                    .then((stat) => stat.isFile())
                    .catch(() => false)
                ) {
                  let html = await fs.readFile(htmlPath, 'utf8');

                  const newOgImageUrl = `${siteConfig.url}${imageUrl}`;
                  const defaultThumbnailUrl = 'https://www.promptfoo.dev/img/thumbnail.png';

                  // If HTML contains the default thumbnail URL, replace all instances
                  if (html.includes(defaultThumbnailUrl)) {
                    html = html.replaceAll(defaultThumbnailUrl, newOgImageUrl);
                    await fs.writeFile(htmlPath, html);
                    console.log(`Replaced default thumbnail OG meta tags for ${routePath}`);
                  }
                }
              } catch (error) {
                console.warn(`Could not inject meta tags for ${routePath}:`, error.message);
              }
            } else {
              failureCount++;
            }
          } catch (error) {
            console.error(`Error processing route ${routePath}:`, error);
            failureCount++;
          }
        }
      }

      // Create a manifest file for the generated images
      const manifestPath = path.join(outDir, 'og-images-manifest.json');
      await fs.writeFile(
        manifestPath,
        JSON.stringify(Object.fromEntries(generatedImages), null, 2),
      );

      console.log(
        `OG image generation complete: ${successCount} succeeded, ${failureCount} failed`,
      );
    },
  };
};

// Export functions for external usage
module.exports.generateSingleImage = generateSingleImage;
module.exports.generateSvgTemplate = generateSvgTemplate;
module.exports.generateOgImage = generateOgImage;
