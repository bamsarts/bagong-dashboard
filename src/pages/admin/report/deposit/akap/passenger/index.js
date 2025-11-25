import { useEffect, useState } from 'react'

import { postJSON, API_ENDPOINT, get, objectToParams } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import { Col, Row } from '../../../../../../components/Layout'
import DepositModal from '../../../../../../components/DepositModal'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { useRouter } from 'next/router'
import { getSessionStorage, setSessionStorage } from '../../../../../../utils/session-storage'
import { dateFilter, currency } from '../../../../../../utils/filters'
import { getLocalStorage, setLocalStorage } from '../../../../../../utils/local-storage'
import Label from '../../../../../../components/Label'
import { BsChevronLeft, BsXLg, BsChevronRight, BsArrowRight, BsFillPencilFill, BsFillArchiveFill } from 'react-icons/bs'
import styles from './Passenger.module.scss'
import Link from 'next/link'

export default function ReportAkapPassenger(props) {
    
    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Kode Booking',
            field : 'bookingCode',
            textAlign: 'left'
        },
        {
            title: 'Kode Tiket',
            field : 'ticket',
            textAlign: 'left'
        },
        {
            title: 'Nama',
            field : 'name',
            textAlign: 'left'
        },
        {
            title: 'Asal',
            field : 'originName',
            textAlign: 'left',
        },
        {
            title: 'Tujuan',
            field : 'destinationName',
            textAlign: 'left',
        },
        {
            title: 'No Kursi',
            field : 'seatNumber',
            textAlign: 'left',
        },
        {
            title: 'Harga',
            field : 'baseFare',
            textAlign: "right",
            customCell : (value) => currency(value, '')
        },
        // {
        //     title: 'Opsi',
        //     field: 'ticket',
        //     customCell: (value, row, index) => {
                
        //         return (
        //             <Button
        //             disabled={row.aksi == "0"}
        //             title={'Cetak Tiket'}
        //             styles={Button.primary}
        //             onClick={() => {
        //                 setLocalStorage("ticket_damri", JSON.stringify(row))
        //                 window.open("/admin/ticket-order/ticket/INTERCITY*"+row.ticket+"?src=report",'_blank');
        //             }}
        //             small
        //             />
        //         )
        //     }
        // }
    ]

    const [_date, _setDate] = useState(dateFilter.basicDate(new Date()).normal)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isGettingDeposit, _setIsGettingDeposit] = useState(false)
    const [_deposits, _setDeposits] = useState(null)
    const [_selectedDeposit, _setSelectedDeposit] = useState(null)
    const [_titleModal, _setTitleModal] = useState({})
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_branchRange, _setBranchRange] = useState([])
    const [_branch, _setBranch] = useState({
        "title": "Pilih Cabang",
        "value": ""
    })

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_traject, _setTraject] = useState({
        "title": "Pilih Trayek",
        "value": ""
    })

    const [_busRange, _setBusRange] = useState([])
    const [_bus, _setBus] = useState({
        "title": "Pilih Bus",
        "value": ""
    })

    const [_manifest, _setManifest] = useState([])

    async function _getDeposits() {
        _setIsProcessing(true)
        _setDeposits(null)
        try {
            const param = {
                companyId: props.authData.companyId,
                date: router.query.date,
                busId: router.query.detail,
                trajectId: router.query.traject
            }
            const res = await postJSON('/laporan/setoran/akap/detail/tiket', param, props.authData.token)
            _setDeposits(res.data)
            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada penumpang', type : 'info' })
            }
            _setIsProcessing(false)
        } catch (e) {
            _setIsProcessing(false)
            popAlert({ message : e.message })
        }
    }

    async function _getBranch(){
        
        let params = {
            startFrom : 0,
            length: 300,
        }

        try {
            const res = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){

                data.push({
                    title: val.name,
                    value: val.id_cabang
                })
            })

            if(res) {
                _setBranchRange(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getTraject(){
        let params = {
            tanggal : _date,
            cabang: `${_branch.value}`,
        }

        try {
            const res = await postJSON(`/simaDamri/manifestPenumpang/trayek/list `, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){

                data.push({
                    title: val.text,
                    value: val.value
                })

            })

            if(data.length == 0){
                data.push({
                    title: "Trayek tidak ada keberangkatan",
                    value: null
                })
            }

            if(res) {
                _setTrajectRange(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getBus(){
        let params = {
            tanggal : _date,
            cabang: `${_branch.value}`,
            kd_trayek: `${_traject.value}`,
        }

        try {
            const res = await postJSON(`/simaDamri/manifestPenumpang/bus/list `, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){

                data.push({
                    title: val.text,
                    value: val.value
                })

            })

            if(res) {
                _setBusRange(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getManifestSima(){
        let params = {
            tanggal : _date,
            cabang: `${_branch.value}`,
            trayek: `${_traject.value}`,
            bus: `${_bus.value}`
        }

        try {
            const res = await postJSON(`/simaDamri/manifestPenumpang/list `, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){

                data.push({
                    bookingCode: val.kd_booking,
                    ticket: val.kd_tiket,
                    name: val.penumpang_nama,
                    traject: _traject.title,
                    seatNumber: val.kursi,
                    baseFare: val.harga,
                    email: val.email,
                    bus: _bus.title,
                    trajectCode: _traject.value,
                    departureDate: _date,
                    email: val.email,
                    aksi: val.aksi
                })

            })

            if(res) {
                _setDeposits(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getManifest(){
        _setIsProcessing(true)

        let params = {
            date: _date
        }

        // if (_form.branchId != "") params.branchId = `${_form.branchId}`
        
        try {
            const manifest = await get(
                {
                    url: API_ENDPOINT.ticketOrder+'/dashboard/transaction/passengers/manifest?'+objectToParams(params)
                }, 
                props.authData.token
            )


            _setManifest(manifest.data)
           
        } catch (e) {
            popAlert({ message : e.message })

        } finally {
            _setIsProcessing(false)

        }
    }

    useEffect(() => {
        _setTraject({
            "title": "Pilih Trayek",
            "value": ""
        })
    }, [_date])

    useEffect(() => {
        if(_branch.value != ""){
            _getTraject()
        }
    }, [_branch.value, _date])

    useEffect(() => {
        if(_traject.value != ""){
            _getBus()
        }
    }, [_traject.value])

    useEffect(() => {
        _getDeposits()
        _getBranch()
    }, [])

    return (
        <Main>
        
            <AdminLayout>

                <div className={styles.header_content}>
                    <div>
                        <Link href="/admin/report/deposit/akap">
                            <BsChevronLeft/>
                        </Link>
                        <strong>AKAP</strong>
                    </div>
                </div>

                {/* <Card>
                    <Row
                    verticalEnd
                    >

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            title={"Tanggal Keberangkatan"}
                            value={_date}
                            onChange={date => _setDate(dateFilter.basicDate(new Date(date)).normal)}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Cabang'}
                            placeholder={'Pilih Cabang'}
                            value={_branch.title}
                            suggestions={_branchRange}
                            onSuggestionSelect={branch => {
                                _setBranch(branch)
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Trayek'}
                            placeholder={'Pilih Trayek'}
                            value={_traject.title}
                            suggestions={_trajectRange}
                            onSuggestionSelect={traject => {
                                _setTraject(traject)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Bis'}
                            placeholder={'Pilih Bis'}
                            value={_bus.title}
                            suggestions={_busRange}
                            onSuggestionSelect={bus => {
                                _setBus(bus)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            title={'Cari Keberangkatan'}
                            onProcess={_isProcessing}
                            onClick={_getManifest}
                            />
                        </Col>
                    </Row>
                </Card> */}

                {
                    _deposits && (
                        <Card
                        noPadding
                        >
                            <Table
                            //  headerContent={(
                            //      <Row>
                            //          <Col
                            //          column={1}
                            //          >
                            //             <Button
                            //             title={'Rekap AP3'}
                            //             styles={Button.secondary}
                            //             onClick={() => {
                            //                 setLocalStorage("penjualan_damri", JSON.stringify(_deposits))
                            //                 let url = window.location.href + "?date="+_date
                            //                 window.open(url.replace("passenger", 'ap3'),'_blank');
                            //             }}
                            //             small
                            //             />
                            //          </Col>

                            //          <Col
                            //          column={1}
                            //          >
                            //             <Button
                            //             title={'Penjualan'}
                            //             styles={Button.primary}
                            //             onClick={() => {
                            //                 setLocalStorage("penjualan_damri", JSON.stringify(_deposits))
                            //                 let url = window.location.href + "?date="+_date+"&bus="+_bus.title.split("|")[0]
                            //                 window.open(url.replace("passenger", 'sales'),'_blank');
                            //             }}
                            //             small
                            //             />
                            //          </Col>
                            //      </Row>
                            //  )}
                             headExport={[
                                {
                                    title: 'Kode Booking',
                                    value: "bookingCode"
                                },
                                {
                                    title: 'Kode Tiket',
                                    value: "ticket"
                                },
                                {
                                    title: 'Nama',
                                    value: "name"
                                },
                                {
                                    title: 'Asal',
                                    value: 'originName'
                                },
                                {
                                    title: 'Tujuan',
                                    value: "destinationName"
                                },
                                {
                                    title: 'Harga',
                                    value: "baseFare"
                                },
                                {
                                    title: 'Pembayaran',
                                    value: "pembayaran"
                                }
                            ]}
                            columns={__COLUMNS}
                            records={_deposits}
                            noPadding
                            />
                        </Card>
                    )
                }
            </AdminLayout>
        </Main>
    )

}