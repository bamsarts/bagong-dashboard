import Main from '../../components/Main'
import { useEffect, useState } from 'react'
import { get, BUCKET } from '../../api/utils'
import Card from '../../components/Card'
import { Row, Col } from '../../components/Layout'
import ActivityIndicator from '../../components/ActivityIndicator'

export default function BusInfo() {
    const [_busData, _setBusData] = useState([])
    const [_loading, _setLoading] = useState(true)

    useEffect(() => {
        _loadBusData()
    }, [])

    async function _loadBusData() {
        try {
            const response = await fetch(`${BUCKET}/bus-info.json?t=${Date.now()}`)
            const data = await response.json()
            _setBusData(data.buses || [])
        } catch (e) {
            console.error('Failed to load bus info:', e)
        } finally {
            _setLoading(false)
        }
    }

    return (
        <Main>
            <div style={{
                padding: '40px 20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '10px',
                    color: '#333'
                }}>
                    Informasi Bus
                </h1>
                
                <p style={{
                    fontSize: '16px',
                    color: '#666',
                    marginBottom: '40px'
                }}>
                    Bagong Transport menyediakan alat transportasi sewa berupa bus pariwisata, mini bus, bus 4x4, bus 4x2, manhauling  dan ambulance.
                </p>

                {_loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <ActivityIndicator />
                    </div>
                ) : (
                    <Row>
                        {_busData.map((bus, index) => (
                            <Col key={index} column={3} withPadding>
                                <Card style={{
                                    height: '100%',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        overflow: 'hidden',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <img
                                            src={bus.image}
                                            alt={bus.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.src = '/assets/placeholder-bus.png'
                                            }}
                                        />
                                    </div>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '8px'
                                    }}>
                                        {bus.title}
                                    </h3>
                                    {bus.description && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#666',
                                            lineHeight: '1.5'
                                        }}>
                                            {bus.description}
                                        </p>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {!_loading && _busData.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#999'
                    }}>
                        <p>Belum ada informasi bus tersedia</p>
                    </div>
                )}
            </div>
        </Main>
    )
}
