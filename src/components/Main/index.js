import { useContext, useState, useEffect, useRef } from 'react'

import Head from 'next/head'
import { useRouter } from 'next/router'

import AppContext from '../../context/app'

import Sidebar from '../Sidebar'
import Alert from '../Alert'

import generateClasses from '../../utils/generateClasses'

import styles from './Main.module.scss'

const alertDefaultProps = {
    message: '',
    type: 'error',
    duration: 2500
}

const defaultProps = {
    headContent: null
}

Main.defaultProps = defaultProps

export default function Main(props = defaultProps) {

    const router = useRouter()

    const appContext = useContext(AppContext)

    const [_alertVisible, _setAlertVisible] = useState(false)
    const [_alertProps, _setAlertProps] = useState(alertDefaultProps)

    const __alertTimeout = useRef(null)
    const [_time, _setTime] = useState("")
    const [_company, _setCompany] = useState({
        "favicon": "",
        "name": ""
    })

    const [_companyRange, _setCompanyRange] = useState([
        {
            id: "1",
            name: "DAMRI",
            logo: "/assets/logo/damri.png",
            favicon: "/assets/logo/favicon-damri.png"
        },
        {
            id: "2",
            name: "BAGONG",
            logo: "/assets/logo/bagong.svg",
            favicon: "/assets/logo/favicon-bagong.PNG"
        },
        {
            id: "3",
            name: "LORENA",
            logo: "/assets/logo/lorena.png",
            favicon: "/assets/logo/favicon-lorena.png"
        },
        {
            id: "4",
            name: "AGRAMAS",
            logo: "/assets/logo/agramas.png",
            favicon: "/assets/logo/favicon-agramas.png"
        }
    ])

    useEffect(() => {

        if (typeof window !== "undefined") {
            const subdomain = window.location.hostname.split('.')[0];
            let subSubDomain = window.location.hostname.split('.')[1];
            let companyMatchSubdomain = null


            // Prioritize company ID matching from _companyRange
            const companyMatch = _companyRange.find(company => company.id === appContext.authData?.companyId)

            if (subSubDomain) {
                companyMatchSubdomain = _companyRange.find(company => company.name.toLowerCase() === subSubDomain.toLowerCase())
            }

            if (companyMatch) {
                // Use logo from _companyRange if companyId matches

                _setCompany({
                    "favicon": companyMatch.favicon,
                    "name": companyMatch.name + " Dashboard"
                })
            } else if (companyMatchSubdomain) {
                _setCompany({
                    "favicon": companyMatchSubdomain.favicon,
                    "name": companyMatchSubdomain.name + " Dashboard"
                })
            } else if (subdomain === "bisku" || window.location.hostname === 'localhost') {
                // Fall back to subdomain-based logic
                _setCompany({
                    "favicon": "/assets/logo/favicon-bisku.jpg",
                    "name": "Bisku Dashboard"
                })
            } else if (subdomain === "dev") {

                const companyMatchSubdomain = _companyRange.find(company => company.name.toLowerCase() === subSubDomain.toLowerCase())

                if (companyMatchSubdomain) {
                    _setCompany({
                        "favicon": companyMatchSubdomain.favicon,
                        "name": companyMatchSubdomain.name + " Dashboard"
                    })
                }

                _setIsDev(true)
            }


        }



        function popAlertEventHandler(e) {
            clearTimeout(__alertTimeout.current)
            _setAlertProps({
                ...alertDefaultProps,
                ...e.detail
            })
            _setAlertVisible(true)
            __alertTimeout.current = setTimeout(() => {
                _setAlertVisible(false)
            }, e.detail.duration || alertDefaultProps.duration)
        }

        document.body.addEventListener('popAlert', popAlertEventHandler, false)

        if (_time == "") {
            _setTime(new Date().getTime())
        }

        return (() => {
            document.body.removeEventListener('popAlert', popAlertEventHandler, false)
        })



    }, [])

    function _closeAlert() {
        _setAlertVisible(false)
        clearTimeout(__alertTimeout.current)
    }

    function _isAdminPage() {
        return router.pathname.includes('/admin')
    }

    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width, maximum-scale=1, user-scalable=yes" />
                <meta name="description" content="Bisku" />
                <link rel="shortcut icon" href={_company.favicon} type="image/x-icon"></link>
                <title>{_company.name}</title>
                {props.headContent}
            </Head>

            <div
                className={generateClasses([
                    styles.alert_container,
                    !_alertVisible && styles.hide_alert
                ])}
            >
                <Alert
                    show={_alertVisible}
                    slideTo={'bottom'}
                    {..._alertProps}
                    onClick={_closeAlert}
                />
            </div>

            {
                _isAdminPage() && (
                    <Sidebar
                        router={router}
                        context={appContext}
                        key={_time}
                    />
                )
            }

            <main
                className={generateClasses([
                    styles.main,
                    _isAdminPage() && styles.admin_page,
                    (_isAdminPage() && appContext.sidebarOpen) && styles.sidebar_open
                ])}
            >
                {props.children}
            </main>

        </>
    )

}

export function popAlert(detail = alertDefaultProps) {
    const popAlertEvent = new CustomEvent('popAlert', { detail })
    document.body.dispatchEvent(popAlertEvent)
}