import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import { Col, Row } from '../../../../../../components/Layout'
import DepositModal from '../../../../../../components/DepositModal'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import Link from 'next/link'
import { dateFilter, currency } from '../../../../../../utils/filters'
import { FaRoute, FaUsers } from 'react-icons/fa'
import styles from './Sales.module.scss'
import generateClasses from '../../../../../../utils/generateClasses'
import { useRouter } from 'next/router'
import { getSessionStorage, setSessionStorage } from '../../../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../../../utils/local-storage'

export default function ReportAkapSales(props) {

    const router = useRouter()

    const [_seri, _setSeri] = useState("DMR "+router.query.date.replace("-",""))
    const [_traject, _setTraject] = useState([])
    const [_date, _setDate] = useState(dateFilter.getFullDate(new Date(router.query.date)))
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState([])
    const [_pnp, _setPnp] = useState({
        data: [],
        busName: ""
    })
    const [_source, _setSource] = useState({
        data: [],
        cash: 0,
        nonCash: 0,
        pnpCash: 0,
        pnpNonCash: 0
    })

    const [_isDefaultTable, _setIsDefaultTable] = useState(true)

    const [_pnpSima, _setPnpSima] = useState({
        "headers": [],
        "tickets": [],
        "totalPnp": 0
    })

    useEffect(() => {
        
        _setLocalData()
        
    }, [])

    function _setLocalData(){
        let sales = getLocalStorage("penjualan_damri")
        let passenger = []
        
        if(sales != null){
            sales = JSON.parse(sales)
        }

        sales.forEach(function(val, key){
            if(val.aksi == "1"){
                passenger.push(val)
            }
        })

        _setTraject(passenger[0].traject.split("-"))
        
        _getScrapingSima(passenger)
        
    }

    useEffect(() => {
        console.log(_pnpSima)
    }, [_pnpSima.headers])

    async function _getScrapingSima(passenger){

        let params = {
            "tanggal": router.query.date,
            "cabang": router.query.cabang,
            "trayek": router.query.trayek,
            "bus": router.query.bus
        }

        try {
            const res = await postJSON(`/simaDamri/cetakan/penjualan/list`, params, props.authData.token)
            
            if(res) {

                if(res.data.headers.length != 9){
                    _setIsDefaultTable(false)
                }
                
                let totalPnp = 0
                let tickets = res.data.tickets.splice(0,res.data.tickets.length - 1)

                tickets.forEach(function(val, key){
                    if(val[res.data.headers[1]] != ""){
                        totalPnp += 1
                    }

                    if(val['Date Of Birth'] == "1901-01-01"){
                        val['Date Of Birth'] = ""
                    }
                })


                _setPnpSima({
                    "headers": res.data.headers,
                    "tickets": tickets,
                    "totalPnp": totalPnp
                })
            }

        } catch (e) {
            console.log(e)
            _setPnp({
                data: passenger
            })
        }
    }
    
    return (
        <>
            <link rel="shortcut icon" href="/assets/logo/favicon.png" type="image/x-icon"></link>
            <title>{"Data-Penjualan-"+_seri}</title>
            
            <Row
            style={{
                margin: "1%"
            }}
            >
                <Col
                column={1}
                >
                    {/* <Link
                    href={router.asPath.replace("sales","passenger")}
                    >
                        <div
                        className={styles.button}
                        >  
                            <span>Kembali</span>
                        </div>
                    </Link> */}
                </Col>

                <Col
                column={5}
                alignEnd
                >
                    <Button
                    title={'Cetak'}
                    styles={Button.primary}
                    onClick={() => {
                        window.print()
                    }}
                    />  
                </Col>
            </Row>

            <div
            style={{"margin": "1%","position": "relative"}}
            >                
                <h3
                style={{
                    "text-align": "center",
                    "margin": "0"
                }}
                >
                    PERUSAHAAN UMUM DAMRI
                </h3>
                <h4 style={{textAlign: 'center', margin: 0}}>(PERUM DAMRI)</h4>
                <h2 style={{textAlign: 'center', textDecoration: 'underline', marginTop: 10}}>Data Penjualan</h2>
                
                <div
                style={{
                    "display": "inline-block",
                    "margin-top": "-80px",
                    "width": "80%",
                    "font-size": "12px"
                }}
                >
                    <p style={{'margin': '0'}}>Nama Driver 1: </p>
                    <p style={{'margin': '0'}}>No. Passport : ................................. </p>
                    <p style={{'margin': '0'}}>Nama Driver 2: :  </p>
                    <p style={{'margin': '0'}}>No. Passport : ................................. </p>
                </div>

                <div 
                style={{
                    "display": "inline-block",
                    "margin-top": "-50px",
                    "float": "right",
                    "font-size": "30px",
                    "color": "silver",
                    "font-family": "Georgia"
                }}
                float='right'>
	                <span>Bis </span><span>{router.query.bus}</span>
	            </div>

                <table style={{width: '100%', marginTop: 20, fontSize: 12, borderCollapse: 'collapse'}} width="100%" border={0}>
                    <tbody>
                        <tr>
                            <td style={{width: "10%"}}>Loket</td>
                            <td style={{width: "4%"}}>:</td>
                            <td style={{width: "26%"}}>{_traject[0]}</td>
                            <td style={{width: "10%"}}>Bus Code</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "5%"}}> </td>
                            <td style={{width: "10%"}}>Dari</td>
                            <td style={{width: "4%"}}>:</td>
                            <td style={{width: "26%"}}>{_traject[0]}</td>
                        </tr>
                        <tr>
                            <td style={{width: "10%"}}>Tanggal</td>
                            <td style={{width: "4%"}}>:</td>
                            <td style={{width: "26%"}}>{_date}</td>
                            <td style={{width: "10%"}}>Formasi</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "5%"}}> </td>
                            <td style={{width: "10%"}}>Ke</td>
                            <td style={{width: "4%"}}>:</td>
                            <td style={{width: "26%"}}>{_traject[1]}</td>
                        </tr>
                    </tbody>
                </table>

                <table 
                style={{
                    "margin-top": "10px",
                    "margin-bottom": "10px",
                    "width": "100%",
                    "border-collapse": "collapse",
                    "font-size": "12px"
                }}
                border='1'
                cellpadding='3'
                >
                    <tbody>
                        
                        {
                            _isDefaultTable && (
                                <>
                                    <tr style={{'background':'#ccc'}}>
                                        <th rowspan='2'>No.</th>
                                        <th rowspan='2'>Nama Penumpang</th>
                                        <th rowspan='2'>Handphone</th>
                                        <th rowspan='2'>Tempat Duduk</th>
                                        <th rowspan='2'>Harga</th>
                                        <th rowspan='2'>Alamat</th>
                                        <th rowspan='2'>Keterangan</th>
                                        <th colspan='2'>Tujuan</th>
                                    </tr>
                                    <tr style={{'background':'#ccc'}}>
                                        <th>Dari</th>
                                        <th>Ke</th>
                                    </tr>
                                    <tr style={{'background':'#ccc'}}>
                                        <th>1</th>
                                        <th>2</th>
                                        <th>3</th>
                                        <th>4</th>
                                        <th>5</th>
                                        <th>6</th>
                                        <th>7</th>
                                        <th>8</th>
                                        <th>9</th>
                                    </tr>
                                </>
                            )
                        }

                        {
                            !_isDefaultTable && (
                                <tr style={{'background':'#ccc'}}>
                                    {
                                        _pnpSima.headers.map(function(val, key){
                                            return <th>{val}</th>
                                        })
                                    }
                                </tr>
                            )
                        }

                        {
                            _pnpSima.tickets.map(function(val, key){

                                return (
                                    <tr
                                    key={key}
                                    >
                                        {
                                            _pnpSima.headers.map(function(i, j){
                                                return <td>{val[i]}</td>
                                            })
                                        }
                                    </tr>
                                )
                               
                            })
                        }
                        
                        {
                            _pnpSima.tickets.length > 0 && (
                                <tr>
                                    <td align='center'>A.</td>
                                    <td colspan={_pnpSima.headers.length - 2}>Pendapatan Angkutan ...</td>
                                    <td align='center'><b>{_pnpSima.totalPnp+" Pnp"}</b></td>
                                </tr>
                            )
                        }

                        {
                            _pnp.data.map(function(val, key){
                                return (
                                    <tr>
                                        <td>{key+1}</td>
                                        <td>{val.name}</td>
                                        <td>{val.phoneNumber}</td>
                                        <td>{val.seatNumber}</td>
                                        <td>{currency(val.baseFare)}</td>
                                        <td>Indonesia</td>
                                        <td>{val.keterangan}</td>
                                        <td>{val.traject.split("-")[0]}</td>
                                        <td>{val.traject.split("-")[1]}</td>
                                    </tr>
                                )
                            })
                        }
                        
                        {
                            _pnp.data.length > 0 && (
                                <tr>
                                    <td align='center'>A.</td>
                                    <td colspan={2}>Pendapatan Angkutan ...</td>
                                    <td align='center'><b>{_pnp.data.length+" Pnp"}</b></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            )
                        }

                       
                        
                    </tbody>
                </table>

                <br/>
               
                <table style={{fontSize: 11, width: '100%', borderCollapse: 'collapse'}}>
                    <tbody>
                        <tr>
                            <td width="45%">&nbsp;</td>
                            <td width="10%">&nbsp;</td>
                            <td width="45%" align="center">{_traject[0]}, {_date}</td>
                        </tr>
                        <tr>
                            <td align="center">Mengetahui,</td>
                            <td />
                            <td align="center">Petugas <i>Checker</i></td>
                        </tr>
                        <tr>
                            <td colSpan={3}><br />&nbsp;<br />&nbsp;<br />&nbsp;</td>
                        </tr>
                        <tr>
                            <td align="center">(.................................)</td>
                            <td />
                            <td align="center">(.................................)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )

}