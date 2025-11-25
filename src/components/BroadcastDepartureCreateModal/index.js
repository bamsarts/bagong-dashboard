import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
// import styles from './AccessRoleModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Datepicker from '../Datepicker'
import Label from '../Label'
import { dateFilter } from '../../utils/filters'
import { TbXxx } from 'react-icons/tb'
import Table from '../Table'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
    isHistory: false
}

BroadcastDepartureCreateModal.defaultProps = defaultProps

export default function BroadcastDepartureCreateModal(props = defaultProps){
   
    const CONFIG_PARAM = {
        "type": "APPS",
        "title": "",
        "banner": "",
        "deepLink": {
            "navigationId": "transaction_history",
            "title": "",
            "url": ""
        },
        "details": [{

        }],
        "body": "",
        "Day": "",
        "Hour": "",
        "Minute": "",
        "action": "BEFORE"
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [titleModal, setTitleModal] = useState(props.data?.id ? 'Ubah Broadcast' : 'Tambah Broadcast')

    const [fields, setFields] = useState(
        [
            { 
                id: Date.now(), 
                Hour: '',
                Day: '',
                Minute: ''    
            }
        ]
    );

    const handleAddField = () => {
        setFields([...fields, { id: Date.now(), value: '' }]);
    };
    
    const handleRemoveField = (id) => {
        setFields(fields.filter((field) => field.id !== id));
    };

    const handleChange = (id, value) => {
        setFields(
            fields.map((field) => (field.id === id ? { 
                ...field, 
                ...value 
            } : field))
        );
    };

    const __COLUMNS = [
        {
            title: 'Kode Booking',
            field : 'partnet_booking_code',
            textAlign: 'left'
        },
        {
            title: 'Tanggal Kirim',
            field : 'date_send',
            textAlign: 'left',
            customCell: (value, row) => {
                return value
            }
        },
    ]

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0,
    })

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[1],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })

    const [_history, _setHistory] = useState([])

    useEffect(() => {
        if(props.data?.id){

            let time = []
            let deep_link = ""

            if(props.data?.deep_link){
                deep_link = JSON.parse(props.data?.deep_link)
            }

            if(props.data?.details.length > 0){
                props.data.details.forEach(function(val, key){
                    if(val.unit == "Minute"){
                        time.push({
                            id: val.id,
                            ...dateFilter.minToDays(val.value)
                        })
                    }                    
                })
            }

            setFields(time)

            _updateQuery({
                ...props.data,
                "deepLink": deep_link,
                "action": props.data.details[0].action
            })

            if(props.isHistory) {
                _getHistory(_page)
                setTitleModal("Riwayat")
            }else{
                setTitleModal(props.data?.id ? 'Ubah Broadcast' : 'Tambah Broadcast')
            }

        }else{
            setTitleModal(props.data?.id ? 'Ubah Broadcast' : 'Tambah Broadcast')
        }

    }, [props.data])
  
    function daysToMinutes(days) {
        return parseInt(days) * 24 * 60;
    }

    function hourToMinutes(hour) {
        return parseInt(hour) * 60;
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm(){
        _setForm(CONFIG_PARAM)
        setFields([{ 
            id: Date.now(), 
            Hour: '',
            Day: '',
            Minute: ''    
        }])
        
    }

    async function _getHistory(pagination = _page){

        let query = {
            broadcastId: props.data?.id,
            ...pagination
        }

        _setIsProcessing(true)

        try{
            
            const result = await postJSON('/masterData/broadcast/keberangkatan/detail/list', query, appContext.authData.token)
            
            if(result){
                _setHistory(result.data)

                _setPaginationConfig({
                    recordLength : result.totalFiltered,
                    recordsPerPage : pagination.length,
                    activePage : (pagination.startFrom / pagination.length) + 1,
                    totalPages : Math.ceil(result.totalFiltered / pagination.length)  
                })
            }
           
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _submitData(){
            
        
        let query  = {
            ..._form,
        }
        
        const typeUrl = props.data?.id ? "update" : "add"
        query.details = []


        fields.forEach(function(val, key){
            let item = {}
            let totalMinutes = 0

            if(typeUrl == "update") item.id = val.id

            totalMinutes += daysToMinutes(val.Day)
            totalMinutes += hourToMinutes(val.Hour)
            totalMinutes += parseInt(val.Minute)

            item.unit = "Minute"
            item.value = totalMinutes
            item.action = query.action

            query.details.push(item)
        })

        

        query.deepLink = JSON.stringify(query.deepLink)

        delete query.action
        delete query.Day
        delete query.Minute
        delete query.Hour
        delete query.deep_link
        delete query.end_at
        delete query.is_active
        delete query.is_running
        delete query.start_at

        _setIsProcessing(true)
       
        try{
            
            const result = await postJSON('/masterData/broadcast/keberangkatan/'+typeUrl, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.onSuccess()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: titleModal,
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >

                {
                    !props.isHistory && (     
                        <Row
                        withPadding
                        >
                            <Col
                            column={6}
                            >
                                
                                <Input
                                withMargin
                                title={"Judul"}
                                value={_form.title}
                                onChange={(value) => {
                                    _updateQuery({
                                        "title": value
                                    })
                                }}
                                />

                                <Input
                                multiline={3}
                                withMargin
                                title={"Body"}
                                value={_form.body}
                                onChange={(value) => {
                                    _updateQuery({
                                        "body": value
                                    })
                                }}
                                />

                                <Col
                                withPadding
                                >
                                    <span
                                    style={{
                                        marginBottom: "1rem"
                                    }}
                                    >
                                        Jadwal Keberangkatan
                                    </span>

                                    <Label
                                    activeIndex={_form.action}
                                    labels={[
                                        {
                                            class: "primary",
                                            title: 'Sebelum',
                                            value: "BEFORE",
                                            onClick : () => {
                                                _updateQuery({
                                                    "action": "BEFORE",
                                                })
                                            }
                                        },
                                        {
                                            class: "primary",
                                            title: 'Setelah',
                                            value: "AFTER",
                                            onClick : () => {
                                                _updateQuery({
                                                    "action": "AFTER",
                                                })
                                            }
                                        },
                                        
                                    ]}
                                    />
                                </Col>
                                
                                <Col
                                withPadding
                                marginBottom
                                >   
                                    <div>
                                        <span>Waktu</span>
                                        <small
                                        style={{
                                            marginLeft: "1rem",
                                            color: "red"
                                        }}
                                        >
                                            Maksimal 3 Hari
                                        </small>
                                    </div>

                                
                                    {fields.map((field, index) => (
                                        <div key={field.id}>

                                            <Row
                                            verticalEnd
                                            >
                                                <Col
                                                withPadding
                                                column={1}
                                                >
                                                    <Input
                                                    type={"number"}
                                                    value={field.Day}
                                                    onChange={(e) => {
                                                        handleChange(field.id, {
                                                            "Day": e
                                                        })
                                                    }}
                                                    title={"Hari"}
                                                    maxLength={1} 
                                                    />
                                                </Col>

                                                <Col
                                                withPadding
                                                column={1}
                                                >
                                                    <Input
                                                    type={"number"}
                                                    value={field.Hour}
                                                    onChange={(e) => {
                                                        handleChange(field.id, {
                                                            "Hour": e
                                                        })
                                                    }}
                                                    title={"Jam"} 
                                                    maxLength={2} 
                                                    />
                                                </Col>

                                                <Col
                                                withPadding
                                                column={1}
                                                >
                                                    <Input
                                                    type={"number"}
                                                    value={field.Minute}
                                                    onChange={(e) => {
                                                        handleChange(field.id, {
                                                            "Minute": e
                                                        })
                                                    }}
                                                    title={"Menit"} 
                                                    maxLength={2} 
                                                    />
                                                </Col>
                                                
                                                {
                                                    !props.data?.id && (
                                                        <Col
                                                        withPadding
                                                        column={1}
                                                        >
                                                            <Button
                                                            small
                                                            styles={Button.warning}
                                                            title="Hapus"
                                                            onClick={() => handleRemoveField(field.id)}
                                                            disabled={fields.length === 1}
                                                            />
                                                            
                                                        </Col>
                                                    )
                                                }
                                            
                                            </Row>
                                        </div>
                                    ))}
                                    
                                    {
                                        !props.data?.id && (
                                            <Col
                                            withPadding
                                            >
                                                <Button
                                                small 
                                                title="Tambah" 
                                                onClick={handleAddField}
                                                />
                                            </Col>
                                        )
                                    }
                                    
                                    
                            
                                </Col>

                                <Col
                                withPadding
                                >
                                    <Button
                                    title={'Simpan'}
                                    styles={Button.secondary}
                                    onClick={_submitData}
                                    onProcess={_isProcessing}
                                    />
                                </Col>
                            
                            </Col>
                                
                        </Row>
                    )
                }

                {
                    props.isHistory && (
                        <Table
                        columns={__COLUMNS}
                        records={_history}
                        noPadding
                        config={_paginationConfig}
                        defaultLength={50}
                        onRecordsPerPageChange={perPage => _setPagination({..._page, length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                        isLoading={_isProcessing}
                        />
                    )
                }
               
            </ModalContent>
            
        </Modal>
    )
}