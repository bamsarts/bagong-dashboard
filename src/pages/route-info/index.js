import Main, {popAlert} from '../../components/Main'
import AdminLayout from '../../components/AdminLayout'
import { useEffect, useState, useContext } from 'react'
import { Col, Row } from '../../components/Layout'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { postJSON, get, BASE_URL, CMS_URL } from '../../api/utils'
// import styles from './DetailNews.module.scss'
import { useRouter } from 'next/router'
import Card from '../../components/Card'
import Label from '../../components/Label'
import { input } from '../../utils/filters'

export default function RouteInfo(props){

    const router = useRouter()
    const [_urlCsv, _setUrlCsv] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vQwNkxGfBj2PWX8fyn4gpte8iNebDz1LI2I7GlQnBdyOW6e39Thkzrb4DVv6GeNeQ/pub?gid=1935800650&single=true&output=csv")
    const [_routeInfo, _setRouteInfo] = useState([])
    const [_search, _setSearch] = useState("")
    const [_defaultRoute, _setDefaultRoute] = useState([])
    const [_activeStatus, _setActiveStatus] = useState("bandara")
    const [_mobileLink, _setMobileLink] = useState("")

    useEffect(() => {
        _getRouteInfo()

        if(router.query?.redirect){
            window.location.href = router.query?.redirect

            getMobileOperatingSystem()

        }



    }, [_activeStatus])

    useEffect(() => {

        if(_search != ""){
            let suggestion = [..._routeInfo].filter(item => {
                return item.rute &&  // Exclude items with null/undefined rute
                       item.rute.toLowerCase().includes(_search.toLowerCase())
            });

            _setRouteInfo(suggestion)

        }else{
            _setRouteInfo(_defaultRoute)
        }

    }, [_search])

    async function _getRouteInfo(){
        try{
            const result = await get({
                url: "/assets/files/"+_activeStatus+".json"
            })

            _setRouteInfo(result)
            _setDefaultRoute(result)
        } catch (e){

        } finally {

        }
    }

    function _checkRoute(data){
        if(input.isValidUrl(data)){
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
        }else{
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
                            marginBottom: "2rem"
                        }}
                        >
                            <Label
                            activeIndex={_activeStatus}
                            labels={[
                                {
                                    class: "primary",
                                    title: 'Bandara',
                                    value: "bandara",
                                    onClick : () => {
                                        _setActiveStatus("bandara")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Banjarmasin',
                                    value: "banjarmasin",
                                    onClick : () => {
                                        _setActiveStatus("banjarmasin")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Bandung',
                                    value: "bandung",
                                    onClick : (value) => {
                                        _setActiveStatus("bandung")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Jakarta',
                                    value: "jakarta",
                                    onClick : (value) => {
                                        _setActiveStatus("jakarta")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Lampung',
                                    value: "lampung",
                                    onClick : (value) => {
                                        _setActiveStatus("lampung")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Surabaya & Malang',
                                    value: "surabaya_malang",
                                    onClick : (value) => {
                                        _setActiveStatus("surabaya_malang")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Mataram',
                                    value: "mataram",
                                    onClick : (value) => {
                                        _setActiveStatus("mataram")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Makassar',
                                    value: "makassar",
                                    onClick : (value) => {
                                        _setActiveStatus("makassar")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Pontianak',
                                    value: "pontianak",
                                    onClick : (value) => {
                                        _setActiveStatus("pontianak")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Palembang',
                                    value: "palembang",
                                    onClick : (value) => {
                                        _setActiveStatus("palembang")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Purwokerto',
                                    value: "purwokerto",
                                    onClick : (value) => {
                                        _setActiveStatus("purwokerto")
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Yogyakarta',
                                    value: "yogyakarta",
                                    onClick : (value) => {
                                        _setActiveStatus("yogyakarta")
                                    }
                                },
                            ]}
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
                            _routeInfo.map(function(val, key){

                                if(val.rute != "" && val.rute != null){
                                    return (
                                        <Card>
                                            <div
                                            style={{
                                                display: "grid"
                                            }}
                                            >
                                                <strong
                                                style={{
                                                    marginBottom: ".5rem"
                                                }}
                                                >
                                                    {val.rute}
                                                </strong>

                                                {
                                                    val.titik_keberangkatan && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Titik Keberangkatan :
                                                            </small>
                
                                                            <small
                                                            style={{
                                                                marginBottom: ".5rem"
                                                            }}
                                                            >
                                                                {val.titik_keberangkatan}
                                                            </small>
                                                        </>
                                                    )
                                                }

                                                {
                                                    val.rute_yang_dilewati && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Rute yang dilewati :
                                                            </small>
                                                            
                                                            <small
                                                            style={{
                                                                whiteSpace: "pre-line",
                                                                marginBottom: ".5rem"
                                                            }}
                                                            >
                                                                {_checkRoute(val.rute_yang_dilewati)}
                                                            </small>
                                                        </>
                                                    )
                                                }

                                                
                                                

                                                {
                                                    (val.menuju_bandara || val.jam) && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Waktu Berangkat :
                                                            </small>
                
                                                            <small
                                                            style={{
                                                                marginBottom: ".5rem"
                                                            }}
                                                            >
                                                                {val.menuju_bandara || val.jam}
                                                            </small>
                                                        </>
                                                    )
                                                }
                                                
                                                
                                                {
                                                    val.dari_bandara && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Waktu Pulang :
                                                            </small>
                
                                                            <small
                                                            style={{
                                                                marginBottom: ".5rem"
                                                            }}
                                                            >
                                                                {val.dari_bandara}
                                                            </small>
                                                        </>
                                                    )
                                                }
                                                
                                                
                                                {
                                                    val?.interval_waktu && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Interval :
                                                            </small>

                                                            <small
                                                            style={{
                                                                marginBottom: ".5rem"
                                                            }}
                                                            >
                                                                { val.interval_waktu.includes("KM") ? val.interval_waktu : val.interval_waktu + " Menit"}

                                                            </small>
                                                        </>
                                                    )
                                                }

                                               

                                                {
                                                   (val.executive || val.royal || val.bisnis) && (
                                                        <>
                                                            <small
                                                            style={{
                                                                fontWeight: "bold",
                                                                marginBottom: ".2rem"
                                                            }}
                                                            >
                                                                Tarif :
                                                            </small>
                
                                                            <small>{val.tarif_baru}</small>

                                                            <ul
                                                            style={{
                                                                fontSize: ".7rem"
                                                            }}
                                                            >
                                                                {
                                                                    val.ekonomi && (
                                                                        <li>Ekonomi : {val.ekonomi}</li>
                                                                    )
                                                                }

                                                                {
                                                                    val.bisnis && (
                                                                        <li>Bisnis : {val.bisnis}</li>
                                                                    )
                                                                }

                                                                {
                                                                    val.executive && (
                                                                        <li>Eksekutif : {val.executive}</li>
                                                                    )
                                                                }

                                                                {
                                                                    val.royal && (
                                                                        <li>Royal : {val.royal}</li>
                                                                    )
                                                                }

                                                                {
                                                                    val.royal_imperial && (
                                                                        <li>Royal Imperial : {val.royal_imperial}</li>
                                                                    )
                                                                }

                                                                {
                                                                    val.sleeper && (
                                                                        <li>Sleeper : {val.sleeper}</li>
                                                                    )
                                                                }
                                                            </ul>

                                                        </>
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