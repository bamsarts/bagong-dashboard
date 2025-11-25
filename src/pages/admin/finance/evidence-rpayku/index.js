import { useEffect, useState } from 'react'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { currency, dateFilter } from '../../../../utils/filters'
import { API_ENDPOINT, get, postJSON, SETTLEMENT_URL } from '../../../../api/utils'
import Button from '../../../../components/Button'
import ImageSlider from '../../../../components/ImageSlider'
import { Col, Row } from '../../../../components/Layout'
import Input from '../../../../components/Input'

export default function EvidenceRpayku(props) {
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_page, _setPage] = useState({
        length : Table.defaultProps.recordsPerPageValues[1],
        startFrom : 0,
    })

    const [_evidenceRange, _setEvidenceRange] = useState([])
    const [_evidenceSelected, _setEvidenceSelected] = useState([])
    const [_counter, _setCounter] = useState({
        title: "Semua Counter",
        value: ""
    })
    const [_counterRanges, _setCounterRanges] = useState([])

    let __COLUMNS = [
        {   
            title: 'Tanggal Transaksi',
            field : 'transactionDate',
            customCell : (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {
            title: 'Waktu',
            field : 'transactionTime',
            customCell: (value) => {
                return dateFilter.getTime(new Date(`2024-05-01 ${value}`))
            }
        },
        {
            title: 'Petugas',
            field : 'counterOfficer',
        },
        {
            title: 'Counter',
            field : 'counterName',
        },
        {
            title: 'Pembayaran',
            field : 'payment',
        },
        {
            title: 'Opsi',
            field: 'imagePath',
            customCell: (value) => {
                if(value != null){
                    return (
                        <Button
                        title={'Lihat Bukti'}
                        onProcess={_isProcessing}
                        onClick={ () => {
                            _setEvidenceSelected([
                                {
                                    "link": value
                                }
                            ])
                        }}
                        />
                    )
                }else{
                    return ''
                }
            }
        }
    ]
   
    useEffect(() => {
        _getEvidence()
        _getCounter()
    },[])

    async function _getEvidence(pagination = _page) {

        let params = {
            segment: "all",
            sortMode: "desc",
            orderBy: "id",
            ...pagination
        }

        if(_counter.value != "") params.counterId = _counter.value

        try {
            const res = await postJSON("/keuangan/settlement/list", params, props.authData.token)

            if(res.data.length === 0){
                popAlert({ message : 'Tidak ada bukti bayar', type : 'info' })
            }

            _setEvidenceRange(res.data)


        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getCounter(){
        let params = {
            startFrom : 0,
            length: 480,
        }

        try {
            const res = await postJSON(`/masterData/counter/list`, params, props.authData.token)
            let data = []

            res.data.forEach(function(val, key){
                if(key == 0){
                    data.push({
                        title: "Semua Counter",
                        value: ""
                    })
                }
                data.push({
                    title: val.name,
                    value: val.id
                })
            })

            if(res) {
                _setCounterRanges(data)
            }

        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Main>

            <ImageSlider
            index={0}
            data={_evidenceSelected}
            visible={_evidenceSelected.length > 0 ? true : false}
            closeModal={() => {
                _setEvidenceSelected([])
            }}
            />
            
            <AdminLayout>
                {
                    _evidenceRange && (
                        <>
                            <Card
                            noPadding
                            >

                                <Row
                                verticalEnd
                                withPadding
                                >
                                    <Col
                                    column={1}
                                    mobileFullWidth
                                    withPadding
                                    >
                                        <Input
                                        title={'Counter'}
                                        placeholder={'Semua Counter'}
                                        value={_counter.title}
                                        suggestions={_counterRanges}
                                        suggestionsField={"title"}
                                        onSuggestionSelect={counter => {
                                            _setCounter(counter)
                                        }}
                                        />
                                    </Col>

                                    <Col
                                    column={1}
                                    withPadding
                                    >
                                        <Button
                                        styles={Button.secondary}
                                        id={"btnApply"}
                                        title={'Terapkan'}
                                        onProcess={_isProcessing}
                                        onClick={_getEvidence}
                                        />
                                    </Col>
                                </Row>

                                <Table
                                columns={__COLUMNS}
                                records={_evidenceRange}
                                noPadding
                                />
                                    
                            </Card>
                        </>
                    )
                }
            </AdminLayout>
        </Main>
    )

}