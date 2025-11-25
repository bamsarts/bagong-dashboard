import { useEffect, useState } from 'react'

import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { currency, dateFilter } from '../../../../utils/filters'
import { API_ENDPOINT, get, SETTLEMENT_URL } from '../../../../api/utils'
import Button from '../../../../components/Button'

export default function Settlement(props) {
    const [_isProcessing, _setIsProcessing] = useState(false)

    let __COLUMNS = [
        {   
            title: 'Tanggal',
            field : 'created_at',
            customCell : (value) => dateFilter.convertISO(new Date(value), "date")
        },
        {
            title: 'Serial Number',
            field : 'serial_number',
        },
        {
            title: 'Nominal',
            field : 'amount',
            textAlign: 'right',
            customCell : (value) => currency(value)
        },
        {
            title: 'Opsi',
            field: 'settlement_url',
            customCell: (value) => {
                return (
                    <Button
                    title={'Settle'}
                    onProcess={_isProcessing}
                    onClick={ () => {
                        _settlePaid(value)
                    }}
                    />
                )
            }
        }
    ]

    const [_settlement, _setSettlement] = useState([])
   
    useEffect(() => {
        _getSettlement()
    },[])
    
    async function _settlePaid(target){
        _setIsProcessing(true)

        try{
            const res = await get({ url: "/api/api-server-side?url="+target}, "", "")
            if(res.data?.transaction_id){
                popAlert({ message : 'Settlement berhasil', type : 'success' })
                _getSettlement()
                _setIsProcessing(false)
            }

        }catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    async function _getSettlement() {

        try {
            const res = await get({url: "/api/api-server-side?url="+SETTLEMENT_URL + "/tsm/emoney/settlement/pending"}, "", "")

            if(res.data.length === 0){
                popAlert({ message : 'Tidak ada settlement pending', type : 'info' })
                _setSettlement([])
            }else{
                _setSettlement(res.data)
            }

        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    return (
        <Main>
            
            <AdminLayout>
                {
                    _settlement && (
                        <>
                            <Card
                            noPadding
                            >
                                <Table
                                    headExport={[
                                    {
                                        title: 'Tanggal',
                                        value: 'created_at',
                                        customCell : (value) => dateFilter.convertISO(new Date(value), "date")
                                    },
                                    {
                                        title: 'Serial Number',
                                        value: 'serial_number',
                                    },
                                    {
                                        title: 'Nominal',
                                        value: 'amount',
                                    },
                                ]}
                                columns={__COLUMNS}
                                records={_settlement}
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