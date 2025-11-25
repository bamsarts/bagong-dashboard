import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Main, { popAlert } from '../../../../../components/Main'
import Table from '../../../../../components/Table'
import Button from '../../../../../components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Trajectlist.module.scss'
import { BsFillSignpostFill, BsThreeDotsVertical, BsFillWalletFill, BsCursorFill, BsFillTrashFill } from 'react-icons/bs'
import generateClasses from '../../../../../utils/generateClasses'
import TrajectMasterModal from '../../../../../components/TrajectMasterModal'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function TrajectList(props) {
    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title : 'Kode Trayek', rowSpan: 2},
            { title : 'Trayek', rowSpan: 2},
            { title : 'Trip Pergi', colSpan: 2},
            { title : 'Trip Pulang', colSpan: 2},
            { title : 'Segmentasi', rowSpan: 2},
            { title : '', rowSpan: 2}
        ],
        [
            { title: 'Asal'},
            { title: 'Tujuan'},
            { title: 'Asal'},
            { title: 'Tujuan'}
        ]
    ]

    const __COLUMNS = [
        {
            title : 'Kode Trayek',
            field : 'code'
        },
        {
            title : 'Trayek',
            field : 'name',
            textAlign: 'left'
        },
        {
            title : 'Trip Pergi (Asal)',
            field : 'pergiOriginName',
            textAlign: 'left'
        },
        {
            title : 'Trip Pergi (Tujuan)',
            field : 'pergiDestinationName'
        },
        {
            title : 'Trip Pulang (Asal)',
            field : 'pulangOriginName',
            textAlign: 'left'
        },
        {
            title : 'Trip Pulang (Tujuan)',
            field : 'pulangDestinationName',
            textAlign: 'left'
        },
        {
            title : 'Segmentasi',
            field : 'trajectTypeName',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            style: {"position": "relative"},
            customCell : (value, row) => {
                return (
                    <div>
                        <div
                        title={"Aksi"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setDropdown(row.id)
                        }}
                        >
                            <BsThreeDotsVertical/>
                        </div>

                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            
                            <div
                            className={styles.button_action}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setDataTraject(row)
                            }}
                            >
                                <BsFillSignpostFill/>
                                <span>Ubah Trayek</span>
                            </div>
                            
                            <div
                            style={{"color":"red"}}
                            className={styles.button_action}
                            onClick={() => {
                                _setFormDelete(row)
                            }}
                            >
                                <BsFillTrashFill/>
                                <span>Hapus Trayek</span>
                            </div>
                            
                        </div>
                    </div>                        
                )
            }
        }
    ]

    const [_intercityTrajects, _setIntercityTrajects] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_segment, _setSegment] = useState({
        title: "Semua Segmentasi",
        value: ""
    })
    const [_segmentRanges, _setSegmentRanges] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_dataTraject, _setDataTraject] = useState({})
    const [_formDelete, _setFormDelete] = useState({})

    useEffect(() => {
        _getData(_page)
        _getSegment()
    }, [])

    useEffect(() => {
        _getData(_page)
    }, [_segment])

    function _setDropdown(id){
        const parent = document.getElementsByClassName("dropdown-item "+id)
        if(parent[0].style.display == "none"){
            parent[0].style.display = "flex"
        }else{
            parent[0].style.display = "none"
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
    
    async function _getData(pagination, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) params.query = query
        if (_segment.value != "") params.trajectTypeId = _segment.value

        try {
            const intercityTrajects = await postJSON('/masterData/trayekMaster/list', params, props.authData.token)
            _setIntercityTrajects(intercityTrajects)
            _setPaginationConfig({
                recordLength : intercityTrajects.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(intercityTrajects.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteTraject(){
        _setIsProcessing(true)
        try{
            
            let query = {
                id: _formDelete.id
            }

            const result = await postJSON('/masterData/trayekmaster/delete', query, props.authData.token)
            
            popAlert({"message": "Berhasil dihapus", "type": "success"})
            _getData(_page)
            _setFormDelete({})
        } catch (e){
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getSegment() {
        const params = {
            "startFrom": 0,
            "length": 680
        }
        
        try {
            const segments = await postJSON(`/masterData/trayekType/list`, params, props.authData.token)
            let segmentRange = [];
            segments.data.forEach(function(val, key){

                if(key == 0){
                    segmentRange.push(_segment)
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

    return (
        <Main>

            <TrajectMasterModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
                _setDataTraject({})
            }}
            refresh={() => {
                _getData(_page)
                _setIsOpenModal(false)
            }}
            data={_dataTraject}
            />

            <ConfirmationModal
            visible={_formDelete?.id}
            closeModal={() => {
                _setFormDelete({})
            }}
            onDelete={_deleteTraject}
            onLoading={_isProcessing}
            />

            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    tableHeaders={__TABLE_HEADERS}
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
                    records={_intercityTrajects.data}
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
                            column={2}
                            mobileFullWidth
                            withPadding
                            >
                                <Input
                                placeholder={'Semua Segment'}
                                value={_segment.title}
                                suggestions={_segmentRanges}
                                onSuggestionSelect={segment => {
                                    _setSegment(segment)
                                }}
                                />

                            </Col>

                            <Col
                            column={1}
                            mobileFullWidth
                            withPadding
                            >
                                <Button
                                styles={Button.secondary}
                                icon={"+"}
                                title={'Tambah Trayek'}
                                onClick={() => {
                                    _setIsOpenModal(true)
                                }}
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