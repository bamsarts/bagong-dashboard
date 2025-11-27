import { useEffect, useState, forwardRef } from 'react'
import { postJSON, get, objectToParams, DAMRI_APPS_URL } from '../../../api/utils'

import Main, { popAlert } from '../../../components/Main'
import AdminLayout from '../../../components/AdminLayout'
import Card from '../../../components/Card'
import Input from '../../../components/Input'
import Table from '../../../components/Table'
import Button from '../../../components/Button'
import Tabs from '../../../components/Tabs'
import { Col, Row } from '../../../components/Layout'
import { AiOutlineClose } from 'react-icons/ai'
import { currency, dateFilter } from '../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import Label from '../../../components/Label'
import PublishedTicketModal from '../../../components/PublishedTicketModal'
import { BsFillSignpostFill, BsThreeDotsVertical, BsFillTicketPerforatedFill , BsCloudDownload , BsFillTrashFill } from 'react-icons/bs'
import styles from '../master-data/traject/traject-list/Trajectlist.module.scss'
import generateClasses from '../../../utils/generateClasses'
import { camelToSnakeCase } from '../../../utils/case-converter'

export default function Transaction(props) {

    const [_activeIndex, _setActiveIndex] = useState('all')

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
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
    const [_form, _setForm] = useState({
        "dateBySelected": _dateByRange[0],
        "userSelected": {
            "title": "",
            "value": ""
        },
        "statusSelected": [],
        "paymentSelected": {
            "label": ""
        },
        "query": "",
        "paymentMethod": "Semua Pembayaran",
        "ticket": ""
    })

    const [_hasChecklist, _setHasChecklist] = useState(false)

    const [_checklistAll, _setChecklistAll] = useState(false)
    const [_statusRange, _setStatusRange] = useState([
        {
            "payment_status": "PAID",
            "total": 0
        },
        {
            "payment_status": "PENDING",
             "total": 0
        },
        {
            "payment_status": "EXPIRED",
            "total": 0
        },
        {
            "payment_status": "CANCEL",
            "total": 0
        },
        {
            "payment_status": "WAITING",
            "total": 0
        }
    ])
    const [_selectedTicket, _setSelectedTicket] = useState([])
    const [_userSuggestions, _setUserSuggestions] = useState([])

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _filterTransactionData(data) {
        let filteredData = data;
        _setFilteredTransactionList(filteredData);
    }

    function _setDropdown(id){
        const parent = document.getElementsByClassName("dropdown-item "+id)
        if(parent[0].style.display == "none"){
            parent[0].style.display = "flex"
        }else{
            parent[0].style.display = "none"
        }
    }


    const __COLUMNS = [
        {
            title: 'Tanggal Pembelian',
            field: 'tanggal_pembelian',
            textAlign: 'center',
            minWidth: '140px',
            customCell: (value, row) => {
                return dateFilter.basicDate(new Date(value)).normalId + " " + dateFilter.getTime(new Date(value))
            }
        },
        {
            title: 'Kode Booking',
            field: 'kode_booking',
            textAlign: 'center',
            minWidth: '120px'
        },
        {
            title: 'Tiket',
            field: 'ticket',
            textAlign: 'center',
            minWidth: '120px'
        },
        {
            title: 'Channel',
            field: 'counter',
            textAlign: 'center',
            minWidth: '120px',
            customCell: (value, row) => {

                let channel = value

                if (value === "api.damri.bisku.id" || value === "api.damri.ck.bisku.top" || value === "null" || value === null) channel = "DAMRI Apps"

                if (value === "web.damri.bisku.id") channel = "Web Reservasi"

                return channel

            }
        },
        {
            title: 'Status Pembayaran',
            field: 'paymentStatus',
            textAlign: 'center',
            minWidth: '100px',
            customCell: (value, row) => {

                return (
                    <Row
                        verticalCenter
                    >

                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": _statusPayment(value),
                                    "title": value,
                                    "value": true
                                }
                            ]}
                        />
                    </Row>
                )

            }
        },
        {
            title: 'Status DAMRI',
            field: 'isPaidInDamri',
            textAlign: 'center',
            minWidth: '100px',
            customCell: (value, row) => {

                return (
                    <Row
                        verticalCenter
                    >

                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": _statusPayment(value ? "PAID" : "PENDING"),
                                    "title": value ? "PAID" : "PENDING",
                                    "value": true
                                }
                            ]}
                        />
                    </Row>
                )

            }
        },
        {
            title: 'Penumpang',
            field: 'nama_penumpang',
            textAlign: 'left',
            minWidth: '120px',
            customCell: (value, row) => {
                return (
                    <Col>
                        <span>{value}</span>
                        <span>{row.nomor_telepon}</span>
                    </Col>
                )
            }
        },
        {
            title: 'Tanggal Berangkat',
            field: 'tanggal_keberangkatan',
            textAlign: 'center',
            minWidth: '90px',
            customCell: (value, row) => {
                return value ? dateFilter.basicDate(new Date(value)).normalId : "";
            }
        },
        {
            title: 'Asal - Tujuan',
            field: "tujuan",
            textAlign: "left",
            minWidth: '260px',
            customCell: (value, row) => {
                return (
                    <Row
                        verticalCenter
                    >
                        <Col>
                            <img
                                src={"/assets/icons/origin.svg"}
                                width={"20"}
                                height={"auto"}
                            />
                            <img
                                src={"/assets/icons/destination.svg"}
                                width={"20"}
                                height={"auto"}
                            />
                        </Col>
                        <Col
                            style={{
                                gap: "1rem"
                            }}
                        >
                            <span>
                                {row.asal}
                            </span>
                            <span>{value}</span>
                        </Col>

                    </Row>
                )
            }
        },
        {
            title: 'Harga',
            field: 'total_harga_normal',
            textAlign: 'right',
            minWidth: '100px',
            customCell: (value, row) => {

                return (
                    <Col>
                        {
                            row.discount == 0 && (
                                <span>{currency(row.harga)}</span>
                            )
                        }
                        {
                            row.discount > 0 && (
                                <>
                                    <span>{currency(row.harga - (row.discount / row.jumlah_penumpang))}</span>
                                    <strike>{row.harga}</strike>
                                    <span>{row.nama_promosi}</span>
                                </>
                            )
                        }
                    </Col>
                )
            }
        },
        {
            title: 'Cabang',
            field: 'nama_cabang',
            textAlign: 'left',
            minWidth: '100px',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: 'Pembayaran',
            field: 'metode_pembayaran',
            minWidth: '100px',
            textAlign: "left",
            customCell: (value, row) => {
                return (
                    <Col>
                        <span>{value}</span>
                        <strong>{row.penyedia_pembayaran}</strong>
                    </Col>
                )
            }
        },
        {
            title: 'Segmentasi',
            field: 'segmen',
            textAlign: 'left',
            minWidth: '100px',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: 'Lokasi',
            field: 'user_city',
            textAlign: 'left',
            minWidth: '100px',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title: '',
            field: 'id',
            textAlign: 'left',
            customCell: (value, row) => {

                 return (
                    <div>
                        <div
                        title={"Aksi"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setDropdown(row.id)
                        }}
                        >
                            <BsThreeDotsVertical/>
                        </div>

                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            
                            <div
                            className={styles.button_action}
                            onClick={() => {
                               _setPublishedTicketModalVisible(true)
                                 _setPublishedTicketModalData(row)
                            }}
                            >
                                <BsFillTicketPerforatedFill/>
                                <span>Terbitkan Tiket</span>
                            </div>

                            <div
                            className={styles.button_action}
                            onClick={() => {
                               window.location.href = DAMRI_APPS_URL+"/export/history/COMMUTER/"+row.id
                            }}
                            >
                                <BsCloudDownload/>
                                <span>Unduh Tiket</span>
                            </div>
                        </div>
                    </div>
                )

                // if (row.paymentStatus != "PAID" && !row.ticket && row.segmen != "AIRPORT" && row.tanggal_keberangkatan) {
                //     return (
                //         <Button
                //             title={'Terbitkan Tiket'}
                //             styles={Button.warning}
                //             onClick={() => {
                //                 _setPublishedTicketModalVisible(true)
                //                 _setPublishedTicketModalData(row)
                //             }}
                //             small
                //         />
                //     )
                // } else {
                //     return ''
                // }

            }
        }
    ]

    const __COLUMNS_QSS = [
        {
            title: 'Kode Booking',
            field: 'kode_booking',
            textAlign: 'center',
            minWidth: '120px'
        },
        {
            title: 'Tanggal Pembelian',
            field: 'tanggal_pembelian',
            textAlign: 'center',
            minWidth: '140px',
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title: 'Tanggal Keberangkatan',
            field: 'tanggal_keberangkatan',
            textAlign: 'center',
            minWidth: '150px',
            customCell: (value, row) => {
                return (value ? dateFilter.getMonthDate(new Date(value)) : "") + " " + (row.jam_keberangkatan ? row.jam_keberangkatan : "")
            }
        },
        {
            title: 'Trayek',
            field: 'trayek',
            textAlign: 'left',
            minWidth: '300px',
            customCell: (value, row) => {
                return (
                    <Col>
                        <strong>{row.kode_trayek}</strong>
                        <span>{value}</span>
                    </Col>
                )
            }
        },
        {
            title: 'Segmen',
            field: 'segmen',
            textAlign: 'center',
            minWidth: '100px'
        },
        {
            title: 'Harga',
            field: 'harga',
            textAlign: 'right',
            minWidth: '100px',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title: 'Penumpang',
            field: 'jumlah_penumpang',
            textAlign: 'center',
            minWidth: '70px'
        },
        {
            title: 'Total Harga',
            field: 'total_harga_stl_discount',
            textAlign: 'right',
            minWidth: '90px',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title: 'Status',
            field: 'payment_status',
            textAlign: 'center',
            minWidth: '100px',
            customCell: (value, row) => {

                return (
                    <Row
                        verticalCenter
                    >

                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": _statusPayment(value),
                                    "title": value,
                                    "value": true
                                }
                            ]}
                        />
                    </Row>
                )
            }
        },
        {
            title: 'Metode Pembayaran',
            field: 'metode_pembayaran',
            textAlign: 'left',
            minWidth: '150px',
            customCell: (value, row) => {
                return (
                    <Col>
                        <span>{value}</span>
                        <strong>{row.penyedia_pembayaran}</strong>
                    </Col>
                )
            }
        },
        {
            title: 'Cabang',
            field: 'nama_cabang',
            textAlign: 'left',
            minWidth: '120px'
        }
    ]

     const __COLUMNS_MPOS = [
        {
            title: 'Kode Booking',
            field: 'booking_code',
            textAlign: 'center',
            minWidth: '120px'
        },
        {
            title: 'Tanggal Pembelian',
            field: 'created_at',
            textAlign: 'center',
            minWidth: '140px',
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title: 'Tanggal Keberangkatan',
            field: 'departure_date',
            textAlign: 'center',
            minWidth: '150px',
            customCell: (value, row) => {
                return (value ? dateFilter.getMonthDate(new Date(value)) : "") + " " + row.departure_time
            }
        },
        {
            title: 'Bis',
            field: 'bus_name',
            textAlign: 'left',
            minWidth: '120px'
        },
        {
            title: 'Trayek',
            field: 'traject_name',
            textAlign: 'left',
            minWidth: '300px',
            customCell: (value, row) => {
                return (
                    <Col>
                        <strong>{row.traject_name}</strong>
                    </Col>
                )
            }
        },
        {
            title: 'Asal - Tujuan',
            field: 'origin_name',
            textAlign: 'center',
            minWidth: '100px',
            customCell: (value, row) => {
                return (
                    <span>{value + " - " + row.destination_name}</span>
                )
            }
        },
        {
            title: 'Status',
            field: 'payment_status',
            textAlign: 'center',
            minWidth: '100px',
            customCell: (value, row) => {

                return (
                    <Row
                        verticalCenter
                    >

                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": _statusPayment(value),
                                    "title": value,
                                    "value": true
                                }
                            ]}
                        />
                    </Row>
                )
            }
        },
        {
            title: 'Harga',
            field: 'total_amount',
            textAlign: 'right',
            minWidth: '100px',
            customCell: (value, row) => {
                return currency(parseInt(value) / row.quantity)
            }
        },
        {
            title: 'Penumpang',
            field: 'quantity',
            textAlign: 'center',
            minWidth: '70px'
        },
        {
            title: 'Total Harga',
            field: 'total_amount',
            textAlign: 'right',
            minWidth: '90px',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title: 'Metode Pembayaran',
            field: 'payment_provider_detail_name',
            textAlign: 'left',
            minWidth: '150px',
            customCell: (value, row) => {
                return (
                    <Col>
                        <span>{value}</span>
                    </Col>
                )
            }
        },
       
    ]

    const [_transactionList, _setTransactionList] = useState([])
    const [_filteredTransactionList, _setFilteredTransactionList] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_startDate, _setStartDate] = useState(new Date())
    const [_endDate, _setEndDate] = useState(new Date())
    const [_departureDate, _setDepartureDate] = useState("")
    const [_paymentRanges, _setPaymentRanges] = useState([
        {
            "id": "",
            "label": "Semua Penyedia"
        },
        {
            "id": 1,
            "label": "Midtrans"
        },
        {
            "id": 2,
            "label": "Damri"
        },
        {
            "id": 3,
            "label": "TSM"
        },
        {
            "id": 4,
            "label": "Faspay"
        },
        {
            "id": 5,
            "label": "Winpay"
        },
        {
            "id": 6,
            "label": "Bank Mandiri"
        },
    ])

    const [_paymentMethodRanges, _setPaymentMethodRanges] = useState([])
    const [_publishedTicketModalVisible, _setPublishedTicketModalVisible] = useState(false)
    const [_publishedTicketModalData, _setPublishedTicketModalData] = useState(null)

    const [_statusVoidRanges, _setStatusVoidRanges] = useState([
        {
            title: "Semua Status",
            value: ""
        },
        {
            title: "DIAJUKAN",
            value: "APPROVE"
        },
        {
            title: "TERBAYAR",
            value: "success"
        }
    ])

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Awal"}
                onClick={onClick}
                ref={ref}
                value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const EndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Akhir"}
                onClick={onClick}
                ref={ref}
                value={_endDate == "" ? "" : dateFilter.getMonthDate(_endDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[1],
        startFrom: 0,
    })

    const [_pageMpos, _setPageMpos] = useState({
        limit: Table.defaultProps.recordsPerPageValues[0],
        page: 1
    })


    useEffect(() => {
        _getData()
        _getPayment()
    }, [])

    useEffect(() => {
        _filterTransactionData(_transactionList)
    }, [_activeIndex, _transactionList])

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }

    async function _getData(pagination = _page) {
        _setIsProcessing(true)

        let params = {
            startDate: dateFilter.basicDate(_startDate).normal,
            endDate: dateFilter.basicDate(_endDate).normal,
            companyId: props.authData.companyId,
            sortMode: "desc",
            ...pagination
        }


        if (_activeIndex == "all") {
            if (_form.dateBySelected.value) params.dateBy = _form.dateBySelected.value
            if (_form.userSelected.value) params.userId = _form.userSelected.value
            if (_form.statusSelected.length > 0) params.paymentStatus = _form.statusSelected.map(s => s.payment_status).join(',')
            if (_form.paymentSelected.id) params.paymentProviderId = _form.paymentSelected.id
            if (_form.query) params.kodeBook = _form.query
            if (_form.paymentMethod != "Semua Pembayaran") params.paymentMethod = _form.paymentMethod
            if (_form.ticket) params.ticket = _form.ticket

        } else if(_activeIndex == "qss"){
            if (_form.dateBySelected.value) params.typeTransaction = _form.dateBySelected.value
            if (_form.statusSelected.length > 0) params.statusPayment = _form.statusSelected.map(s => s.title).join(',')

            delete params['length']
            delete params.sortMode
            delete params.startFrom
        } 

        try {
            let result

            if (_activeIndex == "qss") {
                result = await postJSON("/laporan/transaksi/penjualan/harian/qss/list", params, props.authData.token)
            } else if(_activeIndex == "mpos"){
                result = await get("/transaction/list?"+objectToParams(camelToSnakeCase(params)), props.authData.token)
            } else {
                result = await get("/monitoring/transaction/list?" + objectToParams(params), props.authData.token)
            }


            if (result.data) {
                _setTransactionList(result.data)
                _filterTransactionData(result.data)

                if(_activeIndex == "all"){
                    _setPaginationConfig({
                        recordLength: result.totalFiltered,
                        recordsPerPage: pagination.length,
                        activePage: (pagination.startFrom / pagination.length) + 1,
                        totalPages: Math.ceil(result.totalFiltered / pagination.length)
                    })
                    
                }else if(_activeIndex == "mpos"){
                    _setPaginationConfig({
                        recordLength: result.pagination.total,
                        recordsPerPage: pagination.length,
                        activePage: result.pagination.page,
                        totalPages: result.pagination.totalPages
                    })
                }

                
            }

            if (_activeIndex == "all") {

                let paymentRange = [
                    {
                        "name": "Semua Pembayaran",
                        "value": ""
                    },
                    ...result.paymentMethods.map(method => ({
                        name: method.title || method.name || method,
                        value: method.value || method
                    }))
                ]

                _setPaymentMethodRanges(paymentRange)
                _setStatusRange(result.paymentStatusTotals)

            }




            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 300
        }

        try {
            const branch = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let branchRange = [];
            branch.data.forEach(function (val, key) {

                if (key == 0) {
                    branchRange.push({
                        "title": "Semua Cabang",
                        "value": ""
                    })
                }

                branchRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setBranchRanges(branchRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getPayment() {
        const params = {
            "startFrom": 0,
            "length": 300,
            "counterId": "1"
        }

        try {
            const payment = await postJSON(`/masterData/counter/payment/list`, params, props.authData.token)

            payment.paymentList.map((val, key) => {
                if (val.name == "creditCard") {
                    val.name = "Credit Card"
                }
            })

            let paymentRange = [
                {
                    "name": "Semua Pembayaran",
                    "value": ""
                },
                ...payment?.paymentList
            ];

            _setPaymentMethodRanges(paymentRange)
        } catch (e) {
            console.log(e)
        }
    }

    function _statusPayment(data) {
        // added switch case data
        // Fungsi ini menerima status pembayaran dan mengembalikan label yang sesuai
        switch (data) {
            case "PAID":
                return "primary";
            case "PENDING":
                return "warning";
            case "FAILED":
                return "danger";
            case "EXPIRED":
                return "danger";
            case "CANCEL":
                return "danger";
            default:
                return data;
        }
    }

    async function _getUser(query) {
        const params = {
            "startFrom": 0,
            "length": 10,
            "sortMode": "desc",
            "orderBy": "idUser",
            "role_id": "1"
        }

        if (query) params.query = query

        try {
            const users = await postJSON('/masterData/userRoleAkses/user/list', params, props.authData.token)

            if (users.data) {
                const userSuggestions = users.data.map(user => ({
                    title: user.name + " " + (user?.phoneNumber || user?.email || ""),
                    value: user.id,
                    ...user
                }))
                _setUserSuggestions(userSuggestions)
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    function _getColumn(){
        if(_activeIndex == "all"){
            return __COLUMNS
        }else if(_activeIndex == "qss"){
            return __COLUMNS_QSS
        }else{
            return __COLUMNS_MPOS
        }
    }

    return (
        <Main>

            <PublishedTicketModal
                visible={_publishedTicketModalVisible}
                data={_publishedTicketModalData}
                closeModal={() => {
                    _setPublishedTicketModalVisible(false)
                    _setPublishedTicketModalData(null)
                }}
            />

            <AdminLayout
                headerContent={
                    <Tabs
                        activeIndex={_activeIndex}
                        tabs={[
                            {
                                title: 'Semua',
                                value: 'all',
                                onClick: () => {
                                    _setActiveIndex('all')
                                }
                            },
                            {
                                title: 'QSS',
                                value: 'qss',
                                isHide: props.authData?.username != "adminbisku" ? true : false,
                                onClick: () => {
                                    _setActiveIndex('qss')
                                }
                            },
                            {
                                title: 'MPOS',
                                value: 'mpos',
                                onClick: () => {
                                    _setActiveIndex('mpos')
                                }
                            },
                        ]} />
                }
            >

                <Card
                    noPadding
                >
                    <Row
                        withPadding
                    >

                        <Col
                            mobileFullWidth
                            withPadding
                            column={1}
                        >
                            <Input
                                withMargin
                                title={"Berdasarkan Tanggal"}
                                placeholder={'Pilih'}
                                value={_form.dateBySelected.title}
                                suggestions={_dateByRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "dateBySelected": value,
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            mobileFullWidth
                            withPadding
                            column={1}
                        >
                            <DatePicker
                                style={{
                                    width: "100%"
                                }}
                                selected={_startDate}
                                onChange={(date) => {
                                    _setStartDate(date)
                                }}
                                customInput={<CustomDatePicker />}
                            />
                        </Col>

                        <Col
                            mobileFullWidth
                            withPadding
                            column={1}
                        >
                            <DatePicker
                                style={{
                                    width: "100%"
                                }}
                                selected={_endDate}
                                onChange={(date) => {
                                    _setEndDate(date)
                                }}
                                customInput={<EndDatePicker />}
                            />
                        </Col>

                        {
                            _activeIndex == "all" && (
                                <>
                                    <Col
                                        withPadding
                                        mobileFullWidth
                                        column={2}
                                        style={{
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        <Input
                                            title={"Pengguna"}
                                            placeholder={'Cari pengguna...'}
                                            value={_form.userSelected.title}
                                            suggestions={_userSuggestions}
                                            suggestionField={'title'}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "userSelected": {
                                                        "title": value,
                                                        "value": ""
                                                    }
                                                })
                                                if (value.length > 2) {
                                                    _getUser(value)
                                                }
                                            }}
                                            onSuggestionSelect={(value) => {
                                                _updateQuery({
                                                    "userSelected": value,
                                                })
                                            }}
                                        />
                                        {_form.userSelected.title && (
                                            <div
                                                style={{
                                                    margin: ".5rem"
                                                }}
                                            >
                                                <Button
                                                    icon={<AiOutlineClose />}
                                                    styles={Button.danger}
                                                    onClick={() => {
                                                        _updateQuery({
                                                            "userSelected": {
                                                                "title": "",
                                                                "value": ""
                                                            }
                                                        })
                                                        _setUserSuggestions([])
                                                    }}
                                                    small
                                                />
                                            </div>

                                        )}
                                    </Col>

                                    <Col
                                        mobileFullWidth
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            withMargin
                                            title={"Penyedia Pembayaran"}
                                            placeholder={'Pilih penyedia pembayaran'}
                                            value={_form.paymentSelected.label}
                                            suggestions={_paymentRanges}
                                            suggestionField={'label'}
                                            onSuggestionSelect={(value) => {
                                                _updateQuery({
                                                    "paymentSelected": value,
                                                })
                                            }}
                                        />
                                    </Col>
                                    
                                    <Col
                                        mobileFullWidth
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            withMargin
                                            title={"Pembayaran"}
                                            placeholder={'Pilih Pembayaran'}
                                            value={_form.paymentMethod}
                                            suggestions={_paymentMethodRanges}
                                            suggestionField={'name'}
                                            onSuggestionSelect={(value) => {
                                                _updateQuery({
                                                    "paymentMethod": value.name,
                                                })
                                            }}
                                        />
                                    </Col>

                                    <Col
                                        mobileFullWidth
                                        withPadding
                                        column={2}
                                    >
                                        <Input
                                            withMargin
                                            title={"Kode Booking"}
                                            placeholder={'DMRxxx'}
                                            value={_form.query}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "query": value,
                                                })
                                            }}
                                        />
                                    </Col>

                                    <Col
                                        mobileFullWidth
                                        withPadding
                                        column={2}
                                    >
                                        <Input
                                            withMargin
                                            title={"Tiket"}
                                            placeholder={'Masukkan tiket'}
                                            value={_form.ticket}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "ticket": value,
                                                })
                                            }}
                                        />
                                    </Col>
                                </>
                            )
                        }

                        {
                            _activeIndex != "mpos" && (
                                <Col
                                column={5}
                                style={{
                                    margin: ".5rem"
                                }}
                                withPadding
                                >
                                    <span>Status Pembayaran</span>

                                    <div
                                    style={{
                                        gap: "1rem",
                                        flexWrap: "wrap",
                                        display: "flex",
                                        marginTop: "1rem",
                                    }}
                                    >
                                        {_statusRange.map((status, index) => {
                                            const isSelected = _form.statusSelected.some(s => s.payment_status === status.payment_status);
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            _updateQuery({
                                                                statusSelected: _form.statusSelected.filter(s => s.payment_status !== status.payment_status)
                                                            });
                                                        } else {
                                                            _updateQuery({
                                                                statusSelected: [..._form.statusSelected, status]
                                                            });
                                                        }
                                                    }}
                                                    style={{
                                                        padding: "0.5rem 1rem",
                                                        border: `2px solid ${isSelected ? '#007bff' : '#ddd'}`,
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        backgroundColor: isSelected ? '#e7f3ff' : '#fff',
                                                        transition: "all 0.2s",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        width: "fit-content"
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                    <span style={{ fontWeight: isSelected ? "600" : "400" }}>
                                                        {status.payment_status}
                                                    </span>
                                                    <span style={{
                                                        backgroundColor: '#f0f0f0',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {status?.total}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Col>
                            )
                        }
                        

                        <Col
                        column={1}
                        withMargin
                        style={{
                            display: "flex",
                            alignItems: "end",
                            padding: ".7rem"
                        }}
                        >
                            <div
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <Button
                                onProcess={_isProcessing}
                                title={'Terapkan'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _getData()
                                }}
                                small
                                />
                            </div>
                        </Col>
                    </Row>
                </Card>

                <Card
                    style={{
                        marginBottom: "5rem"
                    }}
                    noPadding
                >
                    <Table
                        config={_paginationConfig}
                        exportToXls={false}
                        isLoading={_isProcessing}
                        columns={_getColumn()}
                        records={_filteredTransactionList}
                        onRecordsPerPageChange={ (perPage) => {
                            _setPagination({ limit: perPage, page: 1 })
                        }}
                        onPageChange={ (page) => {
                            console.log(page)
                            _setPagination({ ..._pageMpos, page:  page })
                        }}
                    />
                </Card>


            </AdminLayout>
        </Main>
    )

}