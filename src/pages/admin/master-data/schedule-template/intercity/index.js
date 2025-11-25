import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import Button from '../../../../../components/Button'
import Tabs from '../../../../../components/Tabs'
import { Col, Row } from '../../../../../components/Layout'
import throttle from '../../../../../utils/throttle'
import PointModal from '../../../../../components/PointModal'
import styles from './Intercity.module.scss'
import { AiFillEye, AiFillDelete, AiOutlinePlus } from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import Calendar from '../../../../../components/Calendar'
import ScheduleTemplateModal from '../../../../../components/ScheduleTemplateModal'

export default function Intercity(props) {

    const __COLUMNS = [
        {
            title : 'Kode Jadwal',
            field : 'code',
            textAlign: 'left'
        },
        {
            title : 'Segmentasi',
            field : 'trajectTypeName',
            textAlign: 'left'
        },
        {
            title : 'Kode Trayek',
            field : 'trajectMasterCode',
            textAlign: 'center'
        },
        {
            title : 'Trayek',
            field : 'trajectMasterName',
            textAlign: 'left'
        },
        {
            title : 'Arah Trip',
            field : 'isPergi',
            textAlign: 'center',
            customCell: (value, row) => {
                return (
                    <span
                    className={generateClasses([
                        styles.label,
                        value ? styles.primary : styles.warning
                    ])}
                    >
                        {value ? 'Pergi' : 'Pulang'}
                    </span>
                )
            }
        },
        {
            title : 'Bis',
            field : 'busCategoryCode',
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
                            _setDataSchedule(row)
                            _setIsOpenModal(true)
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

    const [_templateScheduleLists, _setTemplateScheduleLists] = useState([])
    const [_formDelete, _setFormDelete] = useState({})

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
    const [_trajectRange, _setTrajectRange] = useState([])

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
    
    useEffect(() => {
        _getTrajectMaster()
    }, [_form.segmentId])

    useEffect(() => {   
        _getData(_page)
        _getBranch()
        _getSegment()
    }, [])

    async function _getData(pagination, query = _searchQuery) {
        _setIsProcessing(true)

        const params = {
            ...pagination,
            orderBy: "id",
            sortMode: "desc"
        }

        if (query) params.query = query
        if (_form.branchId != "") params.branchId = `${_form.branchId}`
        if (_form.segmentId != "") params.trajectTypeId = `${_form.segmentId}`
        if (_form.trajectMasterId != "") params.trajectMasterId = `${_form.trajectMasterId}`

        try {
            const scheduleTemplate = await postJSON('/masterData/jadwal/template/list', params, props.authData.token)
            _setTemplateScheduleLists(scheduleTemplate)
            _setPaginationConfig({
                recordLength : scheduleTemplate.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(scheduleTemplate.totalFiltered / pagination.length)  
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
                id: `${_formDelete.id}`
            }

            const res = await postJSON(`/masterData/jadwal/template/delete`, query, props.authData.token)
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

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
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

                segmentRange.push({
                    "title": val.code,
                    "value": val.id
                })
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
                    {/* <Calendar/> */}
                    
                    <Table
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
                    isLoading={_isProcessing}
                    columns={__COLUMNS}
                    records={_templateScheduleLists.data}
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
                                icon={<AiOutlinePlus/>}
                                title={'Tambah Jadwal'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _setIsOpenModal(true)
                                }}
                                small
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