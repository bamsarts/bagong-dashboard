import Table from '../../../../components/Table'
import { useEffect, useState } from 'react'
import { get, objectToParams, postJSON } from '../../../../api/utils'
import throttle from '../../../../utils/throttle'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Col, Row } from '../../../../components/Layout'
import generateClasses from '../../../../utils/generateClasses'
import NewsModal from '../../../../components/NewsModal'
import styles from './News.module.scss'
import { AiFillEdit, AiFillDelete } from 'react-icons/ai'
import ConfirmationModal from '../../../../components/ConfirmationModal'
import Input from '../../../../components/Input'
import { dateFilter } from '../../../../utils/filters'

export default function News(props) {

    const __COLUMNS = [
        {
            title: '',
            field: 'imageLink',
            customCell: (value, row) => {
                return (
                    <img
                        src={value.replace("http:", "https:") + "?option=thumbnail&size=50"}
                        width={"100"}
                        height={"auto"}
                    />
                )
            }
        },
        {
            title: 'Judul',
            field: 'title',
        },
        {
            title: 'Tanggal Posting',
            field: 'articleDate',
            style: {
                minWidth: '100px'
            },
            customCell: (value, row) => {
                return dateFilter.getMonthDate(new Date(value))
            }
        },
        {
            title: 'Link',
            field: 'linkExternal',
            customCell: (value, row) => {
                return (
                    <a href={value} target="_blank">{value}</a>
                )
            }
        },
        {
            title: 'Kategori',
            field: 'category',
        },
        {
            title: 'Aksi',
            field: "id",
            customCell: (value, row) => {
                return (
                    <Row>
                        <div
                            title={"Ubah"}
                            className={styles.button_action}
                            onClick={() => {
                                _setIsOpenModal(true)
                                _setRowData(row)
                            }}
                        >
                            <AiFillEdit />
                        </div>

                        <div
                            title={"Hapus"}
                            className={generateClasses([
                                styles.button_action,
                                styles.text_red
                            ])}
                            onClick={() => {
                                _setArticleDelete(value)
                            }}
                        >
                            <AiFillDelete />
                        </div>
                    </Row>
                )
            }
        }
    ]

    const [_page, _setPage] = useState({
        length: Table.defaultProps.recordsPerPageValues[0],
        startFrom: 0,
        orderBy: "id",
        sortMode: 'desc'
    })

    const [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_newsData, _setNewsData] = useState([])
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_rowData, _setRowData] = useState({})
    const [_articleDelete, _setArticleDelete] = useState("")
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_categoryRanges, _setCategoryRanges] = useState([
        {
            "title": "Semua Kategori",
            "value": ""
        },
        {
            "title": "Berita",
            "value": "news"
        },
        {
            "title": "Promosi",
            "value": "promotion"
        },
        {
            "title": "Popup Banner",
            "value": "popup"
        },
        {
            "title": "Slide Banner",
            "value": "banner"
        },
        {
            "title": "Majalah",
            "value": "majalah"
        },
        {
            "title": "Penghargaan",
            "value": "penghargaan"
        },
    ])

    const [_selectedCategory, _setSelectedCategory] = useState(_categoryRanges[0])

    useEffect(() => {
        _getData()
    }, [_selectedCategory])

    async function _getData(pagination = _page, query = _searchQuery) {
        const params = {
            ...pagination,
            orderBy: "id",
            sortMode: 'desc'
        }

        if (query) params.query = query
        if (_selectedCategory?.value != "") params.category = _selectedCategory.value

        try {
            console.log("articker", params)
            console.log("auyt", props.authData.token)

            const result = await get('/data/articleLink/list?' + objectToParams(params), props.authData.token)

            _setNewsData(result.data)

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

    async function _deleteArticle() {
        _setIsProcessing(true)

        try {
            let query = {
                "id": _articleDelete
            }

            const result = await postJSON('/marketingSupport/articleLink/delete', query, props.authData.token)

            if (result) _getData()

            popAlert({ "message": "Berhasil dihapus", "type": "success" })
        } catch (e) {

            let errMessage = ""

            if (e.message?.details) {
                errMessage = e.message.details[0].message
            } else {
                errMessage = e.message
            }

            popAlert({ message: errMessage })

        } finally {

            _setIsProcessing(false)
        }
    }

    function _setPagination(pagination) {
        _setPage(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })
        _getData(pagination)
    }

    return (
        <Main>

            <NewsModal
                rangeNews={_newsData[0]}
                data={_rowData}
                visible={_isOpenModal}
                closeModal={
                    () => {
                        _setIsOpenModal(false)
                        _setRowData({})
                    }
                }
                onSuccess={_getData}
            />

            <ConfirmationModal
                visible={_articleDelete}
                closeModal={() => {
                    _setArticleDelete("")
                }}
                onDelete={_deleteArticle}
                onLoading={_isProcessing}
            />

            <AdminLayout>
                <Card
                    noPadding
                >

                    <Table
                        columns={__COLUMNS}
                        records={_newsData}
                        config={_paginationConfig}
                        onRecordsPerPageChange={perPage => _setPagination({ length: perPage, startFrom: 0 })}
                        onPageChange={page => _setPagination({ ..._page, startFrom: (page - 1) * _page.length })}
                        headerContent={(
                            <Row
                                verticalEnd
                            >


                                <Col
                                    column={1}
                                    withPadding

                                >
                                    <Button
                                        title={'Tambah'}
                                        styles={Button.secondary}
                                        onClick={() => {
                                            _setIsOpenModal(true)
                                        }}
                                        small
                                    />
                                </Col>

                                <Col
                                    column={2}
                                    withPadding
                                >
                                    <Input
                                        title={""}
                                        placeholder={'Pilih Kategori'}
                                        value={_selectedCategory.title}
                                        suggestions={_categoryRanges}
                                        suggestionField={'title'}
                                        onSuggestionSelect={(value) => {
                                            _setSelectedCategory(value)
                                        }}
                                    />
                                </Col>

                            </Row>
                        )}
                    >
                    </Table>
                </Card>
            </AdminLayout>
        </Main>
    )

}