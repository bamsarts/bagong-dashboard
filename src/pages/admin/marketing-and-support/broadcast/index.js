import Table from '../../../../components/Table'
import { useEffect, useState } from 'react'
import { postJSON } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import generateClasses from '../../../../utils/generateClasses'
import MinioModal from '../../../../components/MinioModal'
// import styles from './News.module.scss'
import { AiFillEdit, AiTwotoneDelete, AiOutlineUser } from 'react-icons/ai'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import BroadcastDetailModal from '../../../../components/BroadcastDetailModal'
import BroadcastCreateModal from '../../../../components/BroadcastCreateModal'
import Tabs from '../../../../components/Tabs'
import BroadcastDepartureCreateModal from '../../../../components/BroadcastDepartureCreateModal'
import { dateFilter } from '../../../../utils/filters'

export default function Broadcast(props){

    const __COLUMNS = [
        {
            title : 'Judul Broadcast',
            field : 'title',
            textAlign: "left"
        },
        {
            title : 'Jenis',
            field : 'type'
        },
        {
            title : 'Tanggal Awal',
            field : 'start_at'
        },
        {
            title : 'Tanggal Akhir',
            field : 'end_at',
        },
        {
            title : 'Status',
            field : 'is_active',
            customCell: (value, row) => {
                return value ? 'Aktif' : 'Tidak Aktif'
            }
        },
        {
            title : 'Tereksekusi',
            field : 'is_running',
            customCell: (value, row) => {
                return value ? 'Tidak' : 'Ya'
            }
        },
        {
            title : '',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <Col
                        withPadding
                        >
                            <Button
                            icon={<AiFillEdit/>}
                            small
                            title={"Ubah"}
                            onClick={() => {
                                _setIsOpenModalCreate(true)
                                _setRowData(row)
                            }}
                            >
                            </Button>
                        </Col>
                        
                        <Col
                        withPadding
                        >
                            <Button
                            icon={<AiOutlineUser/>}
                            small
                            title={"Target Pengguna"}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setRowData(row)
                            }}
                            >
                            </Button>
                        </Col>
                        
                        {
                            row.is_active == 1 && (
                                <Col   
                                withPadding
                                >
                                    <Button
                                    styles={Button.error}
                                    icon={<AiTwotoneDelete/>}
                                    small
                                    title={"Non Aktif"}
                                    onClick={() => {
                                        _deleteBroadcast(value)
                                    }}
                                    />
                                </Col>
                            )
                        }
                        
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_DEPARTURE = [
        {
            title: "Gambar",
            field: 'banner',
            customCell: (value, row) => {
                return value ? `<img src="${value}" width="50" height="auto"/>` : ''
            }
        },
        {
            title : 'Konten',
            field : 'title',
            textAlign: "left",
            customCell: (value, row) => {
                return (
                    <div
                    style={{
                        display: "grid"
                    }}
                    >
                        <strong>{value}</strong>
                        <span>{row.body}</span>
                    </div>
                )
            }
        },
        {
            title : 'Waktu',
            field : 'details',
            textAlign: "left",
            customCell: (value, row) => {
                return value[0].action == "BEFORE" ? 'Sebelum' : "Setelah"
            }
        },
        {
            title : 'Hari',
            field : 'details',
            customCell: (value, row) => {

            
                return (
                    <div
                    style={{
                        display: "grid"
                    }}
                    >
                        {
                            value.map(function(val, key){

                                if(val.unit == "Minute"){
                                    return (
                                        <span
                                        style={{
                                            padding: ".5rem"
                                        }}
                                        >
                                            {dateFilter.minToDays(val.value).Day || ''}
                                        </span>
                                    )
                                }
                                
                            })
                        }

                    </div>
                )
            
            }
        },
        {
            title : 'Jam',
            field : 'details',
            customCell: (value, row) => {

                return (
                    <div
                    style={{
                        display: "grid"
                    }}
                    >
                        {
                            value.map(function(val, key){

                                if(val.unit == "Minute"){
                                    return (
                                        <span
                                        style={{
                                            padding: ".5rem"
                                        }}
                                        >
                                            {dateFilter.minToDays(val.value).Hour || ''}
                                        </span>
                                    )
                                }
                                
                            })
                        }

                    </div>
                )
            }
        },
        {
            title : 'Menit',
            field : 'details',
            customCell: (value, row) => {

                return (
                    <div
                    style={{
                        display: "grid"
                    }}
                    >
                        {
                            value.map(function(val, key){

                                if(val.unit == "Minute"){
                                    return (
                                        <span
                                        style={{
                                            padding: ".5rem"
                                        }}
                                        >
                                            {dateFilter.minToDays(val.value).Minute || ''}
                                        </span>
                                    )
                                }
                                
                            })
                        }

                    </div>
                )
            }
        },
        {
            title : '',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <Col
                        withPadding
                        >
                            <Button
                            icon={<AiFillEdit/>}
                            small
                            title={"Ubah"}
                            onClick={() => {
                                _setIsOpenModalDeparture(true)
                                _setDepartureRow(row)
                            }}
                            >
                            </Button>
                        </Col>

                        <Col
                        withPadding
                        >
                            <Button
                            small
                            title={"Riwayat"}
                            onClick={() => {
                                _setIsOpenModalDeparture(true)
                                _setDepartureRow(row)
                                _setIsHistory(true)
                            }}
                            >
                            </Button>
                        </Col>
                    </Row>
                )
            }
        }
    ]

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: 'desc'
    })

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_isHistory, _setIsHistory] = useState(false)
    const [_broadcastData, _setBroadcastData] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_isOpenModalCreate, _setIsOpenModalCreate] = useState(false)
    const [_isOpenModalDelete, _setIsOpenModalDelete] = useState(false)
    const [_rowData, _setRowData] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_activeIndex, _setActiveIndex] = useState("promosi")
    const [_departureBroadcastData, _setDepartureBroadcastData] = useState([])
    const [_rowDeparture, _setDepartureRow] = useState({})
    const [_isOpenModalDeparture, _setIsOpenModalDeparture] = useState(false)
    const [_isOpenModalS3, _setIsOpenModalS3] = useState(false)

    useEffect(() => {
        _getData()
    }, [])

    useEffect(() => {
        _getData()
    }, [_activeIndex])

    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) params.query = query

        try {

            let url = ""

            if(_activeIndex == "keberangkatan") url = "keberangkatan/"

            const result = await postJSON('/masterData/broadcast/'+url+'list', params, props.authData.token)
            
            if(_activeIndex == "promosi"){
                _setBroadcastData(result.data)
            }else{
                _setDepartureBroadcastData(result.data)
            }

            _setPaginationConfig({
                recordLength : result.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(result.totalFiltered / pagination.length)  
            })
            
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteBroadcast(id){
        const params = {
            "id": id
        }

        try {
            const result = await postJSON('/masterData/broadcast/delete', params, props.authData.token)

            if(result) {
                _getData()
                _setIsOpenModalDelete(false)
            }

        } catch (e) {
            popAlert({ message : e.message })
        }
    }


    return (
        <Main>

            <MinioModal
            visible={_isOpenModalS3}
            closeModal={() => {
                _setIsOpenModalS3(false)
                _setIsOpenModalCreate(true)
            }}
            />

            <ConfirmationModal
            visible={_isOpenModalDelete}
            closeModal={() => {
                _setIsOpenModalDelete(false)
            }}
            onDelete={_deleteBroadcast}
            onLoading={_isProcessing}
            />


            <BroadcastCreateModal
            visible={_isOpenModalCreate}
            closeModal={() => {
                _setIsOpenModalCreate(false)
                _setRowData({})
            }}
            data={_rowData}
            onSuccess={() => {
                _getData()
            }}
            triggerOpen={() => {
                _setIsOpenModalS3(true)
                _setIsOpenModalCreate(false)
            }}
            />

            <BroadcastDepartureCreateModal
            visible={_isOpenModalDeparture}
            closeModal={() => {
                _setIsOpenModalDeparture(false)
                _setDepartureRow({})
                _setIsHistory(false)
            }}
            data={_rowDeparture}
            onSuccess={() => {
                _getData()
            }}
            isHistory={_isHistory}
            />

            <BroadcastDetailModal
            visible={_isOpenModal}
            closeModal={() => {
                _setRowData({})
                _setIsOpenModal(false)
            }}
            rowInfo={_rowData}
            />

            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Promosi',
                        value : 'promosi',
                        onClick : () => {
                            _setActiveIndex("promosi")
                        }
                    },
                    {
                        title : 'Keberangkatan',
                        value : 'keberangkatan',
                        onClick : () => {
                            _setActiveIndex("keberangkatan")
                        }
                    },
                ]}
                />
            }
            >
                <Card
                noPadding
                >

                    <Table
                    columns={_activeIndex == "promosi" ? __COLUMNS : __COLUMNS_DEPARTURE}
                    records={_activeIndex == "promosi" ? _broadcastData : _departureBroadcastData}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
                            withPadding
                            style={
                                {
                                    "flex": "auto",
                                    "max-width": "100%"
                                }
                            }
                            >
                                <Button
                                title={'Tambah'}
                                styles={Button.secondary}
                                onClick={() => {

                                    if(_activeIndex == "promosi"){
                                        _setIsOpenModalCreate(true)
                                    }else{
                                        _setIsOpenModalDeparture(true)
                                    }
                                    
                                }}
                                small
                                />
                            </Col>           
                        </Row>
                    )}
                    >
                    </Table>
                </Card>
            </AdminLayout>
        </Main>
    )

}