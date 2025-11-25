import { useEffect, useState, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import Button from '../Button'
import { postJSON, postFormData, get } from '../../api/utils'
import Table from '../Table'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Label from '../Label'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
    type: null
}

export default function SettingMembershipModal(props = defaultProps) {

    const [_settingMember, _setSettingMember] = useState([])
    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const CONFIG_PARAM = {
        "name": ""
    }

    const CONFIG_EKSTERNAL = {
        "email": "",
        "memberId": "",
        "memberName": "",
        "phoneNumber": "",
        "fullName": "",
        "gender": "MALE"
    }

    const [_externalXlsx, _setExternalXlsx] = useState({})

    const [_formMember, _setFormMember] = useState(CONFIG_PARAM)
    const [_formEksternal, _setFormEksternal] = useState(CONFIG_EKSTERNAL)

    // _updateQuery function for updating form state
    function _updateQuery(update) {
        _setFormEksternal(prev => ({
            ...prev,
            ...update
        }))
    }

    const _handleType = (position, field, name) => {

        let update = []

        _settingMember.forEach(function (val, key) {
            if (key == position) {
                val[field] = name
            }
            update.push(val)
        })

        _setSettingMember(update);
    }

    const __COLUMNS_MEMBER = [
        {
            title: "Nama",
            field: "name",
            customCell: (val, row, key) => {
                return (
                    <Input
                        type={"text"}
                        value={val}
                        onChange={(value) => {
                            _handleType(key, "name", value)
                        }}
                    />
                )
            }
        },
        {
            title: '',
            field: 'id',
            customCell: (val, row, key) => {
                return (
                    <Button
                        onProcess={_isProcessing}
                        small
                        title={"Ubah"}
                        onClick={(value) => {
                            _updateName(row)
                        }}
                    />
                )
            }
        },
    ]

    async function _updateName(data) {

        _setIsProcessing(true)

        const params = {
            ...data
        }

        try {

            let typeUrl = "add"

            if (params?.id) {
                typeUrl = "update"
            }

            const result = await postJSON(`/masterData/userRoleAkses/member/` + typeUrl, params, appContext.authData.token)

            if (result) {
                _getMembership()
            }

        } catch (e) {
            popAlert({ message: e.message })

        } finally {

            _setIsProcessing(false)
        }
    }

    async function _getMembership() {
        const params = {
            startFrom: 0,
            length: 320
        }

        try {
            const memberList = await postJSON(`/masterData/userRoleAkses/member/list`, params, appContext.authData.token)
            let data = []

            memberList.data.forEach(function (val, key) {
                if (val.id != 1) {
                    data.push(val)
                }
            })

            _setSettingMember(data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _checkIdentity(data = {}) {
        let params = {
            "phoneNumber": _formEksternal.phoneNumber,
            "email": _formEksternal.email
        }

        if (data?.email) {
            params.phoneNumber = data.phoneNumber
            params.email = data.email
        }

        // Wait 3 seconds before saving
        await new Promise(resolve => setTimeout(resolve, 3000));
        await _saveExternal(data);

        return false

        try {
            const result = await postJSON(`/member/data/getByContact`, params, appContext.authData.token)

            if (result?.data) {
                _updateQuery({
                    "fullName": result.data?.name,
                    "gender": result.data?.gender
                })

                data.fullName = result.data?.name
                data.gender = result.data?.gender

                popAlert({ message: "Pengguna terdaftar sebagai " + result.data?.name, type: "success" })
            }

            // Wait 3 seconds before saving
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // await _saveExternal(data);


        } catch (e) {
            popAlert({ message: e.message })

            // Wait 3 seconds before saving even on error
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // await _saveExternal(data);
        }
    }

    async function _saveExternal(data = {}) {
        let params = {
            ..._formEksternal
        }

        if (data?.fullName) {
            params = data
        }


        delete params.memberName

        _setIsProcessing(true)

        try {
            const result = await postJSON(`/member/data/add`, params, appContext.authData.token)


            if (result) {
                popAlert({ message: "Berhasil disimpan", type: "success" })
                // props.onSuccess()
            }


        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getJsonExternal() {

        const result = await get({
            url: "/files/pendaftaran_member_22.json"
        })

        if (result) {
            // Process items sequentially with delay
            for (let i = 0; i < result.length; i++) {
                const val = result[i];

                if (val['Nomor Telepon']) {
                    await _checkIdentity({
                        "email": val.Email,
                        "memberId": 4,
                        "phoneNumber": val['Nomor Telepon'] && String(val['Nomor Telepon']).startsWith("08") && /^\d+$/.test(val['Nomor Telepon'])
                            ? "62" + val['Nomor Telepon'].slice(1)
                            : val['Nomor Telepon'] && /^\d+$/.test(val['Nomor Telepon'])
                                ? "62" + val['Nomor Telepon']
                                : null,
                        "fullName": val['Nama Lengkap'],
                        "gender": val['Jenis Kelamin'] == "Pria" ? "MALE" : "FEMALE"
                    });

                    // Add 1 second delay between requests
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

    }

    async function _updateMember(params) {
        _setIsProcessing(true)

        try {
            const result = await postJSON(`/member/data/update`, params, appContext.authData.token)


            if (result) {
                popAlert({ message: "Berhasil disimpan", type: "success" })
                // props.onSuccess()
            }


        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateJsonExternal() {
        const result = await get({
            url: "/files/fix_member.json"
        })


        if (result) {
            result.forEach(function (val, key) {

                // if (val.phone_number && val.phone_number.startsWith("62")) {
                //     val.phone_number = val.phone_number.replace(/^62/, "628");
                // }

                let params = {
                    "id": val.id,
                    "email": val.email,
                    "memberId": val.member_id,
                    "phoneNumber": val.phone_number,
                    "fullName": val.full_name,
                    "gender": val.gender
                }

                _updateMember(params)

            })
        }
    }

    useEffect(() => {
        if (props.visible) {
            _getMembership()
        }
    }, [props.visible])

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >

            <ModalContent
                header={{
                    title: props.type == "eks" ? "Tambah Eksternal" : "Pengaturan Korporasi",
                    closeModal: () => {
                        props.closeModal()
                    },
                }}
            >

                {
                    props.type == "2" && (
                        <>
                            <Row
                                center
                                verticalCenter
                                spaceEvenly
                            >

                                <Col
                                    withPadding
                                    column={3}
                                >
                                    <Input
                                        title={"Nama Perusahaan"}
                                        value={_formMember.name}
                                        onChange={(value) => {
                                            _setFormMember({
                                                name: value
                                            })
                                        }}
                                    />
                                </Col>

                                <Col
                                    withPadding
                                    column={2}
                                >
                                    <Button
                                        title={'Tambah'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            _updateName(_formMember)
                                        }}
                                        onProcess={_isProcessing}
                                    />
                                </Col>

                            </Row>

                            <Table
                                columns={__COLUMNS_MEMBER}
                                records={_settingMember}
                            />
                        </>
                    )
                }

                {
                    props.type == "eks" && (
                        <div>
                            <Col
                                withPadding
                                column={6}
                            >
                                <Input
                                    title={"Email"}
                                    value={_formEksternal.email}
                                    onChange={(value) => {
                                        _updateQuery({
                                            "email": value
                                        })
                                    }}
                                />

                            </Col>

                            <Row
                                style={{
                                    padding: ".25rem"
                                }}
                                flexEnd
                                verticalEnd
                            >
                                <Input
                                    type={"tel"}
                                    withPadding
                                    title={"No Telepon"}
                                    value={_formEksternal.phoneNumber}
                                    onChange={(value) => {

                                        _updateQuery({
                                            "phoneNumber": value
                                        })

                                    }}
                                />

                                <Button
                                    marginLeft
                                    onProcess={_isProcessing}
                                    title={"Periksa"}
                                    onClick={() => {
                                        _checkIdentity()
                                    }}
                                    small
                                />
                            </Row>

                            {
                                appContext.roleId == "2" && (
                                    <Input
                                        title={"Keanggotaan"}
                                        withMargin
                                        placeholder={'Pilih keanggotaan'}
                                        value={_formEksternal.memberName}
                                        suggestions={_settingMember}
                                        suggestionField={'name'}
                                        onSuggestionSelect={(value) => {
                                            _updateQuery({
                                                "memberId": value.id,
                                                "memberName": value.name,
                                            })
                                        }}
                                    />
                                )
                            }

                            <Input
                                title={"Nama"}
                                withMargin
                                value={_formEksternal.fullName}
                                onChange={(value) => {
                                    _updateQuery({
                                        "fullName": value
                                    })
                                }}
                            />

                            <Col
                                marginBottom
                                withPadding
                            >
                                <p
                                    style={{
                                        marginBottom: "1rem"
                                    }}
                                >
                                    Jenis Kelamin
                                </p>

                                <Label
                                    activeIndex={_formEksternal.gender}
                                    labels={[
                                        {
                                            class: "warning",
                                            title: 'Laki-laki',
                                            value: "MALE",
                                            onClick: () => {
                                                _updateQuery({
                                                    "gender": "MALE"
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Perempuan',
                                            value: "FEMALE",
                                            onClick: () => {
                                                _updateQuery({
                                                    "gender": "FEMALE"
                                                })
                                            }
                                        }
                                    ]}
                                />
                            </Col>

                            <Button
                                title={'Simpan'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _saveExternal()
                                }}
                                onProcess={_isProcessing}
                            />


                            <Button
                                title={'Action'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _getJsonExternal()
                                }}
                                onProcess={_isProcessing}
                            />

                            <Button
                                title={'Update'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _updateJsonExternal()
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