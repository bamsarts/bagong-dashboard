import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from '../ScheduleModal/ScheduleModal.module.scss'
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

ScheduleAirportModal.defaultProps = defaultProps

export default function ScheduleAirportModal(props = defaultProps){
    const appContext = useContext(AppContext)

    const CONFIG_PARAM = {
        "scheduleType": "",
        "scheduleTemplateId": "",
        "dateSelects": [],
        "date": null,
        "trip": "1",
        "assign_type": "DEFAULT",
        "departure_time": "",
        "company_id": appContext.authData.companyId,
        "traject_id": 5,
        "traject_time_table_id": null,
        "note": "",
        "en_note": "",
        "assign_for": "DAMRI_APPS",
        "departure_time_zone": "WIB",
        "time_table": null,
        "start_time": "",
        "end_time": "",
        "bus_category_id": 4,
        "bus_id": null,
        "traject_name": "",
        "bus_category_name": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_activeFormatDate, _setActiveFormatDate] = useState(false)
    const [_startDate, _setStartDate] = useState(new Date());
    const [_endDate, _setEndDate] = useState(null);
    const [_dateEachSelected, _setDateEachSelected] = useState([])
    const [_startDateEach, _setStartDateEach] = useState(new Date())
    const [_tempStartDate, _setTempStartDate] = useState(null)
    const [_tempEndDate, _setTempEndDate] = useState(null)
    const [_isComplete, _setIsComplete] = useState(true)
    const [_trajectRange, _setTrajectRange] = useState([])
    const [_busCategoryRange, _setBusCategoryRange] = useState([])

    const onChangeDate = (dates) => {
        const [start, end] = dates;
        _setStartDate(start);
        _setEndDate(end);
        
    };

    function _clearForm(){
        _setForm(CONFIG_PARAM)
        _setStartDate(new Date())
        _setEndDate(null)
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _updateDateSelects(date){
        let dates = _dateEachSelected
        let isRemove = false

        dates.forEach(function(val, key){
            if(dateFilter.basicDate(val).normal == dateFilter.basicDate(date).normal){
                dates.splice(key, 1)
                isRemove = true
            }
        })

        if(!isRemove){
            dates.push(date)
        }
    
        _setDateEachSelected(dates)
    }

    useEffect(() => {
       
       if(_form.dateSelects.length > 0){
           _setIsComplete(false)
       }else{
            _setIsComplete(true)
       }
    }, [_form.dateSelects])

    useEffect(() => {
        if(_activeFormatDate){
            console.log(_dateEachSelected)
            console.log(_startDate)
            if(_dateEachSelected.length > 0){
                _setIsComplete(false)
            }else{
                _setIsComplete(true)
            }
        }else{
           

            if(_startDate != null && _endDate != null){
                _setIsComplete(false)
            }else{
                _setIsComplete(true)
            }
        }
    }, [_startDateEach, _startDate, _endDate])


    function camelToUnderscore(key) {
        var result = key.replace( /([A-Z])/g, " $1" );
        return result.split(' ').join('_').toLowerCase();
    }

    useEffect(() => {
        if(props.visible){
            _setActiveFormatDate(false)
            _setStartDate(new Date())
            _setEndDate(null)
            _setDateEachSelected([])
            _setStartDateEach(new Date())

            let convert = {}

            for (let x in props.data){
                let key = camelToUnderscore(x)
                let value = props.data[x]

                if(key == "start_time" || key == "end_time" || key == "departure_time"){
                    value = value ? value.substring(0, value.length - 3) : ""
                }

                convert[camelToUnderscore(x)] = value ? `${value}` : value
            }

            _updateQuery({
                ...convert
            })
        }
    }, [props.visible])

    useEffect(() => {
        _getTraject()
        _getBusCategory()
    }, [])

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 760,
            "companyId": appContext.authData.companyId,
            "categoryName": "COMMUTER"
        }
        
        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, appContext.authData.token)
            _setTrajectRange(traject.data)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getBusCategory() {
        const params = {
            "startFrom": 0,
            "length": 760,
        }
        
        try {
            const busCategory = await postJSON(`/masterData/bus/kategori/list`, params, appContext.authData.token)
            _setBusCategoryRange(busCategory.data)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData(){

        let url = "add"

        let query  = {
            ..._form
        }

        if(props.data?.id) url = "update"

        delete query.scheduleType
        delete query.scheduleTemplateId
        delete query.dateSelects
        delete query.traject_name
        delete query.bus_category_name
        delete query.branch_id 
        delete query.branch_name
        delete query.bus_category_code
        delete query.traject_code

        query.start_time = query.start_time+":00"
        query.end_time = query.end_time+":00"

        if(query.departure_time != ""){
            query.departure_time = query.departure_time+":00"
        } else {
            query.departure_time = null
        }

        query.bus_id = query.bus_id == null ? null : `${query.bus_id}`
        
        _setIsProcessing(true)

        try{
           
            const result = await postJSON('/masterData/jadwal/master/commuter/'+ url , query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.onSuccess()
        } catch(e){
            let errMessage = ""
            if(e.message?.details){
                errMessage = e.message.details[0].message
            }else{
                errMessage = e.message
            }
            popAlert({ message : errMessage })  
            
           
        } finally{
            _setIsProcessing(false)
        }
    }

    function _sortDate(){
        let normalDates = []
        let dateRange = _dateEachSelected.sort(function(a, b){
            return a - b;
        })

        dateRange.forEach(function(val, key){
            normalDates.push(dateFilter.basicDate(val).normal)
        })

        return normalDates
    }

    function _loopDate(startDate){
        let state = true
        let startDateChoosed = startDate
        let dateRange = []

        // _setTempStartDate(new Date("2024-01-02"))
        // _setTempEndDate(_endDate)
        
        for(let i = 0; i < 360; i++){
            if(state){
                dateRange.push(dateFilter.basicDate(startDateChoosed).normal)
                if(startDateChoosed.getTime() == _endDate.getTime()){
                    state = false
                }else{
                    startDateChoosed.setDate(startDateChoosed.getDate() + 1)
                }
            }
        }

        
        
        return dateRange
    }

    return (
        <Modal
        large
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: (props.data?.id ? "Ubah" : "Tambah") + " Jadwal",
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
                        Platform   
                    </div>
                    
                    <Label
                    activeIndex={_form.assign_for}
                    labels={[
                        {
                            class: "primary",
                            title: 'DAMRI Apps',
                            value: "DAMRI_APPS",
                            onClick : () => {
                                _updateQuery({
                                    "assign_for": "DAMRI_APPS"
                                })
                            }
                        },
                        {
                            class: "primary",
                            title: 'MPOS',
                            value: "MPOS",
                            onClick : () => {
                                _updateQuery({
                                    "assign_for": "MPOS"
                                })
                            }
                        }
                    ]}
                    />
                
                </div>
                
                <Col
                withPadding
                >
                    <Input
                    title={'Trayek'}
                    placeholder={'Pilih Trayek'}
                    value={_form.traject_name}
                    suggestions={_trajectRange}
                    suggestionField={"name"}
                    onSuggestionSelect={data => {
                    _updateQuery({
                            "traject_name": data.name,
                            "traject_id": data.id
                    })
                    }}
                    />
                </Col>
                

                <Col
                withPadding
                >
                    <Input
                    title={'Jenis Bis'}
                    placeholder={'Pilih jenis bis'}
                    value={_form.bus_category_name}
                    suggestions={_busCategoryRange}
                    suggestionField={"code"}
                    onSuggestionSelect={data => {
                    _updateQuery({
                            "bus_category_name": data.code,
                            "bus_category_id": `${data.id}`
                    })
                    }}
                    />
                </Col>
              
                
                <Row>
                    <Col>
                        <Input
                        maxlength={5}
                        withMargin
                        title={"Jam Berangkat"}
                        placeholder={'HH:MM'}
                        value={_form.departure_time}
                        onChange={(value) => {
                            _updateQuery({
                                "departure_time": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    >
                        <Input
                        maxlength={5}
                        withMargin
                        title={"Jam Mulai"}
                        placeholder={'HH:MM'}
                        value={_form.start_time}
                        onChange={(value) => {
                            _updateQuery({
                                "start_time": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    >
                        <Input
                        maxlength={5}
                        withMargin
                        title={"Jam Akhir"}
                        placeholder={'HH:MM'}
                        value={_form.end_time}
                        onChange={(value) => {
                            _updateQuery({
                                "end_time": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    style={{
                        padding: "2rem 0rem 0rem 0rem"
                    }}
                    >
                        
                        <Label
                        activeIndex={_form.departure_time_zone}
                        labels={[
                            {
                                class: "primary",
                                title: 'WIB',
                                value: "WIB",
                                onClick : () => {
                                    _updateQuery({
                                        "departure_time_zone": "WIB"
                                    })
                                }
                            },
                            {
                                class: "primary",
                                title: 'WITA',
                                value: "WITA",
                                onClick : () => {
                                    _updateQuery({
                                        "departure_time_zone": "WITA"
                                    })
                                }
                            },
                            {
                                class: "primary",
                                title: 'WIT',
                                value: "WIT",
                                onClick : () => {
                                    _updateQuery({
                                        "departure_time_zone": "WIT"
                                    })
                                }
                            }
                        ]}
                        />
                
                    </Col>
                </Row>
                
                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        multiline={2}
                        withMargin
                        title={"Catatan"}
                        placeholder={'ID'}
                        value={_form.note}
                        onChange={(value) => {
                            _updateQuery({
                                "note": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={3}
                    >
                        <Input
                        multiline={2}
                        withMargin
                        title={"Note"}
                        placeholder={'EN'}
                        value={_form.en_note}
                        onChange={(value) => {
                            _updateQuery({
                                "en_note": value
                            })
                        }}
                        />
                    </Col>
                </Row>
                    
                {/* <div
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
                            onClick : () => {
                                _setActiveFormatDate(false)
                            }
                        },
                        {
                            class: "primary",
                            title: 'Satuan',
                            value: true,
                            onClick : () => {
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
                                        _dateEachSelected.map(function(val, key){
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
                } */}
                
                <div
                style={{
                    marginTop: "1rem"
                }}
                >
                    <Button
                    // disabled={_isComplete}
                    title={'Simpan'}
                    styles={Button.secondary}
                    onClick={_submitData}
                    onProcess={_isProcessing}
                    />
                </div>
                

            </ModalContent>
            
        </Modal>
    )
}