import { useEffect, useState } from "react"
import AdminLayout from "../../../../../components/AdminLayout"
import Main, { popAlert } from '../../../../../components/Main'
import Card from '../../../../../components/Card'
import Table from '../../../../../components/Table'
import Input from '../../../../../components/Input'
import { Col, Row } from '../../../../../components/Layout'
import { AiFillEdit, AiFillDelete } from 'react-icons/ai'
import Button from '../../../../../components/Button'
import { postJSON } from '../../../../../api/utils'
import throttle from '../../../../../utils/throttle'
import BusFacilityModal from '../../../../../components/BusFacilityModal'
import styles from './BusFacility.module.scss'

export default function BusFacility(props){

    const __COLUMNS = [
        {
            title : 'Kode Fasilitas',
            field : 'code',
            textAlign: 'center'
        },
        {
            title : 'Gambar',
            field : 'link',
            customCell: (value, row) => {
                return (
                   <img src={value+"?option=thumbnail&size=10"} width="100" height="auto"/>
                )
            }
        },
        {
            title : 'Gambar CDN',
            field : 'imageUrl',
            customCell: (value, row) => {

                if(value){
                    return (
                        <img src={value} width="100" height="auto"/>
                     )
                }else{
                    return ''
                }
               
            }
        },
        {
            title : 'Nama Fasilitas',
            field : 'name'
        },
        {
            title : '',
            field : "id",
            customCell : (value, row) => {
                return (
                    <Row>
                        <div
                        title={"Ubah"}
                        className={styles.button_action}
                        onClick={() => {
                            _setIsOpenModal(true)
                            _setForm(row)
                        }}
                        >
                            <AiFillEdit/>
                        </div>

                        {/* <div
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
                        </div> */}
                    </Row>
                )
            }
        }
    ]

    const [_busFacility, _setBusFacility] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
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
            const data = await postJSON('/masterData/bus/fasilitas/list', params, props.authData.token)
            _setBusFacility(data)
            _setPaginationConfig({
                recordLength : data.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(data.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Main>

            <BusFacilityModal
            visible={_isOpenModal}
            closeModal={
                () => {
                    _setIsOpenModal(false)
                    _setForm({})
                }
            }
            data={_form}
            refresh={() => _getData()}
            />

            <AdminLayout>

                <Card
                noPadding
                >

                    <Table
                    columns={__COLUMNS}
                    records={_busFacility.data}
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
                                title={'Tambah Fasilitas Bus'}
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