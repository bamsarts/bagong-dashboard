import { useState, useEffect, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './TopupUserModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'

TopupUserModal.defaultProps = {
    closeModal : null,
    data: {},
}

export default function TopupUserModal(props = TicketListModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_isProcessing, _setIsProcessing] = useState(false)
    const FORM = {
        companyId: appContext.authData.companyId,
        userId: props.data.userId,
        remark: "",
        amount: ""
    }
    const [_form, _setForm] = useState(FORM)

    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0,
        orderBy: 'id',
        sortMode: 'desc',
        companyId: appContext.authData.companyId,
    })

    const [_topupLists, _setTopupLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }

    useEffect(() => {
        if(props.data?.id){
            _getData()
        }
    }, [props.data])

    async function _submitData() {
        _setIsProcessing(true)

        let query = {
            ..._form
        }

        query.userId = props.data.userId
        query.amount = query.amount.split(".").join("")
        
        try {
            await postJSON('/masterData/company/user/topup/add', query, appContext.authData.token)

            popAlert({ message : 'Berhasil disimpan', type : 'success' })
            _getData()
            _updateQuery({
                "amount": "",
                "remark": ""
            })
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getData(pagination = _page) {
        const params = {
            ...pagination,
        }

        params.userId = props.data.userId

        try {
            const topupLists = await postJSON('/masterData/company/user/topup/list', params, appContext.authData.token)
            
            _setTopupLists(topupLists.data)
            _setPaginationConfig({
                recordLength : topupLists.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(topupLists.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Modal
        visible={props.data?.id}
        onBackdropClick={props.closeModal}
        centeredContent
        extraLarge
        >
            <ModalContent
            header={{
                title : `Topup Pengguna `+props.data?.userName,
                closeModal : props.closeModal
            }}
            >   
                <form
                style={{
                    position : 'sticky',
                    top : 0,
                    zIndex : 9999,
                    backgroundColor: "#ffff"
                }}
                onSubmit={e => {
                    e.preventDefault()
                    _submitData()
                }}
                action={'.'}
                >
                    <Row
                    verticalEnd
                    >
                        <Col
                        column={1}
                        withPadding
                        >
                            <Input
                            type={"currency"}
                            title="Nominal"
                            placeholder='Masukan nominal'
                            onChange={(value) => {
                                _updateQuery({
                                    amount: value
                                })
                            }}
                            value={_form.amount}
                            autoFocus={true}
                            />
                        </Col>
                        <Col
                        column={2}
                        withPadding
                        >
                            <Input
                            title={"Keterangan"}
                            placeholder='Masukan keterangan'
                            onChange={(value) => {
                                _updateQuery({
                                    remark: value
                                })
                            }}
                            value={_form.remark}
                            />
                        </Col>
                        <Col
                        column={2}
                        withPadding
                        >
                            <Button
                            title={'Simpan'}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />
                        </Col>
                    </Row>
                </form>
                   
                
                {
                    props.data?.id && (
                        <Table
                        columns={[
                            {
                                field : 'remark',
                                title : 'Keterangan',
                                textAlign: 'left',
                                customCell : (value) => {
                                    return value || '-'
                                }
                            },
                            {
                                field : 'debet',
                                title : 'Debit',
                                textAlign: 'right',
                                customCell : (value) => {
                                    return currency(value) || '-'
                                }
                            },
                            {
                                field : 'kredit',
                                title : 'Kredit',
                                textAlign: 'right',
                                customCell : (value) => currency(value)
                            },
                            {
                                field : 'saldo',
                                title : 'Saldo',
                                textAlign: 'right',
                                customCell : (value) => currency(value)
                            }
                        ]}
                        records={_topupLists}
                        onPageChange={page => _setPagination({ ..._page, startFrom : (page - 1) * _page.length })}
                        onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                        config={_paginationConfig}
                        />
                    )
                }

            </ModalContent>
        </Modal>
    )

}