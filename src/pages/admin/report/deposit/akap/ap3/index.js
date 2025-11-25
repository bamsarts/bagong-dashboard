import { useEffect, useState } from 'react'

import { postJSON, get } from '../../../../../../api/utils'

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
import styles from './Ap.module.scss'
import generateClasses from '../../../../../../utils/generateClasses'
import { useRouter } from 'next/router'
import { getLocalStorage, setLocalStorage } from '../../../../../../utils/local-storage'

export default function ReportAp(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title : 'No.',
            customCell : (value, record, key) => {
                return key + 1
            }
        },
        {
            title : 'Produk (Bus)',
            field : 'busName'
        },
        {
            title : 'Trayek',
            field : 'trajectName',
            textAlign: 'left'
        },
        {
            title : 'Total Penumpang',
            field : 'pnpCash',
            customCell : (value, record, key) => {
                return value + record.pnpDeposit + record.pnpEmoney + record.pnpQris + record.pnpDebit + record.pnpKredit;
            }
        },
        {
            title : 'Total Nominal (Rp)',
            field : 'totalAmount',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        {
            field : 'busId',
            customCell : (value, row) => {
                return (
                    <Row>
                        <Link
                        href={window.location.href+"/track?detail="+value+"&date="+row.departureDate}
                        >
                            <div
                            title={"Lihat Rute"}
                            className={styles.button_action}
                            >
                                <FaRoute/>
                            </div>
                        </Link>
                        
                        <Link
                        href={window.location.href+"/passenger?detail="+value+"&date="+row.departureDate+"&traject="+row.trajectId}
                        >
                            <div
                            title={"Lihat Penumpang"}
                            className={generateClasses([
                                styles.button_action,
                                styles.text_red
                            ])}
                            >
                                <FaUsers/>
                            </div>
                        </Link>
                        
                    </Row>
                )
            }
        }
    ]

    const [_seri, _setSeri] = useState("DMR "+router.query.date.replace("-",""))
    const [_traject, _setTraject] = useState([])
    const [_date, _setDate] = useState(dateFilter.getFullDate(new Date(router.query.date)))
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState([])
    const [_pnp, _setPnp] = useState({
        total: 0,
        amount: 0,
        busName: ""
    })
    const [_source, _setSource] = useState({
        data: [],
        cash: 0,
        nonCash: 0,
        pnpCash: 0,
        pnpNonCash: 0
    })
    

    useEffect(() => {
        // _getDeposits()
        _getManifest()
    }, [])


    function removeBracketsContent(data) {
        return data.replace(/\[.*?\]/g, '').trim();
    }

    async function _getManifest(){
        let storage = getLocalStorage("penjualan_damri")

        if(storage == null){
            window.location.href = "/admin/report/deposit/akap/"
        }else{
            const item = JSON.parse(storage)
            console.log(item)
            let source = []
            let totalPnp = 0
            let amount = 0
            let cash = 0
            let nonCash = 0
            let pnpCash = 0
            let pnpNonCash = 0
            let busName = ""

            let lookup = {};
            let lookupTraject = {}
            let result = [];
            let resultTraject = []

            for (let value, i = 0; value = item[i++];) {
                let name = value.email;
                let traject = value.traject

                if (!(name in lookup)) {
                    lookup[name] = 1;
                    result.push({
                        "totalPnp": 0,
                        "name": name,
                        "totalAmount": 0,
                        "totalKomisi": 0,
                        "cash": 0,
                        "nonCash": 0
                    });
                }

                if(!(traject in lookupTraject)){
                    lookupTraject[traject] = 1
                
                    resultTraject.push({
                        "traject": value.traject,
                        "totalPnp": 0,
                        "baseFare": parseInt(value.baseFare.replace(".00","")),
                        "totalAmount": 0
                    })
                }

            }
                         
            item.forEach(function(val, key){

                let traject = removeBracketsContent(val.traject)

                result.forEach(function(i, j){
                    if(i.name == val.email && val.aksi == "1"){
                        i.totalPnp += 1
                        i.cash += parseInt(val.baseFare.replace(".00",""))

                        cash += parseInt(val.baseFare.replace(".00",""))
                        pnpNonCash += 
                        
                        totalPnp += 1
                        amount += parseInt(val.baseFare.replace(".00",""))

                        busName = val.bus

                        i.totalAmount += parseInt(val.baseFare.replace(".00",""))

                        _setTraject(val.selectedTraject.split("-"))
                    }
                })

                resultTraject.forEach(function(i, j){

                  
                    if(i.traject == traject && val.aksi == "1"){
                        i.totalPnp += 1
                        i.totalAmount += parseInt(val.baseFare.replace(".00",""))
                    }
                })
            })

            _setSource({
                data: result,
                cash: cash,
                nonCash: nonCash,
                pnpCash: pnpCash,
                pnpNonCash: pnpNonCash
            })

            _setPnp({
                total: totalPnp,
                amount: amount,
                busName: busName
            })

            _setDeposits(resultTraject)
        }
    }

    async function _getDeposits() {
        _setIsProcessing(true)
        _setDeposits(null)
        try {
            const param = {
                companyId: props.authData.companyId,
                date: router.query.date,
                busId: router.query.detail,
            }
            const res = await postJSON('/laporan/setoran/akap/detail', param, props.authData.token)
            let totalPnp = 0
            let amount = 0
            let cash = 0
            let nonCash = 0
            let pnpCash = 0
            let pnpNonCash = 0
            let busName = ""
            let apps = {
                "id": null,
                "name": "Apps",
                "totalPnp": 0,
                "totalAmount": 0,
                "totalKomisi": 0,
                "totalTax": 0,
                "cash": 0,
                "nonCash": 0
            }
            let source = [apps]

            _setDeposits(res.data)

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada keberangkatan', type : 'info' })
            }
            
            _setIsProcessing(false)

            res.data.forEach(function(val, key){
                if(key == 0){
                    _setTraject(val.trajectName.split("-"))
                }

                pnpCash += val.pnpCash
                pnpNonCash += val.pnpDeposit += val.pnpEmoney += val.pnpQris += val.pnpKredit += val.pnpDebit

                totalPnp += val.totalPnp
                amount += val.totalAmount
                busName = val.busName
            })

            res.source.forEach(function(val, key){

                if(val.name == "Apps"){
                    apps.totalPnp += val.totalPnp
                    apps.totalAmount += val.totalAmount
                    apps.totalKomisi += val.totalKomisi
                    apps.totalTax += val.totalTax
                    apps.cash += val.cash
                    apps.nonCash += val.nonCash
                }else{
                    source.push(val)
                }

                cash += val.cash
                nonCash += val.nonCash
            })

            _setSource({
                data: source,
                cash: cash,
                nonCash: nonCash,
                pnpCash: pnpCash,
                pnpNonCash: pnpNonCash
            })

            _setPnp({
                total: totalPnp,
                amount: amount,
                busName: busName
            })
           
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    return (
        <>
            
            <link rel="shortcut icon" href="/assets/logo/favicon.png" type="image/x-icon"></link>
            <title>{"Rekap-AP3-"+_seri}</title>                
            
            <Row
            style={{
                margin: "1%"
            }}
            >
                <Col
                column={1}
                >
                    {/* <Link
                    href={router.asPath.replace("ap3","passenger")}
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
                    "font-size": "11px"
                }}
                >
                    PERUM UMUM DAMRI
                </h3>
                <h4 style={{textAlign: 'center', fontSize: 12}}>(PERUM DAMRI)</h4>
                <h2 style={{textAlign: 'center', textDecoration: 'underline', marginTop: 10, fontSize: 12}}>DAFTAR MUATAN BUS</h2>
                <div style={{position: 'absolute', fontSize: 25, left: 20, top: 20}}>Bis {_pnp.busName}</div>
                <div style={{position: 'absolute', right: 0, top: 0, fontSize: 11}}>
                    <p>
                        <span style={{width: 50, display: 'inline-block'}}>
                            Seri AP/3
                        </span>: <b>H</b><span style={{color: '#c0392b'}}>{_seri.replace("-","")}</span></p>
                    <p><span style={{width: 50, display: 'inline-block'}}>Nomor</span>: ..............................</p>
                </div>

                <table style={{width: '100%', marginTop: 20, fontSize: 12, borderCollapse: 'collapse'}} width="100%" border={0}>
                    <tbody>
                        <tr>
                            <td style={{width: "10%"}}>Loket</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "25%"}}>{_traject[0]}</td>
                            <td style={{width: "10%"}}>Bus Code</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "5%"}}> </td>
                            <td style={{width: "10%"}}>Dari</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "25%"}}>{_traject[0]}</td>
                        </tr>
                        <tr>
                            <td style={{width: "10%"}}>Tanggal</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "25%"}}>{_date}</td>
                            <td style={{width: "10%"}}>Formasi</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "5%"}}> </td>
                            <td style={{width: "10%"}}>Ke</td>
                            <td style={{width: "5%"}}>:</td>
                            <td style={{width: "25%"}}>{_traject[1]}</td>
                        </tr>
                    </tbody>
                </table>

                <table style={{marginTop: 20, marginBottom: 10, width: '100%', fontSize: 12, borderCollapse: 'collapse'}} border={1}>
                    <tbody>
                        <tr style={{textAlign: 'center', background: '#f1f1f1'}}>
                            <th style={{width: 20}} rowSpan={2}>No</th>
                            <th colSpan={2}>Trayek</th>
                            <th colSpan={3}>Pendapatan Angkutan (Rp)</th>
                        </tr>
                        <tr style={{textAlign: 'center', background: '#f1f1f1'}}>
                            <th>Asal</th>
                            <th>Tujuan</th>
                            <th>Jumlah</th>
                            <th>Harga Tiket</th>
                            <th style={{width: 80}}>Total</th>
                        </tr>
                        <tr style={{textAlign: 'center', background: '#f1f1f1'}}>
                            <th>1</th>
                            <th>2</th>
                            <th>3</th>
                            <th>4</th>
                            <th>5</th>
                            <th>6</th>
                        </tr>
                        {   
                            _deposits != null && (
                                _deposits.map(function(val, key){
                                    return (
                                        <tr>
                                            <td align="center">{key+1}</td>
                                            <td>{val.traject.split("-")[0]}</td>
                                            <td>{val.traject.split("-")[1]}</td>
                                            <td align="center">{val.totalPnp}</td>
                                            <td align="center">{currency(val.baseFare)}</td>
                                            <td align="right">{currency(val.totalAmount)}</td>
                                        </tr>
                                    )
                                })
                            )
                        }

                        <tr>
                            <td colSpan={3} align="center">J u m l a h</td>
                            <td align="center"> {_pnp.total} Penumpang</td>
                            <td align="center">-</td>
                            <td align="right">{currency(_pnp.amount)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div
                style={{
                    content: "",
                    display: "table",
                    clear: "both",
                    width: "100%"
                }}
                >
                    <table style={{float: "left", width: "50%", fontSize: 11, borderCollapse: 'collapse'}} border={1}>
                        <tbody>
                            <tr>
                                <th>Uraian Pendapatan</th>
                                <th>Tunai</th>
                                <th>Non Tunai</th>
                                <th>Jumlah</th>
                                <th>Setor</th>
                            </tr>

                            {
                                _source.data.map(function(val, key){
                                    return (
                                        <tr>
                                            <td>{val.name}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.cash)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.nonCash)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.cash+val.nonCash)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.cash+val.nonCash)}</td>
                                        </tr>
                                    )
                                })
                            }
                            
                            <tr>
                                <td style={{fontWeight: 'bold'}}> Total Pendapatan</td>
                                <td style={{fontWeight: 'bold'}} align="right">{currency(_source.cash)}</td>
                                <td style={{fontWeight: 'bold'}} align="right">{currency(_source.nonCash)}</td>
                                <td style={{fontWeight: 'bold'}} align="right">{currency(_source.cash+_source.nonCash)}</td>
                                <td style={{fontWeight: 'bold'}} align="right">{currency(_source.cash+_source.nonCash)}</td>
                            </tr>

                        </tbody>
                    </table>

                    <table style={{float: "right", fontSize: 11, borderCollapse: 'collapse', width: '49%'}} valign={'top'} border={1}>
                        <tbody>
                            <tr>
                                <th>Metode Pembayaran</th>
                                <th>Tiket</th>
                                <th>Harga</th>
                                <th>Komisi</th>
                                <th>PPh</th>
                                <th>Total</th>
                            </tr>

                            {
                                _source.data.map(function(val, key){
                                    return (
                                        <tr>
                                            <td>{val.name}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{val.totalPnp}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.totalAmount)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.totalKomisi)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.totalTax)}</td>
                                            <td style={{fontWeight: 'bold'}} align="right">{currency(val.totalAmount)}</td>
                                        </tr>
                                    )
                                })
                            }

                            
                        </tbody>
                    </table>
                </div>

                <br/>
                <div style={{marginLeft: 10, fontSize: 10, margin: 0}}>
                    <div style={{fontSize: 8, marginTop: 10, margin: 0}}>
                    <p>Penjelasan</p>
                    <p>a. Lembar kesatu untuk Crew</p>
                    <p>b. Lembar kedua untuk UPT</p>
                    <p>c. Lembar ketiga untuk arsip loket</p>
                    </div>
                </div>
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