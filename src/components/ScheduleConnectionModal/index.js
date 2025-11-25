import { useEffect, useState, useContext, forwardRef} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
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
import Table from '../Table'
import { BsChevronLeft, BsChevronRight, BsXLg, BsFillPencilFill, BsFillTrashFill } from 'react-icons/bs'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
    isImport: false,
    roleRange: []
}

ScheduleModal.defaultProps = defaultProps

export default function ScheduleModal(props = defaultProps){

    const CONFIG_PARAM = {
        "gaptime": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_activeFormatDate, _setActiveFormatDate] = useState(false)
    const [_startDate, _setStartDate] = useState(new Date());
    const [_endDate, _setEndDate] = useState(new Date());
    const [_isComplete, _setIsComplete] = useState(true)
    const [_scheduleData, _setScheduleData] = useState([])
    const [_scheduleDataB, _setScheduleDataB] = useState([])
    const [_selectedScheduleA, _setSelectedScheduleA] = useState({});
    const [_selectedScheduleB, _setSelectedScheduleB] = useState({});

    const __COLUMNS = [
        {
            title : 'Pilih',
            field : 'bis',
            customCell: (value, row) => {
                return (
                    <input
                    id={`option-a-${value}`}
                    type="radio"
                    name={`option-a-${value}`}
                    value={value}
                    checked={_selectedScheduleA?.bis === value}
                    onChange={() => _setSelectedScheduleA(row)}
                    />
                )
            }
        },
        {
            title : 'Bis (Kode Jadwal)',
            field : 'bis',
        },
        {
            title : 'Tanggal',
            field : 'tanggal',
        },
        {
            title : 'Jam Berangkat',
            field : 'jam',
        },
        {
            title : 'Tiba',
            field : 'durasi',
            customCell: (value, row) => {
                return dateFilter.getEstimatedTime(row.estimasi, value).substring(0, 5) + " "+ row.timezone + " ("+dateFilter.getDurationFromTimeFormat(row.durasi)+")"
            }
        }
    ]

    const __COLUMNS_ROUTE_B = [
        {
            title : 'Pilih',
            field : 'bis',
            customCell: (value, row) => {
                return (
                    <input
                    id={`option-b-${value}`}
                    type="radio"
                    name={`option-b-${value}`}
                    value={value}
                    checked={_selectedScheduleB?.bis === value}
                    onChange={() => _setSelectedScheduleB(row)}
                    />
                )
            }
        },
        {
            title : 'Bis (Kode Jadwal)',
            field : 'bis',
        },
        {
            title : 'Tanggal',
            field : 'tanggal',
        },
        {
            title : 'Jam Berangkat',
            field : 'jam',
        },
        {
            title : 'Tiba',
            field : 'durasi',
            customCell: (value, row) => {
                return dateFilter.getEstimatedTime(row.estimasi, value).substring(0, 5) + " "+ row.timezone + " ("+dateFilter.getDurationFromTimeFormat(row.durasi)+")"
            }
        }
    ]

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Rute A"}
            onClick={onClick}
            ref={ref}
            value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
            onChange={(value) => {
                
            }}
            />
        </Col>
    ));

    const CustomDatePickerRouteB = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Rute B"}
            onClick={onClick}
            ref={ref}
            value={_endDate == "" ? "" : dateFilter.getMonthDate(_endDate)}
            onChange={(value) => {
                
            }}
            />
        </Col>
    ));

    function _clearForm(){
        _setForm(CONFIG_PARAM)
        _setStartDate(new Date())
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

    async function _getScheduleDamri(){

        let query  = {
            "asal": props.data?.['Traject1.pointOrig.damri_code'],
            "tujuan": props.data?.['Traject1.pointDest.damri_code'],
            "tanggal": dateFilter.basicDate(_startDate).normal
        }

        let queryB  = {
            "asal": props.data?.['Traject2.pointOrig.damri_code'],
            "tujuan": props.data?.['Traject2.pointDest.damri_code'],
            "tanggal": dateFilter.basicDate(_endDate).normal
        }

        _setIsProcessing(true)

        try{
           
            const result = await postJSON('/masterData/get/schedule/API/Damri/list', query, appContext.authData.token)
            const resultB = await postJSON('/masterData/get/schedule/API/Damri/list', queryB, appContext.authData.token)

            if(result && resultB){
                _setScheduleData(result.data)
                _setScheduleDataB(resultB.data)
            }
            
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

    async function _submitData(){

        let query  = {}

        query = _selectedScheduleA

        for (let x in _selectedScheduleB){
            query[x+"2"] = _selectedScheduleB[x]
        }

        query.connection_traject_id = props.data?.connection_traject_id
        query.gaptime = `${_form.gaptime}`

        _setIsProcessing(true)

        try{
           
            const result = await postJSON('/masterData/connection/traject/schedule/add', query, appContext.authData.token)
            
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

    function _checkComplete(){
        let state = true

        if(_form.gaptime && _selectedScheduleA?.bis && _selectedScheduleB.bis){
            state = false
        }

        return state
    }

    // Function to increase a Date object by a given number of hours
    function increaseDateTimeByHours(date, hours) {
        if (!(date instanceof Date) || isNaN(hours)) return null;
        const newDate = new Date(date.getTime());
        newDate.setHours(newDate.getHours() + hours);
        return newDate;
    }

    // Convert duration string (e.g., "07:00:00") to hours as a float
    // Example usage:
    // let hours = durationToHours("07:00:00"); // hours = 7
    function durationToHours(durationStr) {
        if (!durationStr) return 0;
        const parts = durationStr.split(':');
        if (parts.length !== 3) return 0;
        const [hh, mm, ss] = parts.map(Number);
        return hh + (mm / 60) + (ss / 3600);
    }
   

    useEffect(() => {
        if(props.data?.name){
            _getScheduleDamri()
        }

    }, [props.data, _startDate, _endDate])

    useEffect(() => {
       
       if(_selectedScheduleA?.bis && _selectedScheduleB?.bis){
            let dateA = new Date(_selectedScheduleA?.tanggal + " " + _selectedScheduleA?.jam)
            let dateB = new Date(_selectedScheduleB?.tanggal + " " + _selectedScheduleB?.jam)
        

            let dateA2 = increaseDateTimeByHours(dateA, durationToHours(_selectedScheduleA?.durasi))

            // Get the difference in minutes between dateA2 and dateB
            let diffMs = dateB - dateA2;
            let diffMinutes = Math.round(diffMs / (1000 * 60));

            _updateQuery({
                "gaptime": diffMinutes
            })

       }
    }, [_selectedScheduleA, _selectedScheduleB])

    return (
        <Modal
        visible={props.visible}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title: 'Tentukan Tanggal',
                closeModal: () => {
                    props.closeModal()
                    // _clearForm()
                },
            }}
            >
                
                <Row
                spaceBetween
                marginBottom
                >
                    <Col
                    mobileFullWidth
                    column={1}
                    >
                        <DatePicker
                        style={{
                            width: "100%"
                        }}
                        selected={_startDate}
                        onChange={(date) => {
                            _setStartDate(date)
                            _setSelectedScheduleA({})
                        }}
                        minDate={new Date()}
                        customInput={<CustomDatePicker/>}
                        />
                    </Col>

                    <Col
                    mobileFullWidth
                    column={1}
                    >
                        <Input
                        withMargin
                        title={"Interval (Menit)"}
                        placeholder={'Masukan interval'}
                        value={_form.gaptime}
                        onChange={(value) => {
                            _updateQuery({
                                "gaptime": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    mobileFullWidth
                    column={1}
                    >
                        <DatePicker
                        style={{
                            width: "100%"
                        }}
                        selected={_endDate}
                        onChange={(date) => {
                            _setEndDate(date)
                            _setSelectedScheduleB({})
                        }}
                        minDate={new Date()}
                        customInput={<CustomDatePickerRouteB/>}
                        />
                    </Col>
                </Row>

                <Row>
                    <Col
                    withPadding
                    column={3}
                    style={{
                        display: "grid"
                    }}
                    >
                        <small>Rute A</small>

                        <span>
                            {"("+props.data?.['Traject1.pointOrig.damri_code']+"-"+props.data?.['Traject1.pointDest.damri_code'] + ") " + props.data?.['Traject1.name'] }
                        </span>

                        <Table
                        isLoading={_isProcessing}
                        style={{
                            marginTop: "1rem"
                        }}
                        exportToXls={false}
                        columns={__COLUMNS}
                        records={_scheduleData}
                        />
                    </Col>

                    <Col
                    withPadding
                    column={3}
                    style={{
                        display: "grid"
                    }}
                    >

                        <small>Rute B</small>

                        <span>
                            {"("+props.data?.['Traject2.pointOrig.damri_code']+"-"+props.data?.['Traject2.pointDest.damri_code']+") " + props.data?.['Traject2.name']}
                        </span>

                        <Table
                        isLoading={_isProcessing}
                        style={{
                            marginTop: "1rem"
                        }}
                        exportToXls={false}
                        columns={__COLUMNS_ROUTE_B}
                        records={_scheduleDataB}
                        />
                    </Col>
                </Row>


                
               
                <div
                style={{
                    marginTop: "1rem"
                }}
                >
                    <Button
                    disabled={_checkComplete()}
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