import { useContext, useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import { AiOutlineMenuUnfold, AiOutlineUser } from 'react-icons/ai'

import { Col, Row } from '../Layout'

import AppContext from '../../context/app'

import generateClasses from '../../utils/generateClasses'

import styles from './AdminLayout.module.scss'
import { NAVIGATIONS } from '../../config/navigations'
import { resetCookie } from '../../utils/cookie'
import { setLocalStorage, getLocalStorage } from '../../utils/local-storage'
import OccupancyModal from '../OccupancyModal'
import { get, objectToParams, postJSON, API_ENDPOINT, SETTLEMENT_URL, TICKET_ORDER_URL } from '../../api/utils'

const defaultProps = {
    showBreadCrumb : false,
    BreadCrumb : null,
    headerContent : null,
    hideLogo: false,
    triggerNotif: null
}

AdminLayout.defaultProps = defaultProps

export default function AdminLayout(props = defaultProps) {

    const router = useRouter()
    const appContext = useContext(AppContext)
    const APP_NAVIGATIONS = NAVIGATIONS || appContext.menu

    const [_breadCrumb, _setBreadCrumb] = useState([])
    const [_notifOccupancy, _setNotifOccupancy] = useState({})    
    const [_isOpenModalOccupancy, _setIsOpenModalOccupancy] = useState(false)

    useEffect(() => {
        const { asPath } = router
        const pathname = asPath

        let breadCrumbs = []

        APP_NAVIGATIONS.some(nav => {
            if (nav.href === pathname) {
                breadCrumbs.push({
                    title : nav.title,
                    href : nav.href
                })
                return true
            }
            if (nav.subMenus?.length > 0) {
                nav.subMenus.forEach(sub => {
                    if (sub.href === pathname) {
                        breadCrumbs.push(
                            {
                                title : nav.title,
                                href : nav.href
                            },
                            {
                                title : sub.title,
                                href : sub.href
                            }
                        )
                    }
                    if (sub.subMenus?.length > 0) {
                        sub.subMenus.forEach(subsub => {
                            if (subsub.href === pathname) {
                                breadCrumbs.push(
                                    {
                                        title : nav.title,
                                        href : nav.href
                                    },
                                    {
                                        title : sub.title,
                                        href : sub.href
                                    },
                                    {
                                        title : subsub.title,
                                        href : subsub.href
                                    }
                                )
                            }
                        })
                    }
                })
            }
            return false
        })
        _setBreadCrumb(breadCrumbs)
    }, [router.asPath]) 

    function _compareDate(d2){
        let dateNow = new Date();
        // Format dateNow as YYYY-MM-DD
        let year = dateNow.getFullYear();
        let month = String(dateNow.getMonth() + 1).padStart(2, '0');
        let day = String(dateNow.getDate()).padStart(2, '0');
        let formattedDateNow = `${year}-${month}-${day}`;

        let date1 = new Date(formattedDateNow).getTime();
        let date2 = new Date(d2).getTime();
        
        if(date2 >= date1){
            return true
        }else{
            return false
        }
    }

    const filterDuplicates = (arr, key) => {
        const values = new Set();
        return arr.filter((item) => {
          const value = item[key];
          if (values.has(value)) {
            return false;
          }
          values.add(value);
          return true;
        });
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Perform localStorage action

            let storage = getLocalStorage("notif_occupancy")
            
            if(storage != null){
                const item = JSON.parse(storage)

                let filtered = []
                item.forEach(function(val, key){
                    if(_compareDate(val.departure_date)){
                        filtered.push(val)        
                    }
                })
                
                _setNotifOccupancy(filterDuplicates(filtered, "id"))
            }
        }
    }, [])



    return (
        <>
            <OccupancyModal
            visible={_isOpenModalOccupancy}
            closeModal={() => _setIsOpenModalOccupancy(false)}
            data={_notifOccupancy}
            />

            <div
            className={!props.hideLogo && styles.top_bar}
            style={{
                backgroundColor : "#F4F4F6", //red
                visibility: props.hideLogo ? "hidden" : "",
                display: props.hideLogo ? "none" : ""
            }}
            >
                <div
                className={generateClasses([
                    styles.menu_button,
                    !appContext.sidebarOpen && styles.menu_visible
                ])}
                onClick={() => {
                    appContext.openSidebar(!appContext.sidebarOpen)
                }}
                >
                    <AiOutlineMenuUnfold/>
                </div>

                
                <div
                className={styles.profile_container}
                >
                    
                    <div
                    className={styles.header_content}
                    >
                        <div>
                            <strong>{appContext.authData?.name}</strong>
                            {
                                appContext.branch != null && (
                                    <small>Cabang {appContext.branch.branchName}</small>
                                )
                            }   

                            {
                                appContext.counter != null && (
                                    <small>{appContext.counter.counterName}</small>
                                )
                            }

                            {
                                appContext.member?.id != 1 && (
                                    <small>{appContext.member?.name}</small>
                                )
                            }
                        </div>

                        <div
                        className={styles.profile}
                        >
                        <AiOutlineUser/>
                    </div>
                    </div>
                    
                    <div
                    className={styles.profile_menus_container}
                    >
                        <div
                        className={styles.profile_menus}
                        >
                            <div
                            className={styles.profile_menu}
                            onClick={() => {
                                window.location.replace('/admin/master-data/profile')
                            }}
                            >
                                Profil
                            </div>

                            <div
                            className={styles.profile_menu}
                            onClick={() => {
                                resetCookie(document.cookie)
                                localStorage.removeItem('access_menu_damri')
                                window.location.replace('/sign-in')
                            }}
                            >
                                Sign-out
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
            className={styles.header}
            style={{
                backgroundColor : "#F4F4F6",
                paddingBottom: props.hideLogo ? "3rem" : "6rem"
            }}
            >
                <Row>
                    <Col
                    column={3}
                    >
                        <Row
                        className={styles.breadCrumb_row}
                        >
                            {props.BreadCrumb}
                            {
                                _breadCrumb.map((item, key) => {
                                    if (item) {
                                        return (
                                            <div
                                            key={key}
                                            className={styles.breadCrumb}
                                            >
                                                <h3>
                                                    {item.title}
                                                    { _breadCrumb[key + 1] ? <span className={styles.separator}>/</span> : ''} 
                                                </h3>
                                            </div>
                                        )
                                    }
                                })
                            }   
                        </Row>
                    </Col>
                </Row>
                {props.headerContent}
            </div>

            <div
            className={styles.content}
            >
                {props.children}
            </div>

            {
                _notifOccupancy.length > 0 && (
                    <button
                    className={styles.btn_occupancy}
                    onClick={() => {
                        _setIsOpenModalOccupancy(true)
                    }}
                    >
                        <img
                        src={"/assets/icons/chair.svg"}
                        width={"25"}
                        height={"auto"}
                        />
                    </button>
                )
            }
            
        </>
    )

}