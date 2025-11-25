import { useEffect, useState, forwardRef } from 'react'
import { postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import Tabs from '../../../../components/Tabs'
import { Col, Row } from '../../../../components/Layout'
import throttle from '../../../../utils/throttle'
import PointModal from '../../../../components/PointModal'
import styles from './Intercity.module.scss'
import { AiFillEye, AiFillDelete, AiOutlinePlus, AiOutlineClose } from 'react-icons/ai'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import ScheduleTemplateModal from '../../../../components/ScheduleTemplateModal'
import Link from 'next/link'
import ScheduleLmbModal from '../../../../components/ScheduleLmbModal'
import { dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import CustomDatepicker from '../../../../components/CustomDatepicker'

export default function ScheduleIntercity(props) {

    const __COLUMNS = [
        {
            title : 'Tanggal',
            field : 'departureDate',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                    dateFilter.getMonthDate(new Date(value))
                )
            }
        },
        {
            title : 'Kode Trayek',
            field : 'trajectMasterCode',
            textAlign: 'center'
        },
        {
            title : 'Arah Trip',
            field : 'direction',
            textAlign: 'center',
            customCell: (value, row) => {
                return (
                    <span
                    className={generateClasses([
                        styles.label,
                        value == "PERGI" ? styles.primary : styles.warning
                    ])}
                    >
                        {value}
                    </span>
                )
            }
        },
        {
            title : 'Segmentasi',
            field : 'trajectTypeName',
            textAlign: 'left'
        },
        {
            title : 'Kode Jadwal',
            field : 'code',
            textAlign: 'left'
        },
        {
            title : 'Pengemudi 1',
            field : 'busCrew1Name',
            textAlign: 'left'
        },
        {
            title : 'Pengemudi 2',
            field : 'busCrew2Name',
            textAlign: 'left'
        },
        {
            title : 'LMB',
            field : 'lmbCode',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah"}
                        className={styles.button_action}
                        onClick={() => {
                            console.log(row)
                            _setScheduleItem(row)
                        }}
                        >
                            <AiFillEye/>
                        </div>

                        <div
                        title={"Hapus"}
                        className={generateClasses([
                            styles.button_action,
                            styles.text_red
                        ])}
                        onClick={() => {
                            _setFormDelete(row)
                        }}
                        >
                            <AiFillDelete/>
                        </div>
                    </Row>
                )
            }
        }
    ]

    const [_scheduleLists, _setScheduleLists] = useState([])
    const [_formDelete, _setFormDelete] = useState({})
    const [_scheduleItem, _setScheduleItem] = useState({})

    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })

    const [_activeIndex, _setActiveIndex] = useState(0)
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_typeModal, _setTypeModal] = useState('')
    const [_dataSchedule, _setDataSchedule] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([]);
    const [_urlAddSchedule, _setUrlAddSchedule] = useState("")
    const [_trajectRange, _setTrajectRange] = useState([])
    const [_startDate, _setStartDate] = useState("")
    const [_endDate, _setEndDate] = useState("")

    const CONFIG_PARAM = {
        "name": "",
        "branchId": "",
        "branchName": "Semua Cabang",
        "segmentId": "",
        "segmentName": "Semua Segmentasi",
        "trajectMasterId": "",
        "trajectMasterName": "Semua Trayek"
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)

    const CustomDatePicker = forwardRef(({ value, onClick }, ref) => (
        <Col
        justifyCenter
        >
            <Input
            withMargin
            title={"Tanggal Awal"}
            onClick={onClick}
            ref={ref}
            value={_startDate == "" ? "" : dateFilter.getMonthDate(_startDate)}
            onChange={(value) => {
              
            }}
            />

            {
                _startDate != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _setStartDate("")
                        _setEndDate("")
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    const DatepickerEndDate = forwardRef(({ value, onClick }, ref) => (
        <Col>
            <Input
            withMargin
            title={"Tanggal Akhir"}
            onClick={onClick}
            ref={ref}
            value={_endDate == "" ? "" : dateFilter.getMonthDate(_endDate)}
            onChange={(value) => {
            }}
            />

            {
                _endDate != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        _setStartDate("")
                        _setEndDate("")
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    useEffect(() => {   
        _getData(_page)
        _getBranch()
        _getSegment()

        if(typeof window !== 'undefined'){
            _setUrlAddSchedule(window.location.href+"/addSchedule")
        }
    }, [])

    useEffect(() => {
        if(_form.segmentId != ""){
            _getTrajectMaster()           
        }
    }, [_form.segmentId])

    async function _getData(pagination = _page, query = _searchQuery) {
        _setIsProcessing(true)
        const params = {
            ...pagination,
            scheduleType: 'INTERCITY',
            orderBy: "id",
            sortMode: "desc",
        }

        if (query) params.query = query
        if (_form.branchId != "") params.branchId = `${_form.branchId}`
        if (_form.segmentId != "") params.trajectTypeId = `${_form.segmentId}`
        if (_form.trajectMasterId != "") params.trajectMasterId = `${_form.trajectMasterId}`
        if (_startDate != "") params.startDate = dateFilter.basicDate(_startDate).normal
        if (_endDate != "") params.endDate = dateFilter.basicDate(_endDate).normal
        
        try {
            const schedule = await postJSON('/masterData/jadwal/master/list', params, props.authData.token)
            _setScheduleLists(schedule)
            _setPaginationConfig({
                recordLength : schedule.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(schedule.totalFiltered / pagination.length)  
            })
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }
    
    function _toggleModal(data){
        _setLocationCreate(data)
    }

    async function _deleteSchedule(){
        _setIsProcessing(true)
       
        try {  
            
            const query = {
                "scheduleType": _formDelete.trajectTypeCategory,
                "id": _formDelete.id
            }
            const res = await postJSON(`/masterData/jadwal/master/delete`, query, props.authData.token)
            _getData(_page)
            _setFormDelete({})
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const branch = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let branchRange = [];
            branch.data.forEach(function(val, key){

                if(key == 0){
                    branchRange.push({
                        "title": "Semua Cabang",
                        "value": ""
                    })
                }

                branchRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setBranchRanges(branchRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getSegment() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const segments = await postJSON(`/masterData/trayekType/list`, params, props.authData.token)
            let segmentRange = [];
            segments.data.forEach(function(val, key){

                if(key == 0){
                    segmentRange.push({
                        "title": "Semua Segmentasi",
                        "value": ""
                    })
                }

                // if(val.category == "INTERCITY"){
                //     segmentRange.push({
                //         "title": val.code,
                //         "value": val.id
                //     })
                // }
            })
            _setSegmentRanges(segmentRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTrajectMaster(){
        const params = {
            "startFrom": 0,
            "length": 390,
            "trajectTypeId": _form.segmentId
        }
        
        try {
            const traject = await postJSON(`/masterData/trayekMaster/list`, params, props.authData.token)
            let trajectRange = [];
            traject.data.forEach(function(val, key){

                if(key == 0){
                    trajectRange.push({
                        "title": "Semua Trayek",
                        "value": ""
                    })
                }

                trajectRange.push({
                    "title": val.name+" ("+val.code+")",
                    "value": val.id
                })
            })
            _setTrajectRange(trajectRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    return (
        <Main>
            <ScheduleTemplateModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
                _setDataSchedule({})
            }}
            data={_dataSchedule}
            onSuccess={() => {
                _setIsOpenModal(false)
                _getData(_page)
            }}
            />

            <ScheduleLmbModal  
            visible={_scheduleItem?.id}
            closeModal={() => {
                _setScheduleItem({})
            }}
            data={_scheduleItem}
            onSuccess={() => {
                _getData(_page)
                _setScheduleItem({})
            }}
            />

            <ConfirmationModal  
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deleteSchedule}
            onLoading={_isProcessing}
            />
        
            <AdminLayout>  

                <Card
                noPadding
                >
                    <Row
                    withPadding
                    >
                        <Col
                        column={1}
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_startDate}
                            onChange={(date) => {
                                _setStartDate(date)
                                _setEndDate(date)
                            }}
                            minDate={new Date()}
                            customInput={<CustomDatePicker/>}
                            />
                        </Col>

                        <Col
                        column={1}
                        >
                            <DatePicker
                            style={{
                                width: "100%"
                            }}
                            selected={_endDate}
                            onChange={(date) => _setEndDate(date)}
                            minDate={_startDate == "" ? new Date() : _startDate}
                            customInput={<DatepickerEndDate/>}
                            />

                        </Col>

                        <Col
                        column={1}
                        >
                            <Input
                            withMargin
                            title={"Cabang"}
                            placeholder={'Pilih Cabang'}
                            value={_form.branchName}
                            suggestions={_branchRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "branchId": value.value,
                                    "branchName": value.title
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        >
                            <Input
                            withMargin
                            title={"Segmentasi"}
                            placeholder={'Pilih Segmentasi'}
                            value={_form.segmentName}
                            suggestions={_segmentRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "segmentId": value.value,
                                    "segmentName": value.title
                                })
                            }}
                            />
                        </Col>

                        {
                            _form.segmentId != "" && (
                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Trayek"}
                                    placeholder={'Pilih Trayek'}
                                    value={_form.trajectMasterName}
                                    suggestions={_trajectRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "trajectMasterId": value.value,
                                            "trajectMasterName": value.title
                                        })
                                    }}
                                    />
                                </Col>
                            )
                        }
                        
                        <Col
                        column={1}
                        withPadding
                        justifyCenter
                        >
                            <Button
                            title={'Cari Jadwal'}
                            styles={Button.secondary}
                            onClick={() => {
                                _getData(_page)
                            }}
                            small
                            />
                        </Col>
                    </Row>
                </Card>

                <Card
                noPadding
                >                    
                    <Table
                    isLoading={_isProcessing}
                    headExport={[
                        {
                            title: "Kode Asal",
                            value: 'originCode'
                        },
                        {
                            title: "Asal",
                            value: 'orignName'
                        },
                        {
                            title: "Kode Tujuan",
                            value: 'destinationCode'
                        },
                        {
                            title: "Tujuan",
                            value: 'destinationName'
                        },
                        {
                            title: "Kode Trayek",
                            value: 'code'
                        },
                        {
                            title: "Trayek",
                            value: 'name'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_scheduleLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
                            mobileFullWidth
                            withPadding
                            >
                                <Input
                                placeholder={'Cari'}
                                value={_searchQuery}
                                onChange={(query) => {
                                    const pagination = {
                                        length : Table.defaultProps.recordsPerPageValues[0],
                                        startFrom : 0
                                    }
                                    _setSearchQuery(query)
                                    if (query.length > 1) {
                                        throttle(() => _getData(pagination, query), 300)()
                                    } else {
                                        _getData(pagination, query)
                                    }
                                    _setPage(pagination)
                                }}
                                />
                            </Col>

                            <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                            >
                                <Link
                                href={_urlAddSchedule}
                                >
                                    <div
                                    className={styles.button}
                                    >  
                                        <span>Tambah Jadwal</span>
                                    </div>
                                </Link>
                            </Col>
                        </Row>
                    )}
                    />
                </Card>

            </AdminLayout>
        </Main>
    )

}