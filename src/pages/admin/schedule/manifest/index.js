import { useEffect, useState, forwardRef } from 'react'
import { API_ENDPOINT, postJSON, get, objectToParams, TICKET_ORDER_URL } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import styles from './Manifest.module.scss'
import { AiFillEye, AiFillDelete, AiOutlinePlus, AiOutlineClose } from 'react-icons/ai'
import { currency, dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import RefundModal from '../../../../components/RefundModal'
import ApprovalRefundModal from '../../../../components/ApprovalRefundModal'
import TransferRefundModal from '../../../../components/TransferRefundModal'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'
import DetailRefundModal from '../../../../components/DetailRefundModal'
import Label from '../../../../components/Label'

Manifest.RESCHEDULE_QUERY_SESSION = "RESCHEDULE_QUERY_SESSION"

export default function Manifest(props) {

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
                if(val.voidStatus == "APPROVE" && !val.remark){
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
    

    useEffect(() => {
        if(_checklistRange.length > 0){
            _handleChecked(false, false, false, true, false)
        }
    }, [_checklistAll])

    function _checkChecklist(){
        
        var stateChecklist = false
        let bulk = []
        let totalRefund = 0

        _checklistRange.forEach(function(val, key){
            if(val.state){
                stateChecklist = true
                bulk.push({
                    "id": val.voidRefId,
                    "ticket": val.ticket
                })

                totalRefund += val.voidAmount
            }
        })

        _setHasChecklist(stateChecklist)
        _setBulkTicket(bulk)
        _setTotalRefund(totalRefund)
    }

    const __COLUMNS = [
        {
            title : 'Tanggal Berangkat',
            field : 'date',
            textAlign: 'center',
            customCell: (value, row) =>{
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title : 'Waktu',
            field : 'time',
            textAlign: 'center',
        },
        {
            title : 'Penumpang',
            field : 'passengerName',
            textAlign: 'left',
        },
        {
            title : 'Kode Booking',
            field : 'bookingCode',
            textAlign: 'left'
        },
        {
            title : 'Tiket',
            field : 'ticket',
            textAlign: 'left'
        },
        {
            title : 'Trayek',
            field : 'traject',
            textAlign: 'left'
        },
        {
            title : 'Status Pembayaran',
            field : 'paymentStatus',
            textAlign: 'left'
        },
       
    ]

    const __HEADER = [
        [
            { title: "Tanggal Berangkat", rowSpan: 2 },
            { title: "Waktu", rowSpan: 2 },
            { title: "Penumpang", rowSpan: 2 },
            { title: "Kode Booking", rowSpan: 2 },
            { title: "Tiket", rowSpan: 2 },
            { title: "Trayek", rowSpan: 2 },
            { title: "Status", colSpan: 2 },
            { title: "", rowSpan: 2 }
        ],
        [
            { title: "Pembayaran" },
        ]
    ]

    const [_manifestList, _setManifestList] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_startDate, _setStartDate] = useState(new Date())
    const [_detailManifest, _setDetailManifest] = useState({})
    const [_isOpenApprovalModal, _setIsOpenApprovalModal] = useState(false)
    const [_isOpenRefundModal, _setIsOpenRefundModal] = useState(false)
    const [_isOpenTransferRefundModal, _setIsOpenTransferRefundModal] = useState(false)
    const [_isOpenDetailRefundModal, _setIsOpenDetailRefundModal] = useState(false)
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
            title: "Disetujui",
            value: "APPROVE"
        },
        {
            title: "Sukses",
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

                            _updateQuery({
                                "statusVoid": "APPROVE",
                                "statusVoidName": "Disetujui"
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
            title={"Tanggal Berangkat"}
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

    
    useEffect(() => {   
        _checkAccessFeature()
        _getBranch()
    }, [])

    useEffect(() => {

        // if(_checkingAccess){
        //     _getData()
        // }
    }, [_checkingAccess])

    useEffect(() => {
        
    },[_checklistRange])


    async function _getData(query = _searchQuery) {
        _setIsProcessing(true)

        let params = {
            date: dateFilter.basicDate(_startDate).normal
        }

        if (_form.branchId != "") params.branchId = `${_form.branchId}`
        if (_form.channel != "") params.channel = `${_form.channel}`
        if (_form.statusVoid != "") params.voidStatus = `${_form.statusVoid}`
        
        _setBulkTicket([])
        
        try {
            const manifest = await get(
                {
                    url: TICKET_ORDER_URL+'/dashboard/transaction/passengers/manifest?'+objectToParams(params)
                }, 
                props.authData.token
            )

            if(_accessFeature.hasAccessApproval){
                let data = []

                manifest.data.forEach(function(val, key){
                    if(val.voidStatus != null){
                        data.push(val)
                    }
                })

                _setManifestList(data)
            }else{

                manifest.data.forEach(function(val, key){

                })

                _setManifestList(manifest.data)
                _setChecklistRange(manifest.data)
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
            const query = {
                "date": null,
                "details": _bulkTicket,
                "transferProof": null
            }

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/payment/bulk"
            }, query, props.authData.token)

            if(result) {
                popAlert({ message : "Pembayaran berhasil diselesaikan", type: "success"})       
                _setHasChecklist(false)
                _getData()
            }
            
        }catch(e){
            popAlert({ message : e.message })       
            _setIsProcessing(false)
        } finally{
        }
    }

    return (
        <Main>

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
            
            
            <AdminLayout>  

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
                            }}
                            customInput={<CustomDatePicker/>}
                            />
                        </Col>

                        <Col
                        column={1}
                        >
                            <Input
                            withMargin
                            title={"Cabang"}
                            placeholder={'Pilih Cabang'}
                            value={_form.branchName}
                            suggestions={_branchRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "branchId": value.value,
                                    "branchName": value.title
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={1}
                        >
                            <Input
                            withMargin
                            title={"Channel"}
                            placeholder={'Pilih Channel'}
                            value={_form.channelName}
                            suggestions={_channelRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "channel": value.value,
                                    "channelName": value.title
                                })
                            }}
                            />
                        </Col>
                           
                
                        {/* {
                            _form.segmentId != "" && (
                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Trayek"}
                                    placeholder={'Pilih Trayek'}
                                    value={_form.trajectMasterName}
                                    suggestions={_trajectRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "trajectMasterId": value.value,
                                            "trajectMasterName": value.title
                                        })
                                    }}
                                    />
                                </Col>
                            )
                        }
                         */}

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
                    headExport={[
                        {
                            title: "Tanggal Berangkat",
                            value: 'date'
                        },
                        {
                            title: "Waktu",
                            value: 'time'
                        },
                        {
                            title: "Tanggal Transaksi",
                            value: 'createdAt'
                        },
                        {
                            title: "Penumpang",
                            value: 'passengerName'
                        },
                        {
                            title: "Kode booking",
                            value: 'bookingCode'
                        },
                        {
                            title: "Tiket",
                            value: 'ticket'
                        },
                        {
                            title: "Trayek",
                            value: 'traject'
                        },
                        {
                            title: "No Rekening",
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
                            title: "Status Pembayaran",
                            value: 'paymentStatus'
                        },
                        {
                            title: "Status Void",
                            value: 'voidStatus'
                        }
                    ]}
                    tableHeaders={__HEADER}
                    isLoading={_isProcessing}
                    columns={__COLUMNS}
                    records={_manifestList}
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
                                            Refund Terpilih
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
                                            Total Refund
                                        </span>
                                        <strong>{currency(_totalRefund, "Rp")}</strong>
                                    </Col>

                                    <Col
                                    column={1}
                                    withPadding
                                    justifyCenter
                                    >
                                        <Button
                                        onProcess={_isProcessing}
                                        title={'Selesaikan Pembayaran'}
                                        styles={Button.success}
                                        onClick={() => {
                                            _submitBulkPayment()
                                        }}
                                        small
                                        />
                                    </Col>
                                </Row>
                                
                            </Card>
                        </div>
                    )
                }
               
            </AdminLayout>
        </Main>
    )

}