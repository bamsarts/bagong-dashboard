import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import { AiFillEdit, AiOutlineEllipsis, AiOutlineClose} from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import { Row, Col } from '../../../../components/Layout'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import ThemeModal from '../../../../components/ThemeModal'   
// import styles from './EdcBank.module.scss'
import generateClasses from '../../../../utils/generateClasses'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import Link from 'next/link'
import { dateFilter, currency } from '../../../../utils/filters'
import { useRouter } from 'next/router'
import Label from '../../../../components/Label'
import Tabs from '../../../../components/Tabs'
import SwitchButton from '../../../../components/SwitchButton'


export default function VoucherJrc(props) {
    const router = useRouter()

    const __TABLE_HEADERS = [
        [
            { title: 'Nama', rowSpan: 2 },
            { title: 'Kode Voucher', rowSpan: 2 },
            { title: 'Pembelian', colSpan: 2 },
            { title: 'Masa Berlaku', rowSpan: 2 },
            { title: 'Kuota Tersedia', rowSpan: 2 },
            { title: 'Nominal Voucher', rowSpan: 2 },
            { title: 'Harga Voucher', rowSpan: 2 },
            { title: 'Aktif', rowSpan: 2 },
            { title: '', rowSpan: 2 }
        ],
        [
            { title : 'Mulai'},
            { title : 'Akhir'}
        ]
    ]

    const __COLUMNS = [
        {
            title : 'Judul',
            field : 'title',
            textAlign: 'left',
            customCell: (value, row) => {
                return (
                    <Col>
                        <strong>{value}</strong>
                        <span>{row.desc}</span>
                        <small>*{row.notes}</small>
                    </Col>
                )
            }
        },
        {
            title : 'Kode Voucher',
            field : 'code',
            textAlign: 'left',
        },
        {
            title : '',
            field : 'valid_from',
            textAlign: 'left',
            customCell: (value, row) => {
               return dateFilter.getMonthDate(new Date(value)) + " "+dateFilter.getTime(new Date(value))
            }
        },
        {
            title : '',
            field : 'valid_until',
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value)) + " "+dateFilter.getTime(new Date(value))
            }
        },
        {
            title : '',
            field : 'validity_period',
            minWidth: '60px',
            customCell: (value, row) => {
                return value + " Hari"
            }
        },
        {
            title : '',
            field : 'available_stock',
            minWidth: '60px',
            customCell: (value, row) => {
                return value
            }
        },
        {
            title : '',
            field : 'voucher_value',
            minWidth: '60px',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title : '',
            field : 'voucher_price',
            minWidth: '60px',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title : '',
            field : 'is_actived',
            minWidth: '60px',
            customCell: (value, row) => {
                return (
                    <SwitchButton
                    checked={value}
                    onClick={() => {
                        _setActivate(row)
                    }}
                    />
                )
            }
        },
        {
            title : '',
            field : 'id',
            minWidth: '60px',
            customCell: (value, row) => {
                return (
                    <Button
                    small
                    title={'Detail'}
                    styles={Button.secondary}
                    onClick={() => {
                        window.location.href = window.location.href + "/addVoucher?detail="+value
                    }}
                    />  
                )
            }
        },
    ]

    const [_voucherLists, _setVoucherLists] = useState([])

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

    if(router.query?.refPage && _searchQuery == ""){
        refPage = router.query?.refPage
    }

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
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
    
    async function _setActivate(row) {
        const params = {
            "isActived": !row.is_actived
        }
        
    
        try {
            const result = await postJSON('/masterData/voucher/toggle-status/'+row.id, params, props.authData.token, false, "PATCH")
            
            if(result){
                _getData(_page)
            }

        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
        }
        
        if (query) {
            params.query = query
        } 

        try {
            const result = await postJSON('/masterData/voucher/list', params, props.authData.token)
            
            _setVoucherLists(result.data)

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

    return (
        <Main>
            

            <AdminLayout>

                <Card
                noPadding
                >
                    <Table
                    tableHeaders={__TABLE_HEADERS}
                    columns={__COLUMNS}
                    records={_voucherLists}
                    config={_paginationConfig}
                    onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                    onPageChange={(page) => {
                        _setPagination({ ..._page, startFrom : (page - 1) * _page.length })
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
                                title={'Tambah Voucher'}
                                styles={Button.secondary}
                                onClick={() => 
                                    router.push("/admin/marketing-and-support/voucher-jrc/addVoucher")
                                }
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