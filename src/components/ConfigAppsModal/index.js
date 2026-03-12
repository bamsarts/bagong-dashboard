import { useEffect, useState, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import Label from '../Label'
import { Col } from '../Layout'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    type: "configApps"
}

ConfigAppsModal.defaultProps = defaultProps

export default function ConfigAppsModal(props = defaultProps) {

    const INITIAL_FORM = {
        id: 0,
        category: "",
        service: "",
        params: "",
        isActive: true
    }

    const [_form, _setForm] = useState(INITIAL_FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)

    function _clearForm() {
        _setForm(INITIAL_FORM)
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitData() {
        _setIsProcessing(true)

        try {
            const query = {
                category: _form.category,
                isActive: _form.isActive,
                params: _form.params,
                service: _form.service
            }

            const isFilled = query.category && query.service && query.params

            if (!isFilled) {
                popAlert({ message: "Semua form wajib terisi" })
                _setIsProcessing(false)
                return false;
            }

            const result = await postJSON('/masterData/service/configApps/add', query, appContext.authData.token)

            if (result) {
                props.closeModal()
                _clearForm()
                popAlert({ message: "Berhasil disimpan", type: "success" })
                props.onSuccess()
            }

        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    useEffect(() => {
        if (props.data?.id) {
            _updateQuery({
                ...props.data,
                isActive: props.data?.isActive === 1 || props.data?.isActive === true
            })
        }
    }, [props.data])

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: props.data.id ? 'Ubah Config Apps' : 'Tambah Config Apps',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    },
                }}
            >
                <Input
                    withMargin
                    title={"Category"}
                    placeholder={'Masukan category'}
                    value={_form.category}
                    onChange={(value) => {
                        _updateQuery({ category: value })
                    }}
                />

                <Input
                    withMargin
                    title={"Service"}
                    placeholder={'Masukan service'}
                    value={_form.service}
                    onChange={(value) => {
                        _updateQuery({ service: value })
                    }}
                />

                <Input
                    withMargin
                    title={"Params"}
                    placeholder={'Masukan params'}
                    value={_form.params}
                    onChange={(value) => {
                        _updateQuery({ params: value })
                    }}
                />

                <Col withPadding>
                    <p style={{ marginBottom: "1rem" }}>
                        Status
                    </p>

                    <Label
                        activeIndex={_form.isActive}
                        labels={[
                            {
                                class: "primary",
                                title: 'Aktif',
                                value: true,
                                isHide: false,
                                onClick: () => {
                                    _updateQuery({ isActive: true })
                                }
                            },
                            {
                                class: "warning",
                                title: 'Tidak Aktif',
                                value: false,
                                isHide: false,
                                onClick: () => {
                                    _updateQuery({ isActive: false })
                                }
                            }
                        ]}
                    />
                </Col>

                <Col withPadding style={{ marginTop: "1rem" }}>
                    <Button
                        title={'Simpan'}
                        styles={Button.secondary}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                    />
                </Col>

            </ModalContent>

        </Modal>
    )
}