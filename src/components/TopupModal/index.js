import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import styles from './TopupModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import Datepicker from '../Datepicker'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'
import getBank from '../../utils/bank'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: {}
}

TopupModal.defaultProps = defaultProps

export default function TopupModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const FORM_CONFIRMATION = {
        "id": "",
        "originAccBank": "",
        "originAccName": "",
        "dateTransfer": dateFilter.basicDate(new Date()).normal,
        "destinationBankId": "",
        "file":"",
        "bank": {
            "title": "",
            "accNumber": ""
        }
    }
    const [_form, _setForm] = useState({
        "amount": "",
    })
    const [_formConfirmation, _setFormConfirmation] = useState(FORM_CONFIRMATION)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_accountNumber, _setAccountNumber] = useState({})
    const [_isNextConfirm, _setIsNextConfirm] = useState(false)
    const [_bankRange, _setBankRange] = useState({
        "title": "",
        "value": "",
        "accNumber": ""
    })
    const [_bankList, _setBankList] = useState(getBank())
    const [_issuerBank, _setIssuerBank] = useState({
        value: "",
        title: ""
    })

    function _updateQueryConfirm(data = {}){
        _setFormConfirmation(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitRequest(url){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }

            query.amount = query.amount.split(".").join("")
    
            const result = await postJSON('/keuangan/deposit/topup/request', query, appContext.authData.token)
            let bankRange = []

            if(result.data.bankList.length > 0){
                result.data.bankList.forEach(function(val, key){
                    bankRange.push({
                        "title": val.bank,
                        "accNumber": val.accNumber,
                        "value": val.id
                    })
                })
            }

            _setBankRange(bankRange)
            _setAccountNumber(result.data)
            
            _updateQueryConfirm({
                "id": result.data.id
            })

            props.refresh()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _paidConfirmation(){
        _setIsProcessing(true)
        try{
            const query = {
                ..._formConfirmation
            }
            delete query.bank

            const result = await postFormData("/keuangan/deposit/topup/konfirmasi", {
                ...query
            }, appContext.authData.token)

            if(result) {
                props.refresh()
                props.closeModal()
            }
            
            popAlert({"message": "Berhasil dikonfirmasi", "type": "success"})
        }catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        _updateQuery({
            "amount": ""
        })
        _updateQueryConfirm(FORM_CONFIRMATION)
        _setIsNextConfirm(false)
        _setAccountNumber(props.data)

        if(props.data?.id){
            let bankRange = []

            if(props.data.bankList.length > 0){
                props.data.bankList.forEach(function(val, key){
                    bankRange.push({
                        "title": val.bank,
                        "accNumber": val.accNumber,
                        "value": val.id
                    })
                })
            }

            _setBankRange(bankRange)

            _updateQueryConfirm({
                "id": props.data.id
            })
        }
        
    }, [props.visible])

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: "Request Topup",
                closeModal: props.closeModal
            }}
            >

                {
                    (!_accountNumber?.amount_request && !_isNextConfirm) && (
                        <>
                            <Input
                            type={"currency"}
                            title={"Nominal Topup"}
                            placeholder={'Masukan Nomial'}
                            value={_form.amount}
                            onChange={(value) => {
                                _updateQuery({
                                    "amount": value
                                })
                            }}
                            />

                            <small>*Minimal Rp100.000</small>

                            <div className={styles.buttonContainer}>
                                <Button
                                title={'Konfirmasi'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _submitRequest()
                                }}
                                onProcess={_isProcessing}
                                />
                            </div>
                        </>
                    )
                }

                {
                    (_accountNumber?.amount_request && !_isNextConfirm) && (
                        <div
                        className={styles.acc_number_container}
                        >
                            <span>Kode Unik</span>
                            <div
                            className={styles.nominal}
                            >
                                <strong>{_accountNumber.uniqCode}</strong>
                            </div>
                            
                            <span>Nominal yang harus dibayar</span>

                            <div
                            className={styles.nominal}
                            >
                                <strong>{currency(_accountNumber.amount_total, '')}</strong>
                            </div>

                            <span>Silahkan transfer ke salah satu nomor rekening dibawah ini</span>

                            <div
                            className={styles.bank_container}
                            >   
                                {
                                    _accountNumber.bankList.map(function(val, key){
                                        return (
                                            <div
                                            key={key}
                                            >
                                                <strong>{val.bank}</strong>
                                                <aside>
                                                    <strong>{val.accNumber}</strong>
                                                    <span>{val.accName}</span>
                                                </aside>
                                            </div>
                                        )
                                    })
                                }
                                
                            </div>

                            <Button
                            fluidWidth
                            title={'Lanjutkan'}
                            styles={Button.secondary}
                            onClick={() => {
                                _setIsNextConfirm(true)
                            }}
                            />

                        </div>
                    )
                }

                {
                    _isNextConfirm && (
                        <div
                        className={styles.acc_number_container}
                        >
                            <span>Pastikan transfer sesuai nominal dibawah ini</span>

                            <div
                            className={styles.nominal}
                            >
                                <strong>{currency(_accountNumber.amount_total, '')}</strong>
                            </div>
                            
                            <strong>Rekening Penerima</strong>

                            <Row>
                                <Col
                                column={3}
                                >
                                    <Input
                                    withMargin
                                    title={"Bank Penerima"}
                                    placeholder={'Pilih Bank Penerima'}
                                    value={_formConfirmation.bank.title}
                                    suggestions={_bankRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(data) => {
                                        _updateQueryConfirm({
                                            "destinationBankId": data.value,
                                            "bank": data
                                        })
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                >
                                    <Input
                                    withMargin
                                    disabled
                                    title={"No Rekening Penerima"}
                                    value={_formConfirmation.bank.accNumber}
                                    />
                                </Col>
                            </Row>

                            <strong>Rekening Pengirim</strong>

                            <Row>
                                <Col
                                column={3}
                                >                                    
                                    <Input
                                    withMargin
                                    title={"Bank Pengirim"}
                                    placeholder={'Pilih Bank'}
                                    value={_issuerBank.title}
                                    suggestions={_bankList}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQueryConfirm({
                                            "originAccBank": value.title
                                        }, "confirmation")
                                        _setIssuerBank(value)
                                    }}
                                    />
                                </Col>
                                <Col
                                column={3}
                                >
                                    <Input
                                    withMargin
                                    title={"Nama Akun Bank"}
                                    value={_formConfirmation.originAccName}
                                    onChange={(value) => {
                                        _updateQueryConfirm({
                                            "originAccName": value
                                        }, "confirmation")
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                >
                                    <Input
                                    withMargin
                                    title={"No Rekening Pengirim"}
                                    value={_formConfirmation.originAccNumber}
                                    onChange={(value) => {
                                        _updateQueryConfirm({
                                            "originAccNumber": value
                                        }, "confirmation")
                                    }}
                                    />
                                </Col>

                                <Col
                                column={3}
                                >
                                    <Datepicker
                                    withMargin
                                    value={_formConfirmation.dateTransfer}
                                    onChange={(date) => {
                                        _updateQueryConfirm({
                                            "dateTransfer": dateFilter.basicDate(new Date(date)).normal
                                        }, "confirmation")
                                    }}
                                    />
                                </Col>
                                
                                <Col
                                column={3}
                                >
                                    <span>Upload Bukti Bayar</span>
                                    <br></br>
                                    <small>Maksimal 1MB</small>

                                    <input
                                    style={{"margin": "1rem 0rem 1.5rem 0rem"}}
                                    type={'file'}
                                    accept={'.png, .jpg, .jpeg'}
                                    onChange={(e) => {
                                        _updateQueryConfirm({
                                            "file": e.target.files[0]
                                        })
                                    }}
                                    />
                                </Col>
                            </Row>

                            <Button
                            disabled={_formConfirmation.file == "" ? true : false}
                            fluidWidth
                            title={'Konfirmasi Bayar'}
                            styles={Button.secondary}
                            onClick={() => {
                                _paidConfirmation()
                            }}
                            onProcess={_isProcessing}
                            />

                        </div>
                    )
                }
                
            </ModalContent>
        </Modal>
    )
}
