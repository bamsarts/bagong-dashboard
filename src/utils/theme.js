// Theme configuration based on subdomain
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
    // Add more subdomains here
    // example: {
    //   primary: '#ff6b6b',
    //   secondary: '#4ecdc4',
    //   bgcolor: '#2c3e50'
    // }
}

/**
 * Extract subdomain from hostname
 * @param {string} hostname - The full hostname (e.g., 'subdomain.example.com')
 * @returns {string} - The subdomain or 'default'
 */
export function getSubdomain(hostname) {
    if (!hostname) return 'default'

    const parts = hostname.split('.')

    // localhost or IP address
    if (parts.length <= 2 || hostname.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
        return 'default'
    }

    return parts[0]
}

/**
 * Get theme colors based on subdomain
 * @param {string} subdomain - The subdomain name
 * @returns {object} - Theme colors object
 */
export function getThemeBySubdomain(subdomain) {
    return SUBDOMAIN_THEMES[subdomain] || SUBDOMAIN_THEMES.default
}

/**
 * Apply theme colors to CSS variables
 * @param {object} theme - Theme colors object
 */
export function applyTheme(theme) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--primary-color', theme.primary)
    root.style.setProperty('--secondary-color', theme.secondary)
    root.style.setProperty('--bgcolor', theme.bgcolor)
}

/**
 * Initialize theme based on current hostname
 */
export function initializeTheme() {
    if (typeof window === 'undefined') return null

    const subdomain = getSubdomain(window.location.hostname)
    const theme = getThemeBySubdomain(subdomain)
    applyTheme(theme)

    return { subdomain, theme }
}

export default SUBDOMAIN_THEMES
