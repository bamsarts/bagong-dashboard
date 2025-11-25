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
import styles from '../intercity/Intercity.module.scss'
import { AiFillEye, AiFillDelete, AiOutlinePlus, AiOutlineClose } from 'react-icons/ai'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import Link from 'next/link'
import ScheduleAirportModal from '../../../../components/ScheduleAirportModal'
import { dateFilter } from '../../../../utils/filters'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import CustomDatepicker from '../../../../components/CustomDatepicker'

export default function ScheduleAirport(props) {

    const __COLUMNS = [
        {
            title : 'Trayek',
            field : 'trajectCode',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                    <>
                        <p>{value}</p>
                        <p>{row.trajectName}</p>
                    </>
                )
            }
        },
        {
            title : 'Waktu Berangkat',
            field : 'startTime',
            textAlign: 'left',
            customCell: (value, row) => {
                return value + " - " + row.endTime + " "+ (row?.departureTimeZone ? row.departureTimeZone : "")
            }
        },
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'center',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title : 'Platform',
            field : 'assignFor',
            textAlign: 'left'
        },
        {
            title : 'Bus',
            field : 'busCategoryName',
            textAlign: 'left',
        },
        {
            title : 'Catatan',
            field : 'note',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                    <>
                        <p>{value}</p>
                        <i
                        style={{
                            color: "gray"
                        }}
                        >
                            {row.enNote}
                        </i>
                    </>
                )
            }
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {

                if(row.assignFor != "MPOS"){
                    return (
                        <Row>
                            <div
                            title={"Ubah"}
                            className={styles.button_action}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setScheduleItem(row)
                            }}
                            >
                                <AiFillEye/>
                            </div>
                        </Row>
                    )
                }
               
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
    }, [])


    async function _getData(pagination = _page, query = _searchQuery) {
        _setIsProcessing(true)
        const params = {
            ...pagination,
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
            const schedule = await postJSON('/masterData/jadwal/master/commuter/list', params, props.authData.token)
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
            <ScheduleAirportModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
                _setScheduleItem({})
            }}
            data={_scheduleItem}
            onSuccess={() => {
                _setIsOpenModal(false)
                _getData(_page)
            }}
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
                               
                                <Button
                                onClick={() => {
                                    _setIsOpenModal(true)
                                }}
                                title={"Tambah Jadwal"}
                                className={styles.button}
                                />  
                                    
                            </Col>
                        </Row>
                    )}
                    />
                </Card>

            </AdminLayout>
        </Main>
    )

}