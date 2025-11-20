# Public Assets

This directory contains all static assets served by the application.

## Directory Structure

```
public/
├── favicon.ico                 # Site favicon (Note: Currently 2MB, needs optimization!)
├── manifest.json              # PWA manifest
├── images/
│   ├── logos/                 # Logo files
│   │   ├── lof-logo.png      # Main LOF logo (12KB)
│   │   ├── lof-alternate.png  # Alternate LOF logo (40KB)
│   │   ├── lof-logo-large.png # Large LOF logo (50KB)
│   │   ├── lof-small.png      # Small LOF logo (5KB)
│   │   └── trg-logo.png       # TRG logo (7KB)
│   └── branding/              # Other brand assets
└── icons/                     # PWA icons (to be added)
    ├── icon-192x192.png       # (TODO: Create)
    └── icon-512x512.png       # (TODO: Create)
```

## Usage in Code

### Logo References
```tsx
// Main LOF logo
<img src="/images/logos/lof-logo.png" alt="LOF" />

// TRG logo
<img src="/images/logos/trg-logo.png" alt="TRG Logo" />

// LOF alternate logo
<img src="/images/logos/lof-alternate.png" alt="Lab of Future Logo" />
```

## TODO - Assets to Create/Optimize

### Favicon Optimization (CRITICAL!)
- **Current**: favicon.ico is 2MB (way too large!)
- **Target**: Should be under 100KB
- **Action**: Recreate favicon.ico with proper compression
  - Recommended sizes: 16x16, 32x32, 48x48 combined in .ico format
  - Use PNG format with proper compression
  - Tools: ImageMagick, online favicon generators

### PWA Icons (Recommended)
Create the following icon sizes for Progressive Web App support:
- `icons/icon-192x192.png` - Android home screen
- `icons/icon-512x512.png` - Android splash screen
- `icons/apple-touch-icon.png` - iOS home screen

### Command to Optimize Favicon (using ImageMagick)
```bash
# Example: Create multi-resolution favicon from a high-res PNG
convert logo.png -resize 16x16 favicon-16.png
convert logo.png -resize 32x32 favicon-32.png
convert logo.png -resize 48x48 favicon-48.png
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

## Best Practices

1. **Image Optimization**
   - Use WebP format for better compression (with PNG fallback)
   - Compress PNG files using tools like TinyPNG or ImageOptim
   - Keep individual images under 200KB when possible

2. **Lazy Loading**
   - Large images should use Next.js Image component for automatic optimization
   - Use `loading="lazy"` for images below the fold

3. **Caching**
   - Static assets are automatically cached by Next.js
   - Update filenames (versioning) when assets change for cache busting

## Image Sources

- **LOF Logos**: Lab of Future branding assets
- **TRG Logo**: Top Rock Global branding
- **Favicon**: Currently using LOF branding (needs optimization!)
