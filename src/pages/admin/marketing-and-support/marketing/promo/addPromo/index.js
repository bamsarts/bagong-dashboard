import { useEffect, useState } from 'react'

import { DAMRI_APPS_URL, postJSON, TICKET_ORDER_URL } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from './AddPromo.module.scss'
import { BsChevronLeft, BsFillSendPlusFill } from 'react-icons/bs'
import Label from '../../../../../../components/Label'
import { useRouter } from 'next/router'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../../../utils/filters'
import SelectArea from '../../../../../../components/SelectArea'
import Link from 'next/link'
import { QRCode } from 'react-qrcode-logo'
import MinioModal from "../../../../../../components/MinioModal";

export default function AddPromo(props) {

    const router = useRouter()
    const [_locationRange, _setLocationRange] = useState({
        title: "",
        value: ""
    })

    const [_trajectTypeRange, _setTrajectTypeRange] = useState({
        title: "",
        value: ""
    })

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_trajectTrackRange, _setTrajectTrackRange] = useState([])
    const [_trajectTrackData, _setTrajectTrackData] = useState([])
    const [_selectedArea, _setSelectedArea] = useState(1)
    const [_areaRange, _setAreaRange] = useState([1, 2, 3])

    const CONFIG_PARAM = {
        "description": "",
        "endAt": dateFilter.basicDate(new Date()).normal + " 23:59:59",
        "companyId": props.authData.companyId,
        "maxAmount": 0,
        "startAt": dateFilter.basicDate(new Date()).normal + " 00:00:00",
        "title": "",
        "type": "",
        "value": 0,
        "format": "",
        "maxQuantity": 4,
        "scopeTable": "",
        "sub_scopeTable": null,
        "sub_sub_scopeTable": null,
        "traject": {
            "title": ""
        },
        "traject_sub": {
            "title": ""
        },
        "traject_sub_sub": {
            "title": ""
        },
        "trajectTrack": {
            "title": ""
        },
        "roundTrip": {
            "title": ""
        },
        "minQuantity": 1,
        "quota": 0,
        "validFrom": dateFilter.basicDate(new Date()).normal,
        "validUntil": dateFilter.basicDate(new Date()).normal,
        "isActive": "",
        "targetId": [],
        "sub_targetId": [],
        "sub_sub_targetId": [],
        "coverageTarget": {
            "title": ""
        },
        "coverage": {
            "title": ""
        },
        "coverage_sub": {
            "title": ""
        },
        "coverage_sub_sub": {
            "title": ""
        },
        "typeDiscount": {
            "title": ""
        },
        "timeValidFrom": "00:00",
        "timeValidUntil": "23:59",
        "timeStartAt": "00:00:00",
        "timeEndAt": "23:59:59",
        "trajectType": {
            "title": ""
        },
        "trajectType_sub": {
            "title": ""
        },
        "trajectType_sub_sub": {
            "title": ""
        },
        "company": {
            "title": "",
        },
        "company_sub": {
            "title": "",
        },
        "company_sub_sub": {
            "title": "",
        },
        "member": {
            "title": ""
        },
        "member_sub": {
            "title": ""
        },
        "member_sub_sub": {
            "title": ""
        },
        "payment": {
            "title": ""
        },
        "payment_sub": {
            "title": ""
        },
        "payment_sub_sub": {
            "title": ""
        },
        "layanan": {
            "title": ""
        },
        "layanan_sub": {
            "title": ""
        },
        "layanan_sub_sub": {
            "title": ""
        },
        "roundTrip": {
            "title": ""
        },
        "roundTrip_sub": {
            "title": ""
        },
        "roundTrip_sub_sub": {
            "title": ""
        },
        "provider": "",
        "minAmount": 0,
        "isDailyQuota": "",
        "voucherCategory": "",
        "transactionThreshold": 0,
        "isRepeatable": false,
        "isVoucher": false,
        "voucherCode": "",
        "maxPurchasePerUser": 1,
        "promotion_object": "",
        "scope_tables_target_id": null,
        "minFare": 0,
        "maxPurchaseDailyPerUser": 0,
        "group": "",
        "memberId": "",
        "memberInput": {
            "title": ""
        },
        "platformId": 1,
        "platformInput": {
            "title": ""
        },
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_dataTable, _setDataTable] = useState([])
    const [_dataTable_sub, _setDataTable_sub] = useState([])
    const [_dataTable_sub_sub, _setDataTable_sub_sub] = useState([])
    const [_isActive, _setIsActive] = useState(1)
    const [_typeDiscount, _setTypeDiscount] = useState(1)
    const [_coverageTargetRange, _setCoverageTargetRange] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_coverageRange, _setCoverageRange] = useState([
        {
            title: "Perusahaan",
            value: "COMPANY",
            id: '1'
        },
        {
            title: "Trayek",
            value: "TRAJECT"
        },
        {
            title: "Rute",
            value: "TRAJECT_TRACK"
        },
        {
            title: "Segmentasi",
            value: "TRAJECT_TYPE"
        },
        {
            title: "Pengguna Baru",
            value: "NEW_USER"
        },
        {
            title: "Pembayaran",
            value: "PAYMENT_PROVIDER_DETAIL"
        },
        {
            title: "Layanan",
            value: "BUS_CATEGORY"
        },
        {
            title: "Pulang Pergi",
            value: "ROUNDTRIP"
        }
    ])
    const [_typeDiscountRange, _setTypeDiscountRange] = useState([
        {
            value: "BOOKING_DATE",
            title: 'Pembelian'
        },
        {
            value: "DEPARTURE_DATE",
            title: 'Keberangkatan'
        }
    ])
    const [_companyRange, _setCompanyRange] = useState([
        {
            value: "1",
            title: "DAMRI"
        }
    ])

    const [_roundTripRange, _setRoundTripTrange] = useState([
        {
            value: 0,
            title: "Pergi"
        },
        {
            value: 1,
            title: "Pulang"
        }
    ])

    const [_platformRange, _setPlatformRange] = useState([
        {
            value: 1,
            title: "DAMRI Apps"
        },
        {
            value: 2,
            title: "DAMRI Web"
        },
        {
            value: 3,
            title: "Counter EDC"
        }
    ])

    const [_memberRange, _setMemberRange] = useState([])

    const [_validUntil, _setValidUntil] = useState("")
    const [_isFilledPromo, _setIsFilledPromo] = useState(true)
    const [_paymentRange, _setPaymentRange] = useState([])
    const [_busCategoryRange, _setBusCategoryRange] = useState({
        title: "",
        value: ""
    })
    const [_allBusCategory, _setAllBusCategory] = useState([])
    const [_memberSelect, _setMemberSelect] = useState([])
    const [_platformSelect, _setPlatformSelect] = useState([])
    const [_isOpenModalS3, _setIsOpenModalS3] = useState(false)
    const [_isLoadingData, _setIsLoadingData] = useState(true)

    let __COLUMNS = [
        {
            title: _form.coverage.title,
            field: 'data',
            textAlign: 'left'
        },
        {
            title: 'Aksi',
            field: 'id',
            customCell: (value, record, key) => {
                return (
                    <Button
                        title={'Hapus'}
                        styles={Button.warning}
                        onClick={() => {
                            _deleteData(key)
                        }}
                        small
                    />
                )
            }
        }
    ]

    function _updateMember(data = {}, isDelete = false) {
        let member = [..._memberSelect]
        let memberId = _form?.memberId ? _form?.memberId.split(",") : []

        if (data.value == 0) {
            member = _memberRange.filter(item => item.value !== 0)
            memberId = _memberRange.filter(item => item.value !== 0).map(function (val) {
                return val.value
            })
        } else {
            const index = _memberSelect.indexOf(data)

            if (index < 0 && !isDelete) {
                member.push(data)
                memberId.push(data.value)
            } else {
                member.splice(index, 1)
                memberId.splice(index, 1)
            }
        }



        _updateQuery({
            "memberId": memberId.toString()
        })
        _setMemberSelect(member)
    }

    function _updatePlatform(data = {}, isDelete = false) {
        let platform = [..._platformSelect]

        if (data.value == 0) {
            platform = _platformRange.filter(item => item.value !== 0)
        } else {
            const index = _platformSelect.indexOf(data)

            if (index < 0 && !isDelete) {
                platform.push(data)
            } else {
                platform.splice(index, 1)
            }
        }

        // Always rebuild platformId from the platform array to ensure consistency
        const platformId = platform.map(item => item.value)

        _updateQuery({
            "platformId": platformId.toString()
        })

        _setPlatformSelect(platform)
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

    function updateCoverageRange(type) {
        if (type == "COMPANY") {
            _setCoverageRange([
                {
                    title: "Damri",
                    value: '1'
                }
            ])
        }
    }

    function _validationForm(){
        let state = false

        if(!_form.platformId){
            state = true
        }

        return state
        
    }

    useEffect(() => {
        _setDataTable([])
    }, [_form.coverage.title])

    useEffect(() => {
        _setDataTable_sub([])
    }, [_form.coverage_sub.title])

    useEffect(() => {
        _setDataTable_sub_sub([])
    }, [_form.coverage_sub_sub.title])

    useEffect(() => {
        const loadData = async () => {
            _setIsLoadingData(true)
            
            _getTraject()
            await new Promise(resolve => setTimeout(resolve, 2000))

            _getTrajectType()
            await new Promise(resolve => setTimeout(resolve, 2000))

            _getTrajectTrack(false, false)
            await new Promise(resolve => setTimeout(resolve, 2000))

            _getMember()
            await new Promise(resolve => setTimeout(resolve, 2000))

            _getPayment()
            await new Promise(resolve => setTimeout(resolve, 1000))

            _getBusCategory()
            
            _setIsLoadingData(false)
        }

        loadData()

        if (router.query?.detail) {
            if (_checkLocalStorage()?.id) {
                
                const validUntil = _checkLocalStorage().validUntil.split(".")
                const validFrom = _checkLocalStorage().validFrom.split(".")
                const startAt = _checkLocalStorage().startAt.split(" ")
                const endAt = _checkLocalStorage().endAt.split(" ")

                let timeValidUntil = validUntil[0].split(" ")
                timeValidUntil = timeValidUntil[1].split(":")
                timeValidUntil = timeValidUntil[0] + ":" + timeValidUntil[1]

                let timeValidFrom = validFrom[0].split(" ")
                timeValidFrom = timeValidFrom[1].split(":")
                timeValidFrom = timeValidFrom[0] + ":" + timeValidFrom[1]

                let platfom = {}
                let platformId = ""

                if(_checkLocalStorage().platforms){
                    platformId = _checkLocalStorage().platforms.toString()
                }

                _platformRange.forEach(function (val, key) {
                    if (val.value == _checkLocalStorage().platformId) {
                        platfom = val
                    }
                })


                _updateQuery({
                    ..._checkLocalStorage(),
                    "validUntil": dateFilter.basicDate(new Date(validUntil[0])).normal,
                    "validFrom": dateFilter.basicDate(new Date(validFrom[0])).normal,
                    "timeValidUntil": timeValidUntil,
                    "timeValidFrom": timeValidFrom,
                    "timeStartAt": startAt[1],
                    "timeEndAt": endAt[1],
                    "typeDiscount": {
                        "title": _checkLocalStorage().type == "BOOKING_DATE" ? 'Pembelian' : 'Keberangkatan',
                        "value": _checkLocalStorage().type
                    },
                    "value": currency(_checkLocalStorage().value),
                    "maxAmount": currency(_checkLocalStorage().maxAmount),
                    "isVoucher": _checkLocalStorage().isVoucher ? true : false,
                    "isDailyQuota": _checkLocalStorage().isDailyQuota ? true : false,
                    "isRepeatable": _checkLocalStorage().isRepeatable ? true : false,
                    "promotion_object": _checkLocalStorage().promotionObject,
                    "sub_scopeTable": _checkLocalStorage().subScopeTable,
                    "sub_sub_scopeTable": _checkLocalStorage().subSubScopeTable,
                    "platform": {
                        ...platfom
                    },
                    "platformId": _checkLocalStorage().platformId || platformId,
                    "imageUrl": _checkLocalStorage().image
                })

                _setValidUntil(dateFilter.basicDate(new Date()).normal)

                

                if (_checkLocalStorage().scopeTable == "ROUNDTRIP") {
                    let roundTrip = []
                    _checkLocalStorage().targetId.forEach(function (val, key) {
                        _roundTripRange.forEach(function (i, j) {
                            if (i.value == parseInt(val)){
                                roundTrip.push({
                                    "data": i.title,
                                    "id": i.value
                                })
                            }
                        })
                    })

                    _setDataTable(roundTrip)

                } else if (_checkLocalStorage().scopeTable == "COMPANY") {
                    _updateQuery({
                        "company": {
                            title: "DAMRI",
                            value: 1
                        }
                    })

                    _setDataTable([
                        {
                            "data": "DAMRI",
                            "id": 1
                        }
                    ])
                }

                if (_checkLocalStorage().platforms) {
                    let platform = []
                    _checkLocalStorage().platforms.forEach(function (val) {
                        _platformRange.forEach(function (i, j) {
                            if (i.value == val) {
                                platform.push(i)
                            }
                        })
                    })

                    _setPlatformSelect(platform)
                }

            }
        }
    }, [])

    function _checkLocalStorage() {
        let data = localStorage.getItem("promo_damri")

        if (data != null) {
            const dataParse = JSON.parse(data)

            if (dataParse.id == router.query.detail) {
                data = dataParse

                _coverageRange.forEach(function (val, key) {
                    if (val.value == dataParse.scopeTable) {
                        data.coverage = val
                    }
                })
            }
        }

        return data
    }


    async function _getBusCategory() {
        const params = {
            startFrom: 0,
            length: 470,
        }
        try {
            const bus = await postJSON('/masterData/bus/kategori/list', params, props.authData.token)
            let filteredBus = filterDuplicates(bus.data, "name")

            _setBusCategoryRange(filteredBus)
            _setAllBusCategory(bus.data)

            if (router.query?.detail) {
                if (_checkLocalStorage().subScopeTable == "BUS_CATEGORY") {
                    let selectedBus = []

                    _checkLocalStorage().subTargetId.split(",").forEach(function (val) {
                        bus.data.forEach(function (i, j) {
                            if (i.id == parseInt(val)) {
                                selectedBus.push({
                                    "data": i.name,
                                    "id": i.id
                                })
                            }
                        })
                    })

                    let filteredSelectedBus = filterDuplicates(selectedBus, "data")

                    _setDataTable_sub(filteredSelectedBus)
                }

                if (_checkLocalStorage().scopeTable == "BUS_CATEGORY") {
                    let selectedBusScope = []

                    _checkLocalStorage().targetId.forEach(function (val) {
                        bus.data.forEach(function (i, j) {
                            if (i.id == parseInt(val)) {
                                selectedBusScope.push({
                                    "data": i.name,
                                    "id": i.id
                                })
                            }
                        })
                    })

                    let filteredSelectedBusScope = filterDuplicates(selectedBusScope, "data")

                    _setDataTable(filteredSelectedBusScope)
                }

                if (_checkLocalStorage().subSubScopeTable == "BUS_CATEGORY" && _checkLocalStorage().subSubTargetId) {
                    let selectedBusScopeSub = []

                    _checkLocalStorage().subSubTargetId.split(",").forEach(function (val) {
                        bus.data.forEach(function (i, j) {
                            if (i.id == parseInt(val)) {
                                selectedBusScopeSub.push({
                                    "data": i.name,
                                    "id": i.id
                                })
                            }
                        })
                    })

                    let filteredSelectedBusScopeSub = filterDuplicates(selectedBusScopeSub, "data")

                    _setDataTable_sub_sub(filteredSelectedBusScopeSub)
                }
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getPayment() {

        try {

            const param = {
                "startFrom": 0,
                "length": 320
            }

            const payment = await postJSON('/masterData/counter/payment/list', param, props.authData.token)

            let data = []

            payment.paymentList.forEach(function (val, key) {
                data.push({
                    "title": val.label,
                    "value": val.id
                })
            })

            _setPaymentRange(data)

            if (router.query?.detail) {
                if (_checkLocalStorage()?.scopeTable == "PAYMENT_PROVIDER_DETAIL") {
                    let paymentSelected = []
                    _checkLocalStorage().targetId.forEach(function (val) {
                        data.forEach(function (i, j) {
                            if (i.value == val) {
                                paymentSelected.push({
                                    "data": i.title,
                                    "id": i.value
                                })
                            }
                        })
                    })

                    _setDataTable(paymentSelected)

                }

                if (_checkLocalStorage()?.subScopeTable == "PAYMENT_PROVIDER_DETAIL") {
                    let paymentSelectedSub = []
                    _checkLocalStorage().subTargetId.split(",").forEach(function (val) {
                        data.forEach(function (i, j) {
                            if (i.value == val) {
                                paymentSelectedSub.push({
                                    "data": i.title,
                                    "id": i.value
                                })
                            }
                        })
                    })

                    _setDataTable_sub(paymentSelectedSub)

                }

                if (_checkLocalStorage()?.subSubScopeTable == "PAYMENT_PROVIDER_DETAIL") {
                    let paymentSelectedSubSub = []
                    _checkLocalStorage().subSubTargetId.split(",").forEach(function (val) {
                        data.forEach(function (i, j) {
                            if (i.value == val) {
                                paymentSelectedSubSub.push({
                                    "data": i.title,
                                    "id": i.value
                                })
                            }
                        })
                    })

                    _setDataTable_sub_sub(paymentSelectedSubSub)

                }
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getMember() {
        const params = {
            startFrom: 0,
            length: 470,
        }

        try {
            const member = await postJSON('/masterData/userRoleAkses/member/list', params, props.authData.token)
            let data = []

            member.data.forEach(function (val, key) {

                if (key == 0) {
                    data.push({
                        "title": "Semua",
                        "value": 0
                    })
                }

                data.push({
                    "title": val.name,
                    "value": val.id
                })

            })

            _setMemberRange(data)

            // if(_checkLocalStorage()?.scopeTable == "MEMBER"){
            //     let memberSelected = []
            //     _checkLocalStorage().targetId.forEach(function(val){
            //         data.forEach(function(i,j){
            //             if(i.value == val){
            //                 memberSelected.push({
            //                     "data": i.title,
            //                     "id": i.value
            //                 })
            //             }
            //         })
            //     })

            //     _setDataTable(memberSelected)

            // }

            if (router.query?.detail) {
                if (_checkLocalStorage().memberId) {
                    let member = []
                    _checkLocalStorage().memberId.split(",").forEach(function (val) {
                        data.forEach(function (i, j) {
                            if (i.value == val) {
                                member.push(i)
                            }
                        })
                    })

                    _setMemberSelect(member)
                }
            }


        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTrajectType() {
        const params = {
            companyId: props.companyId,
            startFrom: 0,
            length: 470,
        }
        try {
            const type = await postJSON('/masterData/trayekType/list', params, props.authData.token)
            let data = []
            type.data.forEach(function (val, key) {
                data.push({
                    "title": val.name,
                    "value": val.id
                })
            })

            _setTrajectTypeRange(data)

            if (_checkLocalStorage()?.scopeTable == "TRAJECT_TYPE") {
                let trajectSelected = []
                _checkLocalStorage().targetId.forEach(function (val) {
                    data.forEach(function (i, j) {
                        if (i.value == val) {
                            trajectSelected.push({
                                "data": i.title,
                                "id": i.value
                            })
                        }
                    })
                })

                _setDataTable(trajectSelected)

            }

            if (_checkLocalStorage()?.scopeTable == "TRAJECT_TRACK") {

            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTraject() {
        const params = {
            startFrom: 0,
            length: 1560,
        }
        try {
            const traject = await postJSON('/masterData/trayek/list', params, props.authData.token)
            let trajectList = []
            traject.data.forEach(function (val, key) {
                trajectList.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTrajectRange(trajectList)

            if (_checkLocalStorage()?.scopeTable == "TRAJECT") {
                let trajectSelected = []
                _checkLocalStorage().targetId.forEach(function (val) {
                    trajectList.forEach(function (i, j) {
                        if (i.value == val) {
                            trajectSelected.push({
                                "data": i.title,
                                "id": i.value
                            })
                        }
                    })
                })

                _setDataTable(trajectSelected)

            }

            if (_checkLocalStorage()?.subScopeTable == "TRAJECT") {
                let trajectSelectedSub = []
                _checkLocalStorage().subTargetId.split(",").forEach(function (val) {
                    trajectList.forEach(function (i, j) {
                        if (i.value == val) {
                            trajectSelectedSub.push({
                                "data": i.title,
                                "id": i.value
                            })
                        }
                    })
                })

                _setDataTable_sub(trajectSelectedSub)

            }

            if (_checkLocalStorage()?.subSubScopeTable == "TRAJECT") {
                let trajectSelectedSubSub = []
                _checkLocalStorage().subSubTargetId.split(",").forEach(function (val) {
                    trajectList.forEach(function (i, j) {
                        if (i.value == val) {
                            trajectSelectedSubSub.push({
                                "data": i.title,
                                "id": i.value
                            })
                        }
                    })
                })

                _setDataTable_sub_sub(trajectSelectedSubSub)

            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTrajectTrack(idTraject, id) {
        const params = {
            startFrom: 0,
            length: 2800
        }

        // if(idTraject) params.trajectId = idTraject
        if (id) params.id = id

        try {
            const trajectTrack = await postJSON('/masterData/trayekTrack/list', params, props.authData.token)
            let trajectTrackList = []
            trajectTrack.data.forEach(function (val, key) {
                trajectTrackList.push({
                    "title": val.originName + " - " + val.destinationName,
                    "value": val.id,
                    "originId": val.originId,
                    "destinationId": val.destinationId,
                    "data": "(" + val.trajectCode + ") " + val.originName + " - " + val.destinationName,
                })
            })

            _setTrajectTrackData(trajectTrackList)

            let cleanTrajectTrack = trajectTrackList.filter((arr, index, self) => index === self.findIndex((t) => (t.originId == arr.originId && t.destinationId == arr.destinationId)))
            _setTrajectTrackRange(cleanTrajectTrack)

            if (_checkLocalStorage()?.scopeTable == "TRAJECT_TRACK") {
                let trajectSelected = []
                let idScopeTrajectTrack = _checkLocalStorage()?.targetId || []

                trajectTrackList.forEach(function (i, j) {

                    idScopeTrajectTrack.forEach(function(val, key) {
                        if (i.value == val) {
                            trajectSelected.push({
                                "data": i.title,
                                "id": i.value
                            })
                        }
                    })
                   
                })

                _setDataTable((oldQuery) => {
                    let data = [
                        ...oldQuery,
                        ...trajectSelected
                    ]

                    var clean = data.filter((arr, index, self) =>
                        index === self.findIndex((t) => (t.id === arr.id)))

                    return clean
                })
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    useEffect(() => {
        console.log(_memberSelect)
    }, [_memberSelect])



    async function _submitData(isDuplicate = false) {
        _setIsProcessing(true)

        try {
            let method = 'add'
            let message = "ditambahkan"
            let query = {
                ..._form
            }

            query.value = Number.isInteger(query.value) ? query.value : query.value.split(".").join("")
            query.maxAmount = Number.isInteger(query.maxAmount) ? query.maxAmount : query.maxAmount.split(".").join("")
            query.minAmount = `${query.minAmount}`.replace(".", "")
            query.minFare = `${query.minFare}`.replace(".", "")
            query.validFrom = query.validFrom + " " + query.timeValidFrom + ":00"
            query.validUntil = query.validUntil + " " + query.timeValidUntil + ":00"

            if (query.type == "BOOKING_DATE") {
                let date = new Date(query.endAt);
                date.setFullYear(date.getFullYear() + 2);
                query.endAt = date.toISOString().split('T')[0] + " " + query.timeEndAt;
            }

            if (router.query?.detail) {
                method = "update"
                message = "diubah"

                if(isDuplicate){
                    method = "add"
                    message = "diduplikasi"
                    delete query.id
                }
            }

            if (query.group == "") {
                query.group = null
            }

            delete query.coverage
            delete query.coverageTarget
            delete query.typeDiscount
            delete query.traject
            delete query.traject_sub
            delete query.traject_sub_sub
            delete query.timeValidFrom
            delete query.timeValidUntil
            delete query.trajectType
            delete query.trajectType_sub
            delete query.trajectType_sub_sub
            delete query.trajectPoint
            delete query.trajectTrack
            delete query.company
            delete query.timeStartAt
            delete query.timeEndAt
            delete query.member
            delete query.member_sub
            delete query.member_sub_sub
            delete query.promotionObject
            delete query.scopeTablesTargetId
            delete query.payment
            delete query.payment_sub
            delete query.payment_sub_sub
            delete query.layanan
            delete query.layanan_sub
            delete query.layanan_sub_sub
            delete query.company_sub
            delete query.company_sub_sub
            delete query.coverage_sub
            delete query.coverage_sub_sub
            delete query.subScopeTable
            delete query.subSubScopeTable
            delete query.subSubTargetId
            delete query.subTargetId
            delete query.memberInput
            delete query.platform
            delete query.platformInput
            // delete query.platformId
            delete query.platforms
            delete query.image
            delete query.roundTrip
            delete query.roundTrip_sub_sub
            delete query.roundTrip_sub

            if (!query.isVoucher) {
                delete query.voucherCode
                delete query.voucherCategory
            }

            query.targetId = []

            if (query.scopeTable == 'BUS_CATEGORY') {
                query.targetId = _checkBusCategory(_dataTable)
            } else if (query.scopeTable == "COMPANY") {
                query.targetId = [_companyRange[0].value]
            } else if (query.scopeTable == "NEW_USER") {
                query.targetId = []
            } else {
                _dataTable.forEach(function (val, key) {
                    query.targetId.push(val.id)
                })
            }

            query.sub_targetId = []

            if (query.sub_scopeTable == "BUS_CATEGORY") {
                query.sub_targetId = _checkBusCategory(_dataTable_sub)
            } else {

                if (query.sub_scopeTable == "COMPANY") {
                    query.sub_targetId = [_companyRange[0].value]
                } else if (query.sub_scopeTable == "NEW_USER") {
                    query.sub_targetId = []
                } else {
                    _dataTable_sub.forEach(function (val, key) {
                        query.sub_targetId.push(val.id)
                    })
                }
            }


            query.sub_sub_targetId = []

            if (query.sub_sub_scopeTable == "BUS_CATEGORY") {
                query.sub_sub_targetId = _checkBusCategory(_dataTable_sub_sub)
            } else {

                if (query.sub_sub_scopeTable == "COMPANY") {
                    query.sub_sub_targetId = [_companyRange[0].value]

                } else if (query.sub_sub_scopeTable == "NEW_USER") {
                    query.sub_sub_targetId = []
                } else {
                    _dataTable_sub_sub.forEach(function (val, key) {
                        query.sub_sub_targetId.push(val.id)
                    })
                }
            }

            if (query.scopeTable != "NEW_USER" && query.scopeTable != "COMPANY") {
                if (query.targetId.length == 0) {
                    popAlert({ "message": "Diskon area wajib terisi", "type": "error" })
                    return false
                }
            }

            const result = await postJSON('/marketingSupport/promosi/' + method, query, props.authData.token)

            if (result) {
                popAlert({ "message": "Berhasil " + message, "type": "success" })

                setTimeout(() => {
                    window.location.href = "/admin/marketing-and-support/marketing/promo"
                }, 1000);
            }


        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _checkBusCategory(name) {
        let data = []

        for (const item of _allBusCategory) {
            name.forEach(function (val, key) {
                if (item.name == val.data) {
                    data.push(item.id)
                }
            })
        }

        return data
    }

    function _deleteData(key) {
        if (_selectedArea == 1) {
            _setDataTable(_dataTable.filter((v, i) => i !== key))
        } else if (_selectedArea == 2) {
            _setDataTable_sub(_dataTable_sub.filter((v, i) => i !== key))
        } else {
            _setDataTable_sub_sub(_dataTable_sub_sub.filter((v, i) => i !== key))
        }
    }

    function _clearScopeTable() {
        let query = {}

        if (_selectedArea == 1) {
            query.coverage = {}
            query.targetId = []
            query.scopeTable = null
        } else if (_selectedArea == 2) {
            query.coverage_sub = {}
            query.sub_targetId = []
            query.sub_scopeTable = null

        } else {
            query.coverage_sub_sub = {}
            query.sub_sub_targetId = []
            query.sub_sub_scopeTable = null
        }

        _updateQuery(query)
    }

    function _checkCoverage() {
        if (_selectedArea == 1) {
            return _form.coverage.title
        } else if (_selectedArea == 2) {
            return _form.coverage_sub.title
        } else {
            return _form.coverage_sub_sub.title
        }
    }

    function _conditionScopeTable(name) {
        let state = false

        if (_selectedArea == 1) {
            if (_form.scopeTable == name) {
                state = true
            }
        } else if (_selectedArea == 2) {
            if (_form.sub_scopeTable == name) {
                state = true
            }
        } else {
            if (_form.sub_sub_scopeTable == name) {
                state = true
            }
        }

        return state
    }

    function _updateCoverage(selection) {
        let data = {}

        if (_selectedArea == 1) {
            data.coverage = selection
            data.scopeTable = selection.value
        } else if (_selectedArea == 2) {
            data.coverage_sub = selection
            data.sub_scopeTable = selection.value
        } else {
            data.coverage_sub_sub = selection
            data.sub_sub_scopeTable = selection.value
        }

        _updateQuery(data)
    }

    function _checkValueInput(name, prop = 'title') {
        let data = ""

        if (_selectedArea == 1) {
            data = _form[name][prop]
        } else if (_selectedArea == 2) {
            data = _form[name + `_sub`][prop]
        } else {
            data = _form[name + `_sub_sub`][prop]
        }

        return data
    }

    function _updateSelection(selection, prop, scopeTable) {
        let data = {}

        if (_selectedArea == 1) {
            data[prop] = selection

            if (_form.scopeTable == scopeTable) {
                _setIsFilledPromo(false)
            }

            if (prop == 'company') {
                _setDataTable([
                    {
                        "data": data.title,
                        "id": data.value
                    }
                ])
            }

        } else if (_selectedArea == 2) {
            data[prop + '_sub'] = selection

            if (_form.sub_scopeTable == scopeTable) {
                _setIsFilledPromo(false)
            }

            if (prop == 'company') {
                _setDataTable_sub([
                    {
                        "data": data.title,
                        "id": data.value
                    }
                ])
            }

        } else {
            data[prop + "_sub_sub"] = selection

            if (_form.sub_sub_scopeTable == scopeTable) {
                _setIsFilledPromo(false)
            }


            if (prop == 'company') {
                _setDataTable_sub_sub([
                    {
                        "data": data.title,
                        "id": data.value
                    }
                ])
            }

        }

        _updateQuery(data)

    }

    function _addData() {

        let result = []
        let dataTable = []
        let sub = ["", "", "_sub", "_sub_sub"]

        result = [{
            data: _form['traject' + sub[_selectedArea]].title,
            id: _form['traject' + sub[_selectedArea]].value
        }]

        if (_form['coverage' + sub[_selectedArea]].title == "Segmentasi") {
            result[0].data = _form['trajectType' + sub[_selectedArea]].title,
                result[0].id = _form['trajectType' + sub[_selectedArea]].value
        }


        if (_form['coverage' + sub[_selectedArea]].title == "Point") {
            result[0].data = _form['trajectPoint' + sub[_selectedArea]].title
            result[0].id = _form['trajectPoint' + sub[_selectedArea]].value
        }

        if (_form['coverage' + sub[_selectedArea]].title == "Pembayaran") {
            result[0].data = _form['payment' + sub[_selectedArea]].title
            result[0].id = _form['payment' + sub[_selectedArea]].value
        }

        if (_form['coverage' + sub[_selectedArea]].title == "Rute") {
            result = []

            _trajectTrackData.forEach(function (val, key) {
                if (val.originId == _form['trajectTrack' + sub[_selectedArea]].originId && val.destinationId == _form['trajectTrack' + sub[_selectedArea]].destinationId) {

                    result.push({
                        data: val.data,
                        id: val.value,
                        originId: val.originId,
                        destinationId: val.destinationId
                    })
                }
            })
        }

        // if(_form['coverage'+sub[_selectedArea]].title == "Keanggotaan"){
        //     result[0].data = _form['member'+sub[_selectedArea]].title,
        //     result[0].id = _form['member'+sub[_selectedArea]].value
        // }

        if (_form['coverage' + sub[_selectedArea]].title == "Layanan") {
            result[0].data = _form['layanan' + sub[_selectedArea]].name,
                result[0].id = _form['layanan' + sub[_selectedArea]].id
        }

        if (_form['coverage' + sub[_selectedArea]].title == "Pulang Pergi") {
            result[0].data = _form['roundTrip' + sub[_selectedArea]].title,
                result[0].id = _form['roundTrip' + sub[_selectedArea]].value
        }

        if (_selectedArea == 1) {
            dataTable = [
                ..._dataTable,
                ...result
            ]
        } else if (_selectedArea == 2) {
            dataTable = [
                ..._dataTable_sub,
                ...result
            ]
        } else {
            dataTable = [
                ..._dataTable_sub_sub,
                ...result
            ]
        }


        let cleanDataTable = dataTable.filter((arr, index, self) => index === self.findIndex((t) => (t.id == arr.id)))

        if (_selectedArea == 1) {
            _setDataTable(oldData => {
                return [
                    ...cleanDataTable,
                ]
            })
        } else if (_selectedArea == 2) {
            _setDataTable_sub(oldData => {
                return [
                    ...cleanDataTable,
                ]
            })
        } else {
            _setDataTable_sub_sub(oldData => {
                return [
                    ...cleanDataTable,
                ]
            })
        }

    }

    function _getDataTable() {
        if (_selectedArea == 1) {
            return _dataTable
        } else if (_selectedArea == 2) {
            return _dataTable_sub
        } else {
            return _dataTable_sub_sub
        }
    }

    function _conditionTable() {

        let state = false

        if (_selectedArea == 1) {
            if (_form.scopeTable != "COMPANY" && _form.scopeTable != "NEW_USER") {
                state = true
            }
        } else if (_selectedArea == 2) {
            if (_form.sub_scopeTable != "COMPANY" && _form.sub_scopeTable != "NEW_USER") {
                state = true
            }
        } else {
            if (_form.sub_scopeTable != "COMPANY" && _form.sub_scopeTable != "NEW_USER") {
                state = true
            }
        }

        return state
    }

    return (
        <Main>
            <MinioModal
            visible={_isOpenModalS3}
            closeModal={() => {
                _setIsOpenModalS3(false)
            }}
            />

            <AdminLayout
                headerContent={
                    <div className={styles.header_content}>
                        <div>
                            <Link href="/admin/marketing-and-support/marketing/promo">
                                <BsChevronLeft />
                            </Link>
                            <strong>{router.query?.detail ? 'Ubah' : 'Tambah'} Promo</strong>
                        </div>
                    </div>
                }
            >
                {_isLoadingData && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '50px',
                        fontSize: '16px',
                        marginTop: "10%"
                    }}>
                        <div>Memuat data...</div>
                    </div>
                )}
                
                {!_isLoadingData && (
                    <>
                <Row
                    className={styles.tab_area}
                >

                    {
                        _areaRange.map((val, key) => {
                            return (
                                <Col
                                    className={val == _selectedArea ? styles.active : ''}
                                    column={1}
                                    onClick={() => {
                                        _setSelectedArea(val)
                                    }}
                                >
                                    <span>Area {val}</span>
                                </Col>
                            )
                        })
                    }

                </Row>

                <Card>
                    <Row
                        verticalEnd
                    >
                        <Col
                            column={6}
                            alignEnd
                        >
                            <Button
                                title={'Hapus'}
                                styles={Button.danger}
                                onClick={() => {
                                    _clearScopeTable()
                                }}
                            />
                        </Col>


                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Diskon Area"}
                                placeholder={'Pilih diskon area'}
                                value={_checkCoverage()}
                                suggestions={_coverageRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {

                                    _updateCoverage(data)
                                }}
                            />
                        </Col>

                        {
                            _conditionScopeTable('') && (
                                <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Perusahaan"}
                                        placeholder={'Pilih Perusahaan'}
                                        value={_checkValueInput('company')}
                                        suggestions={_companyRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'company')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _conditionScopeTable('BUS_CATEGORY') && (
                                <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Layanan"}
                                        placeholder={'Pilih Layanan'}
                                        value={_checkValueInput('layanan', 'name')}
                                        suggestions={_busCategoryRange}
                                        suggestionField={'name'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'layanan', 'BUS_CATEGORY')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _conditionScopeTable('PAYMENT_PROVIDER_DETAIL') && (
                                <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Pembayaran"}
                                        placeholder={'Pilih Pembayaran'}
                                        value={_checkValueInput('payment')}
                                        suggestions={_paymentRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'payment', 'PAYMENT_PROVIDER_DETAIL')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _conditionScopeTable('TRAJECT') && (
                                <Col
                                    column={4}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Trayek"}
                                        placeholder={'Pilih Trayek'}
                                        value={_checkValueInput('traject')}
                                        suggestions={_trajectRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'traject', 'TRAJECT')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _conditionScopeTable('TRAJECT_TRACK') && (
                                <>
                                    <Col
                                        column={4}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <Input
                                            title={"Rute"}
                                            placeholder={'Pilih Track'}
                                            value={_checkValueInput('trajectTrack')}
                                            suggestions={_trajectTrackRange}
                                            suggestionField={'title'}
                                            onSuggestionSelect={(data) => {

                                                _updateSelection(data, 'trajectTrack', 'TRAJECT_TRACK')
                                            }}
                                        />
                                    </Col>

                                </>

                            )
                        }

                        {
                            _conditionScopeTable('TRAJECT_TYPE') && (
                                <Col
                                    column={3}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Segmentasi"}
                                        placeholder={'Pilih Segmentasi'}
                                        value={_checkValueInput('trajectType')}
                                        suggestions={_trajectTypeRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'trajectType', 'TRAJECT_TYPE')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            _conditionScopeTable('ROUNDTRIP') && (
                                <Col
                                    column={3}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Pergi Pulang"}
                                        placeholder={'Pilih jenis keberangkatan'}
                                        value={_checkValueInput('roundTrip')}
                                        suggestions={_roundTripRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateSelection(data, 'roundTrip', 'ROUNDTRIP')
                                        }}
                                    />
                                </Col>
                            )
                        }

                        {
                            (_conditionTable()) && (
                                <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Button
                                        disabled={_isFilledPromo}
                                        title={'Tambahkan'}
                                        styles={Button.secondary}
                                        onClick={_addData}
                                        onProcess={_isProcessing}
                                    />
                                </Col>
                            )
                        }

                    </Row>

                    {
                        (_conditionTable()) && (
                            <Table
                                exportToXls={false}
                                columns={__COLUMNS}
                                records={_getDataTable()}
                                noPadding
                            />
                        )
                    }

                </Card>

                <Card>
                    <Row
                        marginBottom
                        verticalEnd
                    >

                        <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                        >


                            {
                                _form.imageUrl && (
                                    <img
                                    src={_form.imageUrl}
                                    width={"200"}
                                    height={"auto"}
                                    />
                                )
                            }

                            <Row
                            verticalEnd
                            style={{
                                gap: "1rem"
                            }}
                            >
                                <Input
                                title={'Link Gambar'}
                                placeholder={'Masukan link gambar'}
                                value={_form.imageUrl}
                                onChange={(value) => {
                                    _updateQuery({
                                        "imageUrl": value
                                    })
                                }}
                                />

                                <Button
                                small
                                title={'Media S3'}
                                onClick={() => {
                                    _setIsOpenModalS3(true)
                                }}
                                />
                            </Row>

                            
                        </Col>
                        
                        <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Judul Promosi"}
                                placeholder={'Masukan judul'}
                                value={_form.title}
                                onChange={(value) => {
                                    _updateQuery({
                                        "title": value
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={6}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                note={"Maksimum 250 Karakter"}
                                maxLength={250}
                                multiline={2}
                                title={"Deskripsi Promosi"}
                                placeholder={'Masukan deskripsi'}
                                value={_form.description}
                                onChange={(value) => {
                                    _updateQuery({
                                        "description": value
                                    })
                                }}
                            />
                        </Col>
                    </Row>

                    <Row
                        marginBottom
                    >
                        <Col
                            style={{
                                marginTop: "1.5rem"
                            }}
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Tipe Diskon"}
                                placeholder={'Pilih tipe'}
                                value={_form.typeDiscount.title}
                                suggestions={_typeDiscountRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "type": data.value,
                                        "typeDiscount": data
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={3}
                            mobileFullWidth
                            withPadding
                        >
                            <strong>Periode Pembelian</strong>

                            <Row>
                                <Col
                                    column={6}
                                    withPadding
                                >
                                    <Row>

                                        <Col
                                            column={2}
                                        >
                                            <Datepicker
                                                id={"startAt"}
                                                title={"Dari"}
                                                value={_form.validFrom}
                                                onChange={date => {
                                                    _updateQuery({
                                                        "validFrom": dateFilter.basicDate(new Date(date)).normal
                                                    })

                                                    if (_form.type == "BOOKING_DATE") {
                                                        _updateQuery({
                                                            "startAt": dateFilter.basicDate(new Date(date)).normal + " 00:00:00",
                                                            "timeStartAt": _form.timeValidFrom + ":00"
                                                        })
                                                    }
                                                }}
                                            />
                                        </Col>

                                        <Col
                                            column={2}
                                        >
                                            <Input
                                                maxLength={5}
                                                title={"Jam:Menit"}
                                                placeholder={'00:00'}
                                                value={_form.timeValidFrom}
                                                onChange={(value) => {
                                                    _updateQuery({
                                                        "timeValidFrom": value
                                                    })
                                                }}
                                            />
                                        </Col>



                                    </Row>
                                </Col>
                            </Row>

                            <Row>
                                <Col
                                    column={6}
                                    withPadding
                                >
                                    <Row>
                                        <Col
                                            column={2}
                                        >
                                            <Datepicker
                                                id={"endAt"}
                                                title={"Sampai"}
                                                value={_form.validUntil}
                                                onChange={date => {
                                                    _updateQuery({
                                                        "validUntil": dateFilter.basicDate(new Date(date)).normal
                                                    })

                                                    if (_form.type == "BOOKING_DATE") {
                                                        _updateQuery({
                                                            "endAt": dateFilter.basicDate(new Date(date)).normal + " 23:59:59",
                                                            "timeEndAt": _form.timeValidUntil + ":00"
                                                        })
                                                    }
                                                }}
                                            />
                                        </Col>

                                        <Col
                                            column={2}
                                        >
                                            <Input
                                                maxLength={5}
                                                title={"Jam:Menit"}
                                                placeholder={'23:59'}
                                                value={_form.timeValidUntil}
                                                onChange={(value) => {
                                                    _updateQuery({
                                                        "timeValidUntil": value
                                                    })
                                                }}
                                            />
                                        </Col>

                                    </Row>

                                </Col>
                            </Row>
                        </Col>

                        {
                            _form.type == "DEPARTURE_DATE" && (
                                <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <strong>Periode Keberangkatan</strong>

                                    <Row>
                                        <Col
                                            column={3}
                                            withPadding
                                        >
                                            <Datepicker
                                                id={"validFrom"}
                                                title={"Dari"}
                                                value={_form.startAt}
                                                onChange={date => {
                                                    _updateQuery({
                                                        "startAt": dateFilter.basicDate(new Date(date)).normal + " 00:00:00"
                                                    })
                                                }}
                                            />
                                        </Col>

                                        <Col
                                            column={3}
                                            withPadding
                                        >
                                            <Datepicker
                                                id={"validUntil"}
                                                title={"Sampai"}
                                                value={_form.endAt}
                                                onChange={date => {
                                                    _updateQuery({
                                                        "endAt": dateFilter.basicDate(new Date(date)).normal + " 23:59:59"
                                                    })
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            )
                        }


                        <Row
                            style={{
                                marginTop: "1rem"
                            }}
                        >
                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    title={"Min Beli (Qty)"}
                                    placeholder={'Masukan Qty'}
                                    value={_form.minQuantity}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "minQuantity": value
                                        })
                                    }}
                                />
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    max={4}
                                    type={"number"}
                                    title={"Maks Beli (Qty)"}
                                    placeholder={'Masukan Qty'}
                                    value={_form.maxQuantity}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "maxQuantity": value
                                        })
                                    }}
                                />
                            </Col>

                            <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                            >

                                <div
                                    className={styles.container}
                                >
                                    <div
                                        className={styles.activate_container}
                                    >
                                        <p
                                            className={styles.mb_1}
                                        >
                                            Satuan Diskon
                                        </p>

                                        <Label
                                            activeIndex={_form.format}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Persen',
                                                    value: "PERCENTAGE",
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "format": "PERCENTAGE",
                                                            "value": "",
                                                            "maxAmount": ""
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Nominal',
                                                    value: "AMOUNT",
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "format": "AMOUNT",
                                                            "value": "",
                                                            "maxAmount": ""
                                                        })

                                                    }
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>

                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    max={_form.format == "PERCENTAGE" ? 100 : 100000000}
                                    type={_form.format == "AMOUNT" ? 'currency' : 'number'}
                                    title={"Diskon"}
                                    placeholder={'Masukan nilai'}
                                    value={_form.value}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "value": value
                                        })

                                        if (_form.format == "AMOUNT") {
                                            _updateQuery({
                                                "maxAmount": value
                                            })
                                        }


                                    }}
                                />
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    type={"currency"}
                                    disabled={_form.format == "AMOUNT" ? true : false}
                                    title={"Maks Diskon"}
                                    placeholder={'Masukan nilai'}
                                    value={_form.maxAmount}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "maxAmount": value
                                        })
                                    }}
                                />
                            </Col>


                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    disabled={_form.minFare > 0}
                                    title={"Min Pembelian (Rp)"}
                                    placeholder={'Masukan min beli'}
                                    type={"currency"}
                                    value={_form.minFare > 0 ? 0 : _form.minAmount}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "minAmount": value
                                        })
                                    }}
                                />
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    type={"currency"}
                                    title={"Set Harga (Rp)"}
                                    placeholder={'Masukan min tarif'}
                                    value={_form.minFare}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "minFare": value
                                        })
                                    }}
                                />
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    title={"Kuota"}
                                    placeholder={'Masukan nilai'}
                                    value={_form.quota}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "quota": value
                                        })
                                    }}
                                />
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <div
                                    className={styles.container}
                                >
                                    <div
                                        className={styles.activate_container}
                                    >
                                        <p
                                            className={styles.mb_1}
                                        >
                                            Kuota Harian
                                        </p>

                                        <Label
                                            activeIndex={_form.isDailyQuota}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Tidak',
                                                    value: false,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "isDailyQuota": false
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Ya',
                                                    value: true,
                                                    onClick: () => {
                                                        _updateQuery({
                                                            "isDailyQuota": true
                                                        })
                                                    }
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </Col>

                            <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    title={"Maks Pembelian (1 User)"}
                                    placeholder={"Masukan Nominal"}
                                    value={_form.maxPurchasePerUser}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "maxPurchasePerUser": value
                                        })
                                    }}
                                />
                            </Col>
                        </Row>
                    </Row>

                    <Row
                        marginBottom
                        verticalEnd
                    >
                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Maks Pembelian (1 User/Hari)"}
                                placeholder={'Masukan nominal'}
                                value={_form.maxPurchaseDailyPerUser}
                                onChange={(value) => {
                                    _updateQuery({
                                        "maxPurchaseDailyPerUser": value
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >

                            <SelectArea
                                title={"Platform"}
                                onSelect={(data) => {
                                    _updatePlatform(data, true)
                                }}
                                select={_platformSelect}
                            />

                            <Input
                                title={""}
                                placeholder={'Pilih Platform'}
                                value={_form.platformInput.title}
                                suggestions={_platformRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updatePlatform(data)
                                    return false
                                }}
                            />
                        </Col>

                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Group"}
                                placeholder={'Masukan group'}
                                value={_form.group}
                                onChange={(value) => {
                                    _updateQuery({
                                        "group": value
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={3}
                            mobileFullWidth
                            withPadding
                        >
                            <SelectArea
                                title={"Keanggotaan"}
                                onSelect={(data) => {
                                    _updateMember(data, true)
                                }}
                                select={_memberSelect}
                            />

                            <Input
                                title={""}
                                placeholder={'Pilih Keanggotaan'}
                                value={_form.memberInput.title}
                                suggestions={_memberRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateMember(data)
                                    return false
                                }}
                            />
                        </Col>
                    </Row>

                    <Row
                        marginBottom
                        verticalEnd
                    >
                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <div
                                className={styles.container}
                            >
                                <div
                                    className={styles.activate_container}
                                >
                                    <p
                                        className={styles.mb_1}
                                    >
                                        Pakai Voucher
                                    </p>

                                    <Label
                                    activeIndex={_form.isVoucher}
                                    labels={[
                                        {
                                            class: "warning",
                                            title: 'Tidak',
                                            value: false,
                                            onClick: () => {
                                                _updateQuery({
                                                    "isVoucher": false
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Ya',
                                            value: true,
                                            onClick: () => {
                                                _updateQuery({
                                                    "isVoucher": true
                                                })
                                            }
                                        }
                                    ]}
                                    />
                                </div>
                            </div>
                        </Col>

                        {
                            _form.isVoucher && (
                                <>

                                    <Col
                                        column={1}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <div
                                            className={styles.container}
                                        >
                                            <div
                                                className={styles.activate_container}
                                            >
                                                <p
                                                    className={styles.mb_1}
                                                >
                                                    Gunakan Berulang
                                                </p>

                                                <Label
                                                    activeIndex={_form.isRepeatable}
                                                    labels={[
                                                        {
                                                            class: "warning",
                                                            title: 'Tidak',
                                                            value: false,
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "isRepeatable": false
                                                                })
                                                            }
                                                        },
                                                        {
                                                            class: "primary",
                                                            title: 'Ya',
                                                            value: true,
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "isRepeatable": true
                                                                })
                                                            }
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </Col>




                                    <Col
                                        column={2}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <div
                                            className={styles.container}
                                        >
                                            <div
                                                className={styles.activate_container}
                                            >
                                                <p
                                                    className={styles.mb_1}
                                                >
                                                    Kategori Voucher
                                                </p>

                                                <Label
                                                    activeIndex={_form.voucherCategory}
                                                    labels={[
                                                        {
                                                            class: "warning",
                                                            title: 'Publik',
                                                            value: "PUBLIC",
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "voucherCategory": "PUBLIC"
                                                                })
                                                            }
                                                        },
                                                        {
                                                            class: "primary",
                                                            title: 'Privat',
                                                            value: "PRIVATE",
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "voucherCategory": "PRIVATE"
                                                                })
                                                            }
                                                        },
                                                        {
                                                            class: "primary",
                                                            title: 'Highlights',
                                                            value: "DAMRIAPPS",
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "voucherCategory": "DAMRIAPPS"
                                                                })
                                                            }
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </Col>

                                    <Col
                                        column={1}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <Input
                                            title={"Kode Voucher"}
                                            placeholder={'Masukan kode'}
                                            value={_form.voucherCode}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "voucherCode": value
                                                })
                                            }}
                                        />
                                    </Col>
                                </>
                            )
                        }

                    </Row>

                    <Row
                    marginBottom
                    >
                        <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                        >
                            <Input
                                title={"Penerbit"}
                                placeholder={'Contoh: BISKU'}
                                value={_form.provider}
                                onChange={(value) => {
                                    _updateQuery({
                                        "provider": value
                                    })
                                }}
                            />
                        </Col>

                        <Col
                            column={2}
                            mobileFullWidth
                            withPadding
                        >
                            <div
                                className={styles.container}
                            >
                                <div
                                    className={styles.activate_container}
                                >
                                    <p
                                        className={styles.mb_1}
                                    >
                                        Pembelian Berdasarkan
                                    </p>

                                    <Label
                                        activeIndex={_form.promotion_object}
                                        labels={[
                                            {
                                                class: "warning",
                                                title: 'Kode Booking',
                                                value: "BOOKING_CODE",
                                                onClick: () => {
                                                    _updateQuery({
                                                        "promotion_object": "BOOKING_CODE"
                                                    })
                                                }
                                            },
                                            {
                                                class: "primary",
                                                title: 'Tiket',
                                                value: "TICKET",
                                                onClick: () => {
                                                    _updateQuery({
                                                        "promotion_object": "TICKET"
                                                    })
                                                }
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        </Col>

                        <Col
                            column={2}
                            mobileFullWidth
                            withPadding
                        >
                            <div
                                className={styles.container}
                            >
                                <div
                                    className={styles.activate_container}
                                >
                                    <p
                                        className={styles.mb_1}
                                    >
                                        Aktivasi Promosi
                                    </p>

                                    <Label
                                        activeIndex={_form.isActive}
                                        labels={[
                                            {
                                                class: "warning",
                                                title: 'Tidak',
                                                value: false,
                                                onClick: () => {
                                                    // _setIsActive(false)
                                                    _updateQuery({
                                                        "isActive": false
                                                    })
                                                }
                                            },
                                            {
                                                class: "primary",
                                                title: 'Ya',
                                                value: true,
                                                onClick: () => {
                                                    // _setIsActive(true)
                                                    _updateQuery({
                                                        "isActive": true
                                                    })
                                                }
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        </Col>

                    </Row>

                    <Row
                    spaceBetween
                    >
                       
                        <Col
                        column={3}
                        mobileFullWidth
                        withPadding
                        >
                            <Button
                            disabled={_validationForm()}
                            title={'Simpan'}
                            styles={Button.primary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />
                        </Col>
                        
                        {
                            router.query?.detail && (
                                <Col
                                column={3}
                                mobileFullWidth
                                withPadding
                                justifyEnd
                                >
                                    <Button
                                    disabled={_validationForm()}
                                    icon={<BsFillSendPlusFill/>}
                                    title={'Simpan Baru'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _submitData(true)
                                    }}
                                    onProcess={_isProcessing}
                                    />
                                </Col>
                            )
                        }
                        

                    </Row>

                    
                </Card>
                </>
                )}

            </AdminLayout>
        </Main>
    )

}