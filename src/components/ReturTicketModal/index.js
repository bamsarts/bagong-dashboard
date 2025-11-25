import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './ReturTicketModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { FaPray } from 'react-icons/fa'
import bank from '../../utils/bank'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

ReturTicketModal.defaultProps = defaultProps

export default function ReturTicketModal(props = defaultProps){

    const CONFIG_PARAM = {
        "idTicket": props.data.idTicket,
        "file": "",
        "keterangan": "",
        "status": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_activeStatus, _setActiveStatus] = useState(1)

    function _clearForm(){
        _setForm(CONFIG_PARAM)
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _uploadUser(){
        _setIsProcessing(true)
        try{
            let result

            if(props.data.type == "retur"){
                result = await postFormData("/laporan/transaksi/penjualan/harian/cancel/branch/request", {
                    ..._form
                }, appContext.authData.token)
                popAlert({"message": "Berhasil diretur", "type": "success"})

            }else if(props.data.type == "approval" || props.data.type == "approval-central"){
                const query = {
                    idTicket: props.data.idTicket,
                    status: _form.status
                }

                const isBranch = props.data.type == "approval" ? 'branch' : 'company'

                result = await postJSON(`/laporan/transaksi/penjualan/harian/cancel/${isBranch}/update`, query, appContext.authData.token)

                popAlert({"message": "Persetujuan berhasil", "type": "success"})
            }
           

            if(result) props.closeModal()
            _clearForm()
            props.onSuccess()
        }catch(e){
            popAlert({ message : e.message })       
        } finally{
            document.getElementById("formUpload").reset()
            _setIsProcessing(false)
        }
    }

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: 'Retur Tiket '+props.data.ticket,
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >
               
                <form
                id="formUpload"
                >
                     {
                        props.data?.type == "retur" && (
                            <>
                                <div
                                className={styles.container}
                                >
                                    <span>File</span>
                                    
                                    <input
                                    title={"File"}
                                    type={'file'}
                                    accept={'.jpg, .jpeg, .png'}
                                    onChange={(e) => {
                                        _updateQuery({
                                            "file": e.target.files[0]
                                        })
                                    }}
                                    />
                                </div>
                            
                                <Input
                                multiline={2}
                                withMargin
                                title={"Keterangan"}
                                placeholder={'Masukan keterangan'}
                                value={_form.keterangan}
                                onChange={(value) => {
                                    _updateQuery({
                                        "keterangan": value
                                    })
                                }}
                                />
                            </>
                        )
                    }
                    
                    {
                        (props.data?.type == "approval" || 
                        props.data.type == "approval-central" || 
                        props.data.type == "reject") && (

                            <div
                            className={styles.container}
                            >
                                <p className={styles.title}>Bukti Retur</p>

                                <a 
                                href={props.data.evidenceOfTransfer}
                                target="_blank"
                                className={styles.evidence}
                                >
                                    <img
                                    src={props.data.evidenceOfTransfer}
                                    width="auto"
                                    height="70"
                                    />

                                </a>

                                <p className={styles.title}>Keterangan</p>
                                
                                <div className={styles.mb_s}>{props.data.remarkCancelTicket}</div>


                                {
                                    props.data.type != "reject" && (
                                        <>
                                            <p className={styles.title}>Persetujuan</p>

                                            <Label
                                            activeIndex={_activeStatus}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Tolak',
                                                    value: false,
                                                    onClick : () => {
                                                        _setActiveStatus(false)
                                                        _updateQuery({
                                                            "status": "REJECT"
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Setuju',
                                                    value: true,
                                                    onClick : (value) => {
                                                        _setActiveStatus(true)
                                                        _updateQuery({
                                                            "status": 'APPROVE'
                                                        })
                                                    }
                                                }
                                            ]}
                                            />
                                        </>
                                    )
                                }
                                
                            </div>
                        )
                    }

                    {
                        props.data?.type != "reject" && (
                            <div className={styles.container}>
                                <div
                                style={{
                                    marginTop: "1rem"
                                }}
                                >
                                    <Button
                                    title={'Simpan'}
                                    styles={Button.secondary}
                                    onClick={_uploadUser}
                                    onProcess={_isProcessing}
                                    />
                                </div>
                            </div>
                        )
                    }
                    
                </form>

            </ModalContent>
            
        </Modal>
    )
}