import { useEffect, useState } from 'react'

import { objectToParams, postJSON, get } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import { AiFillEdit, AiOutlineEllipsis, AiOutlineClose } from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import { Row, Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import ThemeModal from '../../../../components/ThemeModal'
import { dateFilter, currency } from '../../../../utils/filters'
import { useRouter } from 'next/router'
import Label from '../../../../components/Label'

export default function Theme(props) {

    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Tema',
            field: 'tema',
            textAlign: 'left',
            customCell: (value, row) => {

                const isValidUrl = (string) => {
                    try {
                        new URL(string)
                        return true
                    } catch (_) {
                        return false
                    }
                }

                return (
                    <>
                        <span
                        style={{
                            marginBottom: "1rem"
                        }}
                        >
                            {value}
                        </span>
                        <Label
                            activeIndex={true}
                            labels={[
                                {
                                    "class": isValidUrl(row.mainLogo) ? 'primary' : "warning",
                                    "title": isValidUrl(row.mainLogo) ? 'Homescreeen' : "Promo",
                                    "value": true
                                }
                            ]}
                        />
                    </>
                )
            }
        },
        {
            title: 'Logo Homescreen/Promo',
            field: 'mainLogo',
            textAlign: 'left',
            customCell: (value, row) => {
                const isValidUrl = (string) => {
                    try {
                        new URL(string)
                        return true
                    } catch (_) {
                        return false
                    }
                }

                const imageResult = isValidUrl(value) ? value : row.promo_logo

                return (
                    <img
                        src={imageResult}
                        width={"100"}
                        height={"auto"}
                    />
                )
            }
        },
        {
            title: 'Background Homescreen/Promo',
            field: 'mainScreen',
            textAlign: 'left',
            customCell: (value, row) => {

                 const isValidUrl = (string) => {
                    try {
                        new URL(string)
                        return true
                    } catch (_) {
                        return false
                    }
                }

                const imageResult = isValidUrl(value) ? value : row.promo_banner

                return (
                    <img
                        src={imageResult}
                        width={"100"}
                        height={"auto"}
                    />
                )
            }
        },
        {
            title: 'Mulai Periode',
            field: 'startDate',
        },
        {
            title: 'Akhir Periode',
            field: 'endDate',
            minWidth: '60px'
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
            title: 'Tanggal Diperbarui',
            field: 'updatedAt',
            minWidth: '60px',
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value)) + value.split(" ")[1]
            }
        },
        {
            title: '',
            field: "id",
            minWidth: '60px',
            style: { "position": "relative" },
            customCell: (value, row) => {
                return (
                    <Button
                        tooltip={"Ubah"}
                        icon={<AiFillEdit />}
                        small
                        onClick={() => {
                            _setIsOpenModal(true)
                            _setForm(row)
                        }}
                    />
                )
            }
        }
    ]

    const [_themeLists, _setThemeLists] = useState([])

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_searchQuery, _setSearchQuery] = useState(router.query?.refQuery ? router.query.refQuery : '')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_form, _setForm] = useState({})

    if (router.query?.refPage && _searchQuery == "") {
        refPage = router.query?.refPage
    }

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
            const result = await get('/masterData/tematik/apps/list?'+objectToParams(params), props.authData.token)

            _setThemeLists(result.data)

            _setPaginationConfig({
                recordLength: result.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(result.totalFiltered / pagination.length)
            })

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    return (
        <Main>

            <ThemeModal
                visible={_isOpenModal}
                closeModal={
                    () => {
                        _setIsOpenModal(false)
                        _setForm({})
                    }
                }
                onSuccess={() => _getData()}
                data={_form}
            />

            <AdminLayout>

                <Card
                    noPadding
                >
                    <Table
                        columns={__COLUMNS}
                        records={_themeLists}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0, ..._page })}
                        onPageChange={(page) => {
                            _setPagination({ ..._page, startFrom: (page - 1) * _page.length })
                        }}
                        headerContent={(
                            <Row>
                                <Col
                                    column={2}
                                >
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

                                            _setPage(_page)

                                        }}
                                    />
                                </Col>

                                <Col
                                    column={2}
                                    withPadding
                                >
                                    <Button
                                        title={'Tambah Tema'}
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