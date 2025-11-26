import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { get, postJSON } from '../../../../api/utils'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Row, Col } from '../../../../components/Layout'
import Input from '../../../../components/Input'
import styles from './Deposit.module.scss'

export default function DepositDetail(props) {
    const router = useRouter()
    const { id } = router.query
    const [_setoranData, _setSetoranData] = useState(null)
    const [_isLoading, _setIsLoading] = useState(true)
    const [_pointTraject, _setPointTraject] = useState([])

    const summaryRows = [
        { label: 'Jumlah' },
        { label: 'Total (Ribuan)' }
    ];

    const cellStyle = {
        padding: '8px',
        border: '1px solid #ddd',
        fontSize: '11px',
        whiteSpace: 'nowrap'
    };

    useEffect(() => {
        if (id) {
            _fetchSetoranDetail()
        }
    }, [id])

    useEffect(() => {
        if(_setoranData?.data.setoran?.traject_id){
            _getTrackTraject()
        }
    }, [_setoranData?.data?.setoran?.traject_id])

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

    async function _getTrackTraject() {
        try {
            const trajectId = _setoranData?.data?.setoran?.traject_id
            if (!trajectId) {
                throw new Error('Trajectory ID not found')
            }

            const requestBody = {
                startFrom: 0,
                length: 1560,
                trajectId: trajectId
            }

            const data = await postJSON('/masterData/trayekPoint/list', requestBody, props.authData.token)

            _setPointTraject(data.data)

        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
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


                        {_isLoading ? (
                            <p>Loading...</p>
                        ) : _setoranData ? (
                            <div
                                style={{
                                    overflow: "auto"
                                }}
                            >
                                <h2>{_setoranData.data.setoran?.desc}</h2>

                                <Row>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>Tanggal</span>
                                            <span> : {_setoranData.data.setoran.transaction_date}</span>
                                        </div>
                                        <div>
                                            <span>Nopol</span>
                                            <span> : N 1442 ADS</span>
                                        </div>
                                        <div>
                                            <span>Ritase</span>
                                            <span> : {_setoranData.data.ritase.length}</span>
                                        </div>
                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>Driver</span>
                                            <span> : Saeful</span>
                                        </div>
                                        <div>
                                            <span>Kondektur</span>
                                            <span> : N 1442 ADS</span>
                                        </div>
                                        <div>
                                            <span>Kenek</span>
                                            <span> : {_setoranData.data.ritase.length}</span>
                                        </div>
                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>Tanggal Setoran</span>
                                            <span> : Saeful</span>
                                        </div>
                                        <div>
                                            <span>Waktu Setoran</span>
                                            <span> : N 1442 ADS</span>
                                        </div>

                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>KM Awal</span>
                                            <span> : Saeful</span>
                                        </div>
                                        <div>
                                            <span>KM Akhir</span>
                                            <span> : N 1442 ADS</span>
                                        </div>
                                        <div>
                                            <span>KM</span>
                                            <span> : N 1442 ADS</span>
                                        </div>
                                    </Col>
                                </Row>

                                <Row>
                                    {
                                        _setoranData.data.ritase.map((ritaseData, ritaseIndex) => {
                                            const getPnpCount = (originName, destinationName) => {
                                                let count = 0

                                                const detail = ritaseData.detail?.find(
                                                    d => d.origin_name === originName && d.destination_name === destinationName
                                                );

                                                if(detail){
                                                    count +=  detail?.pnp_count || 0;
                                                }

                                                return count > 0 ? count : ""
                                            };

                                            return (
                                                <Col
                                                    key={ritaseIndex}
                                                    column={(_setoranData.data.ritase.length > 2 || _pointTraject.length > 6) ? 6 : 3}
                                                >
                                                    <h4 style={{ marginTop: '1rem' }}>Ritase {ritaseData.ritase || ritaseIndex + 1}</h4>
                                                    <table style={{ marginTop: "0.5rem", width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                                        <tbody>
                                                            {_pointTraject.map((location, index) => {

                                                                let origin = (indexStart, indexEnd) => {
                                                                    
                                                                }

                                                                return (


                                                                    <tr key={index}>
                                                                        {Array.from({ length: (location.pointOrder - 1) }).map((_, i) => (
                                                                            <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent' }}>
                                                                                {i + " " +location.pointName}
                                                                            </td>
                                                                        ))}
                                                                        <td style={{ ...cellStyle, backgroundColor: 'transparent' }}>
                                                                            <b>{index + " " + location.pointName}</b>
                                                                        </td>
                                                                    </tr>
                                                                )    
                                                                
                                                                
                                                            })}
                                                            
                                                            {summaryRows.map((row, index) => (
                                                                <tr key={`summary-${index}`}>
                                                                    {Array.from({ length: 11 }).map((_, i) => (
                                                                        <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent' }}></td>
                                                                    ))}
                                                                    <td style={cellStyle}>{row.label}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </Col>
                                            )

                                        })
                                    }
                                </Row>
                                                               
                                                            
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
