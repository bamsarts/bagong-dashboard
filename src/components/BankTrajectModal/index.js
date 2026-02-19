import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext } from 'react'
import Input from '../Input'
import { postJSON } from '../../api/utils'
import Button from '../Button'
import styles from './BankTrajectModal.module.scss'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    refresh: () => {}
}

BankTrajectModal.defaultProps = defaultProps

export default function BankTrajectModal(props = defaultProps) {
    const appContext = useContext(AppContext)

    /* ================= STATE ================= */

    const [_trayekRanges, _setTrayekRanges] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)

    const CONFIG_PARAM = {
        id: '',
        traject_master_id: '',
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
        companyId: appContext.authData.companyId,
        traject: {}
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)

    /* ================= EFFECT ================= */

    useEffect(() => {
        _getTrayek()
    }, [])

    useEffect(() => {
        if (!props.data?.id) return

        const traject = _findData(
            _trayekRanges,
            props.data.traject_master_id
        )

        _updateQuery({
            ...props.data,
            traject
        })
    }, [props.data, _trayekRanges])

    /* ================= HELPERS ================= */

    function _findData(data, objectSearch) {
        let result = {}
        data.forEach(val => {
            if (val.value == objectSearch) {
                result = val
            }
        })
        return result
    }

    function _updateQuery(data = {}) {
        _setForm(old => ({
            ...old,
            ...data
        }))
    }

    function _clearForm() {
        _setForm(CONFIG_PARAM)
    }

    /* ================= API ================= */

    async function _getTrayek() {
        const params = { startFrom: 0, length: 100 }

        try {
            const res = await postJSON(
                '/data/masterData/trayekMaster/list',
                params,
                appContext.authData.token
            )

            let trayekRange = []
            res.data.forEach(val => {
                trayekRange.push({
                    title: val.name,
                    value: val.id
                })
            })

            _setTrayekRanges(trayekRange)
        } catch (e) {
            console.log(e)
        }
    }

    /* ================= SUBMIT ================= */

    async function _submitData() {
        _setIsProcessing(true)

        try {
            const payload = {
                companyId: Number(_form.companyId),
                branchId: Number(_form.branchId),
                trajectMasterId: Number(_form.traject_master_id),
                bankName: _form.bank_name,
                bankAccountName: _form.bank_account_name,
                bankAccountNumber: _form.bank_account_number,
                isActive: true
            }

            let url = '/data/masterData/trajectBank/add'

            if (props.data?.id) {
                url = '/data/masterData/trajectBank/update'
                payload.id = Number(props.data.id)
            }

            await postJSON(url, payload, appContext.authData.token)

            popAlert({ message: 'Berhasil disimpan', type: 'success' })
            props.refresh()
            props.closeModal()
            _clearForm()
        } catch (e) {
            popAlert({
                message:
                    typeof e?.message === 'string'
                        ? e.message
                        : 'Gagal menyimpan data'
            })
        } finally {
            _setIsProcessing(false)
        }
    }

    /* ================= RENDER ================= */

    return (
        <Modal visible={props.visible} centeredContent>
            <ModalContent
                header={{
                    title: props.data.id
                        ? 'Ubah Bank Trayek'
                        : 'Tambah Bank Trayek',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    }
                }}
            >
                <Input
                    withMargin
                    title="Trayek"
                    value={_form.traject?.title}
                    suggestions={_trayekRanges}
                    suggestionField="title"
                    onSuggestionSelect={data =>
                        _updateQuery({
                            traject_master_id: data.value,
                            traject: data
                        })
                    }
                />

                <Input
                    withMargin
                    title="Nama Bank"
                    value={_form.bank_name}
                    onChange={value =>
                        _updateQuery({ bank_name: value })
                    }
                />

                <Input
                    withMargin
                    title="Nama Rekening"
                    value={_form.bank_account_name}
                    onChange={value =>
                        _updateQuery({ bank_account_name: value })
                    }
                />

                <Input
                    withMargin
                    title="Nomor Rekening"
                    value={_form.bank_account_number}
                    onChange={value =>
                        _updateQuery({ bank_account_number: value })
                    }
                />

                <div className={styles.buttonContainer}>
                    <Button
                        title="Simpan"
                        styles={Button.secondary}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                    />
                </div>
            </ModalContent>
        </Modal>
    )
}
