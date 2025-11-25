import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './RejectAccountBank.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { useRouter } from 'next/router'
import Table from '../Table'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
}

RejectAccountBankModal.defaultProps = defaultProps

export default function RejectAccountBankModal(props = defaultProps){
    const router = useRouter()
    const _pathArray = router.asPath.split("/")

    const CONFIG_PARAM = {
        "namaGroup": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const FORM_REJECT = [
        "REKENING TIDAK DITEMUKAN",
        "NAMA DAN NOMOR REKENING TIDAK SESUAI",
        "GAGAL MEMVERIFIKASI. HUBUNGI CS"
    ]
    const [_selectedReject, _setSelectedReject] = useState("")

    async function _verifyBank() {
        const params = {
            "is_verified": false,
            "id": props.data.id,
            "remark": _selectedReject
        }

        _setIsProcessing(true)

        try {
            const accountBank = await postJSON(`/masterData/userRoleAkses/user/bank/update`, params, appContext.authData.token)

            if(accountBank){
                popAlert({ message: "Rekening berhasil ditolak", "type": "success"})
                props.closeModal()
                _setSelectedReject("")
            }

        } catch (e) {
            popAlert({ message : e.message })

        } finally {
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
                title: "Penolakan Verifikasi Rekening",
                closeModal: () => {
                    props.closeModal()
                    _setSelectedReject("")
                },
            }}
            >
                <span>Alasan Penolakan</span>

                <div
                className={styles.reject_container}
                >
                    {
                        FORM_REJECT.map(function(val, key){
                            return (
                                <span
                                className={val == _selectedReject && styles.active}
                                onClick={() => {
                                    _setSelectedReject(val)
                                }}
                                >
                                    {val}
                                </span>
                            )
                        })
                    }
                </div>


                <Button
                disabled={_selectedReject == ""}
                title={'Simpan'}
                styles={Button.secondary}
                onClick={() => {
                    _verifyBank()
                }}
                onProcess={_isProcessing}
                />
                
            </ModalContent>
            
        </Modal>
    )
}