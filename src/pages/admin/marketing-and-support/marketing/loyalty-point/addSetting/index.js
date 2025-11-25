import { useEffect, useState, forwardRef } from 'react'

import { DAMRI_APPS_URL, postJSON, TICKET_ORDER_URL, get } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../../promo/addPromo/AddPromo.module.scss'
import { BsChevronLeft, BsPlus } from 'react-icons/bs'
import Label from '../../../../../../components/Label'
import { useRouter } from 'next/router'
import Table from '../../../../../../components/Table'
import Datepicker from '../../../../../../components/Datepicker'
import { dateFilter, currency } from '../../../../../../utils/filters'
import Link from 'next/link'
import { AiFillCloseCircle } from 'react-icons/ai'
import SelectArea from '../../../../../../components/SelectArea'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { AiFillCaretDown, AiFillCaretUp, AiOutlineClose, AiFillEye } from 'react-icons/ai'

export default function AddSetting(props) {

    const router = useRouter()

    const CONFIG_PARAM = {
        "desc": "",
        "end_periode": dateFilter.basicDate(new Date()).normal + " 23:59:59",
        "company_id": props.authData.companyId,
        "start_periode": dateFilter.basicDate(new Date()).normal + " 00:00:00",
        "title_point": "",
        "type_user": "",
        "value_point": 0,
        "quota_point": 0,
        "validFrom": dateFilter.basicDate(new Date()).normal,
        "validUntil": dateFilter.basicDate(new Date()).normal,
        "is_actived": "",
        "type_user_option": {
            "title": ""
        },
        "timeValidFrom": "00:00",
        "timeValidUntil": "23:59",
        "publisher": "",
        "min_amount_transaction": 0,
        "quota_daily": "",
        "privacy": "PUBLIC",
        "repetition": false,
        "action_by": "",
        "expired_point": "",
        "expired_type": "",
        "member_id": "",
        "platform_id": "",
        "memberInput": "",
        "platformInput": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_dataTable, _setDataTable] = useState([])
    const [_isActive, _setIsActive] = useState(1)
    const [_typeDiscount, _setTypeDiscount] = useState(1)
    const [_coverageTargetRange, _setCoverageTargetRange] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_coverageRange, _setCoverageRange] = useState([])
    const [_categoryRange, _setCategoryRange] = useState([
        {
            value: "NEW_USER",
            title: 'Pengguna Baru'
        },
        {
            value: "EXISTING_USER",
            title: 'Pengguna Lama'
        },
        {
            value: "COMPANY",
            title: 'Perusahaan'
        },
        {
            value: "STAF",
            title: 'Karyawan'
        }
    ])
    const [_companyRange, _setCompanyRange] = useState([
        {
            value: "1",
            title: "DAMRI"
        }
    ])

    const [_formArea, _setFormArea] = useState({
        "loyalty_point_param_id": "",
        "scope_table": "",
        "scope_target_id": "",
        "point": {
            "title": ""
        },
        "selectedArea": {
            "title": ""
        }
    })

    const [_platformRange, _setPlatformRange] = useState([
        {
            value: 1,
            title: "DAMRI Apps"
        },
        {
            value: 2,
            title: "DAMRI Web"
        },
        {
            value: 3,
            title: "Counter EDC"
        }
    ])

    const [_pointRange, _setPointRange] = useState([
        {
            "title": "Trayek",
            "value": "traject"
        },
        {
            "title": "Keanggotaan",
            "value": "member"
        },
        {
            "title": "Perusahaan",
            "value": "company"
        },
        {
            "title": "Pembayaran",
            "value": "payment_provider_detail"
        }

    ])

    const [_selectedAreaRange, _setSelectedAreaRange] = useState([])
    const __COLUMNS = [
        {
            "title": 'Area',
            "field": "scopeTable",
            "textAlign": "left",
            customCell: (value, record, key) => {
                return value.title
            }
        },
        {
            "title": 'Target',
            "field": "title",
            "textAlign": "left"
        },
        {
            "title": "",
            "field": "value",
            customCell: (value, record, key) => {
                return (
                    <Button
                        title={'Hapus'}
                        styles={Button.warning}
                        onClick={() => {
                            _deleteData(key)

                            if (record.scopeTable.id) {
                                _deletePointArea(record.scopeTable.id)
                            }
                        }}
                        small
                    />
                )
            }
        }
    ]

    const [_memberSelect, _setMemberSelect] = useState([])
    const [_platformSelect, _setPlatformSelect] = useState([])
    const [_memberRange, _setMemberRange] = useState([])
    const [_dateExpired, _setDateExpired] = useState("")

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            inputWrapperClassName={styles.input}
            titleContainerClassName={styles.input_title}
            title={""}
            onClick={onClick}
            ref={ref}
            value={_form.expired_point == "" ? "" : dateFilter.getMonthDate(new Date(_form.expired_point))}
            onChange={(value) => {
                
            }}
            />

            {
                _form.expired_point != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "10px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _updateQuery({
                            "expired_point": ""
                        })
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: ".5rem",
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    function _updateMember(data = {}, isDelete = false) {
        let member = [..._memberSelect]
        let memberId = _form?.member_id ? _form?.member_id.split(",") : []

        if (data.value == 0) {
            member = _memberRange.filter(item => item.value !== 0)
            memberId = _memberRange.filter(item => item.value !== 0).map(function (val) {
                return val.value
            })
        } else {
            const index = _memberSelect.indexOf(data)

            if (index < 0 && !isDelete) {
                member.push(data)
                memberId.push(data.value)
            } else {
                member.splice(index, 1)
                memberId.splice(index, 1)
            }
        }

        _updateQuery({
            "member_id": memberId.toString()
        })
        _setMemberSelect(member)
    }

    function _updatePlatform(data = {}, isDelete = false) {
        let platform = [..._platformSelect]

        if (data.value == 0) {
            platform = _platformRange.filter(item => item.value !== 0)
        } else {
            const index = _platformSelect.indexOf(data)

            if (index < 0 && !isDelete) {
                platform.push(data)
            } else {
                platform.splice(index, 1)
            }
        }

        // Always rebuild platformId from the platform array to ensure consistency
        const platformId = platform.map(item => item.value)

        _updateQuery({
            "platform_id": platformId.toString()
        })

        _setPlatformSelect(platform)
    }

    function _getScopeTableTitle(value) {
        let data = _pointRange.find(v => v.value == value)
        return data.title
    }

    function _updateQuery(data = {}, type = "form") {

        if (type == "form") {
            _setForm(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        } else {
            _setFormArea(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        }

    }

    async function _submitData() {
        _setIsProcessing(true)

        try {
            let method = 'add'
            let message = "ditambahkan"
            let query = {
                ..._form
            }

            query.end_periode = query.validUntil + " " + query.timeValidUntil + ":00"
            query.start_periode = query.validFrom + " " + query.timeValidFrom + ":00"
            query.type_user = query.type_user_option.value

            if (router.query?.detail) {
                method = "update"
                message = "diubah"
            }

            if (!query.expired_point) {
                delete query.expired_point
                delete query.expired_type
            }


            delete query.timeValidFrom
            delete query.timeStartAt
            delete query.validFrom
            delete query.validUntil
            delete query.type_user_option
            delete query.timeValidUntil
            delete query.timeValidFrom
            delete query.detail
            delete query.is_deleted
            delete query.created_at
            delete query.updated_at
            delete query.created_by
            delete query.last_modified_by
            delete query.last_modified_at
            delete query.memberInput
            delete query.platformInput

            const result = await postJSON('/loyalty/point/param/' + method, query, props.authData.token)

            if (result) {
                popAlert({ "message": "Berhasil " + message, "type": "success" })

                if (!router.query?.detail) {
                    _getListParam()
                } else {
                    setTimeout(() => {
                        window.location.href = "/admin/marketing-and-support/marketing/loyalty-point?tab=/point/param"
                    }, 1000);
                }
            }


        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _deleteData(key) {
        _setDataTable(_dataTable.filter((v, i) => i !== key))
    }

    function _addData() {

        if (router.query?.detail) {
            _submitPointArea(router.query?.detail, _formArea.selectedArea.value, _formArea.point.value)
            return false;
        }

        let result = [{
            ..._formArea.selectedArea
        }]

        let dataTable = [
            ..._dataTable,
            ...result
        ]

        let cleanDataTable = dataTable.filter((arr, index, self) => index === self.findIndex((t) => (t.id == arr.id)))

        _setDataTable(oldData => {
            return [
                ...cleanDataTable,
            ]
        })

    }

    async function _getScopeTable() {
        try {
            const scope = await get('/loyalty/point/scope/table/list', props.authData.token)
            let data = {
                "branch": "Cabang",
                "bus": "Bis",
                "bus_category": "Kategori Bis",
                "company": "Perusahaan",
                "counter": "Loket",
                "member": "Keanggotaan",
                "payment_provider_detail": "Pembayaran",
                "point": "Lokasi",
                "role": "Role",
                "traject": "Trayek",
                "traject_track": "Segmentasi"
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getSelectedArea() {

        let params = {
            "scopeTable": _formArea.point.value,
            "startFrom": 0,
            "length": 850,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {
            let scope = await postJSON('/loyalty/point/scope/table/target/list', params, props.authData.token)

            scope.data.forEach(function (val, key) {

                if (_formArea.point.value == "traject") {
                    val.title = "(" + val.code + ") " + val.name
                } else {
                    val.title = val.name
                }

                val.value = val.id
                val.scopeTable = _formArea.point
            })

            _setCoverageRange(scope.data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getMember() {
        const params = {
            startFrom: 0,
            length: 470,
        }

        try {
            const member = await postJSON('/masterData/userRoleAkses/member/list', params, props.authData.token)
            let data = []

            member.data.forEach(function (val, key) {
                if (key == 0) {
                    data.push({
                        "title": "Semua",
                        "value": 0
                    })
                }

                data.push({
                    "title": val.name,
                    "value": val.id
                })
            })

            _setMemberRange(data)

            // Call _getDetailParam after _getMember succeeds if detail query exists
            if (router.query?.detail) {
                _getDetailParam()
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getListParam() {
        let params = {
            "startFrom": 0,
            "length": 1,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {
            let scope = await postJSON('/loyalty/point/param/list', params, props.authData.token)

            if (scope.data.length > 0) {

                for (const item of _dataTable) {
                    _submitPointArea(scope.data[0].id, item.id, item.scopeTable.value)
                }

                if (!router.query?.detail) {
                    setTimeout(() => {
                        window.location.href = "/admin/marketing-and-support/marketing/loyalty-point?tab=/point/param"
                    }, 1000);
                }
            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _submitPointArea(id, targetId, scopeTable) {
        let params = {}

        params.scope_table = scopeTable
        params.scope_target_id = `${targetId}`
        params.loyalty_point_param_id = id

        delete params.point
        delete params.selectedArea

        try {
            let scope = await postJSON('/loyalty/point/param/detail/add', params, props.authData.token)

            if (router.query?.detail) {
                _getDetailParam()
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getDetailParam() {
        let params = {
            "startFrom": 0,
            "length": 1,
            "orderBy": "id",
            "sortMode": "desc",
            "loyalty_point_param_id": router.query?.detail
        }

        try {
            let scope = await postJSON('/loyalty/point/param/detail/list', params, props.authData.token)

            if (scope.data.length > 0) {
                let category = _categoryRange.find(v => v.value == scope.data[0].type_user)
                let datatable = []
                let query = {
                    ...scope.data[0],
                    type_user: category.value,
                    type_user_option: category
                }

                let startPeriod = scope.data[0].start_periode.split(" ")
                let startTimePeriod = startPeriod[1].split(":")
                let endPeriod = scope.data[0].end_periode.split(" ")
                let endTimePeriod = endPeriod[1].split(":")

                query.repetition = scope.data[0].repetition == 1 ? true : false
                query.quota_daily = scope.data[0].quota_daily == 1 ? true : false
                query.is_actived = scope.data[0].is_actived == 1 ? true : false
                query.validFrom = startPeriod[0]
                query.timeValidFrom = startTimePeriod[0] + ":" + startTimePeriod[1]
                query.validUntil = endPeriod[0]
                query.timeValidUntil = endTimePeriod[0] + ":" + endTimePeriod[1]

                for (const item of scope.data[0].detail) {
                    item.scope_target.forEach(function (val, key) {
                        datatable.push({
                            "title": val.name,
                            "value": val.target_id,
                            "scopeTable": {
                                "id": val.scope_table_id,
                                "value": item.scope_table,
                                "title": _getScopeTableTitle(item.scope_table)
                            },
                        })
                    })
                }

                _setDateExpired(new Date(query.expired_point))
                _updateQuery(query)
                _setDataTable(datatable)

            }

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _deletePointArea(id) {
        let params = {
            "loyalty_point_param_id": router.query?.detail,
            "id": id
        }

        try {
            let scope = await postJSON('/loyalty/point/param/detail/delete', params, props.authData.token)

            if (scope) {
                popAlert({ message: "Berhasil dihapus", "type": "success" })
            }
        } catch (e) {
            popAlert({ message: e.message })
        }
    }


    useEffect(() => {
        _getScopeTable()
        _getMember()
    }, [])

    useEffect(() => {
        if (_formArea.point?.value) {
            _getSelectedArea()
        }
    }, [_formArea.point])

    // useEffect(() => {
    //     _updateQuery({
    //         "expired_point": ""
    //     })
    // }, [_form.expired_type])

    useEffect(() => {
        if(_memberRange.length > 0){
            let member = []
            _form.member_id.split(",").forEach(function (val) {
                _memberRange.forEach(function (i, key) {
                    if (i.value == val) {
                        member.push(i)
                    }
                })
            })

            _setMemberSelect(member)
        }

        if(_platformRange.length > 0){
            let platform = []
            _form.platform_id.split(",").forEach(function (val) {
                _platformRange.forEach(function (i, key) {
                    if (i.value == val) {
                        platform.push(i)
                    }
                })
            })

            _setPlatformSelect(platform)
        }
    }, [_form.id])

    return (
        <Main>
            <AdminLayout
                headerContent={
                    <div className={styles.header_content}>
                        <div>
                            <Link href="/admin/marketing-and-support/marketing/loyalty-point?tab=/point/param">
                                <BsChevronLeft />
                            </Link>
                            <strong>{router.query?.detail ? 'Ubah' : 'Tambah'} Pengaturan</strong>
                        </div>
                    </div>
                }
            >
                <Row>
                    <Col
                        column={3}
                    >
                        <Card>
                            <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                            >
                                <Input
                                    title={"Poin Area"}
                                    placeholder={'Pilih poin area'}
                                    value={_formArea.point.title}
                                    suggestions={_pointRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(data) => {
                                        _updateQuery({
                                            "point": data,
                                            "scope_table": data.value
                                        }, "formArea")
                                    }}
                                />
                            </Col>

                            <Row
                            >
                                <Col
                                    withPadding
                                    column={5}
                                    mobileFullWidth
                                >
                                    <Input
                                        title={"Target"}
                                        placeholder={'Pilih target'}
                                        value={_formArea.selectedArea.title}
                                        suggestions={_coverageRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateQuery({
                                                "selectedArea": data
                                            }, "formArea")
                                        }}
                                    />
                                </Col>

                                <Col
                                    withPadding
                                    alignEnd
                                    column={1}
                                    justifyEnd
                                >
                                    <Button
                                        small
                                        icon={<BsPlus />}
                                        styles={Button.danger}
                                        onClick={() => {
                                            _addData()
                                        }}
                                    />
                                </Col>
                            </Row>

                            <Table
                                style={{
                                    marginTop: "1rem"
                                }}
                                exportToXls={false}
                                columns={__COLUMNS}
                                records={_dataTable}
                                noPadding
                            />

                        </Card>
                    </Col>

                    <Col
                        column={3}
                    >
                        <Card>
                            <Row
                                marginBottom
                                verticalEnd
                            >
                                <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Kategori"}
                                        placeholder={'Pilih kategori'}
                                        value={_form.type_user_option.title}
                                        suggestions={_categoryRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateQuery({
                                                "type_user": data.value,
                                                "type_user_option": data
                                            })
                                        }}
                                    />
                                </Col>

                                <Col
                                    column={6}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Judul Point"}
                                        placeholder={'Masukan judul'}
                                        value={_form.title_point}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "title_point": value
                                            })
                                        }}
                                    />
                                </Col>

                                <Col
                                    column={6}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        multiline={2}
                                        title={"Deskripsi"}
                                        placeholder={'Masukan deskripsi'}
                                        value={_form.desc}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "desc": value
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>

                            <Row
                                marginBottom
                            >

                                <Col
                                    column={3}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <strong>Periode</strong>

                                    <Row>
                                        <Col
                                            column={6}
                                            withPadding
                                        >
                                            <Row>

                                                <Col
                                                    column={3}
                                                >
                                                    <Datepicker
                                                        id={"startAt"}
                                                        title={"Dari"}
                                                        value={_form.validFrom}
                                                        onChange={date => {
                                                            _updateQuery({
                                                                "validFrom": dateFilter.basicDate(new Date(date)).normal,
                                                                "start_periode": dateFilter.basicDate(new Date(date)).normal + " 00:00:00",
                                                            })
                                                        }}
                                                    />
                                                </Col>

                                                <Col
                                                    column={3}
                                                >
                                                    <Input
                                                        maxLength={5}
                                                        title={"Jam:Menit"}
                                                        placeholder={'00:00'}
                                                        value={_form.timeValidFrom}
                                                        onChange={(value) => {
                                                            _updateQuery({
                                                                "timeValidFrom": value
                                                            })
                                                        }}
                                                    />
                                                </Col>

                                            </Row>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col
                                            column={6}
                                            withPadding
                                        >
                                            <Row>
                                                <Col
                                                    column={3}
                                                >
                                                    <Datepicker
                                                        id={"endAt"}
                                                        title={"Sampai"}
                                                        value={_form.validUntil}
                                                        onChange={date => {
                                                            _updateQuery({
                                                                "validUntil": dateFilter.basicDate(new Date(date)).normal,
                                                                "end_periode": dateFilter.basicDate(new Date(date)).normal + " 23:59:59",
                                                            })
                                                        }}
                                                    />
                                                </Col>

                                                <Col
                                                    column={3}
                                                >
                                                    <Input
                                                        maxLength={5}
                                                        title={"Jam:Menit"}
                                                        placeholder={'23:59'}
                                                        value={_form.timeValidUntil}
                                                        onChange={(value) => {
                                                            _updateQuery({
                                                                "timeValidUntil": value
                                                            })
                                                        }}
                                                    />
                                                </Col>

                                            </Row>

                                        </Col>
                                    </Row>
                                </Col>


                                <Row
                                    style={{
                                        marginTop: "1rem"
                                    }}
                                >
                                    <Col
                                        column={2}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <Input
                                            title={"Min Beli (Rp)"}
                                            placeholder={'Masukan nominal'}
                                            value={_form.min_amount_transaction}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "min_amount_transaction": value
                                                })
                                            }}
                                        />
                                    </Col>

                                    <Col
                                        column={1}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <Input
                                            type={"number"}
                                            title={"Jumlah Poin"}
                                            placeholder={'Masukan poin'}
                                            value={_form.value_point}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "value_point": value
                                                })
                                            }}
                                        />
                                    </Col>

                                    <Col
                                        column={1}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <Input
                                            title={"Kuota"}
                                            placeholder={'Masukan nilai'}
                                            value={_form.quota_point}
                                            onChange={(value) => {
                                                _updateQuery({
                                                    "quota_point": value
                                                })
                                            }}
                                        />
                                    </Col>

                                    <Col
                                        column={2}
                                        mobileFullWidth
                                        withPadding
                                    >
                                        <div
                                            className={styles.container}
                                        >
                                            <div
                                                className={styles.activate_container}
                                            >
                                                <p
                                                    className={styles.mb_1}
                                                >
                                                    Kuota Harian
                                                </p>

                                                <Label
                                                    activeIndex={_form.quota_daily}
                                                    labels={[
                                                        {
                                                            class: "warning",
                                                            title: 'Tidak',
                                                            value: false,
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "quota_daily": false
                                                                })
                                                            }
                                                        },
                                                        {
                                                            class: "primary",
                                                            title: 'Ya',
                                                            value: true,
                                                            onClick: () => {
                                                                _updateQuery({
                                                                    "quota_daily": true
                                                                })
                                                            }
                                                        }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </Col>


                                </Row>
                            </Row>

                            <Row
                            marginBottom
                            >
                                <Col
                                    column={6}
                                    mobileFullWidth
                                    withPadding
                                >

                                    <SelectArea
                                        title={"Platform"}
                                        onSelect={(data) => {
                                            _updatePlatform(data, true)
                                        }}
                                        select={_platformSelect}
                                    />

                                    <Input
                                        title={""}
                                        placeholder={'Pilih Platform'}
                                        value={_form.platformInput.title}
                                        suggestions={_platformRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updatePlatform(data)
                                            return false
                                        }}
                                    />
                                </Col>

                                <Col
                                    column={6}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <SelectArea
                                        title={"Keanggotaan"}
                                        onSelect={(data) => {
                                            _updateMember(data, true)
                                        }}
                                        select={_memberSelect}
                                    />

                                    <Input
                                        title={""}
                                        placeholder={'Pilih Keanggotaan'}
                                        value={_form.memberInput.title}
                                        suggestions={_memberRange}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(data) => {
                                            _updateMember(data)
                                            return false
                                        }}
                                    />
                                </Col>
                            </Row>

                            <Row
                                marginBottom
                                verticalEnd
                            >
                                <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <div
                                        className={styles.container}
                                    >
                                        <div
                                            className={styles.activate_container}
                                        >
                                            <p
                                                className={styles.mb_1}
                                            >
                                                Gunakan Berulang
                                            </p>

                                            <Label
                                                activeIndex={_form.repetition}
                                                labels={[
                                                    {
                                                        class: "warning",
                                                        title: 'Tidak',
                                                        value: false,
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "repetition": false
                                                            })
                                                        }
                                                    },
                                                    {
                                                        class: "primary",
                                                        title: 'Ya',
                                                        value: true,
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "repetition": true
                                                            })
                                                        }
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </Col>

                                <Col
                                    column={4}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <div
                                        className={styles.container}
                                    >
                                        <div
                                            className={styles.activate_container}
                                        >
                                            <p
                                                className={styles.mb_1}
                                            >
                                                Expired Point
                                            </p>

                                            <Row
                                                style={{
                                                    gap: "1rem",
                                                }}
                                            >
                                                <Col>
                                                    <Label
                                                        activeIndex={_form.expired_type}
                                                        labels={[
                                                            {
                                                                class: "warning",
                                                                title: 'Hari',
                                                                value: "DAYS",
                                                                onClick: () => {
                                                                    _updateQuery({
                                                                        "expired_type": "DAYS"
                                                                    })
                                                                }
                                                            },
                                                            {
                                                                class: "primary",
                                                                title: 'Tanggal',
                                                                value: "DATE",
                                                                onClick: () => {
                                                                    _updateQuery({
                                                                        "expired_type": "DATE"
                                                                    })
                                                                }
                                                            }
                                                        ]}
                                                    />
                                                </Col>

                                                <Col>
                                                    {
                                                        _form.expired_type == "DAYS" && (
                                                            <Input
                                                                title={""}
                                                                placeholder={_form.expired_type == "DAYS" ? "Masukan jumlah hari" : "Pilih Tanggal"}
                                                                value={_form.expired_point}
                                                                onChange={(value) => {
                                                                    _updateQuery({
                                                                        "expired_point": value
                                                                    })
                                                                }}
                                                            />
                                                        )
                                                    }

                                                    {
                                                        _form.expired_type == "DATE" && (
                                                            <Row
                                                                style={{
                                                                    gap: "1rem",
                                                                    position: "relative"
                                                                }}
                                                            >
                                                                <div>
                                                                    <DatePicker
                                                                    style={{
                                                                        width: "100%"
                                                                    }}
                                                                    selected={_dateExpired}
                                                                    onChange={(date) => {
                                                                        _updateQuery({
                                                                            "expired_point": dateFilter.basicDate(new Date(date)).normal,
                                                                        })

                                                                        _setDateExpired(date)

                                                                    }}
                                                                    customInput={
                                                                        <CustomDatePicker/>
                                                                    }
                                                                    />
                                                                </div>

                                                            

                                                            </Row>
                                                        )
                                                    }
                                                </Col>



                                            </Row>

                                        </div>
                                    </div>
                                </Col>


                                {/* <Col
                                column={2}
                                mobileFullWidth
                                withPadding
                                >   
                                    <div
                                    className={styles.container}
                                    >
                                        <div
                                        className={styles.activate_container}
                                        >
                                            <p
                                            className={styles.mb_1}
                                            >
                                                Dapat diakses
                                            </p>
                                            
                                            <Label
                                            activeIndex={_form.privacy}
                                            labels={[
                                                {
                                                    class: "warning",
                                                    title: 'Publik',
                                                    value: "PUBLIC",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "privacy": "PUBLIC"
                                                        })
                                                    }
                                                },
                                                {
                                                    class: "primary",
                                                    title: 'Privat',
                                                    value: "PRIVATE",
                                                    onClick : () => {
                                                        _updateQuery({
                                                            "privacy": "PRIVATE"
                                                        })
                                                    }
                                                }
                                            ]}
                                            />
                                        </div>
                                    </div>
                                </Col> */}
                            </Row>

                            <Row
                            marginBottom
                            >
                                <Col
                                    marginBottom
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <Input
                                        title={"Penerbit"}
                                        placeholder={'Contoh: BISKU'}
                                        value={_form.publisher}
                                        onChange={(value) => {
                                            _updateQuery({
                                                "publisher": value
                                            })
                                        }}
                                    />
                                </Col>

                                <Col
                                marginBottom
                                    column={3}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <div
                                        className={styles.container}
                                    >
                                        <div
                                            className={styles.activate_container}
                                        >
                                            <p
                                                className={styles.mb_1}
                                            >
                                                Pembelian Berdasarkan
                                            </p>

                                            <Label
                                                activeIndex={_form.action_by}
                                                labels={[
                                                    {
                                                        class: "warning",
                                                        title: 'Kode Booking',
                                                        value: "CODE_BOOKING",
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "action_by": "CODE_BOOKING"
                                                            })
                                                        }
                                                    },
                                                    {
                                                        class: "primary",
                                                        title: 'Tiket',
                                                        value: "CODE_TICKET",
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "action_by": "CODE_TICKET"
                                                            })
                                                        }
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </Col>

                                <Col
                                    column={2}
                                    mobileFullWidth
                                    withPadding
                                >
                                    <div
                                        className={styles.container}
                                    >
                                        <div
                                            className={styles.activate_container}
                                        >
                                            <p
                                                className={styles.mb_1}
                                            >
                                                Aktivasi
                                            </p>

                                            <Label
                                                activeIndex={_form.is_actived}
                                                labels={[
                                                    {
                                                        class: "warning",
                                                        title: 'Tidak',
                                                        value: false,
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "is_actived": false
                                                            })
                                                        }
                                                    },
                                                    {
                                                        class: "primary",
                                                        title: 'Ya',
                                                        value: true,
                                                        onClick: () => {
                                                            _updateQuery({
                                                                "is_actived": true
                                                            })
                                                        }
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </Col>

                            </Row>

                            <Col
                                column={6}
                                mobileFullWidth
                                withPadding
                                justifyEnd
                            >
                                <Button
                                    title={'Simpan'}
                                    styles={Button.secondary}
                                    onClick={_submitData}
                                    onProcess={_isProcessing}
                                />
                            </Col>
                        </Card>
                    </Col>
                </Row>



            </AdminLayout>
        </Main>
    )

}