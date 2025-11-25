import { useEffect, useState } from 'react'

import App from 'next/app'
import { useRouter } from 'next/router'

import { get } from '../api/utils'
import AppContext from '../context/app'

import cookieParser from '../utils/cookie'
import { checkIsMobile } from '../utils/user-agent'
import { initializeTheme, getSubdomain, getThemeBySubdomain } from '../utils/theme'

import '../styles/globals.scss'

function MyApp({ Component, pageProps, clientData }) {

    const router = useRouter()

    const [_isSidebarOpen, _setIsSidebarOpen] = useState(clientData.isMobile ? false : true)

    // Initialize theme based on subdomain
    useEffect(() => {
        initializeTheme()
    }, [])

    useEffect(() => {
        if (clientData.isMobile) {
            setTimeout(() => {
                _setIsSidebarOpen(false)
            }, 200)
        }

    }, [router.pathname])

    function _openSidebar(isOpen) {
        _setIsSidebarOpen(isOpen)
    }

    return (
        <AppContext.Provider
            value={{
                sidebarOpen: _isSidebarOpen,
                openSidebar: _openSidebar,
                company: clientData.company,
                menu: clientData.menu,
                authData: clientData.authData,
                roleId: clientData.role_id,
                accessMenu: clientData.access_menu,
                counter: clientData.counter,
                branch: clientData.branch,
                member: clientData.member
            }}
        >
            <Component {...pageProps} {...clientData} />
            <div
                id={'overlay'}
            >
            </div>
        </AppContext.Provider>
    )
}

MyApp.getInitialProps = async (appContext) => {
    const { ctx, router } = appContext
    const appProps = await App.getInitialProps(appContext);

    const isServer = typeof window === 'undefined'

    const cookies = cookieParser(isServer ? ctx.req.headers['cookie'] : window.document.cookie)
    const isMobile = checkIsMobile(isServer ? ctx.req.headers['user-agent'] : window.navigator.userAgent)
    let clientData = {}

    async function auth(token) {
        if (!token) {
            throw new Error('unauthorized')
        }

        const profile = JSON.parse(cookies['profile_damri'])
        // const company = JSON.parse(cookies['company_damri'])
        const counter = JSON.parse(cookies['counter'])
        const branch = JSON.parse(cookies['branch'])
        const member = JSON.parse(cookies['member_damri'])

        // Get theme based on subdomain
        const subdomain = getSubdomain(isServer ? ctx.req.headers.host : window.location.hostname)
        const theme = getThemeBySubdomain(subdomain)

        return {
            menu: [],
            company: {
                bgcolor: theme.bgcolor,
                logo: '/assets/logo/damri.png',
                // ...company
            },
            authData: {
                token,
                ...profile
            },
            role_id: cookies['role_damri_dashboard'],
            access_menu: [],
            isMobile,
            counter: counter,
            branch: branch,
            member: member,
            theme: theme
        }
    }

    function redirect(page = '/sign-in') {
        if (isServer) {
            ctx.res.writeHead(302, {
                Location: page,
            })
            ctx.res.end()
        } else {
            window.location.href = page
        }
    }

    if (router.pathname.includes('/admin')) {
        try {
            clientData = await auth(cookies['token'])
        } catch (e) {
            redirect()
        }
    }

    return {
        ...appProps,
        clientData
    }
}

export default MyApp