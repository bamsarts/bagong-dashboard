import { useEffect, useState } from 'react'

import { objectToParams, postJSON, get } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { Col, Row } from '../../../../../components/Layout'
import { AiFillEdit, AiFillDelete, AiOutlineFileJpg, AiTwotoneCustomerService} from 'react-icons/ai'
import styles from './BusCategory.module.scss'
import generateClasses from '../../../../../utils/generateClasses'
import BusCategoryModal from '../../../../../components/BusCategoryModal'
import ConfirmationModal from '../../../../../components/ConfirmationModal'

export default function BusCategory(props) {

    const __COLUMNS = [
        {
            title : 'Kode Kategori',
            field : 'code',
            textAlign: 'left'
        },
        {
            title : 'Kategori Bus',
            field : 'name'
        },
        {
            title : 'Kursi',
            field : 'totalSeat'
        },
        {
            title : 'Tipe',
            field : 'type'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah Kategori"}
                        className={styles.button_action}
                        onClick={() => {
                            _setBusCreate(true)
                            _setForm(row)
                            _setTypeCategoryModal("")
                        }}
                        >
                            <AiFillEdit/>
                        </div>

                        <div
                        title={"Media"}
                        className={styles.button_action}
                        onClick={() => {
                            _setBusCreate(true)
                            _setForm(row)
                            _setTypeCategoryModal("media")
                        }}
                        >
                            <AiOutlineFileJpg/>
                        </div>

                        <div
                        title={"Fasilitas"}
                        className={styles.button_action}
                        onClick={() => {
                            _setBusCreate(true)
                            _setForm(row)
                            _setTypeCategoryModal("facility")
                        }}
                        >
                            <AiTwotoneCustomerService />
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

    const [_typeCategoryModal, _setTypeCategoryModal] = useState("")
    const [_busCategories, _setBusCategories] = useState([])
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
            const busCategories = await get('/masterData/bus/kategori/list?'+objectToParams(query), props.authData.token)
            _setBusCategories(busCategories)
            _setPaginationConfig({
                recordLength : busCategories.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(busCategories.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _deleteCategory(){
        _setIsProcessing(true)

        const params = {
            ..._form
        }
       
        try {    
            const res = await postJSON('/masterData/bus/kategori/delete', params, props.authData.token, false, "DELETE")
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

            <BusCategoryModal
            type={_typeCategoryModal}
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
            onDelete={_deleteCategory}
            onLoading={_isProcessing}
            />

            <AdminLayout>
                <Card
                noPadding
                >

                    <Table
                    columns={__COLUMNS}
                    records={_busCategories.data}
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
                                title={'Tambah Bus Kategori'}
                                styles={Button.secondary}
                                onClick={() => {
                                    _setBusCreate(true)
                                    _setTypeCategoryModal("")
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