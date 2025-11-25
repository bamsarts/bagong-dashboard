
import { useState, useEffect, useContext } from 'react'
import { objectToParams, postJSON, TICKET_ORDER_URL } from '../../api/utils'
import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { Col, Row } from '../Layout'
import Button from '../Button'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

ApprovalRefundModal.defaultProps = defaultProps

export default function ApprovalRefundModal(props = defaultProps){


    const CONFIG_PARAM = {
        "id": "",
        "status": "",
        "ticket": ""
    }
    const appContext = useContext(AppContext)
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        if(props.visible){
        
            _updateQuery({
                ticket: props.data.ticket,
                id: props.data.voidRefId
            })

        }else{
            _updateQuery(CONFIG_PARAM)
        }
    }, [props.visible])


    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitApproval(status){
        
        let query = {
            ..._form
        }

        query.status = status

        try{
            _setIsProcessing(true)

            const result = await postJSON({
                url: TICKET_ORDER_URL + "/dashboard/refund/approve/v2?"+objectToParams(query)
            }, null, appContext.authData.token)

            if(result) props.onSuccess()

            popAlert({"message": `Berhasil ${status == "APPROVE" ? 'disetujui' : 'ditolak'}`, "type": "success"})
       
        } catch (e){

            let errMessage = ""
            if(e.message?.details){
                errMessage = e.message.details[0].message
            }else{
                errMessage = e.message
            }
            popAlert({ message : errMessage })  

        } finally {
            _setIsProcessing(false)
        }
         
    }   

    return (
        <Modal
        visible={props.visible}
        centeredContent
        large
        >

            <ModalContent
            header={{
                title: 'Persetujuan pengembalian (Refund)',
                closeModal: () => {
                    props.closeModal()
                },
            }}
            >

                <Row
                spaceAround
                >
                    <Button
                    styles={Button.error}
                    title={'Tolak'}
                    onClick={() => {
                        _submitApproval("REJECT")
                    }}
                    onProcess={_isProcessing}
                    />

                    <Button
                    styles={Button.success}
                    title={'Setujui'}
                    onClick={() => {
                        _submitApproval("APPROVE")
                    }}
                    onProcess={_isProcessing}
                    />
                </Row>

            </ModalContent>

        </Modal>
    )
}