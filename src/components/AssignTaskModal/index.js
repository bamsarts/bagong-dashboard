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
                "ritase": ""
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

    const onChangeDate = (dates) => {
        _setStartDate(dates);
        _updateQuery({
            "assignDate": dateFilter.basicDate(dates).normal
        })
    };

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
                    "value": val.id,
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

    async function _scheduleMaster() {
        const params = {
            "startFrom": 0,
            "length": 100,
            "sortMode": "desc",
            "scheduleType": "INTERCITY",
            "orderBy": "id"
        }

        try {
            const result = await postJSON(`/masterData/jadwal/master/list`, params, appContext.authData.token)
            _setScheduleMasterData(result.data || [])

            // Pre-select currently assigned schedules
            const currentScheduleIds = _form.items.map(item => item.scheduleAssignId).filter(id => id)
            _setSelectedSchedules(currentScheduleIds)

            _setShowScheduleTable(true)
        } catch (e) {
            console.log(e)
            popAlert({ message: "Gagal memuat data jadwal" })
        }
    }

    function _handleScheduleSelection(selectedIds) {
        _setSelectedSchedules(selectedIds)
    }

    function _applyScheduleSelection() {
        const newItems = _selectedSchedules.map(scheduleId => {
            const existingItem = _form.items.find(item => item.scheduleAssignId === scheduleId)
            return existingItem || {
                "scheduleAssignId": scheduleId,
                "ritase": ""
            }
        })
        _updateQuery({ items: newItems })
        _setShowScheduleTable(false)
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
            "assignDate": _form.assignDate,
            "companyId": _form.companyId,
            "busId": _form.busId,
            "crew1_id": _form.crew1_id,
            "crew2_id": _form.crew2_id,
            "crew3_id": _form.crew3_id,
            "items": _form.items
        }   

        for(var i=0; i < 3; i++){
            
        }

        query.items.forEach(function(val, key){
            val.ritase = key + 1
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

                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                        <strong>Jadwal Assign</strong>
                    </div>

                    {!_showScheduleTable ? (
                        <>
                            {_form.items.map((item, index) => (
                                <Row
                                    key={index}
                                    style={{
                                        border: "1px solid #ddd",
                                        padding: "1rem",
                                        marginBottom: "1rem",
                                        borderRadius: "4px"
                                    }}>

                                    <Col>
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <strong>
                                                {_scheduleRanges.find(s => s.value === item.scheduleAssignId)?.title || 'Jadwal tidak ditemukan'}
                                            </strong>
                                        </div>
                                    </Col>

                                    <Col>
                                        <Input
                                            withMargin
                                            title={"Ritase"}
                                            placeholder={'Masukkan Ritase'}
                                            value={item.ritase}
                                            onChange={(value) => {
                                                _updateScheduleItem(index, "ritase", value)
                                            }}
                                        />
                                    </Col>

                                    <Col>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                            {_form.items.length > 1 && (
                                                <Button
                                                    title={'Remove'}
                                                    styles={Button.danger}
                                                    onClick={() => _removeScheduleItem(index)}
                                                />
                                            )}
                                        </div>
                                    </Col>

                                </Row>
                            ))}

                            <div style={{ marginBottom: "1rem" }}>
                                <Button
                                    title={'Pilih Jadwal'}
                                    styles={Button.primary}
                                    onClick={_scheduleMaster}
                                />
                            </div>
                        </>
                    ) : (
                        <div style={{ marginBottom: "1rem" }}>
                            <Table
                                columns={[
                                    {
                                        checkbox: true,
                                        field: 'id',
                                        disabled: () => false
                                    },
                                    {
                                        title: 'Kode',
                                        field: 'code',
                                        minWidth: '150px'
                                    },
                                    {
                                        title: 'Jadwal',
                                        field: 'departureDate',
                                        minWidth: '200px'
                                    },
                                    {
                                        title: 'Trayek',
                                        field: 'trajectMasterName',
                                        minWidth: '200px'
                                    },
                                    {
                                        title: 'Ritase',
                                        field: 'id',
                                        minWidth: '100px',
                                        customCell: (value, row) => {
                                            return (
                                                <Input
                                                    withMargin
                                                    title={"Ritase"}
                                                    placeholder={'Masukkan Ritase'}
                                                    value={row.ritase}
                                                    onChange={(value) => {
                                                        // _updateScheduleItem(index, "ritase", value)
                                                    }}
                                                />
                                            )
                                        }
                                    }
                                ]}
                                records={_scheduleMasterData}
                                onSelectionChange={_handleScheduleSelection}
                                selectionDataFilter={() => true}
                            />
                            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                                <Button
                                    title={'Terapkan'}
                                    styles={Button.secondary}
                                    onClick={_applyScheduleSelection}
                                    disabled={_selectedSchedules.length === 0}
                                />
                                <Button
                                    title={'Batal'}
                                    styles={Button.danger}
                                    onClick={() => _setShowScheduleTable(false)}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: "1rem" }}>
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