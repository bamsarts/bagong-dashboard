import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'
import { AiFillEdit, AiFillDelete } from 'react-icons/ai'
import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import { Row, Col } from '../../../../../components/Layout'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import BusListModal from '../../../../../components/BusListModal'
import styles from './Buslist.module.scss'
import generateClasses from '../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function BusList(props) {

    const __COLUMNS = [
        {
            title : 'Kode Bus',
            field : 'code'
        },
        {
            title : 'Nama Bus',
            field : 'name'
        },
        {
            title : 'Nomor Plat',
            field : 'registrationPlate'
        },
        {
            title : 'Tipe Bus',
            field : 'busCategoryType'
        },
        {
            title : 'Kursi',
            field : 'busCategoryTotalSeat'
        },
        {
            title : 'pool',
            field : 'poolName'
        },
        {
            title : 'Inap',
            field : 'poolInapName'
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
                            _setBusCreate(true)
                            _setForm(row)
                        }}
                        >
                            <AiFillEdit/>
                        </div>

                        <div
                        title={"Hapus"}
                        className={generateClasses([
                            styles.button_action,
                            styles.text_red
                        ])}
                        onClick={() => {
                            _setBusDelete(true)
                            _setForm({
                                "id": value
                            })
                        }}
                        >
                            <AiFillDelete/>
                        </div>
                    </Row>
                )
            }
        }
    ]

    const [_busLists, _setBusLists] = useState([])
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
    const [_busCreate, _setBusCreate] = useState(false)
    const [_busDelete, _setBusDelete] = useState(false)
    const [_form, _setForm] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        _getData(_page)
    }, [])

    function _toggleModal(data){
        _setBusCreate(data)
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
    
    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) params.query = query

        try {
            const busLists = await postJSON('/masterData/bus/list', params, props.authData.token)
            _setBusLists(busLists)
            _setPaginationConfig({
                recordLength : busLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(busLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteBus(){
        _setIsProcessing(true)
       
        try {    
            const res = await postJSON('/masterData/bus/delete', _form, props.authData.token)
            _getData()
            _setBusDelete(false)
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }
    
    return (
        <Main>
            <BusListModal
            visible={_busCreate}
            closeModal={
                () => {
                    _setBusCreate(false)
                    _setForm({})
                }
            }
            data={_form}
            refresh={() => _getData()}
            />

            <ConfirmationModal
            visible={_busDelete}
            closeModal={() => {
                _setBusDelete(false)
            }}
            onDelete={_deleteBus}
            onLoading={_isProcessing}
            />

            <AdminLayout>

                <Card
                noPadding
                >

                    <Table
                    columns={__COLUMNS}
                    records={_busLists.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
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
                            withPadding
                            >
                                <Button
                                title={'Tambah Bus'}
                                styles={Button.secondary}
                                onClick={() => _toggleModal(true)}
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