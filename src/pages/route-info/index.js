import Main, { popAlert } from '../../components/Main'
import AdminLayout from '../../components/AdminLayout'
import { useEffect, useState, useContext } from 'react'
import { Col, Row } from '../../components/Layout'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { postJSON, get, BASE_URL, CMS_URL, BUCKET } from '../../api/utils'
// import styles from './DetailNews.module.scss'
import { useRouter } from 'next/router'
import Card from '../../components/Card'
import Label from '../../components/Label'
import { input } from '../../utils/filters'

export default function RouteInfo(props) {

    const router = useRouter()
    const [_routeInfo, _setRouteInfo] = useState([])
    const [_search, _setSearch] = useState("")
    const [_defaultRoute, _setDefaultRoute] = useState([])
    const [_allRouteData, _setAllRouteData] = useState([])
    const [_trayekList, _setTrayekList] = useState([])
    const [_activeStatus, _setActiveStatus] = useState(null)
    const [_mobileLink, _setMobileLink] = useState("")

    useEffect(() => {
        _getRouteInfo()

        if (router.query?.redirect) {
            window.location.href = router.query?.redirect
            getMobileOperatingSystem()
        }
    }, [])

    useEffect(() => {
        if (_activeStatus && _allRouteData.length > 0) {
            const filteredData = _allRouteData.filter(item => item.Trayek === _activeStatus)
            _setRouteInfo(filteredData)
            _setDefaultRoute(filteredData)
        }
    }, [_activeStatus, _allRouteData])

    useEffect(() => {

        if (_search != "") {
            let suggestion = [..._defaultRoute].filter(item => {
                return (item.Trayek && item.Trayek.toLowerCase().includes(_search.toLowerCase())) ||
                    (item.Asal && item.Asal.toLowerCase().includes(_search.toLowerCase())) ||
                    (item.Tujuan && item.Tujuan.toLowerCase().includes(_search.toLowerCase()))
            });

            _setRouteInfo(suggestion)

        } else {
            _setRouteInfo(_defaultRoute)
        }

    }, [_search])

    async function _getRouteInfo() {
        try {
            const response = await fetch(BUCKET + "/AKDP_Bagong_Rute.json")
            const result = await response.json()

            _setAllRouteData(result)

            // Extract unique Trayek values
            const uniqueTrayek = [...new Set(result.map(item => item.Trayek).filter(Boolean))]
            _setTrayekList(uniqueTrayek)

            // Set first Trayek as default active status
            if (uniqueTrayek.length > 0 && !_activeStatus) {
                _setActiveStatus(uniqueTrayek[0])
            }
        } catch (e) {
            console.error('Error fetching route info:', e)
        }
    }

    function _checkRoute(data) {
        if (input.isValidUrl(data)) {
            return (
                <a
                    style={{
                        color: "blue"
                    }}
                    target="_blank"
                    href={data}>
                    {data}
                </a>
            )
        } else {
            return data
        }
    }

    function getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Windows Phone must come first because its UA also contains "Android"
        if (/windows phone/i.test(userAgent)) {
            return "Windows Phone";
        }

        if (/android/i.test(userAgent)) {
            _setMobileLink("https://play.google.com/store/apps/details?id=com.simadamri.damriapps")
            return "Android";
        }

        // iOS detection from: http://stackoverflow.com/a/9039885/177710
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            _setMobileLink("https://apps.apple.com/app/damri-apps/id6443452294")
            return "iOS";
        }

        return "";
    }

    return (
        <Main>

            <AdminLayout
                hideLogo={true}
            >

                {
                    _mobileLink && (

                        <Card
                            invertedColor
                            style={{
                                position: "fixed",
                                bottom: 0,
                                width: "100%"
                            }}
                        >
                            <Row
                                center
                            >
                                <Col
                                    column={2}
                                    style={{
                                        display: "grid"
                                    }}
                                >
                                    <img
                                        src={"/assets/logo/logo_damri.svg"}
                                        width={"auto"}
                                        height={18}
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                    />

                                    <small>Beli tiket lebih mudah</small>
                                </Col>

                                <Col
                                    column={2}
                                    alignEnd
                                    justifyCenter
                                >
                                    <a
                                        href={_mobileLink}
                                    >
                                        Download
                                    </a>
                                </Col>

                            </Row>
                        </Card>
                    )
                }

                <Row
                    center
                >
                    <Col
                        column={4}
                        mobileFullWidth
                        style={{
                            padding: "1rem"
                        }}
                    >
                        <div
                            style={{
                                marginBottom: "2rem",
                            }}
                        >
                            <Label
                                activeIndex={_activeStatus}
                                labels={_trayekList.map(trayek => ({
                                    class: "primary",
                                    title: trayek,
                                    value: trayek,
                                    onClick: () => {
                                        _setActiveStatus(trayek)
                                    }
                                }))}
                            />
                        </div>

                        <Input
                            alphaOnly
                            placeholder={"Cari"}
                            value={_search}
                            capitalize={'words'}
                            onChange={value => _setSearch(value)}
                            marginBottom
                        />


                        <div
                            style={{
                                margin: "1rem 0rem",
                                fontSize: ".8rem"
                            }}
                        >
                            <small>*Informasi rute dan tarif di bawah ini bisa berubah setiap saat</small>
                        </div>

                        {
                            _routeInfo.map(function (val, key) {

                                if (val.Trayek != "" && val.Trayek != null) {
                                    return (
                                        <Card key={key}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}
                                            >

                                                {
                                                    val.Asal && (
                                                        <small>
                                                            {val.Asal}
                                                        </small>
                                                    )
                                                }

                                                {
                                                    val.Tujuan && (
                                                        <small>
                                                            {val.Tujuan}
                                                        </small>
                                                    )
                                                }

                                                {
                                                    val.Tarif && (
                                                        <small
                                                            style={{
                                                                fontWeight: "bold"
                                                            }}
                                                        >
                                                            Rp{val.Tarif}
                                                        </small>
                                                    )
                                                }

                                            </div>
                                        </Card>
                                    )
                                }

                            })
                        }



                    </Col>

                </Row>

            </AdminLayout>
        </Main>
    )

}