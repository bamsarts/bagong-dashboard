# Dynamic Theme Configuration

This project now supports dynamic theming based on subdomain names.

## How It Works

1. The system detects the subdomain from the URL (e.g., `subdomain.yourdomain.com`)
2. It looks up the corresponding theme colors in `src/utils/theme.js`
3. CSS variables are dynamically updated to apply the theme

## Adding New Subdomain Themes

Edit `src/utils/theme.js` and add your subdomain configuration:

```javascript
const SUBDOMAIN_THEMES = {
  default: {
    primary: '#0166fe',
    secondary: '#FDA604',
    bgcolor: '#1C4075'
  },
  damri: {
    primary: '#0166fe',
    secondary: '#FDA604',
    bgcolor: '#1C4075'
  },
  // Add your new subdomain here
  client1: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    bgcolor: '#2c3e50'
  },
  client2: {
    primary: '#6c5ce7',
    secondary: '#fdcb6e',
    bgcolor: '#2d3436'
  }
}
```

## Testing Locally

Since localhost doesn't have subdomains, you can test by:

1. Editing your hosts file to map subdomains to localhost:
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Add: `127.0.0.1 client1.localhost`

2. Or modify the `getSubdomain` function temporarily for testing:
   ```javascript
   export function getSubdomain(hostname) {
     // For testing, return a specific subdomain
     return 'client1'
   }
   ```

## Available CSS Variables

The following CSS variables are dynamically set:
- `--primary-color`: Main brand color
- `--secondary-color`: Secondary accent color
- `--bgcolor`: Background color for company branding

These can be used anywhere in your CSS/SCSS:
```css
.my-element {
  background-color: var(--primary-color);
}
```

## Files Modified

- `src/utils/theme.js` - Theme configuration and logic
- `src/pages/_app.js` - Theme initialization
- `src/styles/sass/_variables.scss` - Updated to use CSS variables
- `src/styles/theme-variables.css` - CSS variable definitions
- `src/styles/globals.scss` - Import theme variables
