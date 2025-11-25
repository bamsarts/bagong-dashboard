import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { get } from '../../../../api/utils'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Row, Col } from '../../../../components/Layout'

export default function DepositDetail(props) {
    const router = useRouter()
    const { id } = router.query
    const [_setoranData, _setSetoranData] = useState(null)
    const [_isLoading, _setIsLoading] = useState(true)

    useEffect(() => {
        if (id) {
            _fetchSetoranDetail()
        }
    }, [id])

    async function _fetchSetoranDetail() {
        _setIsLoading(true)
        try {
            const data = await get(`/data/setoran/setoranById/${id}`, props.authData.token)
            _setSetoranData(data)
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsLoading(false)
        }
    }

    return (
        <Main>
            <AdminLayout
            headerContent={(
                <Button
                title="Kembali"
                onClick={() => router.back()}
                styles={Button.secondary}
                small
                />
            )}
            >
                <Card>
                    <Col withPadding>
                        
                        
                        <h2>{_setSetoranData.data.header.desc}</h2>

                        <Row>
                            <Col>

                            </Col>
                        </Row>
                        
                        {_isLoading ? (
                            <p>Loading...</p>
                        ) : _setoranData ? (
                            <div>
                                <pre>{JSON.stringify(_setoranData, null, 2)}</pre>
                            </div>
                        ) : (
                            <p>Data tidak ditemukan</p>
                        )}
                    </Col>
                </Card>
            </AdminLayout>
        </Main>
    )
}
