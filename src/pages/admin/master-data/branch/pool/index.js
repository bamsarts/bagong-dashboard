import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Button from '../../../../../components/Button'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import { Col, Row } from '../../../../../components/Layout'
import PoolModal from '../../../../../components/PoolModal'
import Label from '../../../../../components/Label'
import { dateFilter } from '../../../../../utils/filters'
import styles from './Pool.module.scss'
import { AiFillEye } from 'react-icons/ai'

export default function Pool(props) {

    const __COLUMNS = [
        {
            title : 'Name',
            field : 'name'
        },
        {
            title : 'Branch',
            field : 'branchName'
        },
        {
            title : 'Aksi',
            field : "id",
            customCell : (value, row) => {
                return (
                    <div
                    title={"Lihat"}
                    className={styles.button_action}
                    onClick={() => {
                        _setForm(row)
                        _setIsOpenModal(true)
                    }}
                    >
                        <AiFillEye/>
                    </div>
                )
            }
        }
    ]

    const [_pools, _setPools] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
    })
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_form, _setForm] = useState({})

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
            const pools = await postJSON('/masterData/branch/pool/list', params, props.authData.token)
            _setPools(pools)
            _setPaginationConfig({
                recordLength : pools.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(pools.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Main>
            <PoolModal
            visible={_isOpenModal}
            closeModal={
                () => {
                    _setIsOpenModal(false)
                    _setForm({})
                }
            }
            data={_form}
            onSuccess={_getData}
            />
            
            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    headExport={[
                        {
                            title: "Nama",
                            value: 'name'
                        },
                        {
                            title: "Cabang",
                            value: 'branchName'
                        }
                    ]}
                    columns={__COLUMNS}
                    records={_pools.data}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                    headerContent={(
                        <Row>
                            <Col
                            column={2}
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
                            withPadding
                            >
                                <Row
                                >
                                    <Button
                                    title={'Tambah Pool'}
                                    styles={Button.secondary}
                                    onClick={() => {
                                        _setIsOpenModal(true)
                                    }}
                                    small
                                    />

                                </Row>
                                
                            </Col>
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}