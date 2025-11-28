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
import Image from 'next/image'
import { dateFilter } from '../../../../utils/filters'

export default function DepositDetail(props) {
    const router = useRouter()
    const { id } = router.query
    const [_setoranData, _setSetoranData] = useState(null)
    const [_isLoading, _setIsLoading] = useState(true)
    const [_pointTraject, _setPointTraject] = useState([])
    const [_trajectTracks, _setTrajectTracks] = useState({})
    const [depositData, setDepositData] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

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
        const storedData = localStorage.getItem('operasional_deposit');
        if (storedData) {
            setDepositData(JSON.parse(storedData));
            // Optional: clear it after reading
            // localStorage.removeItem('depositData');
        }
    }, []);


    useEffect(() => {
        console.log("fa")
        console.log(_setoranData)
    }, [_setoranData])



    async function _fetchSetoranDetail() {
        _setIsLoading(true)
        try {
            const data = await get(`/data/setoran/setoranById/${id}`, props.authData.token)
            _setSetoranData(data)

            // Iterate through ritase and fetch trajectory tracks
            if (data.data.ritase && data.data.ritase.length > 0) {
                const tracks = {}
                for (const ritase of data.data.ritase) {
                    if (ritase.traject_id) {
                        const trackData = await _getTrackTraject(ritase.traject_id)
                        tracks[ritase.traject_id] = trackData
                    }
                }
                _setTrajectTracks(tracks)
            }

        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsLoading(false)
        }
    }

    async function _getTrackTraject(trajectId) {
        try {
            if (!trajectId) {
                throw new Error('Trajectory ID not found')
            }

            const requestBody = {
                startFrom: 0,
                length: 1560,
                trajectId: trajectId
            }

            const data = await postJSON('/masterData/trayekPoint/list', requestBody, props.authData.token)

            const sortedData = data.data.sort((a, b) => a.pointOrder - b.pointOrder)
            _setPointTraject(sortedData)

            return sortedData

        } catch (e) {
            popAlert({ message: e.message })
            return []
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
                                            <span> : {dateFilter.getMonthDate(new Date(_setoranData.data.setoran.transaction_date))}</span>
                                        </div>
                                        <div>
                                            <span>Nopol</span>
                                            <span> : </span>
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
                                            <span> : </span>
                                        </div>
                                        <div>
                                            <span>Kondektur</span>
                                            <span> : </span>
                                        </div>
                                        <div>
                                            <span>Kenek</span>
                                            <span> : </span>
                                        </div>
                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>Tanggal Setoran</span>
                                            <span> : </span>
                                        </div>
                                        <div>
                                            <span>Waktu Setoran</span>
                                            <span> : </span>
                                        </div>

                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div>
                                            <span>KM Awal</span>
                                            <span> : </span>
                                        </div>
                                        <div>
                                            <span>KM Akhir</span>
                                            <span> : </span>
                                        </div>
                                        <div>
                                            <span>KM</span>
                                            <span> : </span>
                                        </div>
                                    </Col>
                                </Row>

                                <Row
                                    marginBottom
                                >
                                    {
                                        _setoranData.data.ritase.map((ritaseData, ritaseIndex) => {
                                            const trajectTrack = _trajectTracks[ritaseData.traject_id] || []

                                            const getPnpCount = (originName, destinationName) => {
                                                let count = 0

                                                const detail = ritaseData.detail?.find(
                                                    d => d.origin_name === originName && d.destination_name === destinationName
                                                );

                                                if (detail) {
                                                    count += detail?.pnp_count || 0;
                                                }

                                                return count > 0 ? count : ""
                                            };

                                            return (
                                                <Col
                                                    withPadding
                                                    key={ritaseIndex}
                                                    column={(_setoranData.data.ritase.length > 2 || trajectTrack.length > 6) ? 6 : 3}
                                                >
                                                    <h4 style={{ marginTop: '1rem' }}>Ritase {ritaseData.ritase || ritaseIndex + 1}</h4>
                                                    <table style={{ marginTop: "0.5rem", width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                                        <tbody>
                                                            {trajectTrack.map((location, index) => {
                                                                return (
                                                                    <tr key={index}>
                                                                        {Array.from({ length: (location.pointOrder - 1) }).map((_, i) => (
                                                                            <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent' }}>
                                                                                {i + " " + location.pointName}
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
                                                                    {Array.from({ length: trajectTrack.length - 1 }).map((_, i) => (
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

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <h4>Pendapatan Kotor</h4>

                                    {
                                        _setoranData.data.ritase.map((val, key) => {
                                            return (
                                                <>
                                                    <Row
                                                        flexEnd
                                                        style={{
                                                            gap: "1rem"
                                                        }}
                                                    >
                                                        <Col
                                                            withPadding
                                                            alignEnd
                                                            justifyCenter
                                                            column={2}
                                                        >
                                                            <span>{val.detail[0].traject_name}</span>
                                                        </Col>

                                                        <Col
                                                            withPadding
                                                            column={1}
                                                        >
                                                            <Input
                                                                type="number"
                                                                value={val.cash_payment_amount + val.non_cash_payment_amount}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>

                                                    </Row>
                                                </>
                                            )
                                        })
                                    }
                                </div>

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <h4>PER KARCIS UNTUK KRU</h4>

                                    {
                                        _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "PER KARCIS UNTUK KRU")
                                                .map((item, index) => (
                                                    
                                            
                                                        <Row
                                                            key={item.id}
                                                            flexEnd
                                                            style={{
                                                                gap: "1rem"
                                                            }}
                                                        >
                                                            <Col
                                                                withPadding
                                                                alignEnd
                                                                justifyCenter
                                                                column={2}
                                                            >
                                                                <span>{item.desc}</span>
                                                            </Col>

                                                            <Col
                                                                withPadding
                                                                column={1}
                                                            >
                                                                <Input
                                                                    type="number"
                                                                    value={""}
                                                                    placeholder={`Rp`}
                                                                />
                                                            </Col>
                                                            <Col
                                                                withPadding
                                                                column={1}
                                                            >
                                                                <Input
                                                                    type="number"
                                                                    value={item.amount}
                                                                    placeholder={`Rp`}
                                                                />
                                                            </Col>
                                                            <Col
                                                                withPadding
                                                                column={1}
                                                            >
                                                                <Input
                                                                    type="number"
                                                                    value={""}
                                                                    placeholder={`Rp`}
                                                                />
                                                            </Col>

                                                        </Row>
                                                        
                                                ))
                                    }
                                </div>

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <h4>Catatan Saku</h4>

                                    <Row>
                                        {_setoranData.data.biaya[0]?.details
                                            ?.filter(item => item.name === "Catatan Saku")
                                            .map((item, index) => (
                                                <Col key={item.id} column={3} withPadding>
                                                    <Input
                                                        title={item.desc}
                                                        type="number"
                                                        value={item.amount}
                                                        placeholder={`Masukkan ${item.desc}`}
                                                    />
                                                </Col>
                                            ))
                                        }
                                    </Row>
                                </div>

                                <div
                                    style={{
                                        margin: "1rem 0rem"
                                    }}
                                >
                                    <h4>Bukti Setoran</h4>
                                    <Row>
                                        {_setoranData.data.images?.map((image) => {
                                            return (
                                                image.full_url && (
                                                    <Col key={image.id} column={1} withPadding mobileFullWidth>
                                                        <div style={{
                                                            border: '1px solid #ddd',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            cursor: 'pointer',
                                                            transition: 'box-shadow 0.2s'
                                                        }}
                                                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                            onClick={() => setSelectedImage(image)}
                                                        >
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '100%',
                                                                height: '200px',
                                                                marginBottom: '8px',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <img
                                                                    src={image.full_url}
                                                                    alt={image.title}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            </div>
                                                            <h5 style={{ margin: '8px 0 4px 0' }}>{image.title}</h5>
                                                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{image.desc}</p>
                                                            <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                                Rp {image.amount.toLocaleString('id-ID')}
                                                            </p>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                                                                {image.date} {image.time}
                                                            </p>
                                                        </div>
                                                    </Col>
                                                )
                                            )
                                        })}
                                    </Row>
                                </div>

                                <div
                                    style={{
                                        margin: "1rem 0rem"
                                    }}
                                >
                                    <h4>Manifest</h4>
                                    <Row>
                                        {_setoranData.data.manifest?.map((image) => (
                                            <Col key={image.id} column={1} withPadding mobileFullWidth>
                                                <div style={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'box-shadow 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                    onClick={() => setSelectedImage(image)}
                                                >
                                                    {
                                                        image?.url && (
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '100%',
                                                                height: '200px',
                                                                marginBottom: '8px',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}>

                                                                <img
                                                                    src={image.url}
                                                                    alt={image.title}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            </div>
                                                        )
                                                    }

                                                    <h5 style={{ margin: '8px 0 4px 0' }}>{image.name}</h5>
                                                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{image.category}</p>
                                                    <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                        Penumpang {image.pnp_count} ({image.cash_amount.toLocaleString('id-ID')})
                                                    </p>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                                                        {image.date} {image.time}
                                                    </p>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>

                                {selectedImage && (
                                    <div
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 9999,
                                            padding: '20px'
                                        }}
                                        onClick={() => setSelectedImage(null)}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                maxWidth: '90%',
                                                maxHeight: '90%',
                                                backgroundColor: 'white',
                                                borderRadius: '8px',
                                                padding: '20px'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    background: 'rgba(0, 0, 0, 0.5)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    cursor: 'pointer',
                                                    fontSize: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ×
                                            </button>
                                            <img
                                                src={selectedImage.full_url || selectedImage.url}
                                                alt={selectedImage.title}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: 'calc(90vh - 120px)',
                                                    objectFit: 'contain',
                                                    display: 'block'
                                                }}
                                            />

                                        </div>
                                    </div>
                                )}


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
