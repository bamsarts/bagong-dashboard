import { useContext, useEffect, useState, forwardRef } from 'react'

import { TICKET_ORDER_URL, API_ENDPOINT, get, objectToParams, postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Modal, { ModalContent } from '../Modal'
import Tabs from '../Tabs'
import Table from '../Table'
import { currency, dateFilter } from '../../utils/filters'
import { popAlert } from '../Main'
import { Col, Row } from '../Layout'
import ActivityIndicator from '../ActivityIndicator'
import Input from '../Input'
import { FaRust } from 'react-icons/fa'
import DatePicker from 'react-datepicker'
import { AiFillEye, AiFillDelete, AiFillCaretRight, AiOutlineClose } from 'react-icons/ai'
import Button from '../Button'

MutationRefundModal.defaultProps = {
    visible: false,
    closeModal: null,
    data: {}
}

export default function MutationRefundModal(props = MutationRefundModal.defaultProps){
 
    const today = new Date()
    const minDateSelected = new Date(new Date().setDate(new Date().getDate() - 31 ))
    const appContext = useContext(AppContext)

    const [_startDate, _setStartDate] = useState(today)
    const [_endDate, _setEndDate] = useState(today)

    const [_mutation, _setMutation] = useState([])
    const [_isGettingData, _setIsGettingData] = useState(false)
    const [_summary, _setSummary] = useState({
        "debit": 0,
        "credit": 0
    })

    const [_summaryMutation, _setSummaryMutation] = useState({
        "refund": 0,
        "topup": 0,
        "feeRegister": 0,
        "feeTransfer": 0
    })

    const __INSERT_COLUMNS = [
        [
            { value: "Total" },
            { value: currency(_summary.debit, "Rp"), textAlign: "right"},
            { value: currency(_summary.credit, "Rp"), textAlign: "right"},
            { value: ""}
        ]
    ]
  
    useEffect(() => {
        if(props.visible){
            console.log(props.data)
            _getMutation()
        }
    }, [props.visible, _startDate, _endDate])

    async function _getMutation() {

        _setIsGettingData(true)

        const query = {
            startAt : dateFilter.basicDate(_startDate).normal,
            endAt : dateFilter.basicDate(_endDate).normal,
        }

        try {
            const result = await get({ url : TICKET_ORDER_URL + `/dashboard/deposit/account/statement?${objectToParams(query)}` }, appContext.authData.token)
            
            if(result.data){
                
                let summary = {
                    "debit": 0,
                    "credit": 0
                }

                let summaryMutation = {
                    "refund": 0,
                    "topup": 0,
                    "feeRegister": 0,
                    "feeTransfer": 0
                }

                result.data.forEach(function(val, key){

                    if(val.transaction_type == "D"){
                        summary.debit += Math.ceil(val.transaction_amount)
                    }else{
                        summary.credit += parseInt(val.transaction_amount)
                    }

                    if(val.transaction_name == "transfer" && val.transaction_type == "D"){
                        
                        summaryMutation.refund += Math.ceil(val.transaction_amount)

                    } else if(val.transaction_name == "register"){
                        
                        summaryMutation.feeRegister += parseInt(val.transaction_amount)
                    
                    } else if(val.transaction_name == "cashout"){

                        summaryMutation.feeTransfer += parseInt(val.transaction_amount)

                    } else if(val.transaction_name == "transfer" && val.transaction_type == "K"){

                        summaryMutation.refund -= parseInt(val.transaction_amount)

                    } else if(val.transaction_name == "topup"){

                        summaryMutation.topup += parseInt(val.transaction_amount)

                    } 

                    
                })

                _setSummaryMutation(summaryMutation)
                _setMutation(result.data)
                _setSummary(summary)
            }

        } catch (e) {
            popAlert({ message : e.message['id'] })
        } finally {
            _setIsGettingData(false)
        }
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

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        extraLarge
        centeredContent
        >

            <ModalContent
            header={{
                title : 'Mutasi Rekening',
                closeModal : props.closeModal
            }}
            >

                
                <small>Maksimal 31 hari yang lalu</small>

                <Row>    
                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    >
                        <DatePicker
                        style={{
                            width: "100%"
                        }}
                        minDate={minDateSelected}
                        selected={_startDate}
                        onChange={(date) => {
                            _setStartDate(date)   
                        }}
                        customInput={<CustomDatePicker/>}
                        />

                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    >
                        {/* <Input
                        title={'Tanggal Akhir'}
                        type={'date'}
                        max={today}
                        value={_selectedDate.endDate}
                        onChange={date => _setSelectedDate({
                            "startDate": _selectedDate.startDate,
                            "endDate": dateFilter.basicDate(new Date(date)).normal
                        })}
                        /> */}

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
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid"
                    }}
                    >
                        <span>Virtual Account</span>
                        <span
                        style={{
                            margin: "1rem 0rem",
                            display: "grid"
                        }}
                        >
                            <small>Mandiri : 883082 {props.data.virtual_account}</small>
                            <small
                            style={{
                                marginTop: ".5rem"
                            }}
                            >
                                Permata : 734528 {props.data.virtual_account}
                            </small>
                        </span>
                       
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Saldo</span>
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >
                            {currency(props.data.balance, "Rp")}
                        </span>
                    </Col>

                    <Col
                    column={2}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Saldo tersedia untuk transaksi</span>
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(props.data.available_balance, "Rp")}
                        </span>
                    </Col>
                </Row>
                
                <Row>
                    
                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Topup Saldo</span>
                        
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(_summaryMutation.topup, "Rp")}
                        </span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Biaya Registrasi</span>
                        
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(_summaryMutation.feeRegister, "Rp")}
                        </span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Biaya Transfer</span>
                        
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(_summaryMutation.feeTransfer, "Rp")}
                        </span>
                    </Col>

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Total Refund</span>
                        
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(_summaryMutation.refund, "Rp")}
                        </span>
                    </Col>
                        

                    <Col
                    column={1}
                    mobileFullWidth
                    withPadding
                    style={{
                        display: "grid",
                        height: "fit-content"
                    }}
                    >
                        <span>Total Debit</span>
                        
                        <span
                        style={{
                            margin: "1rem 0rem"
                        }}
                        >{
                            currency(_summary.debit, "Rp")}
                        </span>
                    </Col>

                </Row>

                {
                    (!_isGettingData) 
                    ? (
                        <Table
                        exportToXls={false}
                        headerContent={(
                            <Button
                            title={'Export Xlsx'}
                            styles={Button.success}
                            headExport={[
                                {
                                    title: "Tanggal",
                                    value: 'transaction_date',
                                    customCell: (value, row) => {
                                        return value.replace(" ", "T")
                                    }
                                },
                                {
                                    title: "Debit",
                                    value: 'transaction_amount',
                                    customCell: (value, row) => {
                                        // if(row.transaction_type == "D"){
                                        //     return value.split(".").length == 2 ? currency(value.split(".")[0])+","+value.split(".")[1] : currency(value)
                                        // }else{
                                        //     return ''
                                        // }

                                        return "'"+value.replace(".",",")
                                    }
                                },
                                {
                                    title: "Kredit",
                                    value: 'transaction_amount',
                                    customCell: (value, row) => {
                                        if(row.transaction_type == "K"){
                                            return "'"+value.replace(".", ",")
                                        }else{
                                            return ''
                                        }
                                    }
                                },
                                {
                                    title: "Uraian",
                                    value: 'transaction_desc'
                                }
                            ]}
                            dataExport={_mutation}
                            titleExport={"Mutasi-rekening-tgl-"+dateFilter.basicDate(new Date(_startDate)).normal+"-sd-"+dateFilter.basicDate(new Date(_endDate)).normal+".xlsx"}
                            />
                        )}
                        insertColumns={__INSERT_COLUMNS}
                        columns={[
                            {
                                title : 'Tanggal',
                                field : 'transaction_date',
                                customCell : (value) => {
                                    return dateFilter.getMonthDate(new Date(value)) + ', ' + dateFilter.getTime(new Date(value))
                                }   
                            },
                            {
                                title : 'Debit',
                                field : 'transaction_amount',
                                textAlign: "right",
                                customCell : (value, row) => {
                                    if(row.transaction_type == "D"){
                                        return value.split(".").length == 2 ? currency(value.split(".")[0])+","+value.split(".")[1] : currency(value)
                                    }else{
                                        return ''
                                    }
                                }
                            },
                            {
                                title : 'Kredit',
                                field : 'transaction_amount',
                                textAlign: "right",
                                customCell : (value, row) => {
                                    if(row.transaction_type == "K"){
                                        return currency(value, 'Rp')
                                    }else{
                                        return ''
                                    }
                                }
                            },
                            {
                                title: 'Uraian',
                                field: 'transaction_desc'
                            },
                        ]}
                        records={_mutation}
                        tableFooter={[
                            [
                                {
                                    title: "Total"
                                }
                            ]
                        ]}
                        />
                    )
                    : (
                        <Col
                        withPadding
                        column={6}
                        alignCenter
                        >
                            <small>
                                <i>
                                    Memuat data..
                                </i>
                            </small>
                            <br/>
                            <ActivityIndicator
                            dark
                            />
                        </Col>
                    )
                }

            </ModalContent>
        </Modal>
    )
}