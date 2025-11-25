import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'

import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import Main, { popAlert } from '../../../../../components/Main'
import Table from '../../../../../components/Table'

export default function TrajectIntercity(props) {

    const __COLUMNS = [
        {
            title : 'Dari',
            field : 'orignName'
        },
        {
            title : 'Ke',
            field : 'destinationName'
        },
        {
            title : 'Kode Trayek',
            field : 'code'
        },
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
    
    async function _getData(pagination, query = _searchQuery) {
        const params = {
            ...pagination,
            companyId : props.authData.companyId
        }

        if (query) params.query = query

        try {
            const intercityTrajects = await postJSON('/masterData/trayek/akap/list', params, props.authData.token)
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

    return (
        <Main>
            <AdminLayout>
                <Card
                noPadding
                >
                    <Table
                    columns={__COLUMNS}
                    records={_intercityTrajects.data}
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
                        </Row>
                    )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )
}