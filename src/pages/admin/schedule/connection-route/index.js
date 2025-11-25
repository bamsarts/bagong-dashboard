import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'

import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import { Col, Row } from '../../../../components/Layout'
import Main, { popAlert } from '../../../../components/Main'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BsFillSignpostFill, BsThreeDotsVertical, BsFillWalletFill, BsCursorFill, BsFillTrashFill, BsEarbuds } from 'react-icons/bs'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import styles from './ConnectionRoute.module.scss'
import { dateFilter } from '../../../../utils/filters'
import ScheduleConnectionModal from '../../../../components/ScheduleConnectionModal'

export default function ConnectionRoute(props) {
    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title : 'Rute A', colSpan : 3 },
            { title : 'Interval', rowSpan : 2 },
            { title : 'Rute B', colSpan : 3 },
        ],
        [
            { title : 'Keberangkatan'},
            { title : 'Asal'},
            { title : 'Tujuan' },
            { title : 'Keberangkatan'},
            { title : 'Asal'},
            { title : 'Tujuan'},
            { title : ''}
        ]
    ]

    const __COLUMNS = [
        {
            title : 'Rute A',
            field : 'tanggal',
            customCell: (value, row) => {
                return (
                    dateFilter.getMonthDate(new Date(value)) + " " + row.jam.substring(0, 5)
                )
            }
        },
        {
            title : 'Rute A',
            field : 'nm_asal',
        },
        {
            title : '',
            field : 'nm_tujuan',
            textAlign: 'left'
        },
        {
            title : '',
            field : 'gaptime',
            textAlign: 'left',
            customCell: (value) => {
                return value + " Menit"
            }
        },
        {
            title : 'Rute A',
            field : 'tanggal2',
            customCell: (value, row) => {
                return (
                    dateFilter.getMonthDate(new Date(value)) + " " + row.jam2.substring(0, 5)
                )
            }
        },
        {
            title : '',
            field : 'nm_asal2'
        },
        {
            title : '',
            field : 'nm_tujuan2'
        },
        {
            title : '',
            field : 'id',
            customCell: (value, row) => {
                return (
                    <Button
                    small
                    onProcess={_isProcessing}
                    title={'Hapus'}
                    styles={Button.error}
                    onClick={() => {
                        _setFormTraject(row)
                        _setIsOpenModalDelete(true)
                    }}
                    />
                )
            }
        }
    ]

    const FORM = {
        "connection_traject_id": "",
        "name": ""
    }

    const [_isOpenModalDelete, _setIsOpenModalDelete] = useState(false)
    const [_trajectSchedule, _setTrajectSchedule] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formDelete, _setFormDelete] = useState("")
    const [_trajectRanges, _setTrajectRanges] = useState([])
    const [_formTraject, _setFormTraject] = useState(FORM)
    const [_isOpenModal, _setIsOpenModal] = useState(false)

    useEffect(() => {
        _getTraject()
    }, [])

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
        
        params.connection_traject_id = _formTraject.connection_traject_id

        if (query) params.query = query

        try {
            const transitTrajects = await postJSON('/masterData/connection/traject/schedule/list', params, props.authData.token)
            _setTrajectSchedule(transitTrajects.data)
            _setPaginationConfig({
                recordLength : transitTrajects.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(transitTrajects.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteTraject(){
        _setIsProcessing(true)
        try{
            
            let query = {
                id: _formDelete
            }

            const result = await postJSON('/masterData/trayek/delete', query, props.authData.token)
            
            popAlert({"message": "Berhasil dihapus", "type": "success"})
            _getData(_page)
            _setFormDelete("")
        } catch (e){
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 880,
            "orderBy": "id",
            "sortMode": "desc"
        }
        
        try {
            let traject = await postJSON(`/masterData/connection/traject/list`, params, props.authData.token)
            
            if(traject){
                traject.data.forEach(function(val, key){
                    val.name = val['Traject1.name'] + " menuju " + val['Traject2.name']
                })
            }

            _setTrajectRanges(traject.data)
        } catch (e) {
            console.log(e)
        }
    }

    async function _updateQuery(data = {}){
        _setFormTraject(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }
  
    async function _deleteTraject(){
        _setIsProcessing(true)

        let query = {
            "id": _formTraject.connection_traject_id,
            "scheduleid": _formTraject.id
        }

        try {
            await postJSON('/masterData/connection/traject/delete', query, props.authData.token)

            popAlert({ message : 'Berhasil dihapus', type : 'success' })
            _getData(_page)
            _setFormTraject(FORM)
            _setIsOpenModalDelete(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <ConfirmationModal
            visible={_isOpenModalDelete}
            closeModal={() => {
                _setFormTraject(FORM)
                _setIsOpenModalDelete(false)
            }}
            onDelete={_deleteTraject}
            onLoading={_isProcessing}
            />

            <ScheduleConnectionModal
            data={_formTraject}
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
            }}
            onSuccess={() => {
                _getData(_page)
            }}
            />

            <AdminLayout>

                <Card>
                    <Input
                    withMargin
                    title={"Rute Koneksi"}
                    placeholder={'Pilih Rute Koneksi'}
                    value={_formTraject.name}
                    suggestions={_trajectRanges}
                    suggestionField={'name'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "connection_traject_id": value.id,
                            ...value
                        })
                    }}
                    />

                    <Col
                    column={2}
                    withPadding
                    style={{"marginTop": "1rem"}}
                    >
                        <Button
                        disabled={!_formTraject?.connection_traject_id}
                        title={'Terapkan'}
                        onClick={() => {
                            _getData(_page)
                        }}
                        onProcess={_isProcessing}
                        />
                    </Col>

                </Card>
                
 
                <Card
                noPadding
                >
                    <Table
                    tableHeaders={__TABLE_HEADERS}
                    headExport={[
                        {
                            title: "Trayek A",
                            value: 'Traject1.name'
                        },
                        {
                            title: "Trayek B",
                            value: 'Traject2.name'
                        },
                        {
                            title: "Deskripsi",
                            value: 'desc'
                        },
                        {
                            title: "Trayek A Kode",
                            value: 'Traject1.code'
                        },
                        {
                            title: "Trayek B Kode",
                            value: 'Traject2.code'
                        },
                        {
                            title: "Tanggal diperbarui",
                            value: 'last_modified_at'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_trajectSchedule}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            
                            {
                                _formTraject?.name && (
                                    <Col
                                    column={1}
                                    withPadding
                                    mobileFullWidth
                                    >
                                        <Button
                                        styles={Button.secondary}
                                        title={'Tambah Jadwal'}
                                        onClick={() => {
                                            _setIsOpenModal(true)
                                        }}
                                        />
                                    </Col>
                                )
                            }

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

                        </Row>
                    )}
                    />
                </Card>
                    
               
            </AdminLayout>
        </Main>
    )
}