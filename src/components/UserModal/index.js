import { useEffect, useState, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './Usermodal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import QRCodeModal from '../QRCodeModal'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    isImport: false,
    roleRange: []
}

UserModal.defaultProps = defaultProps

export default function UserModal(props = defaultProps) {

    const CONFIG_PARAM = {
        "name": "",
        "username": "",
        "email": "",
        "phoneNumber": "",
        "password": "",
        "cpassword": "",
        "file": "",
        "roleId": "",
        "role": {
            "title": ""
        }
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_activeUser, _setActiveUser] = useState(0)
    const [_roleRange, _setRoleRange] = useState([])
    const [_showQRModal, _setShowQRModal] = useState(false)

    function _clearForm() {
        _setForm(CONFIG_PARAM)
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _uploadUser() {
        _setIsProcessing(true)
        try {
            const result = await postFormData("/masterData/userRoleAkses/user/import", {
                file: _form.file
            }, appContext.authData.token)

            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil diupload", "type": "success" })
            props.onSuccess()
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            document.getElementById("formUpload").reset()
            _setIsProcessing(false)
        }
    }

    async function _submitData() {

        let typeSubmit = props.data.id ? 'update' : 'create'
        let url = typeSubmit == 'update' ? '/masterData/userRoleAkses/user/' : '/dashboard/user/'

        delete _form.failCount
        delete _form.id
        delete _form.lastLogin
        delete _form.file
        delete _form.birthDate

        for (const prop in _form) {
            if (_form[prop] == "" && prop != "isBanned" && prop != "isLogin") {

                if (typeSubmit == "update") {
                    if (prop == "password" || prop == "cpassword") {
                        continue
                    }
                }

                popAlert({ "message": "Semua form wajib terisi" })
                return false
            }
        }

        if (_form.password != _form.cpassword) {
            popAlert({ "message": "Password tidak sama" })
            return false
        }

        _setIsProcessing(true)

        try {
            let query = {
                ..._form
            }

            delete query.role
            delete query.gender
            delete query.identity

            query.phoneNumber = _validatePhone(query.phoneNumber.toString())

            if (query.password == "" && query.cpassword == "" && typeSubmit == "update") {
                delete query.password
                delete query.cpassword
            }

            const result = await postJSON(url + typeSubmit, query, appContext.authData.token)


            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
            props.onSuccess()
        } catch (e) {
            let errMessage = ""
            if (e.message?.details) {
                errMessage = e.message.details[0].message
            } else {
                errMessage = e.message
            }
            popAlert({ message: errMessage })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _validatePhone(data) {
        let phone = `${data}`
        let split = phone.substring(0, 2)

        if (split == "62") {
            return "08" + phone.substring(3, 14)
        } else {
            return data
        }
    }

    useEffect(() => {

        // _updateQuery({
        //     ...props.data,
        // })

        _roleRange.forEach(function (val, key) {
            if (props.data.roleId == val.value) {
                _updateQuery({
                    ...props.data,
                    role: val
                })
            }
        })

        _setActiveUser(props.data.isBanned)

    }, [props.data])

    useEffect(() => {

        if (props.visible) {

            let role = []
            props.roleRange.forEach(function (val, key) {
                if (val.id != 1 && val.id != 2) {
                    role.push({
                        title: val.name,
                        value: val.id
                    })
                }
            })

            _setRoleRange(role)

            _updateQuery({
                ...props.data,
            })
        }

    }, [props.visible])

    useEffect(() => {

        _roleRange.forEach(function (val, key) {
            if (props.data.roleId == val.value) {
                _updateQuery({
                    ...props.data,
                    role: val
                })
            }
        })

    }, [_roleRange])

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: props.data.id ? 'Ubah User' : 'Tambah User',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    },
                }}
            >

                {
                    (_form?.id && (_form.roleId == "16" || _form.roleId == "15")) && (
                        <div className={styles.container}>
                            <Button
                                title={'Lihat QR Code'}
                                styles={Button.primary}
                                onClick={() => _setShowQRModal(true)}
                            />
                        </div>
                    )
                }



                {
                    props.isImport && (
                        <form
                            id="formUpload"
                        >
                            <input
                                type={'file'}
                                accept={'.xls, .xlsx'}
                                onChange={(e) => {
                                    _updateQuery({
                                        "file": e.target.files[0]
                                    })
                                }}
                            />

                            <div className={styles.container}>

                                <Button
                                    title={'Tambahkan'}
                                    styles={Button.secondary}
                                    onClick={_uploadUser}
                                    onProcess={_isProcessing}
                                />

                            </div>
                        </form>

                    )
                }

                {
                    !props.isImport && (
                        <>
                            <Input
                                withMargin
                                title={"Nama User"}
                                placeholder={'Nama User'}
                                value={_form.name}
                                onChange={(value) => {
                                    _updateQuery({
                                        "name": value
                                    })
                                }}
                            />

                            <Input
                                withMargin
                                title={"Username"}
                                placeholder={'Username'}
                                value={_form.username}
                                onChange={(value) => {
                                    _updateQuery({
                                        "username": value
                                    })
                                }}
                            />

                            <Input
                                withMargin
                                title={"Email"}
                                type="email"
                                error={"Email tidak valid"}
                                placeholder={'user@email.com'}
                                value={_form.email}
                                onChange={(value) => {
                                    _updateQuery({
                                        "email": value
                                    })
                                }}
                            />

                            <Input
                                withMargin
                                title={"Telepon"}
                                placeholder={'082212345678'}
                                value={_validatePhone(_form.phoneNumber)}
                                onChange={(value) => {
                                    _updateQuery({
                                        "phoneNumber": _validatePhone(value)
                                    })
                                }}
                            />

                            <Input
                                withMargin
                                title={"Role"}
                                placeholder={'Pilih Role'}
                                value={_form.role.title}
                                suggestions={_roleRange}
                                suggestionField={'title'}
                                onSuggestionSelect={(value) => {
                                    _updateQuery({
                                        "roleId": value.value,
                                        "role": value
                                    })
                                }}
                            />

                            {
                                props.data.id && (
                                    <div
                                        className={generateClasses([
                                            styles.container,
                                            styles.pass_container
                                        ])}
                                    >
                                        <span>
                                            Ubah Password?
                                        </span>
                                    </div>

                                )
                            }

                            <Input
                                withMargin
                                isPassword
                                title={"Password"}
                                placeholder={'Password'}
                                value={_form.password}
                                onChange={(value) => {
                                    _updateQuery({
                                        "password": value
                                    })
                                }}
                            />

                            <Input
                                withMargin
                                isPassword
                                title={"Konfirmasi Password"}
                                placeholder={'Konfirmasi Password'}
                                value={_form.cpassword}
                                onChange={(value) => {
                                    _updateQuery({
                                        "cpassword": value
                                    })
                                }}
                            />

                            <div className={styles.container}>

                                {
                                    props.data.id && (
                                        <>
                                            <div
                                                className={styles.activate_container}
                                            >
                                                <span
                                                    className={styles.mb_1}
                                                >
                                                    Aktivasi User
                                                </span>

                                                <Label
                                                    activeIndex={_activeUser}
                                                    labels={[
                                                        {
                                                            class: "primary",
                                                            title: 'Aktif',
                                                            value: false,
                                                            onClick: () => {
                                                                _setActiveUser(false)
                                                                _updateQuery({
                                                                    "isBanned": false
                                                                })
                                                            }
                                                        },
                                                        {
                                                            class: "warning",
                                                            title: 'Non Aktif',
                                                            value: true,
                                                            onClick: () => {
                                                                _setActiveUser(true)
                                                                _updateQuery({
                                                                    "isBanned": true
                                                                })
                                                            }
                                                        }
                                                    ]}
                                                />

                                            </div>

                                            <div
                                                className={generateClasses([
                                                    styles.d_flex,
                                                    styles.align_items_between,
                                                    styles.mt_1
                                                ])}
                                            >
                                                {
                                                    //roleId = 2 ADMIN
                                                    appContext.roleId == "2" && (
                                                        <Button
                                                            title={'Hapus'}
                                                            styles={Button.warning}
                                                            onClick={() => props.onDelete()}
                                                            onProcess={_isProcessing}
                                                        />
                                                    )
                                                }

                                                <Button
                                                    title={'Simpan Perubahan'}
                                                    styles={Button.secondary}
                                                    onClick={_submitData}
                                                    onProcess={_isProcessing}
                                                />
                                            </div>

                                        </>
                                    )
                                }

                                {
                                    !props.data.id && (
                                        <Button
                                            title={'Tambahkan'}
                                            styles={Button.secondary}
                                            onClick={_submitData}
                                            onProcess={_isProcessing}
                                        />
                                    )
                                }

                            </div>
                        </>
                    )

                }

            </ModalContent>

            <QRCodeModal
                visible={_showQRModal}
                closeModal={() => _setShowQRModal(false)}
                userData={{
                    name: _form.name,
                    id: _form.id
                }}
            />

        </Modal>
    )
}