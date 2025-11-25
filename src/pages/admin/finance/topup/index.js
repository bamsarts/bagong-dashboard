import { useEffect, useState } from 'react'

import { postJSON } from '../../../../api/utils'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Input from '../../../../components/Input'
import Table from '../../../../components/Table'
import Button from '../../../../components/Button'
import Tabs from '../../../../components/Tabs'
import { Col, Row } from '../../../../components/Layout'
import throttle from '../../../../utils/throttle'
import TopupModal from '../../../../components/TopupModal'
import TopupApprovalModal from '../../../../components/TopupApprovalModal'
import TopupDetailModal from '../../../../components/TopupDetailModal'
import { currency, dateFilter } from '../../../../utils/filters'
import { BsChevronRight, BsThreeDotsVertical, BsEyeFill, BsFillCheckCircleFill, BsXOctagon } from 'react-icons/bs'
import styles from './Topup.module.scss'
import generateClasses from '../../../../utils/generateClasses'
import { getSessionStorage, setSessionStorage } from '../../../../utils/session-storage'
import { getLocalStorage, setLocalStorage } from '../../../../utils/local-storage'

export default function Topup(props) {

    const __COLUMNS_TOPUP = [
        {
            title : 'Tanggal Request',
            field : 'dateRequest',
            textAlign: 'left',
            customCell: (value) => dateFilter.getMonthDate(new Date(value))
        },
        {
            title : 'Petugas',
            field : 'counterOfficer',
            textAlign: 'left'
        },
        {
            title : 'Loket',
            field : 'counterName',
            textAlign: 'left'
        },
        {
            title : 'Kode Unik (Rp)',
            field : 'uniqCode',
            textAlign: 'right',
            customCell : (value) => currency(value, '')
        },
        {
            title : 'Total Topup (Rp)',
            field : 'amountTotal',
            textAlign: 'right',
            customCell : (value) => currency(value, '')
        },
        {
            title : 'Transfer Bank',
            field : 'originAccBank',
            textAlign: 'left',
            customCell: (value, row) => {
                if(value != null){
                    return <div className={styles.bank_container}>
                        <span>{value}</span>
                        <BsChevronRight/>
                        <span>{row.destinationAccBank}</span>
                    </div>
                }else{
                    return ''
                }
                
            }
        },
        {
            title : 'Status',
            field : 'status',
            customCell : (value) => {
                return value == "SUCCESS" ? 'APPROVED' : value
            }
        },
        {
            title : 'Disetujui Oleh',
            field : 'approvedBy',
            textAlign: 'left'
        },
        {
            title : 'Aksi',
            field : "id",
            style: {"position": "relative"},
            customCell : (value, row) => {
                return (
                    <div>
                        <div
                        title={"Aksi"}
                        className={styles.dropdown}
                        onClick={() => {
                            _setDropdown(row.id)
                        }}
                        >
                            <BsThreeDotsVertical/>
                        </div>

                        <div
                        style={{"display": "none"}}
                        className={ generateClasses([
                            styles.dropdown_action,
                            "dropdown-item "+row.id
                        ])}
                        >
                            <div
                            title={"Lihat Detail"}
                            className={styles.button_action}
                            onClick={() => {
                                _setTopupDetail(row)
                            }}
                            >
                                <BsEyeFill/>
                                <span>Detail</span>
                            </div>

                            {
                                (_checkRequest() && row.status == "PENDING") && (
                                    <div
                                    title={"Konfirmasi Bayar"}
                                    className={styles.button_action}
                                    onClick={() => {
                                        const data = {
                                            ...row,
                                            "bankList": _topupLists.bankList,
                                            "amount_total": row.amountTotal
                                        }
                                        _setIsOpenModal(true)
                                        _setDataPending(data)
                                    }}
                                    >
                                        <BsFillCheckCircleFill/>
                                        <span>Konfirmasi Bayar</span>
                                    </div> 
                                )
                            }

                            { 
                                (row.status == "CONFIRMED" || row.status == "PENDING") && _checkApproval() && (
                                    <>
                                        <div
                                        title={"Setujui"}
                                        className={styles.button_action}
                                        onClick={() => {
                                            _setTopupData([row, {"isApprove": true}])
                                        }}
                                        >
                                            <BsFillCheckCircleFill/>
                                            <span>Setujui</span>
                                        </div>

                                        <div
                                        title={"Tolak"}
                                        className={styles.button_action}
                                        onClick={() => {
                                            _setTopupData([row, {"isApprove": false}])
                                        }}
                                        >
                                            <BsXOctagon/>
                                            <span>Tolak</span>
                                        </div>
                                    </>
                                )
                            }
                        </div>
                    </div>                        
                )
            }
        }
    ]

    const __COLUMNS_MUTATION = [
        {
            title : 'Tanggal Request',
            field : 'dateRequest',
            textAlign: 'left',
            customCell: (value) => dateFilter.getMonthDate(new Date(value)) +" "+dateFilter.getTime(new Date(value))
        },
        {
            title : 'Petugas',
            field : 'counterOfficer',
            textAlign: 'left'
        },
        {
            title : 'Loket',
            field : 'counterName',
            textAlign: 'left'
        },
        {
            title : 'Cabang',
            field : 'branchName',
            textAlign: 'left',
        },
        {
            title : 'Rincian Transaksi',
            field : 'remark',
            textAlign: 'left',
        },
        {
            title : 'Debit',
            field : 'debet',
            textAlign: 'right',
            customCell: (value, row) => {
                return currency(value)
            }
        },
        {
            title : 'Kredit',
            field : 'kredit',
            textAlign: 'right',
            customCell : (value) => {
                return currency(value)
            }
        },
        {
            title : 'Saldo',
            field : 'saldo',
            textAlign: 'right',
            customCell : (value) => {
                return currency(value)
            }
        }
    ]

    const [_topupLists, _setTopupLists] = useState([])
    const [_mutationLists, _setMutationLists] = useState([])

    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageTopup, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })

    let [_paginationConfigMutation, _setPaginationConfigMutation] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageMutation, _setPageMutation] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: "id",
        sortMode: "desc"
    })
    
    const [_activeIndex, _setActiveIndex] = useState(0)
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_topupData, _setTopupData] = useState([])
    const [_topupDetail, _setTopupDetail] = useState({})
    const [_dataPending, _setDataPending] = useState({})
    const [_accessMenu, _setAccessMenu] = useState([])

    useEffect(() => {   
        _getTopup(_pageTopup)
        _setActiveIndex('topup')
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Perform localStorage action
            
            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                _setAccessMenu(item)
            }
        }
    }, [])
    

    function _setDropdown(id){
        const parent = document.getElementsByClassName("dropdown-item "+id)
        if(parent[0].style.display == "none"){
            parent[0].style.display = "grid"
        }else{
            parent[0].style.display = "none"
        }
    }

    function _setPagination(pagination) {
    
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getTopup(pagination)
    }

    function _setPaginationMutation(pagination) {
    
        _setPageMutation(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getMutation(pagination)
    }

    async function _getTopup(pagination, query = '') {
        const params = {
            ...pagination
        }
        
        params.target = "counter"
        params.orderBy = "id"
        params.sortMode = "desc"

        if(query) params.query = query

        try {
            const topup = await postJSON(`/keuangan/deposit/topup/list`, params, props.authData.token)
            _setTopupLists(topup)
            _setPaginationConfig({
                recordLength : topup.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(topup.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getMutation(pagination, query = '') {
        const params = {
            ...pagination
        }
        
        // params.target = "counter"
        // params.orderBy = "id"
        // params.sortMode = "desc"

        if(query) params.query = query

        try {
            const mutation = await postJSON(`/keuangan/deposit/mutasi/list`, params, props.authData.token)
            _setMutationLists(mutation)
            _setPaginationConfigMutation({
                recordLength : mutation.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(mutation.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    function _checkApproval(){
        let isShow = false

        _accessMenu.forEach(function(val, key){
            if(val.menu == "Keuangan>DepositApproval"){
                isShow = val.viewRole
            }
        })

        return isShow
    }

    function _checkRequest(){
        let isShow = false

        _accessMenu.forEach(function(val, key){
            if(val.menu == "Keuangan>DepositRequest"){
                isShow = val.viewRole
            }
        })

        return isShow
    }

    return (
        <Main>

            <TopupApprovalModal
            data={_topupData}
            closeModal={() => {
                _setTopupData([])
            }}
            refresh={() => _getTopup(_pageTopup)}
            />

            <TopupDetailModal
            data={_topupDetail}
            closeModal={() => {
                _setTopupDetail({})
            }}
            />

            <TopupModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)

            }}
            data={_dataPending}
            refresh={() => _getTopup(_pageTopup)}
            />
        
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Topup',
                        value : 'topup',
                        onClick : () => {
                            _setActiveIndex('topup')
                            _getTopup(_pageTopup)
                        }
                    },
                    {
                        title : 'Mutasi',
                        value : 'mutasi',
                        onClick : () => {
                            _setActiveIndex('mutasi')
                            _getMutation(_pageMutation)
                        }
                    },
                ]}
                />
            }
            >  

            {
                _activeIndex == "topup" && (
                    <Card
                    noPadding
                    >
                        <Table
                        headerContent={(
                            <Row>
                                <Col
                                withPadding
                                mobileFullWidth
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getData(_pageTopup, query), 100)()
                                        }else{
                                            _getTopup(_pageTopup, query)  
                                        }
                                    }}
                                    />
                                </Col>
                                
                                {
                                    _checkRequest() && (
                                        <Col
                                        column={2}
                                        withPadding
                                        >
                                            <Button
                                            title={'Request Topup'}
                                            styles={Button.secondary}
                                            onClick={() => {
                                                _setDataPending({})
                                                _setIsOpenModal(true)
                                            }}
                                            />
                                        </Col>
                                    )
                                }
                                
                            </Row>
                        )}
                        columns={__COLUMNS_TOPUP}
                        records={_topupLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                        onPageChange={page => _setPagination({ ..._pageTopup, startFrom : (page - 1) * _pageTopup.length })}
                        />
                    </Card>
                )
            }    

            {
                _activeIndex == "mutasi" && (
                    <Card
                    noPadding
                    >
                        <Table
                        headerContent={(
                            <Row>
                                <Col
                                withPadding
                                mobileFullWidth
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length > 1){
                                            throttle(() => _getMutation(_pageMutation, query), 100)()
                                        }else{
                                            _getMutation(_pageMutation, query)  
                                        }
                                    }}
                                    />
                                </Col>
                            </Row>
                        )}
                        columns={__COLUMNS_MUTATION}
                        records={_mutationLists.data}
                        config={_paginationConfigMutation}
                        onRecordsPerPageChange={perPage => _setPaginationMutation({ length : perPage, startFrom : 0, orderBy: "id", sortMode: "desc" })}
                        onPageChange={page => _setPaginationMutation({ ..._pageMutation, startFrom : (page - 1) * _pageMutation.length })}
                        />
                    </Card>
                )
            }    


            </AdminLayout>
        </Main>
    )

}