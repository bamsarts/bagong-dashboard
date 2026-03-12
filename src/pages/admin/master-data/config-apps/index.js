import { useEffect, useState } from 'react'

import { objectToParams, get } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import { AiFillEdit } from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import { Row, Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import ConfigAppsModal from '../../../../components/ConfigAppsModal'
import { useRouter } from 'next/router'
import Label from '../../../../components/Label'

export default function ConfigApps(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Params',
            field: 'params',
            textAlign: 'left'
        },
        {
            title: 'Service',
            field: 'service',
            textAlign: 'left'
        },
        {
            title: 'Category',
            field: 'category',
            textAlign: 'left'
        },
        {
            title: 'Status',
            field: 'isActive',
            minWidth: '60px',
            customCell: (value, row) => {
                return (
                    <Label
                        activeIndex={true}
                        labels={[
                            {
                                "class": value ? 'primary' : "warning",
                                "title": value ? 'Aktif' : "Tidak Aktif",
                                "value": true
                            }
                        ]}
                    />
                )
            }
        },
        {
            title: '',
            field: "id",
            minWidth: '60px',
            style: { "position": "relative" },
            customCell: (value, row) => {
                return (
                    <Row>
                        <Col withPadding>
                            <Button
                                tooltip={"Ubah"}
                                icon={<AiFillEdit />}
                                small
                                onClick={() => {
                                    _setIsOpenModal(true)
                                    _setForm(row)
                                }}
                            />
                        </Col>
                    </Row>
                )
            }
        }
    ]

    const [_configAppsList, _setConfigAppsList] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_searchQuery, _setSearchQuery] = useState(router.query?.refQuery ? router.query.refQuery : '')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_form, _setForm] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: "desc"
    })

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

        if (query) {
            params.query = query
        }

        try {
            const response = await get('/masterData/service/configApps/list?' + objectToParams(params), props.authData.token)
            _setConfigAppsList(response.data)

            _setPaginationConfig({
                recordLength: response.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(response.totalFiltered / pagination.length)
            })
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    return (
        <Main>
            <ConfigAppsModal
                visible={_isOpenModal}
                closeModal={
                    () => {
                        _setIsOpenModal(false)
                        _setForm({})
                    }
                }
                data={_form}
                onSuccess={() => _getData(_page)}
                type="configApps"
            />

            <AdminLayout>
                <Card noPadding>
                    <Table
                        columns={__COLUMNS}
                        records={_configAppsList}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => {
                            _setPagination({ ..._page, length: perPage, startFrom: 0 })
                        }}
                        onPageChange={(page) => {
                            _setPagination({ ..._page, startFrom: (page - 1) * _page.length })
                        }}
                        headerContent={(
                            <Row>
                                <Col column={2}>
                                    <Input
                                        placeholder={'Cari'}
                                        value={_searchQuery}
                                        onChange={(query) => {
                                            _setSearchQuery(query)

                                            if (query.length > 1) {
                                                throttle(() => _getData(_page, query), 300)()
                                            } else {
                                                _getData(_page, query)
                                            }
                                        }}
                                    />
                                </Col>

                                <Col column={2} withPadding>
                                    <Button
                                        title={'Tambah Config Apps'}
                                        styles={Button.secondary}
                                        onClick={() => _setIsOpenModal(true)}
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