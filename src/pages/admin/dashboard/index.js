import { useEffect, useState, forwardRef } from 'react'

import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS } from 'chart.js/auto'

import { auth, redirect } from '../../../utils/server-side-auth'
import { get, objectToParams, postJSON, API_ENDPOINT, SETTLEMENT_URL, TICKET_ORDER_URL } from '../../../api/utils'

import Main, { popAlert } from '../../../components/Main'
import AdminLayout from '../../../components/AdminLayout'
import Card from '../../../components/Card'
import { Col, Row } from '../../../components/Layout'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Table from '../../../components/Table'

import { currency, dateFilter } from '../../../utils/filters'

import styles from './Dashboard.module.scss'
import { getLocalStorage, setLocalStorage } from '../../../utils/local-storage'
import { AiFillCaretDown, AiFillCaretUp, AiOutlineClose, AiFillEye } from 'react-icons/ai'
import { BsArrowRight } from 'react-icons/bs'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import ActivityIndicator from '../../../components/ActivityIndicator'
import OccupancyModal from '../../../components/OccupancyModal'

export default function Dashboard(props) {

    const __DATA_CATEGORIES = [
        {
            title: 'Total Penumpang Tunai',
            key: 'quantityCash',
            icon: '/assets/icons/cash-passenger-summary.svg',
            transformValue: (value) => currency(value)
        },
        {
            title: 'Total Penumpang Non Tunai',
            key: 'quantityNonCash',
            icon: '/assets/icons/cash-passenger-summary.svg',
            transformValue: (value) => currency(value)
        },
        {
            title: <>
                <span>Total Pembayaran Tunai</span>
                <img
                    title={"Nilai Bruto (Harga Tiket)"}
                    src="/assets/icons/icon_information.svg"
                    width="15"
                    height="auto"
                    style={{
                        marginLeft: ".5rem"
                    }}
                />
            </>,
            key: 'amountCash',
            icon: '/assets/icons/cash-summary.svg',
            transformValue: (value) => currency(value, 'Rp ')
        },
        {
            title: <>
                <span>Total Pembayaran Non Tunai</span>
                <img
                    title={"Nilai Bruto (Harga Tiket)"}
                    src="/assets/icons/icon_information.svg"
                    width="15"
                    height="auto"
                    style={{
                        marginLeft: ".5rem"
                    }}
                />
            </>,
            key: 'amountNonCash',
            icon: '/assets/icons/cash-summary.svg',
            transformValue: (value) => currency(value, 'Rp ')
        }
    ]

    const __DATA_SELECT_CHART = [
        {
            title: "Total Penumpang",
            value: "pnp"
        },
        {
            title: "Total Pembayaran",
            value: "amount"
        }
    ]

    let __COLUMNS = [
        {
            title: 'Tanggal',
            field: 'created_at',
            customCell: (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {
            title: 'Serial Number',
            field: 'serial_number',
        },
        {
            title: 'Nominal',
            field: 'amount',
            textAlign: 'right',
            customCell: (value) => currency(value)
        },
        {
            title: 'Opsi',
            field: 'settlement_url',
            customCell: (value) => {
                return (
                    <Button
                        title={'Settle'}
                        onProcess={_isProcessing}
                        onClick={() => {
                            _settlePaid(value)
                        }}
                    />
                )
            }
        }
    ]

    const today = new Date()
    const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
    const [_settlement, _setSettlement] = useState([])
    const [_totalSettlement, _setTotalSettlement] = useState(0)
    const [_summary, _setSummary] = useState(_generateSummaryState)
    const [_renderChart, _setRenderChart] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_chartParams, _setChartParams] = useState({
        startDate: {
            value: dateFilter.basicDate(props.role_id == "9" ? today : lastWeek).normal,
            title: dateFilter.basicDate(props.role_id == "9" ? today : lastWeek).normal
        },
        endDate: {
            value: dateFilter.basicDate(today).normal,
            title: dateFilter.basicDate(today).normal
        }
    })

    const [_selectedDataCategoryPassenger, _setSelectedDataCategoryPassenger] = useState(__DATA_SELECT_CHART[0])
    const [_selectedDataCategory, _setSelectedDataCategory] = useState(__DATA_SELECT_CHART[0])
    const [_selectedDataCategoryPayment, _setSelectedDataCategoryPayment] = useState(__DATA_SELECT_CHART[0])

    const [_lineChartData, _setLineChartData] = useState({
        labels: [],
        data: {},
        dataPayment: [],
        labelPayment: [],
        dataPassenger: [],
        labelPassenger: []
    })

    const [_updateSelectChart, _setUpdateSelectChart] = useState({})
    const [_selectSales, _setSelectSales] = useState("pnp")
    const [_selectPayment, _setSelectPayment] = useState("pnp")
    const [_selectPassenger, _setSelectPassenger] = useState("pnp")
    const [_segmentRange, _setSegmentRange] = useState([
        {
            title: "Semua",
            value: "all",
            counterValue: "all"
        },
        {
            title: "AKAP",
            value: "akap",
            counterValue: "INTERCITY"
        },
        {
            title: "Pemadumoda",
            value: "commuter",
            counterValue: "COMMUTER"
        }
    ])

    const [_interval, _setInterval] = useState({
        title: 'Harian',
        value: 'daily'
    })

    const [_intervalRange, _setIntervalRange] = useState([
        {
            title: "Harian",
            value: "daily"
        },
        {
            title: "Mingguan",
            value: "weekly"
        },
        {
            title: "Bulanan",
            value: "monthly"
        },
        {
            title: "Tahunan",
            value: "yearly"
        }
    ])

    const [_channel, _setChannel] = useState({
        title: props.counter?.counterName ? "Counter" : "Semua",
        value: props.counter?.counterId ? '00' : ""
    })

    const [_channelRanges, _setChannelRanges] = useState([
        {
            title: 'Semua',
            value: ''
        },
        {
            title: 'User Apps',
            value: '0'
        },
        {
            title: 'Counter',
            value: '00'
        },
        {
            title: 'Web Reservasi',
            value: '000'
        }
    ])

    const [_counter, _setCounter] = useState({
        title: props.counter?.counterName ? props.counter.counterName : "Semua Loket",
        value: props.counter?.counterId ? `${props.counter.counterId}` : "00"
    })

    const [_counterRanges, _setCounterRanges] = useState([])
    const [_branchRanges, _setBranchRanges] = useState([])
    const [_branch, _setBranch] = useState({
        title: props.branch?.branchName ? props.branch.branchName : "Semua Cabang",
        value: props.branch?.branchId ? props.branch.branchId : ""
    })

    const [_typeTransactionRanges, _setTypeTransactionRanges] = useState([
        {
            title: 'Pembelian',
            value: 'transaction'
        },
        {
            title: 'Keberangkatan',
            value: 'departure'
        }
    ])

    const [_typeTransaction, _setTypeTransaction] = useState({
        title: "Pembelian",
        value: "transaction"
    })

    const [_accessMenu, _setAccessMenu] = useState({
        "AdminCabangAKAP": false,
        "Angkasapura": false,
        "Divre2": false,
        "selectedBranch": ""
    })

    const [_segment, _setSegment] = useState({
        title: 'Semua',
        value: 'all',
        counterValue: 'all'
    })

    const [_toggleSettlement, _setToggleSettlement] = useState(false)
    const [_userRegisteredDamriApps, _setUserRegisteredDamriApps] = useState({
        "dateRegister": [],
        "emailPhoneNumber": [],
        "email": [],
        "phoneNumber": [],
        "totalEmailPhoneNumber": 0,
        "totalEmail": 0,
        "totalPhone": 0
    })

    const [_paymentVendor, _setPaymentVendor] = useState({
        "totalPnp": 0,
        "totalAmountMIDTRANS": 0,
        "totalAmountDamri": 0,
        "totalAmountTsm": 0,
        "totalAmountFASPAY": 0,
        "totalAmountWINPAY": 0,
        "totalInsurance": 0,
        "dateTransaction": [],
        "MIDTRANS": [],
        "Damri": [],
        "Tsm": [],
        "FASPAY": [],
        "WINPAY": [],
        "BANK_MANIDIRI": []
    })

    const [_routeMostSelling, _setRouteMostSelling] = useState([])
    const [_routeMostSellingLowest, _setRouteMostSellingLowest] = useState([])
    const [_fareMostSelling, _setFareMostSelling] = useState([])

    const [_chartPassenger, _setChartPassenger] = useState({})
    const [_repeatOrder, _setRepeatOrder] = useState([])
    const [_passengerPurchase, _setPassengerPurchase] = useState({
        "name": [],
        "total": []
    })
    const [_trajectByPassenger, _setTrajectByPassenger] = useState({
        "traject": [],
        "male": [],
        "female": [],
        "unknown": []
    })

    const [_trajectRanges, _setTrajectRanges] = useState([]);
    const [_trajectSelected, _setTrajectSelected] = useState({
        "title": "Semua Rute",
        "value": ""
    })
    const [_dataExportVendor, _setDataExportVendor] = useState([])
    const [_startDate, _setStartDate] = useState(lastWeek)
    const [_endDate, _setEndDate] = useState(today)
    const [_startDateRoute, _setStartDateRoute] = useState(today)
    const [_endDateRoute, _setEndDateRoute] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
    const [_notifOccupancy, _setNotifOccupancy] = useState({})

    const DatePickRouteStart = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                title={"Dari"}
                onClick={onClick}
                ref={ref}
                value={_startDateRoute == "" ? "" : dateFilter.getMonthDate(_startDateRoute)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const DatePickRouteEnd = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                title={"Sampai"}
                onClick={onClick}
                ref={ref}
                value={_endDateRoute == "" ? "" : dateFilter.getMonthDate(_endDateRoute)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                inputWrapperClassName={styles.input}
                titleContainerClassName={styles.input_title}
                title={"Dari Tanggal"}
                onClick={onClick}
                ref={ref}
                value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
                onChange={(value) => {

                }}
            />

            {
                _startDate != "" && (
                    <div
                        style={{
                            display: "flex",
                            position: "absolute",
                            right: "10px",
                            bottom: "2px",
                        }}
                        onClick={() => {
                            _setStartDate("")
                        }}
                    >
                        <AiOutlineClose
                            title={"Reset"}
                            style={{
                                marginBottom: ".5rem",
                                color: "#fff"
                            }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    const CustomEndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                inputWrapperClassName={styles.input}
                titleContainerClassName={styles.input_title}
                title={"Ke Tanggal"}
                onClick={onClick}
                ref={ref}
                value={_endDate == "" ? "" : dateFilter.getMonthDate(_endDate)}
                onChange={(value) => {

                }}
            />

            {
                _endDate != "" && (
                    <div
                        style={{
                            display: "flex",
                            position: "absolute",
                            right: "10px",
                            bottom: "2px",
                        }}
                        onClick={() => {
                            _setEndDate("")
                        }}
                    >
                        <AiOutlineClose
                            title={"Reset"}
                            style={{
                                marginBottom: ".5rem",
                                color: "#fff"
                            }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    const [_dataExportPayment, _setDataExportPayment] = useState([])
    const [_typeRouteSearched, _setTypeRouteSearched] = useState([
        {
            "title": "Kursi tidak tersedia",
            "value": "KTT"
        },
        {
            "title": "Paling sering dicari",
            "value": "TPSDC"
        },
        {
            "title": "Tidak ada jadwal",
            "value": "TAJ"
        },
        {
            "title": "Transaksi Terendah",
            "value": ""
        }
    ])

    const [_activityRouteRange, _setActivityRouteRange] = useState([])
    const [_selectedRouteSearched, _setSelectedRouteSearched] = useState(_typeRouteSearched[0])
    const [_routeLowest, _setRouteLowest] = useState([])

    useEffect(() => {
        if(_updateSelectChart?.data){
            _updateChart()
        }
    }, [_updateSelectChart, _selectSales, _selectPayment, _selectPassenger])

    useEffect(() => {
        if (_branch.value == "1") {
            _setSegmentRange([
                {
                    title: "Pemadumoda",
                    value: "commuter",
                    counterValue: "COMMUTER"
                }
            ])
        } else {
            _setSegmentRange([
                {
                    title: "Semua",
                    value: "all",
                    counterValue: "all"
                },
                {
                    title: "AKAP",
                    value: "akap",
                    counterValue: "INTERCITY"
                },
                {
                    title: "Pemadumoda",
                    value: "commuter",
                    counterValue: "COMMUTER"
                }
            ])
        }
    }, [_branch])

    useEffect(() => {
        let filteredBranch = ""

        if (typeof window !== 'undefined') {
            // Perform localStorage action

            let storage = getLocalStorage("access_menu_damri")

            if (storage == null) {
                // window.location.href = "/sign-in"
            } else {
                const item = JSON.parse(storage)
                let access = {}

                if (item.length > 0) {
                    item.forEach(function (val, key) {
                        access[val.menu] = val.viewRole

                        if (val.menu == "Divre2" && val.viewRole) {
                            filteredBranch = val.apiLink
                            access.selectedBranch = val.apiLink
                        }
                    })
                }

                _setAccessMenu(access)
            }
        }


        if (props.role_id == "9") {
            _getReportCounter()
        } else {
            _getNotifOccupancy()
            // _resetNotifOccupancy()
            _applyFilter(filteredBranch)
            _setRenderChart(true)
            _getCounter()
            _getBranch(filteredBranch)
            _getTraject()
            _getActivityRoute()
            // _getRouteLowest()
        }

        // if (props.role_id == "2") {
        //     _getSettlement()
        // }

    }, [])

    useEffect(() => {
        if (props.role_id != "9" && !_accessMenu.Angkasapura) {
            _getTrajectByPassenger()
        }
    }, [_trajectSelected.value])

    useEffect(() => {
        _getActivityRoute()
    }, [_selectedRouteSearched, _startDateRoute, _endDateRoute])

    function _validateSegment() {
        //9: counter
        if (props.role_id == "9" || _accessMenu.AdminCabangAKAP) {
            return true
        } else {
            return false
        }
    }

    function _updateChartParams(field, value = { title: '', value: '' }) {
        _setChartParams(oldData => {
            return {
                ...oldData,
                [field]: value
            }
        })
    }

    function _generateSummaryState() {
        let state = {}
        __DATA_CATEGORIES.forEach(item => {
            state[item.key] = 0
        })
        return state
    }

    function _updateChart() {

        const result = _updateSelectChart?.data
        const resultPassenger = _chartPassenger

        let labels = []
        let data = []
        let backgroundColor = ["#FFAB5B", "#00879E", "#003092", "#0166fe", "#FDA604", "#39b666", "#ff5500", "#f32b5e", "#a29bfe", "#fd79a8", "#b2bec3", "#636e72", "#c0392b", "#f6e58d", "#7ed6df", "#FFF5C2", "#6DB9EF"]
        let dataPayment = []
        let labelPayment = []
        let pnpCash = 0
        let pnpNonCash = 0
        let amountCash = 0
        let amountNonCash = 0
        let dataPassenger = []
        let labelPassenger = []

        const genderTranslate = {
            "ELDERLY-FEMALE": "Wanita Lansia 70+",
            "ELDERLY-MALE": "Pria Lansia 70+",
            "CHILD-FEMALE": "Anak Perempuan",
            "CHILD-MALE": "Anak Laki-laki",
            "ADULT-FEMALE": "Wanita",
            "ADULT-MALE": "Pria"
        }

        if (result.transactions?.length > 0) {
            result.transactions.forEach(function (val, key) {

                if (_interval.value == "weekly") {
                    const date = val.dateTransaction.split(" - ")
                    labels.push(dateFilter.getMonthDate(new Date(date[0])) + " sd " + dateFilter.getMonthDate(new Date(date[1])))
                } else if (_interval.value == "yearly") {
                    labels.push(val.dateTransaction)
                }
                else {
                    labels.push(dateFilter.getMonthDate(new Date(val.dateTransaction)))
                }

                data.push(_selectSales == "pnp" ? parseInt(val.totalPnp) : (parseInt(val.totalAmountWithoutInsurance) + (parseInt(val?.totalDiscount || 0)) ))
            })
        }

        if (result.paymentMethods?.length > 0) {
            let totalPnp = 0
            let totalAmount = 0

            result.paymentMethods.forEach(function (val, key) {
                totalPnp += parseInt(val.totalPnp)
                totalAmount += (parseInt(val.totalAmountWithoutInsurance) + parseInt(val.totalDiscount))
            })

            result.paymentMethods.forEach(function (val, key) {
                if (val.pembayaran != null) {
                    labelPayment.push(val.pembayaran.replace("Virtual Account", "VA") + " " + (_selectPayment == "pnp" ? ((val.totalPnp / totalPnp) * 100).toFixed(2) + " %" : ((parseInt(val.totalAmountWithoutInsurance) / totalAmount) * 100).toFixed(2) + " %"))
                    dataPayment.push(_selectPayment == "pnp" ? val.totalPnp : (val.totalAmountWithoutInsurance + val.totalDiscount))

                    if (val.pembayaran == "Cash") {
                        pnpCash += val.totalPnp
                        amountCash += (parseInt(val.totalAmountWithoutInsurance) + parseInt(val?.totalDiscount || 0))
                    } else {
                       
                        pnpNonCash += val.totalPnp
                        amountNonCash += (parseInt(val.totalAmountWithoutInsurance) + parseInt(val?.totalDiscount || 0))
                    }
                }
            })
        }

        if (resultPassenger.length > 0) {

            resultPassenger.forEach(function (val, key) {
                if (val.age_gender != "null-null" && val.age_gender != "undefined-undefined") {
                    dataPassenger.push(_selectPassenger == "pnp" ? val.totalPnp : val.totalAmount)
                    labelPassenger.push(genderTranslate[val.age_gender])
                }
            })
        }

        let summary = {}
        let totalSummary = [pnpCash, pnpNonCash, amountCash, amountNonCash]

        __DATA_CATEGORIES.forEach((i, j) => {
            data[i.key] = []
            summary[i.key] = totalSummary[j]
        })

        _setSummary(summary)

        console.log("sumamr")
        console.log(data)

        _setLineChartData({
            data,
            labels,
            dataPayment,
            labelPayment,
            backgroundColor,
            dataPassenger,
            labelPassenger
        })
    }

    async function _resetNotifOccupancy() {

        const query = {
            "userId": props.authData?.id,
            "isRead": 0
        }

        try {
            const result = await postJSON("/masterData/broadcast/trajectOccupancyNotif/update", query, props.authData.token)

            if (result) {
                _getNotifOccupancy()
            }

        } catch (e) {
        } finally {

        }
    }

    async function _getNotifOccupancy() {

        const query = {
            "userId": props.authData?.id
        }

        try {
            const result = await postJSON("/masterData/broadcast/trajectOccupancyNotif/list", query, props.authData.token)

            if (result?.data.length > 0) {


                let filtered = []
                result.data.forEach(function (val, key) {
                    if (_compareDate(val.departure_date)) {
                        filtered.push(val)
                    }
                })

                let filteredDuplicate = filterDuplicates(filtered, "id")


                _setNotifOccupancy(filteredDuplicate)
                setLocalStorage("notif_occupancy", JSON.stringify(filteredDuplicate))
            }

        } catch (e) {
            popAlert({ message: e.message['id'] })
        } finally {

        }
    }

    function _compareDate(d2) {
        let dateNow = new Date();
        // Format dateNow as YYYY-MM-DD
        let year = dateNow.getFullYear();
        let month = String(dateNow.getMonth() + 1).padStart(2, '0');
        let day = String(dateNow.getDate()).padStart(2, '0');
        let formattedDateNow = `${year}-${month}-${day}`;

        let date1 = new Date(formattedDateNow).getTime();
        let date2 = new Date(d2).getTime();

        if (date2 >= date1) {
            return true
        } else {
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


    async function _getReportCounter() {
        _setIsProcessing(true)
        const query = {
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            paymentStatus: "PAID"
        }

        try {
            const result = await get({ url: TICKET_ORDER_URL + `/dashboard/transaction?${objectToParams(query)}` }, props.authData.token)
            let amountCash = 0
            let amountNonCash = 0
            let pnpCash = 0
            let pnpNonCash = 0

            if (result.data?.length > 0) {
                result.data.forEach(function (val, key) {
                    if (_segment.counterValue == "all" || _segment.counterValue == val.transactionType) {
                        if (val.paymentMethod == "Cash") {
                            pnpCash += val.quantity
                            amountCash += val.totalAmount
                        } else {
                            amountNonCash += val.totalAmount
                            pnpNonCash += val.quantity
                        }
                    }
                })
            }

            let summary = {}
            let totalSummary = [pnpCash, pnpNonCash, amountCash, amountNonCash]
            let data = []

            __DATA_CATEGORIES.forEach((i, j) => {
                data[i.key] = []
                summary[i.key] = totalSummary[j]
            })

            _setSummary(summary)

        } catch (e) {
            popAlert({ message: e.message['id'] })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _applyFilter(branch = "") {


        if (!_accessMenu.Angkasapura && props.role_id != "9" && !_accessMenu.Divre2) {
            _getUserDamriApps()
            _getVendorPayment()
            _getRouteMostSelling("asc")
            _getRouteMostSelling("desc")
            _getRouteMostSelling("desc", "amount")
            _getPassenger()
            _getRepeatOrder()
            _getPassengerPurchase()
        }

        if (props.role_id == "9") {
            _getReportCounter()
            return false
        } else {
            if (!_accessMenu.Angkasapura) {
                _getTrajectByPassenger()
            }
        }

        _setIsProcessing(true)

        try {
            let params = {
                startDate: _chartParams.startDate.value,
                endDate: _chartParams.endDate.value,
                intervalBy: _interval.value,
                modaBy: _segment.value,
                paymentMethod: "all",
                companyId: props.authData.companyId,
            }

            if (_channel.value != "") params.counterId = _channel.value
            if (_channel.value == "00") params.counterId = _counter.value
            if (_validateSegment()) params.modaBy = "akap"
            if (_branch.value != "") params.branchId = String(_branch.value)
            if (_typeTransaction.value != "") params.typeTransaction = _typeTransaction.value

            if (branch || _accessMenu.selectedBranch) {
                params.branchId = branch || _accessMenu.selectedBranch
            }

            const result = await postJSON(`/laporan/dashboard/list`, params, props.authData.token)

            _setUpdateSelectChart(result)

            document.getElementById('summary-data').scrollTop({
                behavior: 'smooth'
            })
        } catch (e) { }
        finally {
            _setIsProcessing(false)
        }
    }

    async function _getCounter() {
        const params = {
            startFrom: 0,
            length: 1560,
        }
        try {
            const counter = await postJSON('/masterData/counter/list', params, props.authData.token)
            let data = []

            if (!props.counter?.counterId) {

                if(counter?.data){
                    counter.data.forEach(function (val, key) {
                        if (key == 0) {
                            data.push({
                                "title": 'Semua Counter',
                                "value": "00"
                            })
                        }
                        data.push({
                            "title": val.name,
                            "value": `${val.id}`
                        })
                    })
                }
               
            } else {
                data.push({
                    "title": props.counter?.counterName,
                    "value": props.counter.counterId
                })
            }

            _setCounterRanges(data)
        } catch (e) {
            // popAlert({ message: e.message })
        }
    }

    async function _getBranch(filteredBranch = "") {
        const params = {
            startFrom: 0,
            length: 1560,
        }
        try {
            const branch = await postJSON('/masterData/branch/list', params, props.authData.token)
            let data = []

            branch.data.forEach(function (val, key) {
                if (key == 0) {
                    data.push({
                        "title": 'Semua Cabang',
                        "value": ""
                    })
                }

                if (filteredBranch) {

                    console.log("filre branc")
                    console.log(filteredBranch)
                    filteredBranch.split(",").forEach(function (i, j) {
                        if (parseInt(i) == val.id) {
                            data.push({
                                "title": val.name,
                                "value": val.id
                            })
                        }
                    })
                } else {
                    data.push({
                        "title": val.name,
                        "value": val.id
                    })
                }


            })
            _setBranchRanges(data)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _settlePaid(target) {
        _setIsProcessing(true)

        try {
            const res = await get({ url: "/api/api-server-side?url=" + target }, "", "")
            if (res.data?.transaction_id) {
                popAlert({ message: 'Settlement berhasil', type: 'success' })
                _getSettlement()
                _setIsProcessing(false)
            }

        } catch (e) {
            popAlert({ message: e.message })
            _setIsProcessing(false)
        }
    }

    async function _getSettlement() {

        try {
            const res = await get({ url: "/api/api-server-side?url=" + SETTLEMENT_URL + "/tsm/emoney/settlement/pending" }, "", "")

            if (res.data.length === 0) {
                // popAlert({ message : 'Tidak ada settlement pending', type : 'info' })
                _setSettlement([])
            } else {
                let total = 0
                res.data.forEach(function (val, key) {
                    total += parseInt(val.amount)
                })

                _setTotalSettlement(total)
                _setSettlement(res.data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getUserDamriApps() {
        const params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            intervalBy: _interval.value
        }
        try {
            const user = await postJSON('/laporan/dashboard/userregister/list', params, props.authData.token)
            let data = {
                "dateRegister": [],
                "emailPhoneNumber": [],
                "email": [],
                "phoneNumber": [],
                "totalEmailPhoneNumber": 0,
                "totalEmail": 0,
                "totalPhoneNumber": 0
            }

            user.data.forEach(function (val, key) {
                let dateRegist = dateFilter.getMonthDate(new Date(val.dateRegister))

                if (_interval.value == "yearly") {
                    dateRegist = val.dateRegister
                }

                data.dateRegister.push(dateRegist)
                data.emailPhoneNumber.push(val.emailPhoneNumber)
                data.email.push(val.email)
                data.phoneNumber.push(val.phoneNumber)

                data.totalEmailPhoneNumber += val.emailPhoneNumber
                data.totalEmail += val.email
                data.totalPhoneNumber += val.phoneNumber
            })

            _setUserRegisteredDamriApps(data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getVendorPayment() {
        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            intervalBy: _interval.value,
            modaBy: _segment.value,
            paymentMethod: "all",
        }

        if (_channel.value != "") params.counterId = _channel.value
        if (_channel.value == "00") params.counterId = _counter.value
        if (_validateSegment()) params.modaBy = "akap"
        if (_branch.value != "") params.branchId = _branch.value

        try {
            const report = await postJSON('/laporan/dashboard/vendor/list', params, props.authData.token)

            let data = {
                "totalPnp": 0,
                "totalAmountMIDTRANS": 0,
                "totalAmountDamri": 0,
                "totalAmountTsm": 0,
                "totalAmountFASPAY": 0,
                "totalAmountWINPAY": 0,
                "totalAmountBANK_MANDIRI": 0,
                "totalInsurance": 0,
                "dateTransaction": [],
                "MIDTRANS": [],
                "Damri": [],
                "Tsm": [],
                "FASPAY": [],
                "WINPAY": [],
                "BANK_MANDIRI": []
            }

            _setDataExportVendor(report.transaction)
            _setDataExportPayment(report.payment)

            if(report?.transaction){
                report.transaction.forEach(function (val, key) {
                    let dateTrx = dateFilter.getMonthDate(new Date(val.dateTransaction))

                    if (_interval.value == "yearly") {
                        dateTrx = val.dateTransaction
                    }

                    data.dateTransaction.push(dateTrx)
                })
            }

            

            data.dateTransaction = data.dateTransaction.filter(function (item, pos) {
                return data.dateTransaction.indexOf(item) == pos
            })

            data.dateTransaction.forEach(function (val, key) {

                let payment = {
                    "MIDTRANS": 0,
                    "Damri": 0,
                    "Tsm": 0,
                    "FASPAY": 0,
                    "WINPAY": 0,
                    "BANK_MANDIRI": 0
                }

                report.transaction.forEach(function (i, j) {
                    if (val == dateFilter.getMonthDate(new Date(i.dateTransaction))) {
                        payment[i.vendorPayment] += (i.totalDiscount + i.totalAmountWithoutInsurance)
                        data['totalAmount' + i.vendorPayment] += (i.totalDiscount + i.totalAmountWithoutInsurance)
                    }
                })

                for (const prop in payment) {
                    if (data?.[prop]) {
                        data[prop].push(payment[prop])
                    }
                }
            })

            _setPaymentVendor(data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getRouteMostSelling(sort, orderBy = "totalPnp") {
        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            intervalBy: _interval.value,
            modaBy: _segment.value,
            paymentMethod: "all",
            limit: 10,
            sortMode: sort,
            orderBy: orderBy
        }

        if (_channel.value != "") params.counterId = _channel.value
        if (_channel.value == "00") params.counterId = _counter.value
        if (_validateSegment()) params.modaBy = "akap"
        if (_branch.value != "") params.branchId = String(_branch.value)

        try {
            const report = await postJSON('/laporan/dashboard/bestseller/list', params, props.authData.token)

            if (orderBy == "totalPnp") {
                if (sort == "asc") {
                    _setRouteMostSellingLowest(report.data)
                } else {
                    _setRouteMostSelling(report.data)
                }
            }

            if (orderBy == "amount") {
                _setFareMostSelling(report.data)
            }


        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getPassenger() {

        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            intervalBy: _interval.value,
            modaBy: _segment.value,
            paymentMethod: "all",
        }

        if (_channel.value != "") params.counterId = _channel.value
        if (_channel.value == "00") params.counterId = _counter.value
        if (_validateSegment()) params.modaBy = "akap"
        if (_branch.value != "") params.branchId = _branch.value

        try {
            const report = await postJSON('/laporan/dashboard/genderage/list', params, props.authData.token)

            _setChartPassenger(report.data)

        } catch (e) {
            // Handle different error types

            popAlert({
                message: e.message?.sql ? 'An unexpected error occurred while fetching' : e.message,
                type: 'error'
            })
          
        }
    }

    async function _getRepeatOrder() {
        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            sortMode: "desc",
            startFrom: 0,
            length: 5
        }

        try {
            const report = await postJSON('/laporan/dashboard/dataPenumpang/repeatOrder/list', params, props.authData.token)

            _setRepeatOrder(report.data)

        } catch (e) {
            // Handle different error types

            popAlert({
                message: e.message?.sql ? 'An unexpected error occurred while fetching.' : e.message,
                type: 'error'
            })
          
        }
    }

    async function _getPassengerPurchase() {
        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            sortMode: "desc",
            startFrom: 0,
            length: 10
        }

        if (_branch.value != "") params.branchId = String(_branch.value)

        try {
            const report = await postJSON('/laporan/dashboard/dataPenumpang/purchase/list', params, props.authData.token)
            let data = {
                "name": [],
                "total": []
            }

            report.data.forEach(function (val, key) {
                data.name.push(val.nama)
                data.total.push(val.totalPurchase)
            })

            _setPassengerPurchase(data)

        } catch (e) {

            popAlert({
                message: e.message?.sql ? 'An unexpected error occurred while fetching' : e.message ,
                type: 'error'
            })
            
        }
    }

    async function _getActivityRoute() {


        const params = {
            "type": _selectedRouteSearched.value,
            "length": 50,
            "startDate": dateFilter.basicDate(_startDateRoute).normal,
            "endDate": dateFilter.basicDate(_endDateRoute).normal,
            "group": "departure_date"
        }

        if (_selectedRouteSearched.value != "") {

            _setIsProcessing(true)

            try {
                const route = await postJSON(`/laporan/dashboard/dataPencarian/list`, params, props.authData.token)
                if (route) {

                    if (_selectedRouteSearched.value != "TPSDC") {
                        route.data.sort(function (a, b) {
                            return parseFloat(a.count) - parseFloat(b.count)
                        })
                    }


                    _setActivityRouteRange(route.data)
                }
            } catch (e) {
                console.log(e)
            } finally {
                _setIsProcessing(false)
            }
        }
    }

    async function _getRouteLowest() {
        const params = {
            "companyId": props.authData.companyId,
            "sortMode": "asc",
            "startDate": _chartParams.startDate.value,
            "endDate": _chartParams.endDate.value
        }

        try {
            const route = await postJSON(`/laporan/transaksi/penjualan/traject/order/list`, params, props.authData.token)
            _setRouteLowest(route.data)
        } catch (e) {
            console.log(e)
        }
    }


    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 400,
            "companyId": props.authData.companyId,
        }

        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, props.authData.token)
            let trajectRange = [];
            traject.data.forEach(function (val, key) {

                if (key == 0) {
                    trajectRange.push({
                        "title": "Semua Rute",
                        "value": ""
                    })
                }

                trajectRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTrajectRanges(trajectRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTrajectByPassenger() {
        let params = {
            companyId: 1,
            startDate: _chartParams.startDate.value,
            endDate: _chartParams.endDate.value,
            limit: 10,
            paymentMethod: "all",
            // modaBy: _segment.value,
            modaBy: "akap",
            intervalBy: _interval.value,
        }

        if (_branch.value != "") params.branchId = _branch.value
        if (_validateSegment()) params.modaBy = "akap"
        if (_channel.value == "00") params.counterId = _counter.value
        if (_channel.value != "") params.counterId = _channel.value
        if (_trajectSelected.value != "") params.trajectId = _trajectSelected.value

        try {
            const report = await postJSON('/laporan/dashboard/bestSellerWithGender/list', params, props.authData.token)
            let data = {
                "traject": [],
                "male": [],
                "female": [],
                "unknown": []
            }

            report.data.forEach(function (val, key) {
                data.traject.push(val.originName + " - " + val.DestinationName)
                data.male.push(val.genderMale)
                data.female.push(val.genderFemale)
                data.unknown.push(val.genderUnknown)
            })

            _setTrajectByPassenger(data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    const __FILTER_INPUTS = [
        [
            {
                title: 'Berdasarkan Tanggal',
                field: 'typeTransaction',
                value: _typeTransaction.title,
                suggestions: _typeTransactionRanges,
                suggestionField: 'title',
                onSuggestionSelect: (value) => {
                    _setTypeTransaction(value)
                }
            },
            {
                title: 'Dari Tanggal',
                type: 'startDate',
                field: 'startDate',
                onChange: (value) => {
                    _updateChartParams('startDate', {
                        value: value,
                        title: value
                    })

                    console.log(value)
                }
            },
            {
                title: 'Ke Tanggal',
                type: 'endDate',
                field: 'endDate',
                onChange: (value) => {
                    _updateChartParams('endDate', {
                        value: value,
                        title: value
                    })
                }
            },
            {
                title: 'Interval',
                field: 'modaBy',
                value: _interval.title,
                suggestions: _intervalRange,
                suggestionField: 'title',
                isHide: props.role_id == "9" ? true : false,
                onSuggestionSelect: (value) => {
                    _setInterval(value)
                }
            },
        ],
        [
            {
                title: 'Cabang',
                field: 'branchId',
                value: _branch.title,
                suggestions: _branchRanges,
                suggestionField: 'title',
                isHide: props.branch?.branchId ? true : false,
                onSuggestionSelect: (value) => {
                    _setBranch(value)
                }
            },
            {
                title: 'Segmentasi',
                field: 'modaBy',
                value: _segment.title,
                suggestions: _segmentRange,
                suggestionField: 'title',
                isHide: _validateSegment() ? true : false,
                onSuggestionSelect: (value) => {
                    _setSegment(value)
                }
            },
            {
                title: 'Channel',
                field: 'channel',
                value: _channel.title,
                suggestions: _channelRanges,
                suggestionField: 'title',
                isHide: props.counter?.counterId ? true : false,
                onSuggestionSelect: (value) => {
                    _setChannel(value)
                }
            },
            {
                title: 'Counter',
                field: 'counter',
                value: _counter.title,
                suggestions: _counterRanges,
                suggestionField: 'title',
                onSuggestionSelect: (value) => {
                    _setCounter(value)
                },
                isHide: _channel.value == '00' ? false : true,
                col: 2
            },
            {
                input: () => {
                    return (
                        <Button
                            title={'Terapkan'}
                            styles={Button.secondary}
                            onClick={_applyFilter}
                            onProcess={_isProcessing}
                        />
                    )
                }
            }
        ]
    ]

    return (
        <Main>

            <OccupancyModal
                visible={_notifOccupancy.length > 0}
                closeModal={() => _setNotifOccupancy([])}
                data={_notifOccupancy}
            />

            <AdminLayout
                triggerNotif={false}
                headerContent={(
                    <>
                        {
                            __FILTER_INPUTS.map((row, key) => {
                                return (
                                    <Row
                                        key={key}
                                        marginBottom
                                        verticalEnd
                                    >
                                        {
                                            row.map((input, key2) => {
                                                if (!input.isHide) {
                                                    return (
                                                        <Col
                                                            key={key2}
                                                            column={input.col ? input.col : 1}
                                                            withPadding
                                                            mobileFullWidth
                                                        >

                                                            {
                                                                (input.type != "startDate" && input.type != "endDate") && (

                                                                    (input.input && input.type != "startDate" && input.type != "endDate")
                                                                        ? input.input()
                                                                        : (
                                                                            <Input
                                                                                inputWrapperClassName={styles.input}
                                                                                titleContainerClassName={styles.input_title}
                                                                                value={_chartParams[input.field]?.title}
                                                                                {...input}
                                                                            />
                                                                        )

                                                                )
                                                            }


                                                            {

                                                                input.type == "startDate" && (
                                                                    <DatePicker
                                                                        style={{
                                                                            width: "100%"
                                                                        }}
                                                                        selected={_startDate}
                                                                        onChange={(date) => {
                                                                            _setStartDate(date)
                                                                            _updateChartParams('startDate', {
                                                                                value: dateFilter.basicDate(date).normal,
                                                                                title: dateFilter.basicDate(date).normal
                                                                            })

                                                                        }}
                                                                        customInput={
                                                                            <CustomDatePicker />
                                                                        }
                                                                    />
                                                                )
                                                            }

                                                            {

                                                                input.type == "endDate" && (
                                                                    <DatePicker
                                                                        style={{
                                                                            width: "100%"
                                                                        }}
                                                                        selected={_endDate}
                                                                        onChange={(date) => {
                                                                            _setEndDate(date)
                                                                            _updateChartParams('endDate', {
                                                                                value: dateFilter.basicDate(date).normal,
                                                                                title: dateFilter.basicDate(date).normal
                                                                            })

                                                                        }}
                                                                        customInput={
                                                                            <CustomEndDatePicker />
                                                                        }
                                                                    />
                                                                )
                                                            }
                                                        </Col>
                                                    )
                                                }
                                            })
                                        }
                                    </Row>
                                )
                            })
                        }

                        <Row
                            id={'summary-data'}
                        >
                            {
                                __DATA_CATEGORIES.map((card, key) => {
                                    return (
                                        <div
                                            key={key}
                                            className={styles.summary_card_container}
                                        >
                                            <div
                                                className={styles.summary_card}
                                            >
                                                <Row
                                                    className={styles.summary_card_row}
                                                >
                                                    <Col
                                                        column={5}
                                                        withPadding
                                                        className={styles.summary}
                                                    >
                                                        <div>
                                                            <h5>
                                                                {card.title}
                                                            </h5>
                                                        </div>
                                                        <div>
                                                            <h3>
                                                                {card.transformValue ? card.transformValue(_summary[card.key]) : _summary[card.key]}
                                                            </h3>
                                                        </div>
                                                    </Col>
                                                    <Col
                                                        column={1}
                                                        className={styles.summary_icon_wrapper}
                                                    >
                                                        <div
                                                            className={styles.summary_icon}
                                                        >
                                                            <img
                                                                src={card.icon}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </Row>
                    </>
                )}
            >
                {
                    (props.role_id == "2" && _totalSettlement > 0) && (
                        <Card
                            fluidHeight
                            headerContent={
                                <Row>
                                    <Col
                                        withPadding
                                        column={5}
                                    >
                                        <div>Transaksi belum <i>settle</i> sebesar <strong>Rp{currency(_totalSettlement)}</strong></div>
                                    </Col>

                                    <Col
                                        withPadding
                                        mobileFullWidth
                                        justifyEnd
                                        column={1}
                                    >
                                        <Button
                                            title={"Detail"}
                                            iconRight={_toggleSettlement ? <AiFillCaretUp /> : <AiFillCaretDown />}
                                            styles={Button.success}
                                            small
                                            onClick={() => {
                                                _setToggleSettlement(!_toggleSettlement)
                                            }}
                                        />
                                    </Col>

                                </Row>
                            }
                        >
                            {
                                _toggleSettlement && (
                                    <Table
                                        headExport={[
                                            {
                                                title: 'Tanggal',
                                                value: 'created_at',
                                                customCell: (value) => dateFilter.convertISO(new Date(value), "date")
                                            },
                                            {
                                                title: 'Serial Number',
                                                value: 'serial_number',
                                            },
                                            {
                                                title: 'Nominal',
                                                value: 'amount',
                                            },
                                        ]}
                                        columns={__COLUMNS}
                                        records={_settlement}
                                        noPadding
                                    />
                                )
                            }

                        </Card>
                    )
                }

                {
                    props.role_id != "9" && (
                        <>
                            <Row>
                                <Col
                                    column={4}
                                >
                                    <Card
                                        title={'Penjualan'}
                                    >
                                        <Row
                                            marginBottom
                                        >
                                            <Col
                                                column={2}
                                            >
                                                <Input
                                                    value={_selectedDataCategory.title}
                                                    suggestions={__DATA_SELECT_CHART}
                                                    onSuggestionSelect={value => {
                                                        _setSelectedDataCategory(value)
                                                        _setSelectSales(value.value)
                                                    }}
                                                    suggestionSearch={false}
                                                />
                                            </Col>

                                            <Col
                                                column={1}
                                                withPadding
                                            >
                                                <Button
                                                    title={'Xlsx'}
                                                    styles={Button.success}
                                                    small
                                                    headExport={[
                                                        {
                                                            title: 'Tanggal',
                                                            value: 'dateTransaction'
                                                        },
                                                        {
                                                            title: 'Total Penumpang',
                                                            value: 'totalPnp'
                                                        },
                                                        {
                                                            title: 'Total Nominal',
                                                            value: 'totalAmount'
                                                        }
                                                    ]}
                                                    dataExport={_updateSelectChart.transaction}
                                                    titleExport={"Laporan-Penjualan-" + _chartParams.startDate.value + "-sd-" + _chartParams.endDate.value + ".xlsx"}
                                                />
                                            </Col>
                                        </Row>
                                        <Line
                                            datasetIdKey='id'
                                            options={{
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                },
                                                scales: {
                                                    x: {
                                                        grid: {
                                                            display: false
                                                        }
                                                    }
                                                }
                                            }}
                                            data={{
                                                labels: _lineChartData.labels,
                                                datasets: [
                                                    {
                                                        id: 1,
                                                        label: '',
                                                        data: _lineChartData.data,
                                                        fill: 'start',
                                                        borderCapStyle: 'round',
                                                        borderWidth: 4,
                                                        tension: 0.4,
                                                        backgroundColor: '#191b2540',
                                                        borderColor: props.company?.bgColor,
                                                    }
                                                ],
                                            }}
                                        />

                                        {
                                            _selectedDataCategory.value == "amount" && (
                                                <div
                                                    style={{
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    <small
                                                        style={{
                                                            color: "gray",
                                                        }}
                                                    >
                                                        Berdasarkan harga tiket
                                                    </small>
                                                </div>
                                            )
                                        }

                                    </Card>
                                </Col>

                                {
                                    !_accessMenu.Divre2 && (
                                        <Col
                                            column={2}
                                            mobileFullWidth
                                        >
                                            <Card
                                                title={"Aktifitas Rute"}
                                            >

                                                <Row>
                                                    <Col
                                                        withPadding
                                                        column={6}
                                                    >

                                                        <Col
                                                            column={5}
                                                            withPadding
                                                        >
                                                            <Input
                                                                value={_selectedRouteSearched.title}
                                                                suggestions={_typeRouteSearched}
                                                                onSuggestionSelect={value => {
                                                                    console.log(value)
                                                                    _setSelectedRouteSearched(value)
                                                                }}
                                                                suggestionSearch={false}
                                                            />
                                                        </Col>

                                                        {
                                                            _selectedRouteSearched.title != "Transaksi Terendah" && (
                                                                <>
                                                                    <div
                                                                        style={{
                                                                            margin: "1rem 0rem"
                                                                        }}
                                                                    >
                                                                        Tanggal Berangkat
                                                                    </div>

                                                                    <Row
                                                                    >
                                                                        <Col
                                                                            column={3}
                                                                        >
                                                                            <DatePicker
                                                                                style={{
                                                                                    width: "100%"
                                                                                }}
                                                                                selected={_startDateRoute}
                                                                                onChange={(date) => {
                                                                                    _setStartDateRoute(date)

                                                                                    console.log(date)

                                                                                }}
                                                                                customInput={<DatePickRouteStart />}
                                                                            />
                                                                        </Col>

                                                                        <Col
                                                                            column={3}
                                                                        >
                                                                            <DatePicker
                                                                                style={{
                                                                                    width: "100%"
                                                                                }}
                                                                                selected={_endDateRoute}
                                                                                onChange={(date) => {
                                                                                    _setEndDateRoute(date)
                                                                                }}
                                                                                customInput={<DatePickRouteEnd />}
                                                                            />
                                                                        </Col>
                                                                    </Row>

                                                                    {
                                                                        !_isProcessing && _activityRouteRange.length == 0 && (

                                                                            <Col
                                                                                center
                                                                                alignCenter
                                                                                style={{
                                                                                    marginTop: '1rem'
                                                                                }}
                                                                            >
                                                                                <small>Tidak ada rute</small>
                                                                            </Col>
                                                                        )
                                                                    }
                                                                </>
                                                            )
                                                        }





                                                        {
                                                            _isProcessing && (
                                                                <Col
                                                                    center
                                                                    alignCenter
                                                                    style={{
                                                                        marginTop: '1rem'
                                                                    }}
                                                                >
                                                                    <small>
                                                                        <i>
                                                                            Memuat data...
                                                                        </i>
                                                                    </small>
                                                                    <br />
                                                                    <ActivityIndicator
                                                                        dark
                                                                    />
                                                                </Col>
                                                            )
                                                        }

                                                        {
                                                            _selectedRouteSearched.title != "Transaksi Terendah" && (
                                                                <div
                                                                    style={{
                                                                        height: "440px",
                                                                        overflow: "auto"
                                                                    }}
                                                                >

                                                                    {
                                                                        _activityRouteRange.map((val, key) => {
                                                                            return (
                                                                                <Row
                                                                                    className={styles.traject_container}
                                                                                >
                                                                                    <Col
                                                                                        ignoreScreenSize
                                                                                        column={1}
                                                                                        style={{
                                                                                            display: "grid"
                                                                                        }}
                                                                                    >
                                                                                        <img src="/assets/icons/origin.svg" width="40" />
                                                                                        <img src="/assets/icons/destination.svg" width="40" />
                                                                                    </Col>

                                                                                    <Col
                                                                                        ignoreScreenSize
                                                                                        column={4}
                                                                                    >
                                                                                        <div>
                                                                                            <span>{val.origin_point_name}</span>
                                                                                            <small>{dateFilter.getMonthDate(new Date(val.departure_date))}</small>
                                                                                        </div>

                                                                                        <span>{val.destination_point_name}</span>
                                                                                    </Col>

                                                                                    <Col
                                                                                        column={1}
                                                                                        alignCenter
                                                                                        justifyCenter
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                textAlign: "center"
                                                                                            }}
                                                                                        >
                                                                                            <AiFillEye />
                                                                                            <strong>{val.count}</strong>
                                                                                        </div>
                                                                                    </Col>
                                                                                </Row>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>
                                                            )
                                                        }

                                                        {
                                                            _selectedRouteSearched.title == "Transaksi Terendah" && (
                                                                <div
                                                                    style={{
                                                                        height: "440px",
                                                                        overflow: "auto"
                                                                    }}
                                                                >
                                                                    {
                                                                        _routeLowest.map((val, key) => {
                                                                            return (
                                                                                <Row
                                                                                    withPadding
                                                                                    className={styles.traject_container}
                                                                                    style={{
                                                                                        borderBottom: "1px solid black"
                                                                                    }}
                                                                                >


                                                                                    <Col
                                                                                        ignoreScreenSize
                                                                                        column={5}
                                                                                    >
                                                                                        <span>{val.traject_code}</span>

                                                                                        <span>{val.traject_name}</span>
                                                                                    </Col>

                                                                                    <Col
                                                                                        column={1}
                                                                                        alignCenter
                                                                                        justifyCenter
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                textAlign: "center"
                                                                                            }}
                                                                                        >
                                                                                            <strong>{val.count}</strong>
                                                                                        </div>
                                                                                    </Col>
                                                                                </Row>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>

                                                            )
                                                        }


                                                    </Col>


                                                </Row>



                                            </Card>
                                        </Col>
                                    )
                                }

                            </Row>

                            {
                                (props.role_id != "9" && !_accessMenu.Angkasapura && !_accessMenu.Divre2) && (
                                    <>
                                        <Row>

                                            {
                                                !props.branch?.branchId && (
                                                    <Col
                                                        column={4}
                                                    >
                                                        <Card
                                                            title={'Penyedia Pembayaran'}
                                                        >

                                                            <Row
                                                                spaceBetween
                                                                className={styles.summary_user_registered}
                                                            >
                                                                <Col
                                                                    justifyStart
                                                                    withPadding
                                                                >
                                                                    <div>
                                                                        <aside
                                                                            style={{
                                                                                backgroundColor: "#033D82",
                                                                            }}
                                                                        >
                                                                        </aside>

                                                                        <div
                                                                            style={{
                                                                                display: "grid"
                                                                            }}
                                                                        >
                                                                            <small>Internal PO</small>
                                                                            <strong>{currency(_paymentVendor.totalAmountDamri, "Rp")}</strong>
                                                                        </div>
                                                                    </div>

                                                                </Col>

                                                                <Col
                                                                    justifyStart
                                                                    withPadding
                                                                >
                                                                    <div>
                                                                        <aside
                                                                            style={{
                                                                                backgroundColor: "#5180F0",
                                                                            }}
                                                                        >
                                                                        </aside>

                                                                        <div
                                                                            style={{
                                                                                display: "grid"
                                                                            }}
                                                                        >
                                                                            <small>Midtrans</small>
                                                                            <strong>{currency(_paymentVendor.totalAmountMIDTRANS, "Rp")}</strong>
                                                                        </div>
                                                                    </div>

                                                                </Col>

                                                                <Col
                                                                    justifyStart
                                                                    withPadding
                                                                >
                                                                    <div>
                                                                        <aside
                                                                            style={{
                                                                                backgroundColor: "#E19E00",
                                                                            }}
                                                                        >
                                                                        </aside>

                                                                        <div
                                                                            style={{
                                                                                display: "grid"
                                                                            }}
                                                                        >
                                                                            <small>TSM</small>
                                                                            <strong><strong>{currency(_paymentVendor.totalAmountTsm, "Rp")}</strong> </strong>
                                                                        </div>
                                                                    </div>

                                                                </Col>


                                                            </Row>

                                                            <Row
                                                                marginBottom
                                                                spaceBetween
                                                                className={styles.summary_user_registered}
                                                            >
                                                                <Col
                                                                    justifyStart
                                                                    withPadding
                                                                >
                                                                    <div>
                                                                        <aside
                                                                            style={{
                                                                                backgroundColor: "#F4EA22",
                                                                            }}
                                                                        >
                                                                        </aside>

                                                                        <div
                                                                            style={{
                                                                                display: "grid"
                                                                            }}
                                                                        >
                                                                            <small>FASPAY</small>
                                                                            <strong><strong>{currency(_paymentVendor.totalAmountFASPAY, "Rp")}</strong> </strong>
                                                                        </div>
                                                                    </div>

                                                                </Col>

                                                                {
                                                                    _paymentVendor.totalAmountWINPAY > 0 && (
                                                                        <Col
                                                                            justifyStart
                                                                            withPadding
                                                                        >
                                                                            <div>
                                                                                <aside
                                                                                    style={{
                                                                                        backgroundColor: "#39b666",
                                                                                    }}
                                                                                >
                                                                                </aside>

                                                                                <div
                                                                                    style={{
                                                                                        display: "grid"
                                                                                    }}
                                                                                >
                                                                                    <small>WINPAY</small>
                                                                                    <strong><strong>{currency(_paymentVendor.totalAmountWINPAY, "Rp")}</strong> </strong>
                                                                                </div>
                                                                            </div>

                                                                        </Col>
                                                                    )
                                                                }

                                                                {
                                                                    _paymentVendor.totalAmountBANK_MANDIRI > 0 && (
                                                                        <Col
                                                                            justifyStart
                                                                            withPadding
                                                                        >
                                                                            <div>
                                                                                <aside
                                                                                    style={{
                                                                                        backgroundColor: "#f32b5e",
                                                                                    }}
                                                                                >
                                                                                </aside>

                                                                                <div
                                                                                    style={{
                                                                                        display: "grid"
                                                                                    }}
                                                                                >
                                                                                    <small>Bank Mandiri (QRIS Tap)</small>
                                                                                    <strong><strong>{currency(_paymentVendor.totalAmountBANK_MANDIRI, "Rp")}</strong> </strong>
                                                                                </div>
                                                                            </div>

                                                                        </Col>
                                                                    )
                                                                }
                                                            </Row>

                                                            <div
                                                                style={{
                                                                    marginBottom: "1rem"
                                                                }}
                                                            >
                                                                <Button
                                                                    title={'Xlsx'}
                                                                    styles={Button.success}
                                                                    small
                                                                    headExport={[
                                                                        {
                                                                            title: 'Tanggal',
                                                                            value: 'dateTransaction'
                                                                        },
                                                                        {
                                                                            title: 'Penyedia',
                                                                            value: 'vendorPayment'
                                                                        },
                                                                        {
                                                                            title: 'Total Diskon',
                                                                            value: 'totalDiscount'
                                                                        },
                                                                        {
                                                                            title: 'Total Pembayaran',
                                                                            value: 'totalAmountWithoutInsurance'
                                                                        }
                                                                    ]}
                                                                    dataExport={_dataExportVendor}
                                                                    titleExport={"Penyedia-Pembayaran" + _chartParams.startDate.value + "-sd-" + _chartParams.endDate.value + ".xlsx"}
                                                                />
                                                            </div>


                                                            <Bar
                                                                datasetIdKey='id'
                                                                options={{
                                                                    plugins: {
                                                                        legend: {
                                                                            display: false
                                                                        }
                                                                    },
                                                                    scales: {
                                                                        x: {
                                                                            grid: {
                                                                                display: false
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                                data={{
                                                                    labels: _paymentVendor.dateTransaction,
                                                                    datasets: [
                                                                        {
                                                                            id: 1,
                                                                            label: 'Damri',
                                                                            data: _paymentVendor.Damri,
                                                                            fill: 'start',
                                                                            borderCapStyle: 'round',
                                                                            tension: 0.4,
                                                                            backgroundColor: '#033D82',
                                                                        },
                                                                        {
                                                                            id: 2,
                                                                            label: 'Midtrans',
                                                                            data: _paymentVendor.MIDTRANS,
                                                                            fill: 'start',
                                                                            borderCapStyle: 'round',
                                                                            tension: 0.4,
                                                                            backgroundColor: '#5180F0',
                                                                        },
                                                                        {
                                                                            id: 3,
                                                                            label: 'TSM',
                                                                            data: _paymentVendor.Tsm,
                                                                            fill: 'start',
                                                                            borderCapStyle: 'round',
                                                                            tension: 0.4,
                                                                            backgroundColor: '#E19E00',
                                                                        },
                                                                        {
                                                                            id: 4,
                                                                            label: 'FASPAY',
                                                                            data: _paymentVendor.FASPAY,
                                                                            fill: 'start',
                                                                            borderCapStyle: 'round',
                                                                            tension: 0.4,
                                                                            backgroundColor: '#F4EA22',
                                                                        },
                                                                        {
                                                                            id: 5,
                                                                            label: 'WINPAY',
                                                                            data: _paymentVendor.WINPAY,
                                                                            fill: 'start',
                                                                            borderCapStyle: 'round',
                                                                            tension: 0.4,
                                                                            backgroundColor: '#39b666',
                                                                        }
                                                                    ],
                                                                }}
                                                            />

                                                        </Card>
                                                    </Col>
                                                )
                                            }

                                            <Col
                                                column={2}
                                                mobileFullWidth
                                            >

                                                <Card
                                                    title={'Pembayaran'}
                                                    fluidHeight
                                                >
                                                    <Row
                                                        marginBottom
                                                    >
                                                        <Col
                                                            column={5}
                                                            withPadding
                                                        >
                                                            <Input
                                                                value={_selectedDataCategoryPayment.title}
                                                                suggestions={__DATA_SELECT_CHART}
                                                                onSuggestionSelect={value => {
                                                                    _setSelectedDataCategoryPayment(value)
                                                                    _setSelectPayment(value.value)
                                                                }}
                                                                suggestionSearch={false}
                                                            />
                                                        </Col>

                                                        <Col
                                                            column={1}
                                                            withPadding
                                                        >
                                                            <Button
                                                                title={'Xlsx'}
                                                                styles={Button.success}
                                                                small
                                                                headExport={[
                                                                    {
                                                                        title: 'Pembayaran',
                                                                        value: 'pembayaran'
                                                                    },
                                                                    {
                                                                        title: 'Penyedia',
                                                                        value: 'vendorPayment'
                                                                    },
                                                                    {
                                                                        title: 'Total Penumpang',
                                                                        value: 'totalPnp'
                                                                    },
                                                                    {
                                                                        title: 'Total Nominal',
                                                                        value: 'totalAmountWithoutInsurance',
                                                                        customCell: (value, row) => {
                                                                            return value + row.totalDiscount
                                                                        }
                                                                    }
                                                                ]}
                                                                dataExport={_dataExportPayment}
                                                                titleExport={"Laporan-Pembayaran-" + _chartParams.startDate.value + "-sd-" + _chartParams.endDate.value + ".xlsx"}
                                                            />
                                                        </Col>
                                                    </Row>

                                                    <Doughnut
                                                        datasetIdKey='id'
                                                        data={{
                                                            labels: _lineChartData.labelPayment,
                                                            position: 'bottom',
                                                            datasets: [
                                                                {
                                                                    // id: 1,
                                                                    label: '',
                                                                    data: _lineChartData.dataPayment,
                                                                    backgroundColor: _lineChartData.backgroundColor,
                                                                    // maxBarThickness : 10,
                                                                    // borderColor : props.company.bgcolor,
                                                                    // stack : true,
                                                                }
                                                            ],
                                                        }}
                                                    />

                                                    {
                                                        _selectedDataCategoryPayment.value == "amount" && (
                                                            <div
                                                                style={{
                                                                    textAlign: "center"
                                                                }}
                                                            >
                                                                <small
                                                                    style={{
                                                                        color: "gray",
                                                                    }}
                                                                >
                                                                    Berdasarkan harga tiket
                                                                </small>
                                                            </div>
                                                        )
                                                    }

                                                </Card>

                                            </Col>
                                        </Row>


                                        {
                                            !props.branch?.branchId && (

                                                <div
                                                style={{
                                                    display: "none"
                                                }}
                                                >
                                                    <Row>
                                                        <Col
                                                            column={4}
                                                        >
                                                            <Card
                                                                title={'Pengguna terdaftar User Apps'}
                                                            >

                                                                <Row
                                                                    marginBottom
                                                                    spaceBetween
                                                                    className={styles.summary_user_registered}
                                                                >
                                                                    <Col
                                                                        column={2}
                                                                        justifyStart
                                                                    >
                                                                        <div>
                                                                            <aside
                                                                                style={{
                                                                                    backgroundColor: "#ED4037",
                                                                                }}
                                                                            >
                                                                            </aside>

                                                                            <div
                                                                                style={{
                                                                                    display: "grid"
                                                                                }}
                                                                            >
                                                                                <small>Email + No Telepon</small>
                                                                                <strong>{_userRegisteredDamriApps.totalEmailPhoneNumber}</strong>
                                                                            </div>
                                                                        </div>

                                                                    </Col>

                                                                    <Col
                                                                        column={2}
                                                                        justifyStart
                                                                    >
                                                                        <div>
                                                                            <aside
                                                                                style={{
                                                                                    backgroundColor: "#E19E00",
                                                                                }}
                                                                            >
                                                                            </aside>

                                                                            <div
                                                                                style={{
                                                                                    display: "grid"
                                                                                }}
                                                                            >
                                                                                <small>Email</small>
                                                                                <strong>{_userRegisteredDamriApps.totalEmail}</strong>
                                                                            </div>
                                                                        </div>

                                                                    </Col>

                                                                    <Col
                                                                        column={2}
                                                                        justifyStart
                                                                    >
                                                                        <div>
                                                                            <aside
                                                                                style={{
                                                                                    backgroundColor: "#F4EA22",
                                                                                }}
                                                                            >
                                                                            </aside>

                                                                            <div
                                                                                style={{
                                                                                    display: "grid"
                                                                                }}
                                                                            >
                                                                                <small>No Telepon</small>
                                                                                <strong><strong>{_userRegisteredDamriApps.totalPhoneNumber}</strong> </strong>
                                                                            </div>
                                                                        </div>

                                                                    </Col>
                                                                </Row>

                                                                <Bar
                                                                    datasetIdKey='id'
                                                                    options={{
                                                                        plugins: {
                                                                            legend: {
                                                                                display: false
                                                                            }
                                                                        },
                                                                        scales: {
                                                                            x: {
                                                                                grid: {
                                                                                    display: false
                                                                                }
                                                                            }
                                                                        }
                                                                    }}
                                                                    data={{
                                                                        labels: _userRegisteredDamriApps.dateRegister,
                                                                        datasets: [
                                                                            {
                                                                                id: 1,
                                                                                label: 'Email + No Telepon',
                                                                                data: _userRegisteredDamriApps.emailPhoneNumber,
                                                                                fill: 'start',
                                                                                borderCapStyle: 'round',
                                                                                tension: 0.4,
                                                                                backgroundColor: '#ED4037',
                                                                            },
                                                                            {
                                                                                id: 2,
                                                                                label: 'Email',
                                                                                data: _userRegisteredDamriApps.email,
                                                                                fill: 'start',
                                                                                borderCapStyle: 'round',
                                                                                tension: 0.4,
                                                                                backgroundColor: '#E19E00',
                                                                            },
                                                                            {
                                                                                id: 3,
                                                                                label: 'No Telepon',
                                                                                data: _userRegisteredDamriApps.phoneNumber,
                                                                                fill: 'start',
                                                                                borderCapStyle: 'round',
                                                                                tension: 0.4,
                                                                                backgroundColor: '#F4EA22',
                                                                            }
                                                                        ],
                                                                    }}
                                                                />

                                                            </Card>
                                                        </Col>




                                                    </Row>

                                                    <Row>
                                                        <Col
                                                            column={2}
                                                        >
                                                            <Card
                                                                title={"10 Penjualan Rute Terbesar"}
                                                            >
                                                                {
                                                                    _routeMostSelling.map(function (val, key) {
                                                                        return (
                                                                            <Row
                                                                                key={key}
                                                                                marginBottom={key < (_routeMostSelling.length - 1) ? true : false}
                                                                            >
                                                                                <Col
                                                                                    column={1}
                                                                                >
                                                                                    <h2>{key + 1}</h2>
                                                                                </Col>

                                                                                <Col
                                                                                    style={{
                                                                                        width: "100%"
                                                                                    }}
                                                                                    column={5}
                                                                                >
                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                            alignEnd
                                                                                        >
                                                                                            <span>{val.originCode}</span>
                                                                                            <small
                                                                                                style={{
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                {val.originName}
                                                                                            </small>
                                                                                        </Col>

                                                                                        <BsArrowRight
                                                                                            style={{
                                                                                                margin: "0rem 1rem"
                                                                                            }}
                                                                                            size={21}
                                                                                        />

                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                        >
                                                                                            <span>{val.DestinationCode}</span>
                                                                                            <small>{val.DestinationName}</small>
                                                                                        </Col>
                                                                                    </Row>

                                                                                    <hr />

                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Tiket.svg" />

                                                                                            <div
                                                                                                style={{
                                                                                                    marginLeft: ".4rem",
                                                                                                    display: "grid",
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                <span>
                                                                                                    {val.totalPnp} Tiket
                                                                                                </span>

                                                                                                {/* <small
                                                                                            style={{
                                                                                                color: "gray"
                                                                                            }}
                                                                                            >
                                                                                                {currency(val.amount, "Rp")}
                                                                                            </small> */}
                                                                                            </div>
                                                                                        </Col>

                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Uang.svg" />

                                                                                            <span
                                                                                                style={{
                                                                                                    marginLeft: ".4rem"
                                                                                                }}
                                                                                            >
                                                                                                {/* {currency(val.totalAmountWithoutInsurance + val.totalDiscount, "Rp")} */}
                                                                                                {currency(val.amount, "Rp")}
                                                                                            </span>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>
                                                                            </Row>
                                                                        )
                                                                    })
                                                                }

                                                            </Card>
                                                        </Col>

                                                        <Col
                                                            column={2}
                                                        >
                                                            <Card
                                                                title={"10 Penjualan Rute Terendah"}
                                                            >
                                                                {
                                                                    _routeMostSellingLowest.map(function (val, key) {
                                                                        return (
                                                                            <Row
                                                                                key={key}
                                                                                marginBottom={key < (_routeMostSellingLowest.length - 1) ? true : false}
                                                                            >
                                                                                <Col
                                                                                    column={1}
                                                                                >
                                                                                    <h2>{key + 1}</h2>
                                                                                </Col>

                                                                                <Col
                                                                                    style={{
                                                                                        width: "100%"
                                                                                    }}
                                                                                    column={5}
                                                                                >
                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                            alignEnd
                                                                                        >
                                                                                            <span>{val.originCode}</span>
                                                                                            <small
                                                                                                style={{
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                {val.originName}
                                                                                            </small>
                                                                                        </Col>

                                                                                        <BsArrowRight
                                                                                            style={{
                                                                                                margin: "0rem 1rem"
                                                                                            }}
                                                                                            size={21}
                                                                                        />

                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                        >
                                                                                            <span>{val.DestinationCode}</span>
                                                                                            <small>{val.DestinationName}</small>
                                                                                        </Col>
                                                                                    </Row>

                                                                                    <hr />

                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Tiket.svg" />

                                                                                            <div
                                                                                                style={{
                                                                                                    marginLeft: ".4rem",
                                                                                                    display: "grid",
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                <span>
                                                                                                    {val.totalPnp} Tiket
                                                                                                </span>

                                                                                                {/* <small
                                                                                            style={{
                                                                                                color: "gray"
                                                                                            }}
                                                                                            >
                                                                                                {currency(val.amount, "Rp")}
                                                                                            </small> */}
                                                                                            </div>
                                                                                        </Col>

                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Uang.svg" />

                                                                                            <span
                                                                                                style={{
                                                                                                    marginLeft: ".4rem"
                                                                                                }}
                                                                                            >
                                                                                                {/* {currency(val.totalAmountWithoutInsurance + val.totalDiscount, "Rp")} */}
                                                                                                {currency(val.amount, "Rp")}
                                                                                            </span>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>
                                                                            </Row>
                                                                        )
                                                                    })
                                                                }

                                                            </Card>
                                                        </Col>

                                                        <Col
                                                            column={2}
                                                        >
                                                            <Card
                                                                title={"10 Penjualan Tarif Terbesar"}
                                                            >
                                                                {
                                                                    _fareMostSelling.map(function (val, key) {
                                                                        return (
                                                                            <Row
                                                                                key={key}
                                                                                marginBottom={key < (_fareMostSelling.length - 1) ? true : false}
                                                                            >
                                                                                <Col
                                                                                    column={1}
                                                                                >
                                                                                    <h2>{key + 1}</h2>
                                                                                </Col>

                                                                                <Col
                                                                                    style={{
                                                                                        width: "100%"
                                                                                    }}
                                                                                    column={5}
                                                                                >
                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                            alignEnd
                                                                                        >
                                                                                            <span>{val.originCode}</span>
                                                                                            <small
                                                                                                style={{
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                {val.originName}
                                                                                            </small>
                                                                                        </Col>

                                                                                        <BsArrowRight
                                                                                            style={{
                                                                                                margin: "0rem 1rem"
                                                                                            }}
                                                                                            size={21}
                                                                                        />

                                                                                        <Col
                                                                                            withPadding
                                                                                            justifyCenter
                                                                                        >
                                                                                            <span>{val.DestinationCode}</span>
                                                                                            <small>{val.DestinationName}</small>
                                                                                        </Col>
                                                                                    </Row>

                                                                                    <hr />

                                                                                    <Row
                                                                                        spaceBetween
                                                                                        verticalCenter
                                                                                    >
                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Tiket.svg" />

                                                                                            <div
                                                                                                style={{
                                                                                                    marginLeft: ".4rem",
                                                                                                    display: "grid",
                                                                                                    textAlign: "right"
                                                                                                }}
                                                                                            >
                                                                                                <span>
                                                                                                    {val.totalPnp} Tiket
                                                                                                </span>

                                                                                                {/* <small
                                                                                            style={{
                                                                                                color: "gray"
                                                                                            }}
                                                                                            >
                                                                                                {currency(val.amount, "Rp")}
                                                                                            </small> */}
                                                                                            </div>
                                                                                        </Col>

                                                                                        <Col
                                                                                            justifyCenter
                                                                                            alignCenter
                                                                                            style={{
                                                                                                flexDirection: "inherit"
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                width={20}
                                                                                                src="/assets/icons/Uang.svg" />

                                                                                            <span
                                                                                                style={{
                                                                                                    marginLeft: ".4rem"
                                                                                                }}
                                                                                            >
                                                                                                {/* {currency(val.totalAmountWithoutInsurance + val.totalDiscount, "Rp")} */}
                                                                                                {currency(val.amount)}
                                                                                            </span>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>
                                                                            </Row>
                                                                        )
                                                                    })
                                                                }

                                                            </Card>
                                                        </Col>
                                                    </Row>

                                                </div>

                                            )
                                        }


                                        <Row>
                                            <Col
                                                column={4}
                                            >
                                                <Card
                                                    title={"Pembelian Tiket Terbanyak"}
                                                >
                                                    <Bar
                                                        datasetIdKey='id'
                                                        options={{
                                                            indexAxis: 'y',
                                                            plugins: {
                                                                legend: {
                                                                    display: false
                                                                }
                                                            },
                                                            scales: {
                                                                x: {
                                                                    grid: {
                                                                        display: false
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                        data={{
                                                            labels: _passengerPurchase.name,
                                                            datasets: [
                                                                {
                                                                    id: 1,
                                                                    label: 'Tiket',
                                                                    data: _passengerPurchase.total,
                                                                    fill: 'start',
                                                                    borderCapStyle: 'round',
                                                                    tension: 0.4,
                                                                    backgroundColor: '#033D82',
                                                                },
                                                            ],
                                                        }}
                                                    />

                                                    <div
                                                        style={{
                                                            marginTop: "1rem"
                                                        }}
                                                    >

                                                        <small>Pembelian berdasarkan tiket penumpang</small>

                                                    </div>
                                                </Card>
                                            </Col>
                                            {
                                                !props.branch?.branchId && (
                                                    <Col
                                                        column={2}
                                                        mobileFullWidth
                                                    >
                                                        <Card
                                                            title={"Pembelian Tiket Berulang"}
                                                        >
                                                            {
                                                                _repeatOrder.map(function (val, key) {
                                                                    return (
                                                                        <Row
                                                                            key={key}
                                                                            marginBottom={key < (_repeatOrder.length - 1) ? true : false}
                                                                        >

                                                                            <Col
                                                                                style={{
                                                                                    width: "100%"
                                                                                }}
                                                                                column={6}
                                                                            >
                                                                                <Row
                                                                                    spaceBetween
                                                                                    verticalCenter
                                                                                >
                                                                                    <Col
                                                                                        withPadding
                                                                                        justifyCenter
                                                                                        alignEnd
                                                                                    >
                                                                                        <span>{val.originCode}</span>
                                                                                        <small
                                                                                            style={{
                                                                                                textAlign: "right"
                                                                                            }}
                                                                                        >
                                                                                            {val.originName}
                                                                                        </small>
                                                                                    </Col>

                                                                                    <BsArrowRight
                                                                                        style={{
                                                                                            margin: "0rem 1rem"
                                                                                        }}
                                                                                        size={21}
                                                                                    />

                                                                                    <Col
                                                                                        withPadding
                                                                                        justifyCenter
                                                                                    >
                                                                                        <span>{val.DestinationCode}</span>
                                                                                        <small>{val.DestinationName}</small>
                                                                                    </Col>
                                                                                </Row>

                                                                                <hr />

                                                                                <Row
                                                                                    spaceBetween
                                                                                    verticalCenter
                                                                                >
                                                                                    <Col
                                                                                        style={{
                                                                                            flexDirection: "inherit"
                                                                                        }}
                                                                                    >
                                                                                        <img
                                                                                            width={20}
                                                                                            src="/assets/icons/Tiket.svg" />

                                                                                        <span
                                                                                            style={{
                                                                                                marginLeft: ".4rem"
                                                                                            }}
                                                                                        >
                                                                                            {val.totalPurchase} Tiket
                                                                                        </span>
                                                                                    </Col>

                                                                                    <Col
                                                                                        style={{
                                                                                            flexDirection: "inherit"
                                                                                        }}
                                                                                    >
                                                                                        <img
                                                                                            width={15}
                                                                                            src="/assets/icons/user.svg" />

                                                                                        <span
                                                                                            style={{
                                                                                                marginLeft: ".4rem"
                                                                                            }}
                                                                                        >
                                                                                            {val.nama}
                                                                                        </span>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>
                                                                        </Row>
                                                                    )
                                                                })
                                                            }

                                                            <div
                                                                style={{
                                                                    marginTop: "1rem"
                                                                }}
                                                            >
                                                                <small>Pembelian berdasarkan tiket penumpang</small>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                )
                                            }
                                        </Row>

                                        {/* <Row>
                                            <Col
                                                column={6}
                                            >
                                                <Card
                                                    title={"Demografi Penumpang dalam Rute"}
                                                >

                                                    <Input
                                                        withMargin
                                                        placeholder={'Semua Trayek'}
                                                        value={_trajectSelected.title}
                                                        suggestions={_trajectRanges}
                                                        suggestionField={'title'}
                                                        onSuggestionSelect={(value) => {
                                                            _setTrajectSelected(oldQuery => {
                                                                return {
                                                                    ...oldQuery,
                                                                    "title": value.title,
                                                                    "value": value.value
                                                                }
                                                            })
                                                        }}
                                                    />

                                                    <Bar
                                                        datasetIdKey='id'
                                                        options={{
                                                            indexAxis: 'y',
                                                            plugins: {
                                                                legend: {
                                                                    display: false
                                                                }
                                                            },
                                                            scales: {
                                                                x: {
                                                                    stacked: true,
                                                                    grid: {
                                                                        display: false
                                                                    }
                                                                },
                                                                y: {
                                                                    stacked: true
                                                                }
                                                            }
                                                        }}
                                                        data={{
                                                            labels: _trajectByPassenger.traject,
                                                            datasets: [
                                                                {
                                                                    id: 1,
                                                                    label: 'Laki-laki',
                                                                    data: _trajectByPassenger.male,
                                                                    fill: 'start',
                                                                    borderCapStyle: 'round',
                                                                    tension: 0.4,
                                                                    backgroundColor: '#033D82',
                                                                },
                                                                {
                                                                    id: 2,
                                                                    label: 'Perempuan',
                                                                    data: _trajectByPassenger.female,
                                                                    fill: 'start',
                                                                    borderCapStyle: 'round',
                                                                    tension: 0.4,
                                                                    backgroundColor: '#39b666',
                                                                },
                                                                {
                                                                    id: 3,
                                                                    label: 'Tidak diketahui',
                                                                    data: _trajectByPassenger.unknown,
                                                                    fill: 'start',
                                                                    borderCapStyle: 'round',
                                                                    tension: 0.4,
                                                                    backgroundColor: '#F4EA22',
                                                                },
                                                            ],
                                                        }}
                                                    />

                                                    <Row
                                                        spaceEvenly
                                                        center
                                                        style={{
                                                            marginTop: "1rem",
                                                        }}
                                                    >

                                                        <Row
                                                            withPadding
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "50px",
                                                                    height: "20px",
                                                                    backgroundColor: "#033D82",
                                                                    marginRight: "1rem"
                                                                }}
                                                            >
                                                            </div>
                                                            <span>Laki-laki</span>
                                                        </Row>

                                                        <Row
                                                            withPadding
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "50px",
                                                                    height: "20px",
                                                                    backgroundColor: "#39b666",
                                                                    marginRight: "1rem"
                                                                }}
                                                            >
                                                            </div>
                                                            <span>Perempuan</span>
                                                        </Row>

                                                        <Row
                                                            withPadding
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "50px",
                                                                    height: "20px",
                                                                    backgroundColor: "#F4EA22",
                                                                    marginRight: "1rem"
                                                                }}
                                                            >
                                                            </div>
                                                            <span>Tidak diketahui</span>
                                                        </Row>


                                                    </Row>
                                                </Card>
                                            </Col>
                                        </Row> */}
                                    </>
                                )
                            }


                        </>
                    )
                }
            </AdminLayout>
        </Main>
    )
}