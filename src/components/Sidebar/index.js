import { useState, useEffect, useContext } from 'react'

import Link from 'next/link'
import { AiOutlineMenuFold, AiOutlineCaretRight } from 'react-icons/ai'

import AppContext from '../../context/app'
import { ICONS, NAVIGATIONS, NAVIGATIONS_FINANCE, NAVIGATIONS_POOL, NAVIGATIONS_ADMIN_CABANG, TICKET_ORDER } from '../../config/navigations'

import generateClasses from '../../utils/generateClasses'
import cookieParser from '../../utils/cookie'
import styles from './Sidebar.module.scss'
import { uploadFile } from '../../api/utils'
import { stream } from 'xlsx'
import { getSessionStorage, setSessionStorage } from '../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../utils/local-storage'

const defaultProps = {
    router: {},
    context: {
        sidebarOpen: null,
        openSidebar: null
    }
}
Sidebar.defaultProps = defaultProps

export default function Sidebar(props = defaultProps) {

    const appContext = useContext(AppContext)
    let APP_NAVIGATIONS = NAVIGATIONS || appContext.menu
    const [_selectedMainMenu, _setSelectedMainMenu] = useState(0)
    const [_selectedSubMenu, _setSelectedSubMenu] = useState(0)
    const [_accessMenu, _setAccessMenu] = useState([])
    const [_logo, _setLogo] = useState("")
    const [_companyRange, _setCompanyRange] = useState([
        {
            id: "1",
            name: "DAMRI",
            logo: "/assets/logo/damri.png"
        },
        {
            id: "2",
            name: "BAGONG",
            logo: "/assets/logo/bagong.svg"
        },
        {
            id: "3",
            name: "LORENA",
            logo: "/assets/logo/lorena.png"
        },
        {
            id: "4",
            name: "AGRAMAS",
            logo: "/assets/logo/agramas.png"
        }
    ])
    const [_isDev, _setIsDev] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Perform localStorage action

            let storage = getLocalStorage("access_menu_damri")
            const subdomain = window.location.hostname.split('.')[0];
            const subSubDomain = window.location.hostname.split('.')[1];

            if (storage == null) {
                window.location.href = "/sign-in"
            } else {
                const item = JSON.parse(storage)
                _setAccessMenu(item)
            }

            // Prioritize company ID matching from _companyRange
            const companyMatch = _companyRange.find(company => company.id === appContext.authData?.companyId)

            if (companyMatch) {
                // Use logo from _companyRange if companyId matches
                _setLogo(companyMatch.logo)
            } else if (subdomain === "bisku" || window.location.hostname === 'localhost') {
                // Fall back to subdomain-based logic
                _setLogo("/assets/logo/bisku.png")
            } else if (subdomain == "bagong") {
                _setLogo("/assets/logo/bagong.svg")
            } else if (subdomain === "dev") {

                const companyMatchSubdomain = _companyRange.find(company => company.name.toLowerCase() === subSubDomain.toLowerCase())

                if (companyMatchSubdomain) {
                    _setLogo(companyMatchSubdomain.logo)
                }

                _setIsDev(true)
            } else {
                _setLogo(appContext.company?.logo)
            }


        }
    }, [])


    // if(validateRole() == "5"){
    //     APP_NAVIGATIONS = NAVIGATIONS_FINANCE || appContext.menu
    // }

    // if(validateRole() == "8"){
    //     APP_NAVIGATIONS = NAVIGATIONS_POOL || appContext.menu
    // }

    // if(validateRole() == "12"){
    //     APP_NAVIGATIONS = NAVIGATIONS_ADMIN_CABANG || appContext.menu
    // }


    if (validateRole() === '9') {
        if (!APP_NAVIGATIONS.find(i => i.href === '/admin/ticket-order')) {
            APP_NAVIGATIONS.push(TICKET_ORDER)
        }
    }
    useEffect(() => {
        if (props.context.sidebarOpen) {
            document.getElementById('overlay').classList.add('overlay-visible')
            document.getElementById('overlay').onclick = () => {
                props.context.openSidebar(false)
            }
        } else {
            document.getElementById('overlay').classList.remove('overlay-visible')
            document.getElementById('overlay').onclick = null
        }
    }, [props.context.sidebarOpen])

    function _selectMainMenu(key) {
        if (key === _selectedMainMenu) {
            _setSelectedMainMenu(null)
        } else {
            _setSelectedMainMenu(key)
        }
    }

    function _selectSubMenu(key) {
        if (key === _selectedSubMenu) {
            _setSelectedSubMenu(null)
        } else {
            _setSelectedSubMenu(key)
        }
    }

    function _isAdminUser(user) {
        let isAdmin = false

        if (validateRole() == "2" || validateRole() == "12") {
            isAdmin = true
        }

        return isAdmin
    }

    if (validateRole() != "2") {
        _findMenu(APP_NAVIGATIONS)
    }

    function _validateMenu(accessMenu, menu) {
        let viewRole = true
        accessMenu.forEach(function (val, key) {
            if (val.menu == menu && val.viewRole) {
                viewRole = false
            }
            // else if(menu == "Dashboard"){
            //     viewRole = false
            // }
        })

        return viewRole
    }

    function _findMenu(data) {
        let resultMenu = []
        let accesMenu = _accessMenu
        let navSidebar = []

        data.forEach(function (val, key) {
            let menu = ""
            let isMenuHide = true

            if (val.subMenus?.length > 0) {

                val.subMenus.forEach(function (a, b) {
                    let isMenu2Hide = true

                    if (a.subMenus?.length > 0) {

                        let isSubMenuHide = true

                        a.subMenus.forEach(function (c, d) {
                            menu = val.title + ">" + a.title + ">" + c.title
                            c.isHide = _validateMenu(accesMenu, menu)
                            if (!c.isHide) {
                                isSubMenuHide = false
                            }
                            resultMenu.push(val.title + ">" + a.title + ">" + c.title)
                        })

                        a.isHide = isSubMenuHide

                        // if(!a.isHide){
                        //     isMenu2Hide = false
                        // }

                    } else {
                        menu = val.title + ">" + a.title
                        a.isHide = _validateMenu(accesMenu, menu)

                        // if(!a.isHide){
                        //     isMenuHide = false
                        //     isMenu2Hide = false
                        // }

                        resultMenu.push(val.title + ">" + a.title)
                    }

                    if (!a.isHide) {
                        isMenu2Hide = false
                        isMenuHide = false
                    }

                    // if(!isMenu2Hide){
                    //     isMenuHide = false
                    // }

                })

            } else {
                menu = val.title
                val.isHide = _validateMenu(accesMenu, menu)

                if (!val.isHide) {
                    isMenuHide = false
                }

                resultMenu.push(val.title)
            }

            val.isHide = isMenuHide

            navSidebar.push(val)
        })

        APP_NAVIGATIONS = navSidebar
    }

    function validateRole() {
        //ROLE ACCESS
        // 1. USER
        // 2. ADMIN
        // 3. CREW
        // 4. OWNER 
        // 5. FINANCE 
        // 6. MARKETING 
        // 7. AUDITOR 
        // 8. CASHIER 
        // 9. COUNTER 
        // 10. OPERATION 
        // 11. PARTNER
        // 12. ADMIN CABANG
        // 13. ADMIN PUSAT
        return props.context.roleId
    }

    return (
        <nav
            className={generateClasses([
                styles.sidebar,
                props.context.sidebarOpen && styles.visble
            ])}
        >
            <div
                className={styles.header}
            >
                <div
                    className={styles.main_logo}
                >
                    <img
                        src={_logo}
                    />

                    {
                        _isDev && (
                            <h5>Development</h5>
                        )
                    }

                </div>
                <div
                    className={styles.menu_button}
                    onClick={() => {
                        props.context.openSidebar(!props.context.sidebarOpen)
                    }}
                >
                    <AiOutlineMenuFold />
                </div>
            </div>

            <div
                className={styles.main_menu_container}
            >
                {
                    APP_NAVIGATIONS.map((menu, key) => {
                        let active = false
                        if (menu.subMenus) {
                            active = props.router.pathname === menu.href || props.router.pathname.includes(menu.href + '/')
                        } else {
                            if (key > 0) {
                                if (props.router.pathname.length >= menu.href.length) {
                                    active = props.router.pathname === menu.href || props.router.pathname.includes(menu.href + '/')
                                }
                            } else {
                                active = props.router.pathname === menu.href
                            }
                        }

                        const Nav = menu.subMenus?.length > 0 ? 'div' : "a"
                        const Anchor = menu.subMenus?.length > 0 ? 'div' : 'div'
                        let isShowMasterData = false

                        if (!_isAdminUser(props.context.authData.username) && menu.title == "Master Data") {
                            isShowMasterData = true
                        }

                        return (
                            <div
                                key={key}
                                style={{
                                    // display: isShowMasterData ? "none" : 'block' 
                                    display: menu?.isHide ? 'none' : "block"
                                }}
                            >
                                <div
                                    className={generateClasses([
                                        styles.menu,
                                        active && styles.active
                                    ])}
                                >
                                    <Nav
                                        legacyBehavior
                                        href={Nav === 'div' ? null : menu.href}
                                        onClick={Nav === 'div' ? () => {
                                            _selectMainMenu(key)
                                        } : null}
                                    >
                                        <Anchor
                                            className={styles.main_menu}
                                        >
                                            <span
                                                className={styles.menu_icon}
                                            >
                                                {ICONS[menu.href]}
                                            </span>
                                            <h4>
                                                {menu.title}
                                            </h4>
                                            {
                                                (menu.subMenus?.length > 0) && (
                                                    <div
                                                        className={styles.submenu_status}
                                                    >
                                                        <AiOutlineCaretRight
                                                            className={generateClasses([
                                                                styles.submenu_non_active,
                                                                (active || key === _selectedMainMenu) && styles.submenu_active
                                                            ])}
                                                        />
                                                    </div>
                                                )
                                            }
                                        </Anchor>
                                    </Nav>
                                </div>
                                {
                                    menu.subMenus && (
                                        <div
                                            className={generateClasses([
                                                styles.submenu,
                                                (active || key === _selectedMainMenu) && styles.active
                                            ])}
                                        >
                                            <ul>
                                                {
                                                    (menu.subMenus.length > 0) && menu.subMenus.map((submenu, key2) => {
                                                        const submenuActive = props.router.pathname === submenu.href || props.router.asPath === submenu.href || props.router.pathname.includes(submenu.href + '/')

                                                        const SubNav = submenu.subMenus?.length > 0 ? 'div' : Link

                                                        return (
                                                            <div
                                                                style={{
                                                                    display: menu?.subMenus[key2]?.isHide ? 'none' : "block"
                                                                }}
                                                                key={key2}
                                                            >
                                                                <li
                                                                    className={generateClasses([
                                                                        submenuActive && styles.submenu_active
                                                                    ])}
                                                                >
                                                                    <SubNav
                                                                        legacyBehavior
                                                                        href={submenu.href}
                                                                        onClick={SubNav === 'div' ? () => {
                                                                            _selectSubMenu(key2)
                                                                        } : null}
                                                                    >
                                                                        <a
                                                                            className={styles.sub_submenus_menu}
                                                                        >
                                                                            <h4>
                                                                                {submenu.title}
                                                                            </h4>
                                                                            {
                                                                                submenu.subMenus?.length > 0 && (
                                                                                    <span
                                                                                        className={styles.submenu_status}
                                                                                    >
                                                                                        <AiOutlineCaretRight
                                                                                            className={generateClasses([
                                                                                                styles.submenu_non_active,
                                                                                                (submenuActive || (key === _selectedMainMenu && key2 === _selectedSubMenu)) && styles.submenu_active
                                                                                            ])}
                                                                                        />
                                                                                    </span>
                                                                                )
                                                                            }
                                                                        </a>
                                                                    </SubNav>
                                                                </li>
                                                                {
                                                                    submenu.subMenus && (
                                                                        <div
                                                                            className={generateClasses([
                                                                                styles.sub_submenus,
                                                                                (submenuActive || (key2 === _selectedSubMenu)) && styles.active
                                                                            ])}
                                                                        >
                                                                            <ul>
                                                                                {
                                                                                    (menu.subMenus.length > 0) && submenu.subMenus.map((subSubmenu, key3) => {
                                                                                        const subSubmenuActive = props.router.pathname === subSubmenu.href
                                                                                        return (
                                                                                            <li
                                                                                                style={{
                                                                                                    display: menu?.subMenus[key2]?.subMenus[key3]?.isHide ? 'none' : ""
                                                                                                }}
                                                                                                key={key3}
                                                                                                className={generateClasses([
                                                                                                    subSubmenuActive && styles.submenu_active
                                                                                                ])}
                                                                                            >
                                                                                                <Link
                                                                                                    legacyBehavior
                                                                                                    href={subSubmenu.href}
                                                                                                >
                                                                                                    <a>
                                                                                                        {subSubmenu.title}
                                                                                                    </a>
                                                                                                </Link>
                                                                                            </li>
                                                                                        )
                                                                                    })
                                                                                }
                                                                            </ul>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </ul>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    })
                }
            </div>
            <div
                className={styles.footer}
            >
                <div>
                    <small
                        style={{
                            fontSize: ".6rem"
                        }}
                    >
                        Powered by
                    </small>
                </div>
                <div>
                    <img
                        src={'/assets/logo/bisku-bw.png'}
                    />
                </div>
            </div>
        </nav>
    )

}