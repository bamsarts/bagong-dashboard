import { useEffect, useState, useContext } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignTask.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import DatePicker from 'react-datepicker'
import { dateFilter } from '../../utils/filters'
import { Col } from '../Layout'
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
    const [_crewRanges, _setCrewRanges] = useState([])
    const [_scheduleRanges, _setScheduleRanges] = useState([])
    const [_isComplete, _setIsComplete] = useState(false)

    const onChangeDate = (dates) => {
        _setStartDate(dates);
        _updateQuery({
            "assignDate": dateFilter.basicDate(dates).normal
        })
    };

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
        _getCrewList()
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
                    "title": val.name + " (" + val.code + ")",
                    "value": val.id,
                    "data": val
                })
            })
            _setBusRanges(busRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getCrewList() {
        const params = {
            "startFrom": 0,
            "length": 100,
            "companyId": appContext.authData.companyId
        }

        try {
            const result = await postJSON(`/masterData/crew/list`, params, appContext.authData.token)
            let crewRange = []
            result.data.forEach(function (val) {
                crewRange.push({
                    "title": val.name,
                    "value": val.id,
                    "data": val
                })
            })
            _setCrewRanges(crewRange)
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

        console.log(query)

        _setIsProcessing(true)

        try {
            const result = await postJSON('/masterData/task/assign', query, appContext.authData.token)

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
                        title: 'Assign Task',
                        closeModal: () => {
                            props.closeModal()
                            _clearForm()
                        },
                    }}
                >

                    <Col column={6} style={{ position: "relative" }}>
                        <div className={styles.mb_1}>
                            Tanggal Penugasan
                        </div>
                        <div style={{ position: "relative" }}>
                            <DatePicker
                                onChange={onChangeDate}
                                minDate={new Date()}
                                selected={_startDate}
                                inline
                            />
                        </div>
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
                        title={"Crew 1"}
                        placeholder={'Pilih Crew 1'}
                        value={_form.crew1.title}
                        suggestions={_crewRanges}
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
                        title={"Crew 2 (Optional)"}
                        placeholder={'Pilih Crew 2'}
                        value={_form.crew2.title}
                        suggestions={_crewRanges}
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
                        title={"Crew 3 (Optional)"}
                        placeholder={'Pilih Crew 3'}
                        value={_form.crew3.title}
                        suggestions={_crewRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(data) => {
                            _updateQuery({
                                "crew3_id": data.value,
                                "crew3": data
                            })
                        }}
                    />

                    <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                        <strong>Schedule Items</strong>
                    </div>

                    {_form.items.map((item, index) => (
                        <div key={index} style={{
                            border: "1px solid #ddd",
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "4px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span>Item {index + 1}</span>
                                {_form.items.length > 1 && (
                                    <Button
                                        title={'Remove'}
                                        styles={Button.danger}
                                        onClick={() => _removeScheduleItem(index)}
                                    />
                                )}
                            </div>

                            <Input
                                withMargin
                                title={"Schedule"}
                                placeholder={'Pilih Schedule'}
                                value={_scheduleRanges.find(s => s.value === item.scheduleAssignId)?.title || ''}
                                suggestions={_scheduleRanges}
                                suggestionField={'title'}
                                onSuggestionSelect={(data) => {
                                    _updateScheduleItem(index, "scheduleAssignId", data.value)
                                }}
                            />

                            <Input
                                withMargin
                                title={"Ritase"}
                                placeholder={'Masukkan Ritase'}
                                value={item.ritase}
                                onChange={(value) => {
                                    _updateScheduleItem(index, "ritase", value)
                                }}
                            />
                        </div>
                    ))}

                    <div style={{ marginBottom: "1rem" }}>
                        <Button
                            title={'+ Add Schedule Item'}
                            styles={Button.primary}
                            onClick={_addScheduleItem}
                        />
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <Button
                            disabled={_isComplete}
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