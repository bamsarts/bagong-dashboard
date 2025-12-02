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
import { currency, dateFilter } from '../../../../utils/filters'

export default function DepositDetail(props) {
    const router = useRouter()
    const { id } = router.query
    const [_setoranData, _setSetoranData] = useState(null)
    const [_isLoading, _setIsLoading] = useState(true)
    const [_pointTraject, _setPointTraject] = useState([])
    const [_trajectTracks, _setTrajectTracks] = useState({})
    const [depositData, setDepositData] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [_assignedData, _setAssignedData] = useState({})
    const [_totalExpenses, _setTotalExpenses] = useState(0)
    const [_totalGrossAmount, _setTotalGrossAmount] = useState(0)
    const [_totalIncomeByPercentage, _setTotalIncomeByPercentage] = useState(0)
    const [_manifestCost, _setManifestCost] = useState({
        "fuel": 0,
        "gas": 0,
        "notesDeposit": 0
    })

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
            _assignedBus(JSON.parse(storedData))
        }
    }, []);

    useEffect(() => {
        if (_setoranData?.data?.setoran) {
            _setTotalExpenses(_calculateTotalExpenses(_setoranData.data.biaya))
        }
    }, [_setoranData])

    useEffect(() => {
        if (_setoranData?.data?.biaya && _totalGrossAmount > 0 && _totalExpenses >= 0) {
            let data = _calculateIncomeByPercentage()
            _setTotalIncomeByPercentage(data.incomeByPercentage)
            _setManifestCost({
                "fuel": data.fuel,
                "tol": data.tol,
                "notesDeposit": data.notesDeposit
            })
        }
    }, [_setoranData, _totalGrossAmount, _totalExpenses])

    async function _fetchSetoranDetail() {
        _setIsLoading(true)
        try {
            const data = await get(`/data/setoran/setoranById/${id}`, props.authData.token)
            let totalGross = 0

            _setSetoranData(data)

            // Iterate through ritase and fetch trajectory tracks
            if (data.data.ritase && data.data.ritase.length > 0) {
                const tracks = {}
                for (const ritase of data.data.ritase) {
                    if (ritase.traject_id) {
                        const trackData = await _getTrackTraject(ritase.traject_id)
                        tracks[ritase.traject_id] = trackData
                    }

                    totalGross += (ritase.cash_payment_amount + ritase.non_cash_payment_amount)
                }
                _setTrajectTracks(tracks)
            }

            _setTotalGrossAmount(totalGross)



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

    async function _assignedBus(deposit) {

        let query = {
            "startFrom": 0,
            "length": 360,
            "query": deposit?.assign_date
        }

        try {


            const data = await postJSON(`/data/penugasan/list`, query, props.authData.token);

            // Find the assignment by ID
            const assignment = data.data?.find(item => (item.schedule_assign_date === deposit.assign_date && item.traject_master_id === deposit.traject_master_id));

            _setAssignedData(assignment)
        } catch (error) {
            console.error('Error fetching assigned bus:', error);
            popAlert({ message: error.message });
            return null;
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

    function _findOriginDestination(trajectId) {
        let origins = "";
        let destinations = "";

        if (!_setoranData?.data?.ritase) return { origins: [], destinations: [] };

        _setoranData.data.ritase.forEach(ritase => {
            if (ritase.traject_id === trajectId && ritase.detail) {
                ritase.detail.forEach(detail => {
                    if (detail.origin_name){
                        origins = detail.origin_name;
                    } 

                    if (detail.destination_name) {
                        destinations = detail.destination_name;
                    }
                });
            }
        });

        return origins + " - " + destinations
       
    }


    function _findMandoran(trajectId) {
        let totalPnpCount = 0;

        if (!_setoranData?.data?.manifest) return totalPnpCount;

        _setoranData.data.manifest.forEach(ritase => {
            if (ritase.traject_id === trajectId && ritase.category === "MANDOR") {
                totalPnpCount += parseInt(ritase.pnp_count) || 0;
            }
        });

        return totalPnpCount;
    }

    function _findCrewKarcis(trajectId) {
        let totalPnpCount = 0;

        if (!_setoranData?.data?.ritase) return totalPnpCount;


        _setoranData.data.ritase.forEach(ritase => {
            if (ritase.traject_id === trajectId) {
                totalPnpCount += parseInt(ritase.non_cash_pnp_count) + parseInt(ritase.cash_pnp_count);
            }
        });

        return totalPnpCount;
    }

    function _calculateTotalExpenses(costData) {
        let total = 0;

        if (!costData[0]?.details) return total;

        costData[0].details.forEach(item => {
            let passengerCount = 0;

            // Calculate passenger count based on the expense type
            if (item.name === "PER KARCIS UNTUK KRU") {
                passengerCount = _findCrewKarcis(item.traject_id);
            } else if (item.name === "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)") {
                passengerCount = _findMandoran(item.traject_id);
            } else if (item.name === "Lain-lain") {
                // For "Lain-lain", use amount directly without multiplying by passenger count
                total += parseInt(item.amount) || 0;
                return;
            }

            // Calculate total for items that need passenger count multiplication
            total += passengerCount * (parseInt(item.amount) || 0);
        });

        return total;
    }

    function _calculateIncomeByPercentage() {
        let total = {
            "incomeByPercentage": 0,
            "notesDeposit": 0,
            "fuel": 0,
            "tol": 0
        }

        if (!_setoranData?.data?.biaya?.[0]?.details) return total;

        const netIncome = _totalGrossAmount - _totalExpenses;

        _setoranData.data.biaya[0].details.forEach(item => {
            if (item.format_amount === "PERCENTAGE" && item.name == "Bonus Kru") {
                const min = parseInt(item.min) || 0;
                const max = parseInt(item.max) || 0;

                // Check if netIncome matches the criteria
                // If max is 0, it means no upper limit
                const meetsMinCriteria = netIncome >= min;
                const meetsMaxCriteria = max === 0 || netIncome <= max;

                if (meetsMinCriteria && meetsMaxCriteria) {
                    // Calculate the difference from min threshold
                    const difference = netIncome - min;
                    // Apply percentage to the difference
                    const percentageAmount = (difference * (parseInt(item.amount) || 0)) / 100;

                    item.percentageAmount = percentageAmount

                    total.incomeByPercentage += percentageAmount;
                }
            }

            if (item.name == "Catatan Saku") {
                total.notesDeposit += parseInt(item.amount)
            }
        });

        _setoranData.data.images.forEach(item => {
            if (item.title == "Solar") {
                total.fuel += parseInt(item.amount)

            } else if (item.title == "Tol") {
                total.tol += parseInt(item.amount)
            }
        })

        return total;
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
                                            <span> : {_assignedData?.bus_name}</span>
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
                                            <span> : {_assignedData?.bus_crew2_name}</span>
                                        </div>
                                        <div>
                                            <span>Kondektur</span>
                                            <span> : {_assignedData?.bus_crew1_name}</span>
                                        </div>
                                        <div>
                                            <span>Kenek</span>
                                            <span> : {_assignedData?.bus_crew3_name}</span>
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
                                                let data = {
                                                    passengerCount: 0,
                                                    ticketPrice: 0,
                                                    origin: "",
                                                    destination: ""
                                                }

                                                const detail = ritaseData.detail?.find(
                                                    d => d.origin_name === originName && d.destination_name === destinationName
                                                );

                                                if (detail) {
                                                    data.origin = detail?.origin_name
                                                    data.destination = detail?.destination_name
                                                    data.passengerCount += parseInt(detail?.pnp_count) || 0;
                                                    data.ticketPrice += parseInt(detail?.payment_amount)
                                                }

                                                return data
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
                                                                        {Array.from({ length: (location.pointOrder - 1) }).map((_, i) => {

                                                                            let origin = trajectTrack[i].pointName
                                                                            let destination = location.pointName
                                                                            let passenger = getPnpCount(origin, destination).passengerCount

                                                                            return (
                                                                                <td key={`empty-${i}`} style={{ ...cellStyle, backgroundColor: 'transparent', textAlign: "right" }}>
                                                                                    {passenger}
                                                                                </td>
                                                                            )

                                                                        })}
                                                                        <td style={{ ...cellStyle, backgroundColor: 'transparent' }}>
                                                                            <b>{location.pointName}</b>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}

                                                            {summaryRows.map((row, index) => {
                                                                // Calculate column totals
                                                                const columnTotals = Array.from({ length: trajectTrack.length - 1 }).map((_, colIndex) => {
                                                                    let summary = {
                                                                        passenger: 0,
                                                                        amount: 0,
                                                                        passengerMin: 0
                                                                    }

                                                                    trajectTrack.forEach((location, rowIndex) => {
                                                                        if (rowIndex > colIndex) {

                                                                            let destinationBefore = ""

                                                                            if(colIndex > 0){
                                                                                destinationBefore = trajectTrack[colIndex - 1].pointName
                                                                            }
                                                                            
                                                                            const origin = trajectTrack[colIndex].pointName;
                                                                            const destination = location.pointName;
                                                                            const data = getPnpCount(origin, destination)
                                                                            const passenger = data.passengerCount;
                                                                            const ticketPrice = data.ticketPrice

                                                                            if(data.origin == destinationBefore){
                                                                                let dataBefore = getPnpCount(data.origin, destinationBefore)
                                                                                summary.passengerMin += parseInt(dataBefore.passengerCount) || 0
                                                                            }

                                                                            
                                                                            
                                                                            summary.passenger += (parseInt(passenger)) || 0;
                                                                            summary.amount += parseInt(ticketPrice) || 0;

                                                                            
                                                                        }
                                                                    });

                                                                    // if(colIndex > 0){
                                                                    //    summary.passenger = columnTotals[colIndex - 1].passenger + summary.passenger
                                                                    // }

                                                                    return summary;
                                                                });

                                                                return (
                                                                    <tr key={`summary-${index}`}>
                                                                        {columnTotals.map((total, i) => {
                                                                            
                                                                            if(i > 0){
                                                                                total.passenger = (columnTotals[i-1].passenger + total.passenger) - total.passengerMin
                                                                            }

                                                                            return (
                                                                                <td key={`total-${i}`} style={{ ...cellStyle, backgroundColor: '#f0f0f0', textAlign: 'right', fontWeight: 'bold' }}>
                                                                                    {
                                                                                        index === 0 ? total.passenger : currency(total.amount)
                                                                                    }
                                                                                </td>
                                                                            )
                                                                        })}
                                                                        <td style={{ ...cellStyle, fontWeight: 'bold' }}>{row.label}</td>
                                                                    </tr>
                                                                );
                                                            })}
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
                                            <span>TOTAL PENDAPATAN KOTOR</span>
                                        </Col>

                                        <Col
                                            withPadding
                                            column={1}
                                        >
                                            <Input
                                                type="number"
                                                value={_totalGrossAmount}
                                                placeholder={`Rp`}
                                            />
                                        </Col>

                                    </Row>
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
                                            .map((item, index) => {

                                                let pnp = _findCrewKarcis(item.traject_id)

                                                return (
                                                    <Row
                                                        key={item.id}

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
                                                                value={pnp}
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
                                                                value={pnp * item.amount}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>

                                                    </Row>
                                                )
                                            })
                                    }
                                </div>

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <h4>PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)</h4>

                                    {
                                        _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)")
                                            .map((item, index) => {

                                                let pnp = _findMandoran(item.traject_id)

                                                return (
                                                    <Row
                                                        key={item.id}
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
                                                                value={pnp}
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
                                                                value={pnp * item.amount}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>
                                                    </Row>
                                                )
                                            })
                                    }

                                    {
                                        _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "Lain-lain")
                                            .map((item, index) => (


                                                <Row
                                                    key={item.id}

                                                >
                                                    <Col
                                                        withPadding
                                                        alignEnd
                                                        justifyCenter
                                                        column={4}
                                                    >
                                                        <span>{item.desc}</span>
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

                                                </Row>

                                            ))
                                    }

                                    <Row>
                                        <Col
                                            withPadding
                                            alignEnd
                                            justifyCenter
                                            column={5}
                                        >
                                            <span>TOTAL PENGELUARAN</span>
                                        </Col>


                                        <Col
                                            withPadding
                                            column={1}
                                        >
                                            <Input
                                                type="number"
                                                value={_totalExpenses}
                                                placeholder={`Rp`}
                                            />
                                        </Col>

                                    </Row>

                                    <Row>
                                        <Col
                                            withPadding
                                            alignEnd
                                            justifyCenter
                                            column={5}
                                        >
                                            <span>PENDAPATAN SETELAH DIPOTONG PENGELUARAN</span>
                                        </Col>


                                        <Col
                                            withPadding
                                            column={1}
                                        >
                                            <Input
                                                type="number"
                                                value={_totalGrossAmount - _totalExpenses}
                                                placeholder={`Rp`}
                                            />
                                        </Col>

                                    </Row>


                                    {
                                        _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "Bonus Kru")
                                            .map((item, index) => (


                                                <Row
                                                    key={item.id}

                                                >
                                                    <Col
                                                        withPadding
                                                        alignEnd
                                                        justifyCenter
                                                        column={5}
                                                    >
                                                        <span>{item.desc} {item.amount}%</span>
                                                    </Col>


                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input
                                                            type="number"
                                                            value={item?.percentageAmount}
                                                            placeholder={`Rp`}
                                                        />
                                                    </Col>

                                                </Row>

                                            ))
                                    }

                                    <Row>
                                        <Col
                                            withPadding
                                            alignEnd
                                            justifyCenter
                                            column={5}
                                        >
                                            <span>PENDAPATAN</span>
                                        </Col>


                                        <Col
                                            withPadding
                                            column={1}
                                        >
                                            <Input
                                                type="number"
                                                value={_totalGrossAmount - _totalExpenses - _totalIncomeByPercentage}
                                                placeholder={`Rp`}
                                            />
                                        </Col>

                                    </Row>
                                </div>

                                <div
                                    style={{
                                        margin: "3rem 0rem 0rem 0rem"
                                    }}
                                >
                                    <h4>Catatan Saku</h4>

                                    {

                                        _setoranData.data.biaya[0]?.details
                                            ?.filter(item => item.name === "Catatan Saku")
                                            .map((item, index) => (
                                                <Row
                                                    key={item.id}
                                                >
                                                    <Col column={2} withPadding justifyCenter>
                                                        <span>{item.desc}</span>
                                                    </Col>
                                                    <Col column={1} withPadding>
                                                        <Input
                                                            type="number"
                                                            value={item.amount}
                                                            placeholder={`Masukkan ${item.desc}`}
                                                        />
                                                    </Col>
                                                </Row>
                                            ))
                                    }

                                    {_setoranData.data.images
                                        ?.filter(item => (item.title === "Solar" || item.title == "Tol"))
                                        .map((item, index) => (
                                            <Row>
                                                <Col column={2} withPadding justifyCenter>
                                                    <span>{item.desc}</span>
                                                </Col>
                                                <Col key={item.id} column={1} withPadding>
                                                    <Input
                                                        type="number"
                                                        value={item.amount}
                                                        placeholder={`Masukkan ${item.desc}`}
                                                    />
                                                </Col>
                                            </Row>

                                        ))
                                    }


                                </div>

                                <Row>
                                    <Col
                                        withPadding
                                        alignEnd
                                        justifyCenter
                                        column={5}
                                    >
                                        <span>TOTAL SAKU & SOLAR</span>
                                    </Col>


                                    <Col
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            type="number"
                                            value={_manifestCost.notesDeposit + _manifestCost.tol + _manifestCost.fuel}
                                            placeholder={`Rp`}
                                        />
                                    </Col>

                                </Row>

                                <Row>
                                    <Col
                                        withPadding
                                        alignEnd
                                        justifyCenter
                                        column={5}
                                    >
                                        <span>SETORAN SETELAH DIPOTONG SAKU</span>
                                    </Col>


                                    <Col
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            type="number"
                                            value={_totalGrossAmount - _totalExpenses - _totalIncomeByPercentage - (_manifestCost.notesDeposit + _manifestCost.tol + _manifestCost.fuel)}
                                            placeholder={`Rp`}
                                        />
                                    </Col>

                                </Row>

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left' }}>No</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left' }}>Lokasi Naik/Jam</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left' }}>Arah</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'right' }}>Jumlah Penumpang</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'right' }}>Jumlah Uang</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center' }}>TTD Kondektur</th>
                                                <th style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'center' }}>Nama Kontrol</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {_setoranData.data.manifest
                                                ?.filter(item => item.category === "CHECKER")
                                                .map((checker, index) => (
                                                    <tr key={checker.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                                        <td style={cellStyle}>{index + 1}</td>
                                                        <td style={cellStyle}>{dateFilter.getMonthDate(new Date(checker.date)) + " " + checker.time}</td>
                                                        <td style={cellStyle}>{_findOriginDestination(checker.traject_id) || '-'}</td>
                                                        <td style={{ ...cellStyle, textAlign: 'right' }}>{checker.pnp_count}</td>
                                                        <td style={{ ...cellStyle, textAlign: 'right' }}>{currency(checker.cash_amount)}</td>
                                                        <td style={{ ...cellStyle, textAlign: 'center' }}>{ }</td>
                                                        <td style={{ ...cellStyle, textAlign: 'center' }}>{checker.name}</td>
                                                    </tr>
                                                ))}

                                        </tbody>
                                    </table>
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
