import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext } from 'react'
import Input from '../Input'
import { postFormData } from '../../api/utils'
import Button from '../Button'
// import styles from './BusListModal.module.scss'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {}
}

ImportPayment.defaultProps = defaultProps

export default function ImportPayment(props = defaultProps){

    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const FORM = {
        "file": ""
    }
    const [_form, _setForm] = useState(FORM)

    function _clearForm(){
        _setForm(FORM)
        document.getElementById("form").reset()
    }

    function _updateFormData(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        }) 
    }

    async function _upload(){
        _setIsProcessing(true)
        try{
            const query = {
                ..._form
            }

            const result = await postFormData("/keuangan/refund/transfer/upload", {
                ...query
            }, appContext.authData.token)

            if(result) {
                popAlert({"message": "Berhasil diunggah", "type": "success"})
                props.onSuccess()
                document.getElementById("form").reset()
            }
            
        }catch(e){
            popAlert({ message : e.message, duration: "10000" })       
        } finally{
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
                title: "Import Pembayaran",
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                }
            }}
            >

                <form
                id={"form"}
                style={{"padding": ".5rem"}}
                >
                    <a 
                    target="_blank"
                    href="/assets/logo/Template-Refund.xlsx"
                    >
                        Unduh Template
                    </a>

                    <input
                    style={{
                        "width": "100%",
                        "margin": "2rem 0rem"
                    }}
                    type={'file'}
                    accept={'.xls, .xlsx'}
                    onChange={(e) => {
                        _updateFormData({
                            "file": e.target.files[0]
                        })
                    }}
                    />

                    <Button
                    onProcess={_isProcessing}
                    title={'Import'}
                    styles={Button.primary}
                    onClick={() => {
                        _upload()
                    }}
                    />
                </form>

            </ModalContent>

        </Modal>
    )
}