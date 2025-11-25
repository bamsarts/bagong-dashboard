import { useEffect, useState, useContext, forwardRef} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './RefundModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData, API_ENDPOINT, TICKET_ORDER_URL } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { FaPray } from 'react-icons/fa'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'
import "react-datepicker/dist/react-datepicker.css";
import getBank from '../../utils/bank'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

RefundModal.defaultProps = defaultProps

export default function RefundModal(props = defaultProps){

    const CONFIG_PARAM = {
        "reason": "",
        "applicant": "",
        "bankName": "",
        "accountName": "",
        "accountNumber": "",
        "ticket": "",
        "voidType": "REFUND",
        "transactionType": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_bankRange, _setBankRange] = useState(getBank())
    const [_penalty, _setPenalty] = useState({
        "amount": "",
        "fine": "",
        "penalty": "",
        "finalAmount": ""
    })
    const [_errorPenalty, _setErrorPenalty] = useState("")
    const CONFIG_TRANSFER_REFUND = {
        "buktiTransfer": "",
        "date": "",
        "id": "",
        "file": ""
    }
    const [_formTransferRefund, _setFormTransferRefund] = useState(CONFIG_TRANSFER_REFUND)

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _updateQueryTransferRefund(data = {}){
        _setFormTransferRefund(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    useEffect(() => {
        if(props.visible){
            if(props.data.paymentStatus == "PAID"){
                _getPenalty()
            }

            _updateQuery({
                ticket: props.data.ticket,
                transactionType: props.data.transactionType
            })

            _updateQueryTransferRefund({
                id: props.data.id
            })

            console.log(props.data)
        }else{
            _updateQuery(CONFIG_PARAM)
        }
    }, [props.visible])

    async function _submitData(){

        let query  = {
            ..._form
        }
       
        _setIsProcessing(true)

        try{
           
            const result = await postJSON({
                url: TICKET_ORDER_URL+'/dashboard/refund'
            }, query, appContext.authData.token)
            
            if(result?.statusCode) props.onSuccess()
            
            popAlert({"message": "Berhasil disimpan", "type": "success"})
        } catch(e){
            let errMessage = ""
            if(e.message?.details){
                errMessage = e.message.details[0].message
            }else{
                errMessage = e.message
            }
            popAlert({ message : errMessage })  
           
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getEvidence(){
        try{
            const query = {
                query: props.data?.id,
                orderBy: "id",
                sortMode: "desc",
                startFrom: "0",
                length: "1"
            }
            
            const res = await postJSON(`/masterData/media/image/list`, query, appContext.authData.token)
        
            if(res.data.length > 0) {
                console.log("link")
                console.log(res.data[0].link)
                _updateQueryTransferRefund({
                    "buktiTransfer": res.data[0].link
                })

                _submitTransferRefund(res.data[0].link)
            }
        
        } catch (e) {
            console.log(e)
            _setIsProcessing(false)
        }
    }

    async function _uploadEvidence(){
        _setIsProcessing(true)

        try{
            const query = {
                "title": props.data?.id,
                "file": _formTransferRefund.file
            }

            const result = await postFormData("/masterData/media/image/upload", {
                ...query
            }, appContext.authData.token)

            if(result) {
               _getEvidence()
            }

        }catch(e){
            popAlert({ message : e.message })       
            _setIsProcessing(false)
        } finally{
            
        }
    }

    async function _submitTransferRefund(link){
        let query  = {
            ..._formTransferRefund
        }

        query.buktiTransfer = link
        delete query.file   
       
        try{
           
            const result = await postJSON({
                url: TICKET_ORDER_URL+'/dashboard/refund/bayar'
            }, query, appContext.authData.token)
            
            if(result) props.onSuccess()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
        } catch(e){
            let errMessage = ""
            if(e.message?.details){
                errMessage = e.message.details[0].message
            }else{
                errMessage = e.message
            }
            popAlert({ message : errMessage })  
           
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getPenalty(){
        let query  = {
            "ticket": props.data?.ticket,
            "voidType": "REFUND",
            "transactionType": props.data?.transactionType
        }

        try{
           
            const result = await postJSON({
                url: API_ENDPOINT.ticketOrder+'/dashboard/sum-penalty'
            }, query, appContext.authData.token)
            
            if(result.data){
                _setPenalty(result.data)
            }
        } catch(e){
            let errMessage = e.message.id
            
            popAlert({ message : errMessage })  
            _setPenalty(null)
        } finally{
            _setIsProcessing(false)
        }
    }

    function _isComplete(){
        let state = true
        if(_form.alasan != "" && _form.rekeningBank != "" && _form.rekeningNama != ""){
            state = false
        }
        return state
    }

    function _isCompleteTransferRefund(){
        let state = true
        if(_formTransferRefund.date != "" && _formTransferRefund.file != ""){
            state = false
        }
        return state
    }

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Transfer"}
            onClick={onClick}
            ref={ref}
            value={_formTransferRefund.date == "" ? "" : dateFilter.getMonthDate(new Date(_formTransferRefund.date))}
            onChange={(value) => {
              
            }}
            />
        </Col>
    ));

    return (
        <Modal
        visible={props.visible}
        centeredContent
        large
        >
            <ModalContent
            header={{
                title: 'Ajukan pengembalian (Refund)',
                closeModal: () => {
                    props.closeModal()
                },
            }}
            >
                
                {
                    (_penalty?.amount && props.data.paymentStatus == "PAID") && (

                        <>
                            <Row
                            marginBottom
                            >
                                <Col
                                column={6}
                                >
                                    <Input
                                    withMargin
                                    title={"Keterangan refund"}
                                    placeholder={'Masukan keterangan atau alasan refund'}
                                    value={_form.reason}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "reason": value
                                        })
                                    }}
                                    multiline={2}
                                    />
                                </Col>
                            </Row>

                            <strong>Identitas Pengembalian</strong>

                            <Row
                            >
                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Nama Bank"}
                                    placeholder={'Pilih Bank'}
                                    value={_form.bankName}
                                    suggestions={_bankRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "bankName": value.title,
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Pemilik Rekening"}
                                    placeholder={'Masukan nama pemilik'}
                                    value={_form.accountName}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "accountName": value
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Nomor Rekening"}
                                    placeholder={'Masukan nama pemilik'}
                                    value={_form.accountNumber}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "accountNumber": value
                                        })
                                    }}
                                    />
                                </Col>
                            </Row>

                            <Row
                            marginBottom
                            >
                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Nama Pemohon"}
                                    placeholder={'Masukan nama pemohon'}
                                    value={_form.applicant}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "applicant": value
                                        })
                                    }}
                                    />
                                </Col>
                            </Row>

                            <strong>Rincian Pengembalian</strong>

                            <Row
                            spaceBetween
                            style={{
                                margin: "1rem 0rem"
                            }}
                            >
                                <span>Nilai Transaksi</span>
                                <span>{currency(_penalty.amount, "Rp")}</span>
                            </Row>

                            <Row
                            spaceBetween
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <span>Nilai Denda ({_penalty.fine}%)</span>
                                <span>{currency(_penalty.penalty, "Rp")}</span>
                            </Row>

                            <Row
                            spaceBetween
                            style={{
                                marginBottom: "1rem"
                            }}
                            >
                                <span>Total Pengembalian</span>
                                <span>{currency(_penalty.finalAmount, "Rp")}</span>
                            </Row>
            
                            <div
                            style={{
                                marginTop: "1rem"
                            }}
                            >
                                <Button
                                disabled={_isComplete()}
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={_submitData}
                                onProcess={_isProcessing}
                                />
                            </div>

                        </>
                    )
                }

                {
                    props.data.paymentStatus == "REFUND" && (
                        <form
                        id={"formTransferRefund"}
                        >
                            <Row
                            marginBottom
                            >
                                <Col
                                column={3}
                                >
                                    <span>Upload bukti bayar</span>

                                    <input
                                    style={{"width": "100%"}}
                                    type={'file'}
                                    accept={'.png, .jpg, .jpeg'}
                                    onChange={(e) => {
                                        _updateQueryTransferRefund({
                                            "file": e.target.files[0]
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                >
                                    <DatePicker
                                    style={{
                                        width: "100%"
                                    }}
                                    // selected={_startDate}
                                    onChange={(date) => {
                                        _updateQueryTransferRefund({
                                            "date": dateFilter.basicDate(date).normal
                                        })
                                        console.log(date)
                                    }}
                                    customInput={<CustomDatePicker/>}
                                    />
                                </Col>
                            </Row>
                                

                            <div
                            style={{
                                marginTop: "1rem"
                            }}
                            >
                                <Button
                                disabled={_isCompleteTransferRefund()}
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={_uploadEvidence}
                                onProcess={_isProcessing}
                                />
                            </div>
                                    
                        </form>

                    )
                }

                {
                    _penalty == null && (
                        <div
                        style={{
                            display: "grid"
                        }}
                        >
                            <small>Tanggal berangkat</small>
                            
                            <span
                            style={{
                                marginTop: ".5rem"
                            }}
                            >
                                {dateFilter.getMonthDate(new Date(props.data.date))} {props.data.time}
                            </span>

                            <p
                            style={{
                                marginTop: "1rem"
                            }}
                            >
                                Pengembalian dana tidak bisa dilakukan karena sudah melebihi batas waktu yang sudah ditentukan
                            </p>
                        </div>
                    )
                }
            </ModalContent>
            
        </Modal>
    )
}