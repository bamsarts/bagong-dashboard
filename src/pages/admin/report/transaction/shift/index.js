import { useEffect, useState } from 'react'

import { get, postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import { currency, dateFilter } from '../../../../../utils/filters'
import { utils } from 'xlsx'
import styles from './Shift.module.scss'
import Datepicker from '../../../../../components/Datepicker'

export default function ReportShift(props) {

    const [_accessMenu, _setAccessMenu] = useState({
        "adminCabangAkap": false,
        "adminCabangAll": false,
    })

    let __COLUMNS = [
        {   
            title: 'Tanggal',
            field : 'dateTransaction',
            customCell : (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {   
            title: 'Waktu',
            field : 'dateTransaction',
            customCell : (value) => dateFilter.convertISO(new Date(value), "time")
        },
        {
            title: 'Ticket',
            field : 'ticket',
        },
        {
            title: 'Harga',
            field : 'baseFare',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Asal',
            field : 'originName',
            textAlign: 'left',
        },
        {
            title: 'Tujuan',
            field : 'destinationName',
            textAlign: 'left'
        },
        {
            title: 'Metode Bayar',
            field : 'pembayaran',
        },
        {
            title: 'Bank',
            field : 'pembayaranDetail',
            textAlign: 'right'
        },
        {
            title: 'Petugas',
            field : 'userName',
            textAlign: 'left'
        },
        {
            field : 'departureDate',
            title : 'Tanggal Berangkat',
            customCell : (value) => {
                if(value != null){
                    const date = new Date(value)
                    return dateFilter.getMonthDate(date)
                }else{
                    return ''
                }
            }
        },
        {
            field : 'scanAt',
            title : 'Tanggal Validasi',
            customCell : (value) => {
                if(value != null){
                    const date = new Date(value)
                    return dateFilter.getMonthDate(date)
                }else{
                    return ''
                }
            }
        }
    ]

    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_counter, _setCounter] = useState({
        title: "Semua Petugas",
        value: ""
    })
    const [_counterRanges, _setCounterRanges] = useState([])
    const [_shift, _setShift] = useState({
        title: "Semua Shift",
        value: ""
    })
    const [_shiftRanges, _setShiftRanges] = useState([])
    const [_branch, _setBranch] = useState({
        title: props.branch?.branchName ? props.branch?.branchName : '',
        value: props.branch?.branchId ? props.branch?.branchId : ''
    })
    const [_branchRanges, _setBranchRanges] = useState([])

    useEffect(() => {
        if(props.branch?.branchId){
            _setAccessMenu( oldQuery => ({
                ...oldQuery,
                "adminCabangAll": true
            }))
        }
        _getSalesReport()
        _getBranch()
    },[])

    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount : 0,
    })

    function _updateSummary(row){
        let totalAmount, totalPnp

        totalPnp = row.length
        totalAmount = 0
              
        if (row.length > 0) {
            row.forEach(item => {
                totalAmount += item.baseFare
            })
        }

        _setSummary({
            totalPnp, totalAmount
        })
    }

    function _updateShift(data){
        let shifts = [{
            "value": "",
            "title": "Semua Shift"
        }]

        data.forEach(function(val, key){
            shifts.push({
                "value": val.shiftId,
                "title": val.shiftId
            })
        })
        _setShiftRanges(shifts)
    }

    function _updateUser(data){
        let users = []
        data.forEach(function(val, key){
            if(key == 0){
                users.push({
                    "value": "",
                    "title": "Semua Petugas"
                })
            }
            users.push({
                "value": val.userId,
                "title": val.userName
            })
        })
        _setCounterRanges(users)
    }

    async function _getSalesReport() {
        _setIsProcessing(true)

        let params = {
            companyId : props.authData.companyId,
            startFrom : 0,
            length: 2930,
            date: _date.start
        }
        console.log("branch")
        console.log(_branch)
        if(_counter.value != "") params.userId = _counter.value
        if(_branch.value != "") params.branchId = _branch.value
        if(_shift.value != "") params.shiftId = _shift.value

        try {
            const res = await postJSON(`/laporan/transaksi/penjualan/shift/list`, params, props.authData.token)

            _setSalesReport(res.data)
            _setIsProcessing(false)
            _updateSummary(res.data)

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada transaksi', type : 'info' })
            }else{
                _updateShift(res.sessionList)
                _updateUser(res.userList)
            }
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    async function _getBranch(){
        
        let params = {
            startFrom : 0,
            length: 70,
        }

        try {
            const res = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Cabang",
                        value: ""
                    })
                }
                data.push({
                    title: val.name,
                    value: val.id
                })
            })

            if(res) {
                _setBranchRanges(data)
                if(!props.branch.branchId){
                    _setBranch(data[0])
                }
            }

        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Main>
            
            <AdminLayout>
                <Card>
                    <Row
                    verticalEnd
                    >
          
                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Datepicker
                            value={_date.start}
                            onChange={value => {
                                _setDate( oldData => {
                                    return {
                                        ...oldData,
                                        start: dateFilter.basicDate(new Date(value)).normal
                                    }
                                })
                            }}
                            />
                        </Col>

                        {
                            !_accessMenu.adminCabangAll && (
                                <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={'Cabang'}
                                    placeholder={'Semua Cabang'}
                                    value={_branch.title}
                                    suggestions={_branchRanges}
                                    onSuggestionSelect={branch => {
                                        _setBranch(branch)
                                    }}
                                    />
                                </Col>
                            )
                        }
                        
                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Petugas'}
                            placeholder={'Semua Petugas'}
                            value={_counter.title}
                            suggestions={_counterRanges}
                            onSuggestionSelect={counter => {
                                _setCounter(counter)
                            }}
                            />
                        </Col>

                        <Col
                        column={3}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Shift'}
                            placeholder={'Semua Shift'}
                            value={_shift.title}
                            suggestions={_shiftRanges}
                            onSuggestionSelect={shift => {
                                _setShift(shift)
                            }}
                            />
                        </Col>
                            

                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Button
                            title={'Terapkan'}
                            onProcess={_isProcessing}
                            onClick={_getSalesReport}
                            />
                        </Col>
                    </Row>
                </Card>
                {
                    _salesReport && (
                        <>
                            <Card
                            noPadding
                            >
                                <Table
                                    headExport={[
                                    {
                                        title: 'Tanggal',
                                        value: 'dateTransaction',
                                        customCell : (value) => dateFilter.convertISO(new Date(value), "date")
                                    },
                                    {
                                        title: 'Waktu',
                                        value: 'dateTransaction',
                                        customCell : (value) => dateFilter.convertISO(new Date(value), "time")
                                    },
                                    {
                                        title: 'Ticket',
                                        value: 'ticket',
                                    },
                                    {
                                        title: 'Harga',
                                        value: 'baseFare'
                                    },
                                    {
                                        title: 'Asal',
                                        value: 'originName',
                                    },
                                    {
                                        title: 'Tujuan',
                                        value: 'destinationName'
                                    },
                                    {
                                        title: 'Metode Pembayaran',
                                        value: 'pembayaran',
                                    },
                                    {
                                        title: 'Bank',
                                        value: 'pembayaranDetail',
                                        customCell : (value) => value == null ? '-' : value
                                    },
                                    {
                                        title: 'Petugas',
                                        value: 'userName',
                                    },
                                    {
                                        title: 'Tanggal Keberangkatan',
                                        value: 'departureDate',
                                        customCell : (value) => {
                                            if(value != null){
                                                return value
                                            }else{
                                                return ''
                                            }
                                        }
                                    },
                                    {
                                        title: 'Tanggal Validasi',
                                        value: 'scanAt',
                                        customCell : (value) => {
                                            if(value != null){
                                                return value
                                            }else{
                                                return ''
                                            }
                                        }
                                    }
                                ]}
                                columns={__COLUMNS}
                                records={_salesReport}
                                noPadding
                                />
                                    
                            </Card>

                            <Card>
                                <Row>
                                    <Col
                                    column={1}
                                    >
                                        <div
                                        className={styles.total_trx}
                                        >
                                            <span>Total Transaksi</span>
                                            <strong>{currency(_summary.totalPnp)}</strong>
                                        </div>
                                    </Col>
                                    <Col
                                    column={2}
                                    >
                                        <div
                                        className={styles.total_trx}
                                        >
                                            <span>Total Penjualan</span>
                                            <strong>{currency(_summary.totalAmount)}</strong>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </>
                    )
                }
            </AdminLayout>
        </Main>
    )

}