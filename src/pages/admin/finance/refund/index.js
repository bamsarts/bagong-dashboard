import { useEffect, useState, forwardRef } from 'react'
import { API_ENDPOINT, postJSON, get, objectToParams, TICKET_ORDER_URL } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import styles from './Refund.module.scss'
import { AiFillEye, AiFillDelete, AiFillCaretRight, AiOutlineClose } from 'react-icons/ai'
import { currency, dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import RefundModal from '../../../../components/RefundModal'
import ApprovalRefundModal from '../../../../components/ApprovalRefundModal'
import TransferRefundModal from '../../../../components/TransferRefundModal'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'
import DetailRefundModal from '../../../../components/DetailRefundModal'
import Label from '../../../../components/Label'
import throttle from '../../../../utils/throttle'
import ImportRefundModal from '../../../../components/ImportRefundModal'
import MutationRefundModal from '../../../../components/MutationRefundModal'
import StatusRefundModal from '../../../../components/StatusRefundModal'

export default function Refund(props) {

    const [_accessFeature, _setAccessFeature] = useState({
        refundTransfer: false,
        hasAccessApproval: false,
        hasAccessRequestRefund: false
    })

    const [_checklistRange, _setChecklistRange] = useState([])

    const [_hasChecklist, _setHasChecklist] = useState(false)

    const [_checklistAll, _setChecklistAll] = useState(false)

    const _handleChecked = (position, field, check, checklistAll = false, reset = false) => {
       
        let updateMenu = []

        _checklistRange.forEach(function(val, key){

            if(reset){
                val.state = false
            }
            
            if(checklistAll){
                if(val.status == "APPROVE" && !val.remark && !val.faspayStatus){
                    val.state = _checklistAll
                }
            }else{
                if(key == position){
                    val.state = check ? false : true
                }
            }
           
            updateMenu.push(val)
        })

        _setChecklistRange(updateMenu);
        _checkChecklist()
    }

    const [_bulkTicket, _setBulkTicket] = useState([])
    const [_selectedTicket, _setSelectedTicket] = useState([])
    const [_summaryRefund, _setSummaryRefund] = useState({
        "netRefund": 0,
        "feeTransfer": 0,
        "brutoRefund": 0
    })
    
    useEffect(() => {
        if(_checklistRange.length > 0){
            _handleChecked(false, false, false, true, false)
        }
    }, [_checklistAll])

    function _checkChecklist(){
        
        var stateChecklist = false
        let bulk = []
        let selected = []
        let totalRefund = 0

        _checklistRange.forEach(function(val, key){
            if(val.state){
                stateChecklist = true

                bulk.push(val.voidCode)
                selected.push(val)

                totalRefund += val.voidAmount
            }
        })

        _setHasChecklist(stateChecklist)
        _setBulkTicket(bulk)
        _setSelectedTicket(selected)
        _setTotalRefund(totalRefund)
    }

    const __INSERT_COLUMNS = [
        [
            { value: "Total" },
            { value: ""},
            { value: ""},
            { value: ""},
            { value: ""},
            { value: ""},
            { value: currency(_summaryRefund.brutoRefund, "Rp"), textAlign: "right"},
            { value: currency(_summaryRefund.feeTransfer, "Rp"), textAlign: "right"},
            { value: currency(_summaryRefund.netRefund, "Rp"), textAlign: "right"},
            { value: ""},
            { value: ""},
            { value: ""},
        ]
    ]

    const __COLUMNS = [
        {
            title : 'Kode Void',
            field : 'voidCode',
            textAlign: 'center',
            customCell: (value, row) => {


                return value
            }
        },
        {
            title : 'Tanggal Pengajuan',
            field : 'createdAt',
            textAlign: 'center',
            customCell: (value, row) => {


                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title : 'Tanggal Berangkat',
            field : 'departureDate',
            textAlign: 'center',
            customCell: (value, row) => {

                let date = value.toString()

                return dateFilter.getMonthDate(new Date(date.replace(",","-")))
            }
        },
        {
            title : 'Tiket',
            field : 'group',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                        <div
                        style={{
                            display: "grid"
                        }}
                        >
                            {
                                value.map((val, key)  => {
                                    return (
                                        <span
                                        style={{
                                            margin: ".2rem"
                                        }}
                                        >
                                            {val.partnerTicket}
                                        </span>
                                    )
                                })
                            }
                       </div>
                )
            }
        },
        {
            title : 'Asal - Tujuan',
            field : 'originName',
            textAlign: 'left',
            minWidth: "250px",
            customCell: (value, row) =>{
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
                                {row.originName}
                            </span>
                            <span>{row.destinationName}</span>
                        </Col>

                    </Row>
                )
            }
        },
        {
            title : 'Harga Tiket',
            field : 'transactionAmount',
            textAlign: 'right',
            customCell: (value, row) =>{
                return currency(value)
            }
        },
        {
            title : 'Bruto Refund',
            field : 'group',
            textAlign: 'right',
            customCell: (value, row) =>{

                let total = 0

                value.forEach(function(val, key){
                    total += (val.voidAmount)
                })

                return currency(total)
            }
        },
        {
            title : 'Biaya Transfer',
            field : 'transferFeeAmount',
            textAlign: 'right',
            customCell: (value, row) =>{
                return currency(value)
            }
        },
        {
            title : 'Nominal Refund (Rp)',
            field : 'group',
            textAlign: 'right',
            customCell: (value, row) =>{

                let total = 0

                value.forEach(function(val, key){
                    total += (val.voidAmount-val.transferFeeAmount)
                })

                return currency(total)
            }
        },        
        {
            title : 'Rekening',
            field : 'paymentMethod',
            textAlign: 'left',
            customCell: (value, row) =>{
                return (
                    <div style={{
                        "display": "grid"
                    }}>
                        <span>{row.accountName}</span>
                        <span>{row.bankName}: {row.accountNumber}</span>

                        {
                            row.remark && (
                                <div
                                style={{    
                                    marginTop: ".5rem"
                                }}
                                >
                                    <Label
                                    activeIndex={true}
                                    labels={[
                                        {
                                            "class": 'danger',
                                            "title": row.remark,
                                            "value": true
                                        }
                                    ]}
                                    />
                                </div>
                            )
                        }
                       
                    </div>
                )
            }
        },
        {
            title : 'Status',
            field : 'status',
            textAlign: 'center',
            customCell: (value, row ) => {

                return (
                    <Row
                    verticalCenter
                    >
                        
                        <Label
                        activeIndex={true}
                        labels={[
                            {
                                "class": value == "SUCCESS" ? 'primary' : "warning",
                                "title": value == "SUCCESS" ? 'TERBAYAR' : "DIAJUKAN",
                                "value": true
                            }
                        ]}
                        />

                        {
                            (row.faspayStatus && row.faspayStatus != "2") && (
                                <>
                                    <div
                                    style={{
                                        marginRight: "1rem"
                                    }}
                                    >
                                        <AiFillCaretRight />
                                    </div>


                                    <Label
                                    activeIndex={true}
                                    labels={[
                                        {
                                            "class": row.faspayStatus != "4" ? 'primary' : "danger",
                                            "title": row.faspayStatus != "4" ? "Faspay "+row.faspayMessage : 'Pembayaran Gagal',
                                            "value": true
                                        }
                                    ]}
                                    />
                                </>
                            )
                        }
                        
                        
                    </Row>
                  
                )
            }
        },
        {
            title : '',
            field : "id",
            customCell : (value, row) => {

                return (
                    <Row
                    spaceEvenly
                    style={{
                        width: (row.faspayStatus == "1" || row.faspayStatus == "9" || row.faspayStatus == "4") ? "200px" : "50px"
                    }}
                    >

                        <Button
                        small
                        title={"Detail"}
                        styles={Button.secondary}
                        onClick={() => {
                            _setDetailManifest(row)
                            _setIsOpenDetailRefundModal(true)
                        }}
                        />

                        {
                            row.faspayStatus == "1" && (
                                <Button
                                disabled={_isProcessing}
                                small
                                title={"Check Status"}
                                onClick={() => {
                                    _checkStatus(row.voidCode)
                                }}
                                />
                            )
                        }

                        {
                            (row.faspayStatus == "9" || row.faspayStatus == "4") && (
                                <Button
                                disabled={_isProcessing}
                                small
                                title={"Perbarui Refund"}
                                onClick={() => {
                                    _regenerateRefund(row.group)
                                }}
                                />
                            )
                        }

                        

                    </Row>
                )
            }
        }
    ]

    const __HEADER = [
        [
            { title: "Kode Void", rowSpan: 1 },
            { title: "Tanggal Pengajuan", rowSpan: 1 },
            { title: "Tanggal Berangkat", rowSpan: 1 },
            { title: "Tiket", rowSpan: 1 },
            { title: "Asal - Tujuan", rowSpan: 1 },
            { title: "Harga Tiket", rowSpan: 1 },
            { title: "Bruto Refund", rowSpan: 1 },
            { title: "Biaya Transfer", rowSpan: 1 },
            { title: "Nett Refund", rowSpan: 1 },
            { title: "Rekening", rowSpan: 1 },
            { title: "Status", colSpan: 1 },
            { title: "", rowSpan: 1 }
        ],
    ]

    const [_manifestExport, _setManifestExport] = useState([])
    const [_manifestList, _setManifestList] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_startDate, _setStartDate] = useState(new Date())
    const [_endDate, _setEndDate] = useState(new Date())
    const [_departureDate, _setDepartureDate] = useState("")
    const [_detailManifest, _setDetailManifest] = useState({})
    const [_isOpenApprovalModal, _setIsOpenApprovalModal] = useState(false)
    const [_isOpenRefundModal, _setIsOpenRefundModal] = useState(false)
    const [_isOpenImportModal, _setIsOpenImportModal] = useState(false)
    const [_isOpenTransferRefundModal, _setIsOpenTransferRefundModal] = useState(false)
    const [_isOpenDetailRefundModal, _setIsOpenDetailRefundModal] = useState(false)
    const [_isOpenMutationRefundModal, _setIsOpenMutationRefundModal] = useState(false)
    const [_isOpenStatusRefundModal, _setIsOpenStatusRefundModal] = useState(false)

    const [_channelRanges, _setChannelRanges] = useState([
        {
            title: "Semua Channel",
            value: ""
        },
        {
            title: "Damri Apps",
            value: "DAMRI_APPS"
        },
        {
            title: "Counter",
            value: "COUNTER"
        }
    ])

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
    

    const CONFIG_PARAM = {
        "branchId": "",
        "branchName": "Semua Cabang",
        "channel": "",
        "channelName": "Semua Channel",
        "statusVoid": "",
        "statusVoidName": "Semua Status"
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_checkingAccess, _setCheckingAccess] = useState(false)
    const [_totalRefund, _setTotalRefund] = useState(0)
    const [_availableBalance, _setAvailableBalance] = useState(0)

    function _checkAccessFeature(){
        if (typeof window !== 'undefined') {
            // Perform localStorage action
            if(validateRole() == "2"){
                _setAccessFeature({
                    refundTransfer: true
                })

                _updateQuery({
                    "statusVoid": "APPROVE",
                    "statusVoidName": "Disetujui"
                })

                _setCheckingAccess(true)
            }else{
                let storage = getLocalStorage("access_menu_damri")
            
                if( storage == null){
                    window.location.href = "/sign-in"
                }else{
                    const item = JSON.parse(storage)
                    item.forEach(function(val, key){
                        
                        if(val.menu == "Jadwal>Manifest Penumpang>Transfer Refund" && val.updateRole){
                            _updateAccessFeature({
                                refundTransfer: true
                            }) 
                        }

                        if(val.menu == "Jadwal>Manifest Penumpang>Approval Refund" && val.updateRole){
                            _updateAccessFeature({
                                hasAccessApproval: true
                            })
                        }

                        if(val.menu == "Jadwal>Manifest Penumpang>RequestRefund" && val.viewRole) {
                            _updateAccessFeature({
                                hasAccessRequestRefund: true
                            })
                        }
                    })

                    _setCheckingAccess(true)
                }
            }
        }
    }

    function validateRole(){
        //ROLE ACCESS
        // 1. USER
        // 2. ADMIN
        // 3. CREW
        // 4. OWNER 
        // 5. FINANCE 
        // 6. MARKETING 
        // 7. AUDITOR 
        // 8. CASHIER 
        // 9. COUNTER 
        // 10. OPERATION 
        // 11. PARTNER
        // 12. ADMIN CABANG
        // 13. ADMIN PUSAT
        return props.roleId
    }

    function allowedPayment(payment){
        return ["Traveloka","Tiket","Redbus"].indexOf(payment) >= 0
    }

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Pengajuan Awal"}
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
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _setStartDate("")
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    const EndDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Pengajuan Akhir"}
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
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _setEndDate("")
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    const CustomDateDeparture = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Berangkat"}
            onClick={onClick}
            ref={ref}
            value={_departureDate == "" ? "" : dateFilter.getMonthDate(_departureDate)}
            onChange={(value) => {
              
            }}
            />

            {
                _departureDate != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _setDepartureDate("")
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    
    useEffect(() => {   
        _checkAccessFeature()
        _getBranch()
    }, [])

    useEffect(() => {

        if(_checkingAccess){
            _getData()
            _checkBalance(true)
        }
    }, [_checkingAccess])

    useEffect(() => {
        
    },[_checklistRange])


    const groupManifest = function(xs, key){
        return xs.reduce(function(rv, x){
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };

    async function _getData(query = _searchQuery) {
        _setIsProcessing(true)

        let params = {
            date: dateFilter.basicDate(_startDate).normal,
            endDate: dateFilter.basicDate(_endDate).normal
        }

        if (_departureDate != "") params.departureDate = `${dateFilter.basicDate(_departureDate).normal}`
        if (query != "") params.voidCode = `${query}`
        if (_form.statusVoid != "") params.voidStatus = `${_form.statusVoid}`
        
        _setBulkTicket([])
        _setSelectedTicket([])
        
        try {
            const manifest = await get(
                {
                    url: TICKET_ORDER_URL+'/dashboard/transaction/refund?'+objectToParams(params)
                }, 
                props.authData.token
            )

            let finalManifest = []

            const groupByVoid = groupManifest(manifest.data, "voidCode")
            let totalRefund = 0
            let summaryRefund = {
                "netRefund": 0,
                "feeTransfer": 0,
                "brutoRefund": 0
            }

            for(let x in groupByVoid){
                let data = {
                    ...groupByVoid[x][0]
                }

                let transferFee = 0

                data.group = groupByVoid[x]

                finalManifest.push(data)

                groupByVoid[x].forEach(function(val, key){
                    transferFee += val.transferFeeAmount
                })

                summaryRefund.netRefund += (groupByVoid[x][0].voidAmount * groupByVoid[x].length) - (transferFee)
                summaryRefund.brutoRefund += (groupByVoid[x][0].voidAmount) * groupByVoid[x].length
                summaryRefund.feeTransfer += (transferFee)

                console.log("net refund "+summaryRefund.netRefund)
                console.log("refund "+(groupByVoid[x][0].voidAmount-groupByVoid[x][0].transferFeeAmount) * groupByVoid[x].length)
            }

            if(_accessFeature.hasAccessApproval){
                let data = []

                finalManifest.forEach(function(val, key){
                    if(val.voidStatus != null){
                        data.push(val)
                    }
                })

                _setManifestList(data)
                _setManifestExport(manifest.data)
                
            }else{
                _setManifestList(finalManifest)
                _setManifestExport(manifest.data)
                _setChecklistRange(finalManifest)
            }

            _setSummaryRefund(summaryRefund)

            if(manifest.data.length == 0){
                popAlert({ message : "Pengembalian dana tidak tersedia" })
            }else{
                _checkBalance()
            }
           
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
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
            branch.data.forEach(function(val, key){

                if(key == 0){
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

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _updateAccessFeature(data = {}){
        _setAccessFeature(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitBulkPayment(media){
        _setIsProcessing(true)
        try{
        
            const queryBulk = {
                "voidCode": _bulkTicket
            }

            console.log(queryBulk)
            console.log(_selectedTicket)
            // return false

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/payment/bulk/v2"
            }, queryBulk, props.authData.token)

            if(result) {

                if(result.data){
                    let data = _selectedTicket

                    data.forEach(function(val, key){
                        result.data.forEach(function(i, j){
                            if(i.voidCode == val.voidCode){
                                val.message = i.message
                            }
                        })
                    })

                    // result.data.forEach(function(val, key){
                    //     data[key].message = val.message
                    // })

                    _setSelectedTicket(data)
                    
                    _setIsOpenStatusRefundModal(true)
                }else{
                    popAlert({ message : "Pembayaran berhasil diselesaikan", type: "success"})       
                }
                _setHasChecklist(false)
                _getData()
            }
            
        }catch(e){
            popAlert({ message : e.message })       
            _setIsProcessing(false)
        } finally{
        }
    }

    async function _checkBalance(isNotif = false){
        try{
           
            const result = await get({
                url: TICKET_ORDER_URL + "/dashboard/deposit/balance/check"
            }, props.authData.token)

            if(result.data) {
                _setAvailableBalance(result.data)
                
                //IDR price
                if(isNotif && parseInt(result.data.balance) < 10000000){
                    popAlert({ message : "Saldo saat ini sebesar "+currency(result.data.balance, "Rp") + " segera lakukan isi ulang", "duration": 100000 })       
                }
            }
            
        }catch(e){
            popAlert({ message : e.message })       
        } finally{

        }
    }

    async function _regenerateRefund(group){

        _setIsProcessing(true)

        try{
            const query = []

            group.forEach(function(val, key){
                query.push({
                    "accountNumber": val.accountNumber,
                    "faspayStatus": val.faspayStatus,
                    "status": val.status,
                    "submissionDate": dateFilter.basicDate(new Date(val.createdAt)).normal,
                    "voidCode": val.voidCode
                })
            })

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/regenerate"
            }, query, props.authData.token)

            if(result) {
                popAlert({ message : "Refund berhasil diperbarui"})       
                _getData()
            }
            
        } catch(e) {
            popAlert({ message : "Berhasil diperbarui", type: "success" })   
            _getData()    
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _checkStatus(voidcode){

        _setIsProcessing(true)

        try{
            const query = {
                voidCode: voidcode
            }

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/payment/check"
            }, query, props.authData.token)

            if(result.data) {
                popAlert({ message : "Pembayaran rekening "+result.data.beneficiary_account+" sebesar "+currency(Math.floor(result.data.trx_amount/100), "Rp") + " "+result.data.message, duration: 10000, type: result.data.status == "2" ? "success" : "warning"})       
                _getData()
            }
            
        }catch(e){
            popAlert({ message : e.message.id })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <MutationRefundModal
            data={_availableBalance}
            visible={_isOpenMutationRefundModal}
            closeModal={() => {
                _setIsOpenMutationRefundModal(false)
            }}
            />

            <RefundModal
            data={_detailManifest}
            visible={_isOpenRefundModal}
            closeModal={() => {
                _setDetailManifest({})
                _setIsOpenRefundModal(false)
            }}
            onSuccess={() => {
                _getData()
                _setDetailManifest({})
                _setIsOpenRefundModal(false)
            }}
            />

            <DetailRefundModal
            data={_detailManifest}
            visible={_isOpenDetailRefundModal}
            closeModal={() => {
                _setDetailManifest({})
                _setIsOpenDetailRefundModal(false)
            }}
            onSuccess={() => {
                _getData()
                _setDetailManifest({})
                _setIsOpenDetailRefundModal(false)
            }}
            onTransfer={() => {
                _setIsOpenDetailRefundModal(false)
                _setIsOpenTransferRefundModal(true)
            }}
            />

            <ApprovalRefundModal
            data={_detailManifest}
            visible={_isOpenApprovalModal}
            closeModal={() => {
                _setIsOpenApprovalModal(false)
                _setDetailManifest({})
            }}
            onSuccess={() => {
                _getData()
                _setIsOpenApprovalModal(false)
                _setDetailManifest({})
            }}
            />

            <TransferRefundModal
            data={_detailManifest}
            visible={_isOpenTransferRefundModal}
            closeModal={() => {
                _setIsOpenTransferRefundModal(false)
                _setDetailManifest({})
            }}
            onSuccess={() => {
                _getData()
                _setIsOpenTransferRefundModal(false)
                _setDetailManifest({})
            }}
            />
            
            <ImportRefundModal
            visible={_isOpenImportModal}
            closeModal={() => {
                _setIsOpenImportModal(false)
            }}
            onSuccess={() => {
                _getData()
                _setIsOpenImportModal(false)
            }}
            />

            <StatusRefundModal
            visible={_isOpenStatusRefundModal}
            data={_selectedTicket}
            closeModal={() => {
                _setIsOpenStatusRefundModal(false)
            }}
            />

            <AdminLayout
            headerContent={(
                <Row
                flexEnd
                spaceBetween
                >
                    <Col
                    column={1}
                    style={{
                        display: "grid",
                        color: "#fff"
                    }}
                    >
                        <span>Saldo</span>
                        <strong
                        style={{
                            marginTop: "1rem"
                        }}
                        >
                            {currency(_availableBalance?.balance, "Rp")}
                        </strong>
                    </Col>

                    <Col
                    style={{
                        display: "grid",
                        color: "#fff"
                    }}
                    >
                        <span>Saldo tersedia untuk transaksi</span>
                        <strong
                        style={{
                            marginTop: "1rem"
                        }}
                        >
                            {currency(_availableBalance?.available_balance, "Rp")}
                        </strong>
                    </Col>
                    

                    <Col
                    justifyEnd
                    alignEnd
                    >
                        <Button
                        style={{
                            width: "fit-content"
                        }}
                        title={'Lihat Mutasi'}
                        onClick={() => {
                            _setIsOpenMutationRefundModal(true)
                        }}
                        small
                        />
                    </Col>
                   
                </Row>
               
            )} 
            >  

                <Card
                noPadding
                >
                    <Row
                    withPadding
                    >
                        <Col
                        column={1}
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_startDate}
                            onChange={(date) => {
                                _setStartDate(date)

                                console.log(date)
                
                            }}
                            customInput={<CustomDatePicker/>}
                            />
                        </Col>

                        <Col
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
                            customInput={<EndDatePicker/>}
                            />
                        </Col>

                        <Col
                        column={1}
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_departureDate}
                            onChange={(date) => {
                                _setDepartureDate(date)
                            }}
                            customInput={<CustomDateDeparture/>}
                            />
                        </Col>
                   
                        <Col
                        column={1}
                        >
                            <Input
                            withMargin
                            title={"Status"}
                            placeholder={'Pilih Status'}
                            value={_form.statusVoidName}
                            suggestions={_statusVoidRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "statusVoid": value.value,
                                    "statusVoidName": value.title
                                })
                            }}
                            />
                        </Col>

                       

                        <Col
                        column={1}
                        withPadding
                        justifyCenter
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
                    insertColumns={__INSERT_COLUMNS}
                    exportToXls={false}
                    tableHeaders={__HEADER}
                    isLoading={_isProcessing}
                    columns={__COLUMNS}
                    records={_manifestList}
                    headerContent={(

                        <Row
                        spaceBetween
                        >
                            {/* <Button
                            styles={Button.primary}
                            title={'Import Pembayaran'}
                            onClick={() => {
                                _setIsOpenImportModal(true)
                            }}
                            /> */}

                            <Col
                            column={2}
                            mobileFullWidth
                            >
                                <Input
                                placeholder={'Cari tiket'}
                                value={_searchQuery}
                                onChange={(query) => {
                                    _setSearchQuery(query)
                                    if(query.length > 1){
                                        throttle(() => _getData(query), 100)()
                                    }else{
                                        _getData(query)  
                                    }
                                }}
                                />
                            </Col>

                            <Button
                            title={'Export Xlsx'}
                            styles={Button.success}
                            headExport={[
                                {
                                    title: "Kode Void",
                                    value: 'voidCode',
                                },
                                {
                                    title: "Tanggal Pengajuan",
                                    value: 'createdAt',
                                    customCell: (value, row) => {
                                        return dateFilter.basicDate(new Date(value)).normal+"T"+dateFilter.getTime(new Date(value))
                                    }
                                },
                                {
                                    title: "Tanggal Keberangkatan",
                                    value: 'departureDate',
                                    customCell: (value, row) => {
                                        let date = value.toString()
                                        return date.replace(",","-")
                                    }
                                },
                                {
                                    title: "Tanggal Pembelian",
                                    value: 'transactionCreatedAt',
                                    customCell: (value, row) => {
                                        return dateFilter.basicDate(new Date(value)).normal+"T"+dateFilter.getTime(new Date(value))
                                    }
                                },
                                {
                                    title: "Kode Booking",
                                    value: 'partnerBookingCode'
                                },
                                {
                                    title: "Nomor Tiket",
                                    value: 'group',
                                    customCell: (value, row) => {
                                        let ticket = []

                                        value.map(function(val, key){
                                            ticket.push(val.partnerTicket)
                                        })

                                        return ticket.toString()
                                    }
                                },
                                {
                                    title: "Harga Tiket",
                                    value: 'transactionAmount'
                                },
                                {
                                    title: "Asal",
                                    value: 'originName'
                                },
                                {
                                    title: "Tujuan",
                                    value: 'destinationName'
                                },
                                {
                                    title: "Cabang",
                                    value: 'branchName'
                                },
                                {
                                    title: "Biaya Refund",
                                    value: 'group',
                                    customCell: (value, row) => {
                                        let fee = 0

                                        value.map(function(val, key){
                                            fee += val.penaltyValue
                                        })

                                        return fee
                                    }
                                },
                                {
                                    title: "Bruto Refund",
                                    value: 'group',
                                    customCell: (value, row) => {
                                        let bruto = 0

                                        value.map(function(val, key){
                                            bruto += val.voidAmount
                                        })

                                        return bruto
                                    }
                                },
                                {
                                    title: "Biaya Transfer",
                                    value: 'transferFeeAmount'
                                },
                                {
                                    title: "Nett Refund",
                                    value: 'group',
                                    customCell: (value, row) => {
                                        let bruto = 0

                                        value.map(function(val, key){
                                            bruto += val.voidAmount
                                        })

                                        return bruto - value[0].transferFeeAmount
                                    }
                                },
                                {
                                    title: "Nomor Rekening",
                                    value: 'accountNumber'
                                },
                                {
                                    title: "Nama Rekening",
                                    value: 'accountName'
                                },
                                {
                                    title: "Bank",
                                    value: 'bankName'
                                },
                                {
                                    title: "Status",
                                    value: 'status',
                                    customCell: (value, row) => {
        
                                        if(row.faspayStatus){
                                            return "Faspay "+row.faspayMessage
                                        }else{
                                            return value == "SUCCESS" ? "TERBAYAR" : "DIAJUKAN"
                                        }
        
                                    }
                                },
                                {
                                    title: "Alasan",
                                    value: "reason",
                                    customCell: (value, row) => {
                                        return !value ? 'Lain-lain': value
                                    }
                                }
                            ]}
                            dataExport={_manifestList}
                            titleExport={"pengajuan-refund-tgl-"+dateFilter.getMonthDate(_startDate).replace(" ","-")+"-sd-"+dateFilter.getMonthDate(_endDate).replace(" ","-")+".xlsx"}
                            />
                        </Row>
                    )}
                    />
                </Card>
                
                {
                    _bulkTicket.length > 0 && (
                        <div
                        style={{
                           position: "fixed",
                           bottom: "0px",
                           width: "100%"
                        }}
                        >
                            <Card
                            style={{
                                margin: "0 auto"
                            }}
                            >
                                <Row>
                                    <Col
                                    column={1}
                                    withPadding
                                    justifyCenter
                                    >
                                        <span
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                        >
                                            Tiket Terpilih
                                        </span>
                                        <strong>{_bulkTicket.length} Tiket</strong>
                                    </Col>

                                    <Col
                                    column={1}
                                    withPadding
                                    justifyCenter
                                    >
                                        <span
                                        style={{
                                            marginBottom: ".5rem"
                                        }}
                                        >
                                            Total Pengembalian Dana
                                        </span>
                                        <strong>{currency(_totalRefund, "Rp")}</strong>
                                    </Col>

                                    
                                    {
                                        _availableBalance?.available_balance && (
                                            <>
                                                <Col
                                                column={1}
                                                withPadding
                                                justifyCenter
                                                >
                                                    <span
                                                    style={{
                                                        marginBottom: ".5rem"
                                                    }}
                                                    >
                                                        Saldo Tersedia
                                                    </span>
                                                    <strong>{currency(_availableBalance.available_balance, "Rp")}</strong>
                                                </Col>
                                                
                                                <Col
                                                column={1}
                                                withPadding
                                                justifyCenter
                                                >
                                                    <Button
                                                    disabled={_totalRefund > _availableBalance.available_balance ? true : false}
                                                    onProcess={_isProcessing}
                                                    title={'Transfer Refund'}
                                                    styles={Button.success}
                                                    onClick={() => {
                                                        _submitBulkPayment()
                                                    }}
                                                    small
                                                    />
                                                </Col>
                                            </>
                                        )

                                        
                                    }
                                    


                                    
                                </Row>
                                
                            </Card>
                        </div>
                    )
                }
               
            </AdminLayout>
        </Main>
    )

}