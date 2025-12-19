import { useEffect, useState } from 'react'

import { get, postJSON, API_ENDPOINT, SETTLEMENT_URL } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Table from '../../../../../components/Table'
import { currency, dateFilter, paymentProvider } from '../../../../../utils/filters'
import { utils } from 'xlsx'
import styles from './Daily.module.scss'
import { TbTicketOff, TbFileTypeXls, TbRefresh  }  from 'react-icons/tb'
import { FaFileExcel }  from 'react-icons/fa'
import ReturTicketModal from '../../../../../components/ReturTicketModal'
import generateClasses from '../../../../../utils/generateClasses'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'
import ChannelExportModal from '../../../../../components/ChannelExportModal'

export default function ReportDaily(props) {

    const [_accessMenu, _setAccessMenu] = useState({
        "branch": false,
        "finance": false,
        "central": false,
        "adminCabangAkap": false,
        "adminCabangAll": false,
    })

    const [_segmentRanges, _setSegmentRange] = useState([
        {
            "title": "Pemadumoda",
            "value": ""
        },
        {
            "title": "AKAP",
            "value": "/akap"
        }
    ])

    const [_paymentProviderRange, _setPaymentProviderRange] = useState([
        {
            "title": "Semua Penyedia",
            "value": ""
        },
        {
            "title": "Midtrans",
            "value": 1
        },
        {
            "title": "Damri",
            "value": 2
        },
        {
            "title": "TSM",
            "value": 3
        },
        {
            "title": "Faspay",
            "value": 4
        }
    ])

    const [_search, _setSearch] = useState("")
    const [_displayAdminCabangAkap, _setDisplayAdminCabangAkap] = useState("none")
    const [_displayAdminCabangAll, _setDisplayAdminCabangAll] = useState("none")
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[1],
        startFrom : 0,
    })
    const [_dateRange, _setDateRange] = useState({
        minDate: "",
        maxDate: dateFilter.basicDate(new Date()).normal
    })

    useEffect(() => {
        if(_search != ""){
            if(_defaultSalesReport.length == 0){
                _setDefaultSalesReport(_salesReport)
            }

            let suggestions = [..._salesReport].filter(suggestion => 
                suggestion.ticket != null ? suggestion.ticket.toLowerCase().includes(_search.toLowerCase()) : ""
            )

            if(suggestions.length > 0){
                _setSalesReport(suggestions)
            }else{
                let suggestionsBooking =  [..._salesReport].filter(suggestion => suggestion.bookingCode.toLowerCase().includes(_search.toLowerCase()))
                _setSalesReport(suggestionsBooking)
            }

        }else{
            _setSalesReport(_defaultSalesReport)
        }
    }, [_search])

    useEffect(() => {
        if (typeof window !== 'undefined') {

            let storage = getLocalStorage("access_menu_damri")

            if( storage == null){
                window.location.href = "/sign-in"
            }else{
                _setIsProcessing(true)

                const item = JSON.parse(storage)
                let branch = false
                let finance = false
                let central = false
                let statusAdminCabangAkap = false

                item.forEach(function(val, key){
                    if(val.menu == "Laporan>Transaksi>PenjualanHarianReturCabang" && val.updateRole){
                        branch = true
                    }

                    if(val.menu == "Laporan>Transaksi>PenjualanHarianReturFinance" && val.updateRole){
                        finance = true
                    }

                    if(val.menu == "Laporan>Transaksi>PenjualanHarianReturPusat" && val.updateRole){
                        central = true
                    }

                    if(val.menu == "AdminCabangAKAP" && val.viewRole){
                        statusAdminCabangAkap = true
                    }
                })

                setTimeout(() => {
                    _setAccessMenu({
                        "branch": branch,
                        "finance": finance,
                        "central": central,
                        "adminCabangAkap": statusAdminCabangAkap,
                    })    
 
                    if(!statusAdminCabangAkap){
                        _getBranch()
                        _getSalesReport()
                        _setDisplayAdminCabangAkap("")
                    }
                    
                    if(!props.branch?.branchId){
                        _setDisplayAdminCabangAll("")
                    }
                }, 3000);
                
            }
        }

    }, [])

    const [_segment, _setSegment] = useState({
        title: _validateSegment() ? 'AKAP' : 'Pemadumoda',
        value: _validateSegment() ? '/akap' : ''
    })

    const [_branch, _setBranch] = useState({
        title: props.branch?.branchName ? props.branch?.branchName : "",
        value: props.branch?.branchId ? props.branch?.branchId : ""
    })

    useEffect(() => {

        if(_accessMenu.adminCabangAkap){
            _getSalesReport()
        }
    }, [_accessMenu.adminCabangAkap])

    const __TABLE_HEADERS = [
        [
            { title : 'Transaksi', colSpan : 2 },
            { title : 'Tanggal Berangkat', rowSpan : 2 },
            { title : 'Kode Booking', rowSpan : 2 },
            { title : 'Tiket', rowSpan : 2 },
            { title : 'Harga', rowSpan : 2 },
            { title : 'Asal', rowSpan : 2 },
            { title : 'Tujuan', rowSpan : 2 },
            { title : 'Metode Bayar', rowSpan : 2 },
            { title : 'Penyedia Pembayaran', rowSpan : 2 },
            { title : 'Bank', rowSpan : 2 },
            { 
                title : 'Petugas', 
                rowSpan : 2,
                hide: props.role_id == "9" ? true : false,         
            },
            { title : 'Status', rowSpan : 2 },
            { 
                title : 'Opsi', 
                rowSpan : 2,
                hide: props.role_id == "2" ? false : true, 
            }
        ],
        [
            { title : 'Tanggal'},
            { title : 'Waktu'}
        ]
    ]

    let __COLUMNS = [
        {   
            title: 'Tanggal',
            field : 'dateTransaction',
            minWidth: '60px',
            customCell : (value) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {   
            title: 'Waktu',
            field : 'dateTransaction',
            minWidth: '60px',
            customCell : (value) => {
                return dateFilter.getTime(new Date(value))
            }
        },
        {   
            title: 'Tanggal Berangkat',
            field : 'departureDate',
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
            title: 'Kode Booking',
            field : 'bookingCode',
            textAlign: "left"
        },
        {
            title: 'Ticket',
            field : 'ticket',
            textAlign: "left"
        },
        {
            title: 'Harga',
            field : 'baseFare',
            textAlign: 'right',
            minWidth: '60px',
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
            title: 'Penyedia Pembayaran',
            field : 'paymentProviderId',
            customCell: (value) => paymentProvider(value)
        },
        {
            title: 'Bank',
            minWidth: '60px',
            field : 'pembayaranDetail',
        },
        {
            title: 'Petugas',
            field : 'userName',
            textAlign: 'left',
            hide: props.role_id == "9" ? true : false,
        },
        {
            title: 'Status',
            field : 'paymentStatus',
            minWidth: '60px',
            // customCell: (value, row) => {
            //     if(row.statusCancelTicket == "PENDING"){
            //         return 'Menunggu Persetujuan Cabang'
            //     }else if(row.statusCancelTicket == "BRANCH_APPROVED"){
            //         return 'Menunggu Persetujuan Pusat'
            //     }else if(row.statusCancelTicket == "REJECT"){
            //         return row.statusCancelTicket
            //     }
            //     else{
            //         return row.ticketStatus == "AKTIF" ? value : row.ticketStatus
            //     }
            // }
        },
        {
            title: 'Opsi',
            field : 'transactionId',
            minWidth: '60px',
            hide: props.role_id == "2" ? false : true,
            customCell: (value, row) => {

                return (
                    <div
                    title={"Reset Print Count"}
                    className={generateClasses([
                        styles.button_action,
                        styles.text_warning
                    ])}
                    onClick={() => {    async function _settlePaid(target){
                        _setIsProcessing(true)
                
                        try{
                            const res = await get({ url: "/api/api-server-side?url="+target}, "", "")
                            if(res.data?.transaction_id){
                                popAlert({ message : 'Settlement berhasil', type : 'success' })
                                _getSettlement()
                                _setIsProcessing(false)
                            }
                
                        }catch (e) {
                            popAlert({ message : e.message })
                            _setIsProcessing(false)
                        }
                    }
                        _resetPrintCount(row.ticket)
                    }}
                    >
                        <TbRefresh />
                    </div>
                )

                // if(row.statusCancelTicket == null && _accessMenu.finance){
                //     return (
                //         <div
                //         title={"Retur Tiket"}
                //         className={styles.button_action}
                //         onClick={() => {
                //             _setForm({
                //                 ...row,
                //                 type: 'retur'
                //             })
                //         }}
                //         >
                //             <TbTicketOff/>
                //         </div>
                //     )

                // }else if((row.statusCancelTicket == "PENDING" && _accessMenu.branch) || 
                // (row.statusCancelTicket == "BRANCH_APPROVED" && _accessMenu.central) ||
                // (row.statusCancelTicket == "REJECT")){
                    
                //     let isType = "approval"
                //     let isTitle = "Persetujuan Retur Tiket"

                //     if(row.statusCancelTicket == "BRANCH_APPROVED"){
                //         isType = "approval-central"
                //     }else if(row.statusCancelTicket == "REJECT"){
                //         isType = "reject"
                //         isTitle = "Lihat Retur Reject"
                //     }

                //     return (
                //         <div
                //         title={isTitle}
                //         className={generateClasses([
                //             styles.button_action,
                //             styles.text_warning
                //         ])}
                //         onClick={() => {
                //             _setForm({
                //                 ...row,
                //                 type: isType
                //             })
                //         }}
                //         >
                //             <TbTicketOff/>
                //         </div>
                //     )
                // }
            }
        },
    ]

    const [_date, _setDate] = useState({
        start : dateFilter.basicDate(new Date()).normal,
        end : dateFilter.basicDate(new Date()).normal
    })
    const [_salesReport, _setSalesReport] = useState([])
    const [_defaultSalesReport, _setDefaultSalesReport] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_paymentMethod, _setPaymentMethod] = useState({
        title: "Semua Pembayaran",
        value: ""
    })
    const [_paymentProvider, _setPaymentProvider] = useState({
        title: "Semua Penyedia",
        value: ""
    })
    const [_paymentMethodRanges, _setPaymentMethodRanges] = useState([
        {
            "title": "Semua Pembayaran",
            "value": ""
        },
        {
            "title": "Emoney",
            "value": "emoney"
        },
        {
            "title": "Cash",
            "value": "cash"
        },
        {
            "title": "Debit",
            "value": "debit"
        },
        {
            "title": "Kredit",
            "value": "kredit"
        },
        {
            "title": "QRIS",
            "value": "qris"
        }
    ])

    const [_branchRanges, _setBranchRanges] = useState([])
    const [_traject, _setTraject] = useState({
        title: "",
        value: ""
    })
    const [_trajectRanges, _setTrajectRanges] = useState([])
    const [_officerRanges, _setOfficerRanges] = useState([])
    const [_officer, _setOfficer] = useState({
        title: props.role_id == "9" ? props.authData.name : "Semua Petugas",
        value: props.role_id == "9" ? props.authData.id : ""
    })

    const [_statusRanges, _setStatusRange] = useState([
        {
            "title": "Paid",
            "value": "PAID"
        },
        {
            "title": "Expired",
            "value": "EXPIRED"
        },
        {
            "title": "Pending",
            "value": "PENDING"
        },
        // {
        //     "title": "Cancel",
        //     "value": "CANCEL"
        // }
    ])
    const [_status, _setStatus] = useState({
        title: "Paid",
        value: "PAID"
    })

    const [_form, _setForm] = useState({})

    const [_summary, _setSummary] = useState({
        totalPnp: 0,
        totalAmount : 0,
    })

    const [_dateByRange, _setDateByRange] = useState([
        {
            "title": "Transaksi",
            "value": "transaction"
        },
        {
            "title": "Keberangkatan",
            "value": "departure"
        }
    ])

    const [_dateBySelected, _setDateBySeleted] = useState(_dateByRange[0])
    const [_openModalExport, _setOpenModalExport] = useState(false)

    function _validateSegment(){
        //9: counter
        if(props.role_id == "9" || _accessMenu.adminCabangAkap){
            return true
        }else{
            return false
        }
    }

    function _compareDate(d1, d2){
        let date1 = new Date(d1)
        date1.setDate(date1.getDate()+7);
        date1 = date1.getTime()
        let date2 = new Date(d2).getTime();
    
        if(date1 >= date2){
            return true
        }else{
            return false
        }
    }

    async function _getSalesReport(pagination = _page) {

        let params = {
            companyId : props.authData.companyId,
            // sortMode : "desc",
            // length: 11360,
            startDate: _date.start,
            endDate: _date.end,
            dateBy: _dateBySelected.value,
            ...pagination
        }

        if(!_compareDate(params.startDate, params.endDate)){
            popAlert({ message : 'Rentang tanggal maksimal 7 hari', type : 'info' })
            return false
        }

        let isLinkAkap = _segment.value

        // if(isLinkAkap != "/akap"){
        //     params.sortMode = "desc"
        // }

        if(_accessMenu.adminCabangAkap) isLinkAkap = "/akap"
        if(_traject.value != "") params.trajectId = _traject.value
        if(_branch.value != "") params.branchId = _branch.value
        if(_paymentMethod.value != "") params.paymentMethod = _paymentMethod.value
        if(_officer.value != "") params.userId = _officer.value
        if(_status.value != "") params.paymentStatus = _status.value
        if(_paymentProvider.value != "") params.paymentProviderId = _paymentProvider.value

        _setIsProcessing(true)

        try {
            const res = await postJSON(`/laporan/penjualan/harian${isLinkAkap}/list`, params, props.authData.token)

            _setSalesReport(res.data)
            _setIsProcessing(false)
            _setSummary({
                totalPnp: res.totalFiltered, 
                totalAmount: res.totalFare
            })

            _setPaginationConfig({
                recordLength : res.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(res.totalFiltered / pagination.length)  
            })

            let officer = []
            res.userList.forEach(function(val, key){
                if(key == 0){
                    officer.push({
                        title: "Semua Petugas",
                        value: ""
                    })
                }
                officer.push({
                    title: val.userName,
                    value: val.userId
                })
            })

            let traject = []
            res.trajectList.forEach(function(val, key){
                if(key == 0){
                    traject.push({
                        title: "Semua Trayek",
                        value: ""
                    })
                }
                traject.push({
                    title: val.name,
                    value: val.id
                })
            })

            _setOfficerRanges(officer)
            
            if(_trajectRanges.length == 0){
                _setTrajectRanges(traject)
            }

            if (res.data.length === 0) {
                popAlert({ message : 'Tidak ada transaksi', type : 'info' })
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

                if(!props.branch?.branchName){
                    _setBranch(data[0])
                }
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _resetPrintCount(ticket){
        
        try {
            const url = "/print-count/reset/"+ticket
            const res = await postJSON({ url: "/api/api-server-side?url="+SETTLEMENT_URL + url}, "", "")
           
            if(res) {
                popAlert({ message : 'Berhasil reset print count', type : 'success' })
            }

        } catch (e) {
            console.log(e)
        }
    }

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getSalesReport(pagination)
        _setDefaultSalesReport([])
    }

    return (
        <Main>

            <ChannelExportModal
            visible={_openModalExport}
            closeModal={
                () => {
                    _setOpenModalExport(false)
                }
            }
            />
            
            <ReturTicketModal
            visible={_form?.idTicket}
            closeModal={
                () => {
                    _setForm({})
                }
            }
            data={_form}
            onSuccess={_getSalesReport}
            />

            <AdminLayout
            headerContent=
                {
                    props.role_id != "9" && (
                        <Button
                        styles={Button.success}
                        icon={<FaFileExcel/>}
                        title={'Export semua channel'}
                        onClick={() => {
                            _setOpenModalExport(true)
                        }}
                        />
                    )
                }
            >
                <Card>
                    
                    <small
                    style={{
                        "font-size": '10px'
                    }}
                    >*Maksimal 7 Hari</small>

                    <Row
                    verticalEnd
                    >

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >   
                            <Input
                            max={_dateRange.maxDate}
                            title={'Tanggal Awal'}
                            type={'date'}
                            value={_date.start}
                            onChange={date => _setDate(oldData => {
                                return {
                                    ...oldData,
                                    start : dateFilter.basicDate(new Date(date)).normal
                                }
                            })}
                            />                            
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            min={_date.start}
                            max={_dateRange.maxDate}
                            title={'Tanggal Akhir'}
                            type={'date'}
                            value={_date.end}
                            onChange={date => _setDate(oldData => {
                                return {
                                    ...oldData,
                                    end : dateFilter.basicDate(new Date(date)).normal
                                }
                            })}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Berdasarkan Tanggal'}
                            value={_dateBySelected.title}
                            suggestions={_dateByRange}
                            onSuggestionSelect={date => {
                                _setDateBySeleted(date)
                            }}
                            />
                        </Col>
                        
                        {
                            !_validateSegment() && (
                                <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                                style={{
                                    "display": _displayAdminCabangAll
                                }}
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

                        {
                            props.role_id != "9" && (
                                <>
                                    <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Input
                                        title={'Petugas'}
                                        placeholder={'Semua Petugas'}
                                        value={_officer.title}
                                        suggestions={_officerRanges}
                                        onSuggestionSelect={officer => {
                                            _setOfficer(officer)
                                        }}
                                        />
                                    </Col>
                                        
                                    {
                                        !_accessMenu.adminCabangAkap && (
                                            <Col
                                            column={1}
                                            mobileFullWidth
                                            withPadding
                                            style={{
                                                "display": _displayAdminCabangAkap
                                            }}
                                            >
                                                <Input
                                                title={'Segmentasi'}
                                                placeholder={'Pemadumoda'}
                                                value={_segment.title}
                                                suggestions={_segmentRanges}
                                                onSuggestionSelect={segment => {
                                                    _setSegment(segment)
                                                }}
                                                />
                                            </Col>
                                        )
                                    }
                                    
                                </>
                            )
                        }

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Penyedia Pembayaran'}
                            placeholder={'Semua Penyedia'}
                            value={_paymentProvider.title}
                            suggestions={_paymentProviderRange}
                            onSuggestionSelect={provider => {
                                _setPaymentProvider(provider)
                            }}
                            />
                        </Col>
                        

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Metode Pembayaran'}
                            placeholder={'Semua Pembayaran'}
                            value={_paymentMethod.title}
                            suggestions={_paymentMethodRanges}
                            onSuggestionSelect={payment => {
                                _setPaymentMethod(payment)
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            title={'Status'}
                            placeholder={'Semua Status'}
                            value={_status.title}
                            suggestions={_statusRanges}
                            onSuggestionSelect={status => {
                                _setStatus(status)
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
                            placeholder={'Semua Trayek'}
                            value={_traject.title}
                            suggestions={_trajectRanges}
                            onSuggestionSelect={traject => {
                                _setTraject(traject)
                            }}
                            />
                        </Col>

                    </Row>

                    <Row
                    verticalEnd 
                    >        
                        <Col
                        column={1}
                        withPadding
                        mobileFullWidth
                        >
                            <Button
                            id={"btnApply"}
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
                                    headerContent={(
                                        <Row
                                        verticalEnd
                                        >
                                            <Col
                                            column={2}
                                            withPadding
                                            >
                                                <Input
                                                title={`Cari Tiket / Kode Booking`}
                                                value={_search}
                                                onChange={ticket => {
                                                    _setSearch(ticket)
                                                }}
                                                />
                                            </Col>
                                             
                                        </Row>
                                        
                                    )}
                                    tableHeaders={__TABLE_HEADERS}
                                    headExport={[
                                    {
                                        title: 'Tanggal',
                                        value: 'dateTransaction',
                                        customCell : (value) => {
                                            return dateFilter.getMonthDate(new Date(value))
                                        }
                                    },
                                    {
                                        title: 'Waktu',
                                        value: 'dateTransaction',
                                        customCell : (value) => {
                                            return dateFilter.getTime(new Date(value))
                                        }
                                    },
                                    {
                                        title: 'Kode Booking',
                                        value: 'bookingCode'
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
                                        title: 'Penyedia Pembayaran',
                                        value: 'paymentProviderId',
                                        customCell: (value) => paymentProvider(value)
                                    },
                                    {
                                        title: 'Bank',
                                        value: 'pembayaranDetail'
                                    },
                                    {
                                        title: 'Petugas',
                                        value: 'userName',
                                    },
                                    {
                                        title: 'Status',
                                        value: 'paymentStatus',
                                    }
                                ]}
                                columns={__COLUMNS}
                                records={_salesReport}
                                config={_paginationConfig}
                                defaultLength={25}
                                onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                                onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                                noPadding
                                extraLarge
                                isLoading={_isProcessing}
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
                                            <span>Total Penumpang</span>
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