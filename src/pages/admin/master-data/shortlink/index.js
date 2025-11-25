import { useEffect, useState } from 'react'

import { objectToParams, postJSON, get } from '../../../../api/utils'
import { AiFillEye } from 'react-icons/ai'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import Link from 'next/link'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import { Row, Col } from '../../../../components/Layout'

export default function Shortlink(props) {

    const __COLUMNS = [
        {
            title: 'Short Link',
            field: 'short_link',
            customCell: (value, row) => {
                return (
                    <Link
                    href={value}
                    >
                        {value}
                    </Link>
                )
            }
        },
        {
            title: 'Destination Link',
            field: 'link',
            customCell: (value, row) => {
                return (
                    <Link
                        href={value}
                    >
                        {value}
                    </Link>
                )
            }
        },
        {
            title: 'Tanggal Dibuat',
            field: 'created_at'
        },
        {
            title: 'Aksi',
            field: "id",
            customCell: (value, row) => {
                return (
                    <Button
                    onProcess={_isProcessing}
                    title={'Hapus'}
                    styles={Button.error}
                    onClick={() => {
                        _deleteShortLink(value)
                    }}
                    />
                )
            }
        }
    ]

    const [_shortLinkLists, _setShortLinkLists] = useState([])
    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })
    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: 'id',
        sortMode: 'desc'
    })
    const [_form, _setForm] = useState({
        link: ''
    })
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

    async function _getData(pagination = _page) {

        _setIsProcessing(true)

        const params = {
            ...pagination,
        }

        try {
            const lists = await get('/shortlink/list?' + objectToParams(params), props.authData.token)
            _setShortLinkLists(lists)
            _setPaginationConfig({
                recordLength: lists.totalFiltered,
                recordsPerPage: pagination.length,
                activePage: (pagination.startFrom / pagination.length) + 1,
                totalPages: Math.ceil(lists.totalFiltered / pagination.length)
            })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    function _updateQuery(updates) {
        _setForm(oldForm => ({
            ...oldForm,
            ...updates
        }))
    }

    async function _submitData() {
        if (!_form.link.trim()) {
            popAlert({ message: 'Original Link is required' })
            return
        }

        _setIsProcessing(true)

        try {
            const payload = {
                link: _form.link
            }

            const response = await postJSON('/shortlink/add', payload, props.authData.token)

            popAlert({
                message: 'Short link created successfully!',
                type: 'success'
            })

            // Reset form
            _setForm({ link: '' })

            // Refresh the list
            _getData(_page)

        } catch (e) {
            popAlert({
                message: e.message || 'Failed to create short link',
                type: 'error'
            })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _deleteShortLink(id) {
        if (!confirm('Apakah anda yakin ingin hapus short link?')) {
            return
        }

        _setIsProcessing(true)

        try {
            await postJSON(`/shortlink/delete/${id}`, {}, props.authData.token, false, "DELETE")

            popAlert({
                message: 'Short link berhasil dihapus!',
                type: 'success'
            })

            // Refresh the list
            _getData(_page)

        } catch (e) {
            popAlert({
                message: e.message || 'Failed to delete short link',
                type: 'error'
            })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Main>

            <AdminLayout>

                <Card
                noPadding
                >
                    <Row
                    withPadding
                    >
                        <Col
                        column={2}
                        mobileFullWidth
                        withPadding
                        >
                            <Input
                            placeholder={"Destination Link"}
                            value={_form.link}
                            onChange={(value) => {
                                _updateQuery({
                                    "link": value
                                })
                            }}
                            />
                        </Col>

                        <Col
                        column={2}
                        withPadding
                        >
                            <Button
                            disabled={_isProcessing || !_form.link.trim()}
                            onProcess={_isProcessing}
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={() => {
                                _submitData()
                            }}
                            />
                        </Col>
                    </Row>

                    <Table
                        isLoading={_isProcessing}
                        columns={__COLUMNS}
                        records={_shortLinkLists.data}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )

}