import { useState, useEffect, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Button from '../Button'
import { Row, Col } from '../Layout'
import styles from './ApprovalNotesModal.module.scss'
import AppContext from '../../context/app'
import Label from '../Label'
import { postJSON } from '../../api/utils'
import { popAlert } from '../Main'

export default function ApprovalNotesModal({ 
    visible, 
    onClose, 
    onSuccess, 
    title = "Catatan Persetujuan",
    isProcessing = false,
    row 
}) {
    const [notes, setNotes] = useState('')
    const [action, setAction] = useState('')
    const CONFIG_PARAM = {
        "redeemId": "",
        "status": "",
        "approvalNotes": "",
        "approvalDoc": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)

    const handleClose = () => {
        setNotes('')
        setAction('')
        onClose()
    }

    async function _redemption() {
        let params = {
            ..._form
        }

        try {
            let scope = await postJSON('/loyalty/redeem/approval', params, appContext.authData.token)

            if (scope) {
                const statusMessage = _form.status === 1 ? 'disetujui' : 'ditolak'
                popAlert({ message: `Persetujuan ${statusMessage}`, "type": "success" })
                _setForm(CONFIG_PARAM)
                onSuccess()
            }
        } catch (e) {
            popAlert({ message: e.message })
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

    useEffect(() => {

        if(visible){
            _updateQuery({
                "redeemId": String(row.id)
            })
        }
    }, [visible])

    return (
        <Modal
            visible={visible}
            onBackdropClick={handleClose}
        >
            <ModalContent
                header={{
                    title: title,
                    closeModal: handleClose
                }}
            >
                <div className={styles.container}>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Persetujuan
                        </label>
                        <Label
                        activeIndex={_form.status}
                        labels={[
                            {
                                class: "primary",
                                title: 'Disetujui',
                                value: 1,
                                onClick: () => {
                                    _updateQuery({
                                        "status": 1
                                    })
                                }
                            },
                            {
                                class: "warning",
                                title: 'Ditolak',
                                value: 2,
                                onClick: () => {
                                    _updateQuery({
                                        "status": 2
                                    })
                                }
                            }
                        ]}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Catatan
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={_form.approvalNotes}
                            onChange={(e) => _updateQuery({"approvalNotes": e.target.value})}
                            placeholder="Masukkan catatan untuk keputusan ini..."
                            rows={4}
                            disabled={isProcessing}
                        />
                    </div>

                    <Row className={styles.buttonRow}>
                        <Col withPadding>
                            <Button
                                title="Simpan"
                                styles={Button.success}
                                onClick={_redemption}
                                onProcess={isProcessing && action === 'approve'}
                                disabled={isProcessing}
                                small
                            />
                        </Col>
                       
                        <Col 
                        alignEnd
                        withPadding>
                            <Button
                                title="Cancel"
                                styles={Button.secondary}
                                onClick={handleClose}
                                disabled={isProcessing}
                                small
                            />
                        </Col>
                    </Row>
                </div>
            </ModalContent>
        </Modal>
    )
}