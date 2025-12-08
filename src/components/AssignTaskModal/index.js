import { useEffect, useState, useContext, forwardRef } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignTask.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import DatePicker from 'react-datepicker'
import { dateFilter } from '../../utils/filters'
import { Col, Row } from '../Layout'
import Table from '../Table'
import "react-datepicker/dist/react-datepicker.css";

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    isImport: false,
    roleRange: []
}

AssignTaskModal.defaultProps = defaultProps

export default function AssignTaskModal(props = defaultProps) {

    const CONFIG_PARAM = {
        "assignDate": "",
        "companyId": "",
        "busId": "",
        "crew1_id": "",
        "crew2_id": "",
        "crew3_id": "",
        "items": [
            {
                "scheduleAssignId": "",
                "ritase": "",
                "scheduleSelected": {
                    "title": ""
                }
            }
        ],
        "bus": {},
        "crew1": {},
        "crew2": {},
        "crew3": {}
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_startDate, _setStartDate] = useState(new Date());
    const [_busRanges, _setBusRanges] = useState([])
    const [_driverRanges, _setDriverRanges] = useState([])
    const [_kondekturRanges, _setKondekturRanges] = useState([])
    const [_kernetRanges, _setKernetRanges] = useState([])


    const [_scheduleRanges, _setScheduleRanges] = useState([])
    const [_isComplete, _setIsComplete] = useState(false)
    const [_scheduleMasterData, _setScheduleMasterData] = useState([])
    const [_selectedSchedules, _setSelectedSchedules] = useState([])
    const [_showScheduleTable, _setShowScheduleTable] = useState(false)


    const DatepickerAssign = forwardRef(({ value, onClick }, ref) => (
        <Col
            justifyCenter
        >
            <Input
                withMargin
                title={"Tanggal Penugasan"}
                onClick={onClick}
                ref={ref}
                value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
                onChange={(value) => {

                }}
            />
        </Col>
    ));

    function _clearForm() {
        _setForm(CONFIG_PARAM)
        _setStartDate(new Date())
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    useEffect(() => {
        _getBusList()
        _getCrewList(18) //kernet
        _getCrewList(19) //kondektur
        _getCrewList(17) //driver
        _getScheduleList()
        _getScheduleByQuery()
    }, [])

    async function _getBusList() {
        const params = {
            "startFrom": 0,
            "length": 100,
            "companyId": appContext.authData.companyId
        }

        try {
            const result = await postJSON(`/masterData/bus/list`, params, appContext.authData.token)
            let busRange = []
            result.data.forEach(function (val) {
                busRange.push({
                    "title": val.name,
                    "value": val.id,
                    "data": val
                })
            })
            _setBusRanges(busRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getCrewList(roleId) {
        const params = {
            "startFrom": 0,
            "length": 360,
            "orderBy": "idUser",
            "sortMode": "desc",
            "role_id": roleId
        }

        try {
            const result = await postJSON(`/masterData/userRoleAkses/user/list`, params, appContext.authData.token)
            let crewRange = []
            result.data.forEach(function (val) {
                crewRange.push({
                    "title": val.name,
                    "value": val.idUser,
                })
            })

            if (roleId == 18) {
                _setKernetRanges(crewRange)
            } else if (roleId == 19) {
                _setKondekturRanges(crewRange)
            } else {
                _setDriverRanges(crewRange)
            }

        } catch (e) {
            console.log(e)
        }
    }

    async function _getScheduleList() {
        const params = {
            "startFrom": 0,
            "length": 100
        }

        try {
            const result = await postJSON(`/masterData/jadwal/master/list`, params, appContext.authData.token)
            let scheduleRange = []
            result.data.forEach(function (val) {
                scheduleRange.push({
                    "title": val.name || val.code || `Schedule ${val.id}`,
                    "value": val.id,
                    "data": val
                })
            })
            _setScheduleRanges(scheduleRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getScheduleByQuery() {
        const params = {
            "startFrom": 0,
            "length": 60,
            "scheduleType": "INTERCITY",
            "sortMode": "desc",
            "orderBy": "id"
        }

        try {
            const result = await postJSON(`/masterData/jadwal/master/list`, params, appContext.authData.token)
            let scheduleRange = []
            result.data.forEach(function (val) {
                scheduleRange.push({
                    "title": val.id + " | Traject " + val.trajectId + " | " + val.trajectMasterName,
                    "value": val.id,
                    "data": val
                })
            })
            _setScheduleRanges(scheduleRange)
        } catch (e) {
            console.log(e)
        }
    }

    function _addScheduleItem() {
        let items = [..._form.items]
        items.push({
            "scheduleAssignId": "",
            "ritase": ""
        })
        _updateQuery({ items })
    }

    function _removeScheduleItem(index) {
        let items = [..._form.items]
        items.splice(index, 1)
        _updateQuery({ items })
    }

    function _updateScheduleItem(index, field, value) {
        let items = [..._form.items]
        items[index][field] = value
        _updateQuery({ items })
    }

    useEffect(() => {
        const isValid = _form.assignDate && _form.busId && _form.crew1_id &&
            _form.items.length > 0 &&
            _form.items.every(item => item.scheduleAssignId && item.ritase)
        _setIsComplete(!isValid)
    }, [_form])


    useEffect(() => {
        if (props.visible) {
            _setStartDate(new Date())
            _updateQuery({
                "companyId": appContext.authData.companyId,
                "assignDate": dateFilter.basicDate(new Date()).normal
            })
        }
    }, [props.visible])

    async function _submitData() {
        let query = {
            "assignDate": dateFilter.basicDate(new Date(_startDate)).normal,
            "companyId": _form.companyId,
            "busId": _form.busId,
            "crew1_id": _form.crew1_id,
            "crew2_id": _form.crew2_id,
            "crew3_id": _form.crew3_id,
            "items": _form.items
        }

        if(query.crew3_id == "") query.crew3_id = null

        query.items.forEach(function (val, key) {
            delete val.scheduleSelected
        })

        _setIsProcessing(true)

        try {
            const result = await postJSON('/data/penugasan/add', query, appContext.authData.token)

            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
            if (props.onSuccess) props.onSuccess()
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

    return (
        <div className={styles.modal_wrapper}>
            <div
                className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`}
                onClick={props.closeModal}
            />
            <div style={{ minWidth: "50%" }} className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`}>
                <ModalContent
                    header={{
                        title: 'Tambah Penugasan',
                        closeModal: () => {
                            props.closeModal()
                            _clearForm()
                        },
                    }}
                >

                    <Col column={6} style={{ position: "relative" }}>
                        <DatePicker
                            onChange={(date) => {
                                _setStartDate(date)
                                console.log(date)
                            }}
                            minDate={new Date()}
                            selected={_startDate}
                            customInput={<DatepickerAssign />}
                        />
                    </Col>

                    <Input
                        withMargin
                        title={"Bus"}
                        placeholder={'Pilih Bus'}
                        value={_form.bus.title}
                        suggestions={_busRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(data) => {
                            _updateQuery({
                                "busId": data.value,
                                "bus": data
                            })
                        }}
                    />

                    <Row>
                        <Col>
                            <Input
                                withMargin
                                title={"Kondektur"}
                                placeholder={'Pilih Kondektur'}
                                value={_form.crew1.title}
                                suggestions={_kondekturRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "crew1_id": data.value,
                                        "crew1": data
                                    })
                                }}
                            />
                        </Col>

                        <Col>
                            <Input
                                withMargin
                                title={"Driver"}
                                placeholder={'Pilih Driver'}
                                value={_form.crew2.title}
                                suggestions={_driverRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "crew2_id": data.value,
                                        "crew2": data
                                    })
                                }}
                            />
                        </Col>

                        <Col>
                            <Input
                                withMargin
                                title={"Kernet"}
                                placeholder={'Pilih Kernet'}
                                value={_form.crew3.title}
                                suggestions={_kernetRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateQuery({
                                        "crew3_id": data.value,
                                        "crew3": data
                                    })
                                }}
                            />
                        </Col>
                    </Row>

                    <div style={
                        { 
                            marginTop: "1rem", 
                            marginBottom: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem" 
                        }
                    }>
                        <strong>Jadwal Assign</strong>

                        <Button
                            small
                            title={"Tambah Jadwal"}
                            styles={Button.primary}
                            onClick={_addScheduleItem}
                        />
                    </div>

                    {_form.items.map((item, index) => (
                        <Row
                            verticalEnd
                            key={index}
                            style={{
                                border: "1px solid #ddd",
                                padding: "1rem",
                                marginBottom: "1rem",
                                borderRadius: "4px"
                            }}>

                            <Col
                            column={3}
                            withPadding
                            >
                                <Input
                                    title={"Jadwal"}
                                    placeholder={'Cari jadwal...'}
                                    value={item.scheduleSelected?.title || ''}
                                    suggestions={_scheduleRanges}
                                    suggestionField={'title'}
                                    onChange={(value) => {
                                        
                                    }}
                                    onSuggestionSelect={(value) => {
                                        _updateScheduleItem(index, "scheduleAssignId", value.value)
                                        _updateScheduleItem(index, "scheduleSelected", value)
                                    }}
                                />
                            </Col>

                            <Col
                            column={1}
                            withPadding
                            >
                                <Input
                                    title={"Ritase"}
                                    placeholder={'Masukkan Ritase'}
                                    value={item.ritase}
                                    onChange={(value) => {
                                        _updateScheduleItem(index, "ritase", value)
                                    }}
                                />
                            </Col>

                            <Col
                            alignEnd
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                    {_form.items.length > 1 && (
                                        <Button
                                            small
                                            title={'Hapus'}
                                            styles={Button.error}
                                            onClick={() => _removeScheduleItem(index)}
                                        />
                                    )}
                                </div>
                            </Col>

                        </Row>
                    ))}

                    <div style={{ marginTop: "3rem" }}>
                        <Button
                            // disabled={_isComplete}
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                        />
                    </div>

                </ModalContent>
            </div>
        </div>
    )
}