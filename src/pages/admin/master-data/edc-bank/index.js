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
import EdcModal from '../../../../components/EdcModal'
import Modal, { ModalContent } from '../../../../components/Modal'
import { dateFilter, currency } from '../../../../utils/filters'
import { useRouter } from 'next/router'
import Label from '../../../../components/Label'
import Tabs from '../../../../components/Tabs'
import { BsBatteryCharging, BsBattery, BsBatteryFull, BsBatteryHalf } from 'react-icons/bs'

export default function EdcBank(props) {
    const router = useRouter()

    const __COLUMNS = [
        {
            title: 'Telepon',
            field: 'phone_number',
            textAlign: 'left'
        },
        {
            title: 'Serial Number',
            field: 'serial_number',
            textAlign: 'left'
        },
        {
            title: 'Kode Aplikasi',
            field: 'app_code',
            textAlign: 'left'
        },
        {
            title: 'Kode Merchant',
            field: 'merchant_code',
            textAlign: 'right',
            minWidth: '70px',
        },
        {
            title: 'Kode Terminal',
            field: 'terminal_code',
            minWidth: '60px'
        },
        {
            title: 'Status',
            field: 'status',
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
                        <Col
                            withPadding
                        >
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

                        {/* <Col
                        withPadding
                        >
                            <Button
                            styles={Button.error}
                            tooltip={"Hapus"}
                            icon={<AiOutlineClose />}
                            small
                            />
                        </Col> */}
                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_EDC_TAP = [
        {
            title: 'Serial Number',
            field: 'serialNumber',
            textAlign: 'left'
        },
        {
            title: 'Kode Merchant',
            field: 'merchantCode',
            textAlign: 'left'
        },
        {
            title: 'Id Terminal',
            field: 'terminalId',
            textAlign: 'left'
        },
        {
            title: 'Kode Terminal',
            field: 'terminalCode',
            minWidth: '60px'
        },
        {
            title: 'Id SAM',
            field: 'samUid',
            textAlign: 'center',
            minWidth: '70px',
        },
        {
            title: 'PIN SAM',
            field: 'samPin',
            minWidth: '60px'
        },
        {
            title: 'Referensi',
            field: 'reference',
            textAlign: 'left'
        },
        {
            title: '',
            field: "id",
            minWidth: '60px',
            style: { "position": "relative" },
            customCell: (value, row) => {

                return (
                    <Row>

                        <Col
                            withPadding
                        >
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

                        {/* <Col
                        withPadding
                        >
                            <Button
                            styles={Button.error}
                            tooltip={"Hapus"}
                            icon={<AiOutlineClose />}
                            small
                            />
                        </Col> */}

                    </Row>
                )
            }
        }
    ]

    const __COLUMNS_MONITORING = [
        {
            title: 'Serial Number',
            field: 'serial_number',
            textAlign: 'left'
        },
        {
            title: 'Jaringan',
            field: 'detail',
            textAlign: 'center',
            customCell: (value, row) => {

                let result = JSON.parse(value)

                if (result?.network_type == "wifi") {
                    return (
                        <img
                            title={"wifi"}
                            src={"/assets/icons/Intersect.svg"}
                            width={"20"}
                            height={"auto"}
                        />
                    )

                } else if (result?.network_type == "cellular") {
                    return (
                        <img
                            title={"Celullar"}
                            src={"/assets/icons/data.svg"}
                            width={"10"}
                            height={"auto"}
                        />
                    )

                } else {
                    return result?.network_type
                }

            }
        },
        {
            title: 'Kertas',
            field: 'detail',
            textAlign: 'center',
            customCell: (value, row) => {

                let result = JSON.parse(value)

                if (result?.printer_paper_ready) {
                    return (
                        <img
                            src={"/assets/icons/paper-ready.svg"}
                            width={"15"}
                            height={"auto"}
                        />
                    )

                } else if (!result?.printer_paper_ready) {
                    return (
                        <img
                            src={"/assets/icons/paper-offline.svg"}
                            width={"15"}
                            height={"auto"}
                        />
                    )

                } else {
                    return result?.printer_paper_ready
                }

            }
        },
        {
            title: 'Baterai',
            field: 'detail',
            textAlign: 'center',
            customCell: (value, row) => {

                let result = JSON.parse(value)

                if (result?.battery_level) {
                    const batteryLevel = result.battery_level
                    let BatteryIcon = BsBattery

                    if (batteryLevel >= 70) {
                        BatteryIcon = BsBatteryFull
                    } else if (batteryLevel >= 30) {
                        BatteryIcon = BsBatteryHalf
                    } else {
                        BatteryIcon = BsBattery
                    }

                    if (result?.battery_is_charging) {
                        BatteryIcon = BsBatteryCharging
                    }

                    return (
                        <Col>
                            <span>{batteryLevel}%</span>
                            <BatteryIcon />
                        </Col>
                    )
                } else {
                    return ''
                }


            }
        },
        {
            title: 'IP Address',
            field: 'detail',
            textAlign: 'center',
            customCell: (value, row) => {

                let result = JSON.parse(value)

                if (result?.ip_address) {
                    return result.ip_address
                } else {
                    return ''
                }
            }
        },
        {
            title: 'Waktu Awal',
            field: 'last_session_start',
            textAlign: 'left',
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value)) + " " + dateFilter.getTime(new Date(value))
            }
        },
        {
            title: 'Waktu Akhir',
            field: 'last_session_end',
            textAlign: 'left',
            customCell: (value, row) => {
                if (value) {
                    return dateFilter.getMonthDate(new Date(value)) + " " + dateFilter.getTime(new Date(value))
                } else {
                    return ''
                }
            }
        },
        {
            title: 'Pengguna',
            field: 'last_session_user_name',
            textAlign: 'left'
        },
        {
            title: '',
            field: 'detail',
            textAlign: 'left',
            customCell: (value, row) => {
                if (value) {
                    return (
                        <Button
                            title={"Detail"}
                            small
                            onClick={() => {
                                _setDetailData(JSON.parse(value) || row)
                                _setIsDetailModalOpen(true)
                            }}
                        />
                    )
                } else {
                    return ''
                }

            }
        },
    ]

    const [_edcBankLists, _setEdcBankLists] = useState([])
    const [_edcTapLists, _setEdcTapLists] = useState([])
    const [_edcMonitoringLists, _setEdcMonitoringLists] = useState([])

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_paginationConfigEdcTap, _setPaginationConfigEdcTap] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_paginationConfigMonitoring, _setPaginationConfigMonitoring] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_searchQuery, _setSearchQuery] = useState(router.query?.refQuery ? router.query.refQuery : '')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_activeIndex, _setActiveIndex] = useState("edcBank")
    const [_form, _setForm] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isDetailModalOpen, _setIsDetailModalOpen] = useState(false)
    const [_detailData, _setDetailData] = useState({})

    if (router.query?.refPage && _searchQuery == "") {
        refPage = router.query?.refPage
    }

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: "desc"
    })

    const [_pageEdcTap, _setPageEdcTap] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: "desc"
    })

    const [_pageMonitoring, _setPageMonitoring] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: "desc"
    })

    useEffect(() => {
        _getData(_page)
        console.log(router)
    }, [])

    useEffect(() => {
        _getData(_page)
    }, [_activeIndex])

    function _toggleModal(data) {
        _setBusCreate(data)
    }

    function _resetDropdown() {
        const parent = document.getElementsByClassName("dropdown-item")
        parent[0].style.display = "none"
    }

    function _setDropdown(id) {
        const parent = document.getElementsByClassName("dropdown-item " + id)


        if (parent[0].style.display == "none") {
            parent[0].style.display = "flex"
        } else {
            parent[0].style.display = "none"
        }
    }

    function _setPagination(pagination) {

        if (_activeIndex == "edcBank") {
            _setPage(oldData => {
                return {
                    ...oldData,
                    ...pagination
                }
            })
        } else if (_activeIndex == "edcTap") {
            _setPageEdcTap(oldData => {
                return {
                    ...oldData,
                    ...pagination
                }
            })
        } else {
            _setPageMonitoring(oldData => {
                return {
                    ...oldData,
                    ...pagination
                }
            })
        }

        _getData(pagination)
    }

    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }

        if (query) {
            params.query = query
        }

        if (_activeIndex == "monitoring") {
            params.orderBy = "device_id"
        }

        try {

            if (_activeIndex == "monitoring") {
                const monitoring = await get('/monitoring/sn/list?' + objectToParams(params), props.authData.token)
                _setEdcMonitoringLists(monitoring.data)

                _setPaginationConfigMonitoring({
                    recordLength: monitoring.totalFiltered || monitoring.data.length,
                    recordsPerPage: pagination.length,
                    activePage: (pagination.startFrom / pagination.length) + 1,
                    totalPages: Math.ceil((monitoring.totalFiltered || monitoring.data.length) / pagination.length)
                })
            } else {
                const edcBank = await postJSON('/masterData/' + _activeIndex + '/list', params, props.authData.token)

                if (_activeIndex == "edcBank") {
                    _setEdcBankLists(edcBank)

                    _setPaginationConfig({
                        recordLength: edcBank.totalFiltered,
                        recordsPerPage: pagination.length,
                        activePage: (pagination.startFrom / pagination.length) + 1,
                        totalPages: Math.ceil(edcBank.totalFiltered / pagination.length)
                    })

                } else if (_activeIndex == "edcTap") {
                    _setEdcTapLists(edcBank)

                    _setPaginationConfigEdcTap({
                        recordLength: edcBank.totalFiltered,
                        recordsPerPage: pagination.length,
                        activePage: (pagination.startFrom / pagination.length) + 1,
                        totalPages: Math.ceil(edcBank.totalFiltered / pagination.length)
                    })
                }
            }


        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _deleteBus() {
        _setIsProcessing(true)

        try {
            const res = await postJSON('/masterData/bus/delete', _form, props.authData.token)
            _getData()
            _setBusDelete(false)
            _setIsProcessing(false)
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>
            <EdcModal
                visible={_isOpenModal}
                closeModal={
                    () => {
                        _setIsOpenModal(false)
                        _setForm({})
                    }
                }
                data={_form}
                onSuccess={() => _getData(_page)}
                type={_activeIndex}
            />

            <Modal
                visible={_isDetailModalOpen}
                onBackdropClick={() => _setIsDetailModalOpen(false)}
                large
            >
                <ModalContent
                    header={{
                        title: 'Detail Data',
                        closeModal: () => _setIsDetailModalOpen(false)
                    }}
                >
                    <div style={{ padding: '20px' }}>
                        {Object.keys(_detailData).length > 0 ? (
                            <div>
                                {Object.entries(_detailData).map(([key, value]) => (
                                    <div key={key} style={{
                                        display: 'flex',
                                        marginBottom: '12px',
                                        borderBottom: '1px solid #f0f0f0',
                                        paddingBottom: '8px',
                                        gap: "1rem"
                                    }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            minWidth: '200px',
                                            textTransform: 'capitalize'
                                        }}>
                                            {key.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {typeof value === 'boolean' ?
                                                (value ? 'Yes' : 'No') :
                                                key.toLowerCase().includes('timestamp') && value ?
                                                    dateFilter.getMonthDate(new Date(value)) + " " + dateFilter.getTime(new Date(value)) :
                                                    (value !== null && value !== undefined ? String(value) : '-')
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#666' }}>
                                No detail data available
                            </div>
                        )}
                    </div>
                </ModalContent>
            </Modal>

            <AdminLayout
                headerContent={
                    <Tabs
                        activeIndex={_activeIndex}
                        tabs={[
                            {
                                title: 'EDC Bank',
                                value: 'edcBank',
                                onClick: () => {
                                    _setActiveIndex('edcBank')
                                }
                            },
                            {
                                title: 'EDC Tap',
                                value: 'edcTap',
                                onClick: () => {
                                    _setActiveIndex('edcTap')
                                }
                            },
                            {
                                title: 'Pemantauan',
                                value: 'monitoring',
                                onClick: () => {
                                    _setActiveIndex('monitoring')
                                }
                            }
                        ]}
                    />
                }
            >

                <Card
                    noPadding
                >
                    <Table
                        columns={_activeIndex == "edcBank" ? __COLUMNS : _activeIndex == "edcTap" ? __COLUMNS_EDC_TAP : __COLUMNS_MONITORING}
                        records={_activeIndex == "edcBank" ? _edcBankLists.data : _activeIndex == "edcTap" ? _edcTapLists.data : _edcMonitoringLists}
                        config={_activeIndex == "edcBank" ? _paginationConfig : _activeIndex == "edcTap" ? _paginationConfigEdcTap : _paginationConfigMonitoring}
                        onRecordsPerPageChange={perPage => {
                            const currentPage = _activeIndex == "edcBank" ? _page : _activeIndex == "edcTap" ? _pageEdcTap : _pageMonitoring
                            _setPagination({ ...currentPage, length: perPage, startFrom: 0 })
                        }}
                        onPageChange={(page) => {
                            const currentPage = _activeIndex == "edcBank" ? _page : _activeIndex == "edcTap" ? _pageEdcTap : _pageMonitoring
                            _setPagination({ ...currentPage, startFrom: (page - 1) * currentPage.length })
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
                                            const currentPage = _activeIndex == "edcBank" ? _page : _activeIndex == "edcTap" ? _pageEdcTap : _pageMonitoring
                                            _setSearchQuery(query)

                                            if (query.length > 1) {
                                                throttle(() => _getData(currentPage, query), 300)()
                                            } else {
                                                _getData(currentPage, query)
                                            }

                                        }}
                                    />
                                </Col>

                                {_activeIndex !== "monitoring" && (
                                    <Col
                                        column={2}
                                        withPadding
                                    >
                                        <Button
                                            title={'Tambah ' + (_activeIndex == "edcBank" ? 'EDC Bank' : 'EDC Tap')}
                                            styles={Button.secondary}
                                            onClick={() => _setIsOpenModal(true)}
                                            small
                                        />
                                    </Col>
                                )}
                            </Row>
                        )}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}