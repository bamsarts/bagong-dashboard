import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import styles from './TopupApprovalModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import Datepicker from '../Datepicker'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'

const defaultProps = {
    data : [],
    closeModal : null,
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
    const [_formApprove, _setFormApprove] = useState({
        "id": "",
        "amountApprove":"",
        "dateApprove": dateFilter.basicDate(new Date()).normal
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

    function _updateQueryConfirm(data = {}){
        _setFormConfirmation(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _updateQuery(data = {}){
        _setFormApprove(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitApprove(type){
        _setIsProcessing(true)
        try{
            let query = {
                ..._formApprove
            }
            let message = "disetujui"
            query.amountApprove = query.amountApprove.split(".").join("")

            if(type == "tolak"){
                delete query.amountApprove
                delete query.dateApprove
                message = "ditolak"
            }
    
            const result = await postJSON('/keuangan/deposit/topup/'+type, query, appContext.authData.token)
            
            popAlert({ message : "Berhasil "+message, type: 'succes' })      

            props.refresh()
            props.closeModal()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        if(props.data[0]?.id){
            _updateQuery({
                id: props.data[0].id
            })
        }
    }, [props.data])

    return (
        <Modal
        visible={props.data[0]?.id}
        centeredContent
        >
            <ModalContent
            header={{
                title: "Approval Topup",
                closeModal: props.closeModal
            }}
            >

                {
                    props.data[1]?.isApprove && (
                        <>
                            <Input
                            withMargin
                            type={"currency"}
                            title={"Nominal Diterima"}
                            placeholder={'Masukan Nominal'}
                            value={_formApprove.amountApprove}
                            onChange={(value) => {
                                _updateQuery({
                                    "amountApprove": value
                                })
                            }}
                            />

                            <Datepicker
                            withMargin
                            title={"Tanggal Pengiriman"}
                            value={_formApprove.dateApprove}
                            onChange={(date) => {
                                _updateQuery({
                                    "dateApprove": dateFilter.basicDate(new Date(date)).normal
                                })
                            }}
                            />

                            <div className={styles.buttonContainer}>
                                <Button
                                title={'Setujui'}
                                styles={Button.success}
                                onClick={() => {
                                    _submitApprove("approve")
                                }}
                                onProcess={_isProcessing}
                                />
                            </div>
                        </>
                    )
                }

                {
                    !props.data[1]?.isApprove && (
                        <div>
                            <p className={styles.ml_1}>Apakah Anda yakin ingin melakukan penolakan permohonan Topup?</p>

                            <div className={styles.buttonContainer}>
                                <Button
                                title={'Tolak Permohonan'}
                                styles={Button.error}
                                onClick={() => {
                                    _submitApprove("tolak")
                                }}
                                onProcess={_isProcessing}
                                />
                            </div>
                        </div>
                    )
                }

            </ModalContent>
        </Modal>
    )
}
