import { useEffect, useState, useContext } from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignTask.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { FaPray } from 'react-icons/fa'
import bank from '../../utils/bank'
import DatePicker from 'react-datepicker'
import { dateFilter, currency } from '../../utils/filters'
import { Col, Row } from '../Layout'
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
        "scheduleType": "",
        "scheduleTemplateId": "",
        "dateSelects": [],
        "assignType": "DAILY", //DAILY,PARTNER,DEFAULT
        "ritase": 0,
        "isOTA": true,
        "isApps": true,
        "isMPOS": true,
        "isCounter": true
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_activeFormatDate, _setActiveFormatDate] = useState(false)
    const [_startDate, _setStartDate] = useState(new Date());
    const [_endDate, _setEndDate] = useState(null);
    const [_dateEachSelected, _setDateEachSelected] = useState([])
    const [_startDateEach, _setStartDateEach] = useState(new Date())
    const [_tempStartDate, _setTempStartDate] = useState(null)
    const [_tempEndDate, _setTempEndDate] = useState(null)
    const [_isComplete, _setIsComplete] = useState(true)

    const onChangeDate = (dates) => {
        const [start, end] = dates;
        _setStartDate(start);
        _setEndDate(end);

    };

    function _clearForm() {
        _setForm(CONFIG_PARAM)
        _setStartDate(new Date())
        _setEndDate(null)
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _updateDateSelects(date) {
        let dates = _dateEachSelected
        let isRemove = false

        dates.forEach(function (val, key) {
            if (dateFilter.basicDate(val).normal == dateFilter.basicDate(date).normal) {
                dates.splice(key, 1)
                isRemove = true
            }
        })

        if (!isRemove) {
            dates.push(date)
        }

        _setDateEachSelected(dates)
    }

    useEffect(() => {

        if (_form.dateSelects.length > 0) {
            _setIsComplete(false)
        } else {
            _setIsComplete(true)
        }
    }, [_form.dateSelects])

    useEffect(() => {
        if (_activeFormatDate) {
            console.log(_dateEachSelected)
            console.log(_startDate)
            if (_dateEachSelected.length > 0) {
                _setIsComplete(false)
            } else {
                _setIsComplete(true)
            }
        } else {


            if (_startDate != null && _endDate != null) {
                _setIsComplete(false)
            } else {
                _setIsComplete(true)
            }
        }
    }, [_startDateEach, _startDate, _endDate])


    useEffect(() => {
        _updateQuery({
            "scheduleType": props.data?.trajectTypeCategory,
            "scheduleTemplateId": props.data?.id
        })

        if (props.visible) {
            _setActiveFormatDate(false)
            _setStartDate(new Date())
            _setEndDate(null)
            _setDateEachSelected([])
            _setStartDateEach(new Date())
        }
    }, [props.visible])

    async function _submitData() {

        let query = {
            ..._form
        }
        query.dateSelects = _activeFormatDate ? _sortDate() : _loopDate(_startDate)

        console.log(query)
       
        _setIsProcessing(true)

        try {

            const result = await postJSON('/masterData/jadwal/master/add', query, appContext.authData.token)

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
            _setStartDate(null)
            _setEndDate(null)

        } finally {
            _setIsProcessing(false)
        }
    }

    function _sortDate() {
        let normalDates = []
        let dateRange = _dateEachSelected.sort(function (a, b) {
            return a - b;
        })

        dateRange.forEach(function (val, key) {
            normalDates.push(dateFilter.basicDate(val).normal)
        })

        return normalDates
    }

    function _loopDate(startDate) {
        let state = true
        let startDateChoosed = startDate
        let dateRange = []

        // _setTempStartDate(new Date("2024-01-02"))
        // _setTempEndDate(_endDate)

        for (let i = 0; i < 360; i++) {
            if (state) {
                dateRange.push(dateFilter.basicDate(startDateChoosed).normal)
                if (startDateChoosed.getTime() == _endDate.getTime()) {
                    state = false
                } else {
                    startDateChoosed.setDate(startDateChoosed.getDate() + 1)
                }
            }
        }



        return dateRange
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
                        title: 'Tentukan Tanggal',
                        closeModal: () => {
                            props.closeModal()
                            _clearForm()
                        },
                    }}
                >

                    <div
                        className={styles.mb_1}
                    >
                        <div
                            className={styles.mb_1}
                        >
                            Format Tanggal
                        </div>

                        <Label
                            activeIndex={_activeFormatDate}
                            labels={[
                                {
                                    class: "primary",
                                    title: 'Rentang',
                                    value: false,
                                    onClick: () => {
                                        _setActiveFormatDate(false)
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Satuan',
                                    value: true,
                                    onClick: () => {
                                        _setActiveFormatDate(true)
                                    }
                                }
                            ]}
                        />

                    </div>

                    {
                        !_activeFormatDate && (
                            <Col
                                column={6}
                                style={{
                                    "position": "relative"
                                }}
                            >
                                <div
                                    className={styles.mb_1}
                                >
                                    Tanggal
                                </div>

                                <div
                                    style={{
                                        justifyContent: "space-between",
                                        display: "flex"
                                    }}
                                >
                                    {
                                        _endDate != null && (
                                            <Row
                                                style={{
                                                    width: "100%"
                                                }}
                                                spaceBetween
                                                className={styles.mb_1}
                                            >
                                                <span>{dateFilter.getFullDate(_startDate)}</span>
                                                <span>s.d</span>
                                                <span>{dateFilter.getFullDate(_endDate)}</span>
                                            </Row>
                                        )
                                    }

                                </div>

                                <div
                                    style={{
                                        "position": "relative"
                                    }}
                                >
                                    <DatePicker
                                        // selected={_startDate}
                                        onChange={onChangeDate}
                                        monthsShown={2}
                                        minDate={new Date()}
                                        startDate={_startDate}
                                        endDate={_endDate}
                                        inline
                                        selectsRange
                                    />
                                </div>

                            </Col>
                        )
                    }

                    {
                        _activeFormatDate && (
                            <Row>
                                <Col
                                    column={3}
                                >
                                    <div
                                        className={styles.mb_1}
                                    >
                                        Pilih Tanggal
                                    </div>

                                    <DatePicker
                                        selected={_startDateEach}
                                        key={new Date()}
                                        onChange={(value) => {
                                            _setStartDateEach(value)
                                            _updateDateSelects(value)
                                        }}
                                        shouldCloseOnSelect={false}
                                        minDate={new Date()}
                                        inline
                                        highlightDates={_dateEachSelected}
                                    />
                                </Col>

                                <Col
                                    column={3}
                                >
                                    <div
                                        className={styles.mb_1}
                                    >
                                        Tanggal Terpilih
                                    </div>

                                    <div
                                        style={{
                                            display: "grid"
                                        }}
                                    >
                                        {
                                            _dateEachSelected.map(function (val, key) {
                                                return (
                                                    <span
                                                        key={key}
                                                        style={{
                                                            "marginBottom": ".2rem"
                                                        }}
                                                    >
                                                        {dateFilter.getFullDate(val)}
                                                    </span>
                                                )
                                            })
                                        }
                                    </div>

                                </Col>

                            </Row>
                        )
                    }

                    <div
                        className={styles.mb_1}
                        style={{
                            marginTop: "1rem"
                        }}
                    >
                        <div
                            className={styles.mb_1}
                        >
                            Tipe Penugasan
                        </div>

                        <Label
                            activeIndex={_form.assignType}
                            labels={[
                                {
                                    class: "primary",
                                    title: 'Daily',
                                    value: "DAILY",
                                    onClick: () => {
                                        _updateQuery({ assignType: "DAILY" })
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Partner',
                                    value: "PARTNER",
                                    onClick: () => {
                                        _updateQuery({ assignType: "PARTNER" })
                                    }
                                },
                                {
                                    class: "primary",
                                    title: 'Default',
                                    value: "DEFAULT",
                                    onClick: () => {
                                        _updateQuery({ assignType: "DEFAULT" })
                                    }
                                }
                            ]}
                        />
                    </div>

                    <div
                        className={styles.mb_1}
                    >
                        <div
                            className={styles.mb_1}
                        >
                            Ritase
                        </div>
                        <Input
                            type="number"
                            value={_form.ritase}
                            onChange={(e) => _updateQuery({ ritase: parseInt(e) || 0 })}
                            placeholder="Masukkan jumlah ritase"
                        />
                    </div>

                    <div
                        className={styles.mb_1}
                    >
                        <div
                            className={styles.mb_1}
                        >
                            Channel Penjualan
                        </div>

                        <Row
                            style={{
                                gap: "1rem"
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={_form.isOTA}
                                    onChange={(e) => _updateQuery({ isOTA: e.target.checked })}
                                />
                                <span>OTA</span>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={_form.isApps}
                                    onChange={(e) => _updateQuery({ isApps: e.target.checked })}
                                />
                                <span>Apps</span>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={_form.isMPOS}
                                    onChange={(e) => _updateQuery({ isMPOS: e.target.checked })}
                                />
                                <span>MPOS</span>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer"
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={_form.isCounter}
                                    onChange={(e) => _updateQuery({ isCounter: e.target.checked })}
                                />
                                <span>Counter</span>
                            </label>
                        </Row>
                    </div>

                    <div
                        style={{
                            marginTop: "1rem"
                        }}
                    >
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