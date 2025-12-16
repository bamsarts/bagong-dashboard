import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { get, postJSON } from '../../../../api/utils'
import Main, { popAlert } from '../../../../components/Main'
import AdminLayout from '../../../../components/AdminLayout'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { Row, Col } from '../../../../components/Layout'
import Input from '../../../../components/Input'
import Modal, { ModalContent } from '../../../../components/Modal'
import styles from './Deposit.module.scss'
import Image from 'next/image'
import { currency, dateFilter } from '../../../../utils/filters'
import { AiFillCaretDown, AiFillCaretUp, AiOutlineUser, AiFillPushpin } from 'react-icons/ai'

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
        "notesDeposit": 0,
        "others": 0
    })
    const [_passengersOntheBus, _setPassengersOntheBus] = useState([])
    const [_amountOntheBus, _setAmountOntheBus] = useState([])
    const [_resultRitase, _setResultRitase] = useState([])
    const [_editablePnp, _setEditablePnp] = useState({})
    const [_form, _setForm] = useState({
        "operan": {
            "title": "OPERAN",
            "value": 0,
            "disabled": false
        },
        "refund": {
            'title': "KEMBALI UANG",
            "value": 0,
            "disabled": false
        },
        "grossAmount": {
            'title': "TOTAL PENDAPATAN KOTOR",
            "value": 0,
            "disabled": true
        }
    })

    const [_formSubmit, _setFormSubmit] = useState({
        "id": 0,
        "busCrew1Id": 0,
        "busCrew1Name": "",
        "busCrew2Id": 0,
        "busCrew2Name": "",
        "busCrew3Id": 0,
        "busCrew3Name": "",
        "kmAwal": 0,
        "kmAkhir": 0,
        "customValue": [],
        "desc": "",
        "totalSetoran": 0,
        "status": "APPROVED"
    })
    const [_formCost, _setFormCost] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_showConfirmModal, _setShowConfirmModal] = useState(false)
    const [_typePaymentAmount, _setTypePaymentAmount] = useState({
        "cash": 0,
        "nonCash": 0
    })
    const [_othersForm, _setOthersForm] = useState(0)

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
        const operanValue = parseFloat(String(_form.operan.value).replace(".", "")) || 0;
        const refundValue = parseFloat(String(_form.refund.value).replace(".", "")) || 0;
        const newGrossAmount = _totalGrossAmount - operanValue - refundValue;

        _updateQuery({
            "grossAmount": {
                "title": _form.grossAmount.title,
                "value": newGrossAmount,
                "disabled": true
            }
        });
    }, [_form.operan.value, _form.refund.value, _totalGrossAmount])


    useEffect(() => {
        const storedData = localStorage.getItem('operasional_deposit');
        if (storedData) {
            setDepositData(JSON.parse(storedData));
            _assignedBus(JSON.parse(storedData))
        }
    }, []);

    useEffect(() => {
        if (_setoranData?.data?.setoran) {
          
            const calculatedExpenses = _calculateTotalExpenses(_setoranData.data.biaya);
          
            _setTotalExpenses(isNaN(calculatedExpenses) ? 0 : calculatedExpenses)
        }

        if (_setoranData?.data?.ritase) {
            _getPaymentAmountTotal()
        }
    }, [_setoranData])

    useEffect(() => {
        if (_setoranData?.data?.setoran) {
            
            const calculatedExpenses = _calculateTotalExpenses(_setoranData.data.biaya);
            _setTotalExpenses(isNaN(calculatedExpenses) ? 0 : calculatedExpenses)
        }

    }, [_othersForm])

    // Initialize _othersForm with default value from biaya details where name == "Lainnya"
    useEffect(() => {
        if (_setoranData?.data?.biaya?.[0]?.details) {
            let lainnyaItem = _setoranData.data.biaya[0].details.find(item => item.name === "Lainnya");

            if (_setoranData?.data?.setoran?.status == "CREATED") {
                lainnyaItem = _setoranData.data.images.find(item => item.title === "Lainnya")
            }

            if (lainnyaItem && _othersForm === 0) {
                _setOthersForm(parseInt(lainnyaItem.amount) || 0);
            }
        }
    }, [_setoranData])

    useEffect(() => {
        if (_setoranData?.data?.biaya) {
            const calculatedExpenses = _calculateTotalExpenses(_setoranData.data.biaya);
            _setTotalExpenses(isNaN(calculatedExpenses) ? 0 : calculatedExpenses)
        }

    }, [_editablePnp])

    useEffect(() => {
        if (_setoranData?.data?.biaya && _totalGrossAmount > 0 && _totalExpenses >= 0) {
            let data = _calculateIncomeByPercentage()
            _setTotalIncomeByPercentage(data.incomeByPercentage)
            _setManifestCost({
                "fuel": data.fuel,
                "tol": data.tol,
                "notesDeposit": data.notesDeposit,
                "others": data.others
            })

            generateTrack()

        }
    }, [_setoranData, _totalGrossAmount, _totalExpenses, _editablePnp])

    useEffect(() => {
        console.log("mfa")
        console.log(_manifestCost)
    }, [_manifestCost.tol, _manifestCost.others])

    function _getPaymentAmountTotal() {

        let cash = 0
        let nonCash = 0


        _setoranData.data.ritase.forEach(function (val, key) {
            cash += val.cash_payment_amount
            nonCash += val.non_cash_payment_amount
        })

        _setTypePaymentAmount({
            "cash": cash,
            "nonCash": nonCash
        })

    }

    async function _fetchSetoranDetail() {

        let query = {
            "id": id
        }

        _setIsLoading(true)

        try {
            const data = await postJSON(`/data/setoran/setoranById/list`, query, props.authData.token)
            let totalGross = 0
            let startKm = data.data.setoran.km_awal
            let endKm = data.data.setoran.km_akhir

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

            if (data.data.setoran.status == "CREATED") {
                data.data.images.forEach(function (val, key) {
                    if (val.title.toLowerCase() == "odometer awal") {
                        startKm = val.amount
                    } else if (val.title.toLowerCase() == "odometer akhir") {
                        endKm = val.amount
                    }
                })
            }

            _setTotalGrossAmount(totalGross)

            _updateQuery({
                "grossAmount": {
                    "title": _form.grossAmount.title,
                    "value": totalGross
                }
            })

            _updateFormSubmit({
                "kmAwal": startKm,
                "kmAkhir": endKm,
                "desc": data.data.setoran.desc
            })



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
            "startDate": deposit?.assign_date,
            "endDate": deposit?.assign_date,
            "orderBy": "id",
            "sortMode": "desc"
        }

        try {


            const data = await postJSON(`/data/penugasan/list`, query, props.authData.token);

            // Find the assignment by ID
            let assignment = {}

            data.data.forEach(function (val, key) {
                if (val.assign_date === deposit.assign_date
                    && val.traject_master_id === deposit.traject_master_id
                    && val.bus_crew1_id === deposit.bus_crew1_id
                    && val.bus_id === deposit.bus_id) {
                    assignment = val
                }
            })

            _updateFormSubmit({
                "busCrew1Id": assignment?.bus_crew1_id,
                "busCrew1Name": assignment?.bus_crew1_name,
                "busCrew2Id": assignment?.bus_crew2_id,
                "busCrew2Name": assignment?.bus_crew2_name,
                "busCrew3Id": assignment?.bus_crew3_id,
                "busCrew3Name": assignment?.bus_crew3_name
            })

            _setAssignedData(assignment)
        } catch (error) {
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

    function _updateFormSubmit(data = {}) {
        _setFormSubmit(oldQuery => {
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
                    if (detail.origin_name) {
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

    function generateTrack() {

        let resultRitase = []


        _setoranData.data.ritase.forEach(function (setoranData, key) {
            let result = []
            let naik = {}
            let turun = {}
            const points = _trajectTracks[setoranData.traject_id]


            for (let i = 0; i < (points.length - 1); i++) {
                let currentPointIndex = i
                let origin = points[i]
                let track = {
                    ...origin,
                    destinations: []
                }


                for (let j = currentPointIndex + 1; j < points.length; j++) {
                    let destination = {
                        ...points[j],
                        pnp: 0
                    }

                    let passengers = setoranData.detail.filter(x => x.origin_id == origin.pointId && x.destination_id == destination.pointId)


                    passengers.forEach(p => {
                        destination.pnp = destination.pnp + parseInt(p.pnp_count)
                        if (naik[origin.pointName]) {
                            naik[origin.pointName].pnp = naik[origin.pointName].pnp + parseInt(p.pnp_count)
                            naik[origin.pointName].amount = naik[origin.pointName].amount + parseInt(p.payment_amount)
                        } else {
                            naik[origin.pointName] = {
                                pnp: parseInt(p.pnp_count),
                                amount: parseInt(p.payment_amount)
                            }
                        }

                        if (turun[destination.pointName]) {
                            turun[destination.pointName].pnp = turun[destination.pointName].pnp + parseInt(p.pnp_count)
                            turun[destination.pointName].amount = turun[destination.pointName].amount + parseInt(p.payment_amount)
                        } else {
                            turun[destination.pointName] = {
                                pnp: parseInt(p.pnp_count),
                                amount: parseInt(p.payment_amount)
                            }
                        }
                    })

                    track.destinations.push(destination)
                }

                result.push(track)
            }

            let passengersInTheBus = []
            let amountOntheBus = []

            let lastPassenger = 0
            let lastAmount = 0

            result.forEach((i, index) => {
                let passengers = 0
                let amounts = 0
                if (index == 0) {
                    passengers = naik[i.pointName]?.pnp - (turun[i.pointName]?.pnp || 0)
                    amounts = naik[i.pointName]?.amount || 0
                } else {
                    passengers = lastPassenger + (naik[i.pointName]?.pnp || 0) - (turun[i.pointName]?.pnp || 0)
                    amounts = lastAmount + (naik[i.pointName]?.amount || 0)
                }
                passengersInTheBus.push(passengers)
                amountOntheBus.push(amounts)
                lastPassenger = passengers
                lastAmount = amounts
            })

            resultRitase.push({
                "passenger": passengersInTheBus,
                "amount": amountOntheBus
            })
        })

        _setResultRitase(resultRitase)
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
                // Use editable pnp if available, otherwise use calculated value
                passengerCount = item?.count || (_editablePnp[item.id] !== undefined ? _editablePnp[item.id] : _findCrewKarcis(item.traject_id));
            } else if (item.name === "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)") {
                passengerCount = item?.count || (_editablePnp[item.id] !== undefined ? _editablePnp[item.id] : _findMandoran(item.traject_id));
            }

            // Validate passengerCount to prevent NaN
            if (isNaN(passengerCount)) {
                passengerCount = 0;
            }

            // Calculate total for items that need passenger count multiplication
            const itemAmount = parseInt(item.amount) || 0;
            total += passengerCount * itemAmount;
        });

        // Validate _othersForm to prevent NaN
        const othersAmount = parseInt(_othersForm) || 0;
        return total + othersAmount;
    }

    function _calculateIncomeByPercentage() {
        let total = {
            "incomeByPercentage": 0,
            "notesDeposit": 0,
            "fuel": 0,
            "tol": 0,
            "others": 0
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
                    // Round to nearest thousand
                    const roundedAmount = Math.floor(percentageAmount / 1000) * 1000;

                    item.percentageAmount = roundedAmount

                    total.incomeByPercentage += roundedAmount;
                }
            }


            if (_setoranData?.data?.setoran?.status == "CREATED") {
                if (item.name == "SOLAR" || item.name == "TOL" || item.name == "Lainnya") {
                    _setoranData.data.images.forEach(i => {
                        if (i.title.toUpperCase() == item.name) {
                            item.amount = parseInt(i.amount)

                            if (i.title == "Lainnya") {
                                _setOthersForm(item.amount)
                            }
                        }
                    })
                }
            }

            if (item.name == "Catatan Saku" || item.name == "SOLAR" || item.name == "Tol" || item.name == "Lainnya") {
                // Use editable value if available, otherwise use original amount
                if (_editablePnp[item.id] !== undefined) {
                    item.amount = _editablePnp[item.id]
                }

                // For "Lainnya", use _othersForm value
                if (item.name === "Lainnya") {
                    item.amount = _othersForm;
                    total.others = _othersForm;
                } else {
                    total.notesDeposit += parseInt(item.amount)
                }
            }
        });

        if (_setoranData?.data?.setoran?.status == "CREATED") {
            _setoranData.data.images.forEach(item => {
                if (item.title == "Solar") {
                    total.fuel += parseInt(item.amount)

                } else if (item.title == "Tol") {
                    total.tol += parseInt(item.amount)

                }
            })
        }
        return total;
    }

    function _getFinalAmount() {
        let finalAmount = _setoranData?.data?.setoran?.payment_amount

        if (_setoranData?.data?.setoran?.status == "CREATED") {
            finalAmount = _form['grossAmount'].value - _totalExpenses - _totalIncomeByPercentage - (_manifestCost.notesDeposit - _manifestCost.tol) -  _typePaymentAmount.nonCash
        }

        return finalAmount
    }

    function _getAmountNetIncome(){
        return _form['grossAmount'].value - _totalExpenses - _totalIncomeByPercentage - (_manifestCost.notesDeposit - _manifestCost.tol)
    }

    async function _confirmReceiveDeposit() {
        _setShowConfirmModal(false)
        _setIsProcessing(true)
        try {
            let payload = {
                ..._formSubmit,
                id: parseInt(id),
                totalSetoran: (parseInt(String(_getFinalAmount()).replace(/\./g, '')) - _typePaymentAmount.nonCash),
                customValue: []
            }

            // Loop through _editablePnp and match with biaya details
            for (const key in _editablePnp) {
                if (_editablePnp.hasOwnProperty(key)) {
                    const matchingDetail = _setoranData.data.biaya[0].details.find(detail => detail.id == key);
                    if (matchingDetail) {

                        let count = _editablePnp[key]
                        let amount = matchingDetail.amount

                        if (matchingDetail.name == "Catatan Saku") {
                            count = 0
                            amount = _editablePnp[key]
                        }

                        payload.customValue.push({
                            id: matchingDetail.id,
                            name: matchingDetail.name,
                            desc: matchingDetail.desc,
                            amount: amount,
                            count: count
                        });
                    }
                }
            }

            for (const key in _form) {
                if (_form.hasOwnProperty(key)) {
                    if ((key == "operan" || key == "refund") && _form[key].value > 0) {
                        payload.customValue.push({
                            id: 0,
                            name: key,
                            desc: _form[key].title,
                            amount: _form[key].value,
                            count: 0
                        });
                    }
                }
            }

            payload.customValue.push(
                {
                    id: 0,
                    name: "Tol",
                    desc: "Tol",
                    amount: _manifestCost.tol,
                    count: 0
                },
                {
                    id: 0,
                    name: "Lainnya",
                    desc: "Lainnya",
                    amount: _othersForm,
                    count: 0
                }
            );

            const response = await postJSON('/data/setoran/update', payload, props.authData.token)

            popAlert({
                message: response.message || 'Setoran berhasil diterima',
                type: 'success'
            })

            // Optionally redirect back or refresh data
            router.back()
        } catch (e) {
            popAlert({
                message: e.message || 'Gagal menerima setoran',
                type: 'error'
            })
        } finally {
            _setIsProcessing(false)
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


                        {_isLoading ? (
                            <p>Loading...</p>
                        ) : _setoranData ? (
                            <div
                                style={{
                                    overflow: "auto"
                                }}
                            >

                                <Row>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Tanggal</span>
                                            <span> : {dateFilter.getMonthDate(new Date(_assignedData?.assign_date))}</span>
                                        </div>
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Nopol</span>
                                            <span> : {_assignedData?.bus_name}</span>
                                        </div>
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Ritase</span>
                                            <span> : {_setoranData.data.ritase.map((r, i) => r.ritase).join(', ')}</span>
                                        </div>
                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Driver</span>
                                            <span> : {_assignedData?.bus_crew2_name}</span>
                                        </div>
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Kondektur</span>
                                            <span> : {_assignedData?.bus_crew1_name}</span>
                                        </div>
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Kernet</span>
                                            <span> : {_assignedData?.bus_crew3_name}</span>
                                        </div>
                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Tanggal Setoran</span>
                                            <span> : {dateFilter.convertISO(_setoranData?.data?.setoran?.last_modified_at, "date", true)}</span>
                                        </div>
                                        <div
                                            className={styles.item}
                                        >
                                            <span>Waktu Setoran</span>
                                            <span> : {dateFilter.convertISO(_setoranData?.data?.setoran?.last_modified_at, "time", true)}</span>
                                        </div>

                                    </Col>
                                    <Col
                                        className={styles.column}
                                    >
                                        <div
                                            className={styles.item}
                                        >
                                            <span>KM Awal</span>
                                            <Input
                                                type="number"
                                                value={_formSubmit.kmAwal}
                                                onChange={(value) => _updateFormSubmit(
                                                    {
                                                        "kmAwal": value
                                                    }
                                                )}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div
                                            className={styles.item}
                                        >
                                            <span>KM Akhir</span>
                                            <Input
                                                type="number"
                                                value={_formSubmit.kmAkhir}
                                                onChange={(value) => _updateFormSubmit(
                                                    {
                                                        "kmAkhir": value
                                                    }
                                                )}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div
                                            className={styles.item}
                                        >
                                            <span>KM</span>
                                            <span> : {_formSubmit.kmAkhir - _formSubmit.kmAwal}</span>
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

                                                            {
                                                                _resultRitase.length > 0 && (
                                                                    summaryRows.map((row, indexSummary) => {
                                                                        return (
                                                                            <>
                                                                                <tr key={`summary-${indexSummary}`}>

                                                                                    {
                                                                                        _resultRitase[ritaseIndex].passenger.map((rowRitase, index) => {

                                                                                            return (
                                                                                                <td key={`total-${index}`} style={{ ...cellStyle, backgroundColor: '#f0f0f0', textAlign: 'right', fontWeight: 'bold' }}>
                                                                                                    {indexSummary === 0 ? rowRitase : currency(_resultRitase[ritaseIndex].amount[index])}
                                                                                                </td>
                                                                                            )

                                                                                        })
                                                                                    }

                                                                                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{row.label}</td>

                                                                                </tr>

                                                                            </>
                                                                        )
                                                                    })
                                                                )
                                                            }


                                                        </tbody>
                                                    </table>


                                                    <table style={{ marginTop: "1rem", width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ ...cellStyle, backgroundColor: '#f0f0f0', textAlign: 'left' }}>Jenis Pembayaran</th>
                                                                <th style={{ ...cellStyle, backgroundColor: '#f0f0f0', textAlign: 'right' }}>Jumlah</th>
                                                                <th style={{ ...cellStyle, backgroundColor: '#f0f0f0', textAlign: 'right' }}>Penumpang</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td style={cellStyle}>Tunai</td>
                                                                <td style={{ ...cellStyle, textAlign: 'right' }}>{currency(ritaseData.cash_payment_amount)}</td>
                                                                <td style={{ ...cellStyle, textAlign: 'right' }}>{ritaseData.cash_pnp_count}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={cellStyle}>Non-Tunai</td>
                                                                <td style={{ ...cellStyle, textAlign: 'right' }}>{currency(ritaseData.non_cash_payment_amount)}</td>
                                                                <td style={{ ...cellStyle, textAlign: 'right' }}>{ritaseData.non_cash_pnp_count}</td>
                                                            </tr>
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
                                                            <span>{val.detail[0]?.traject_name || val.traject_name}</span>
                                                        </Col>

                                                        <Col
                                                            withPadding
                                                            column={1}
                                                        >
                                                            <Input
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                type="currency"
                                                                value={currency(val.cash_payment_amount + val.non_cash_payment_amount)}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>

                                                    </Row>
                                                </>
                                            )
                                        })
                                    }


                                    {
                                        Object.keys(_form).map((key) => {
                                            const field = _form[key];
                                            return (
                                                <Row
                                                    key={key}
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
                                                        <span>{field.title}</span>
                                                    </Col>

                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input
                                                            style={{
                                                                textAlign: "right"
                                                            }}
                                                            disabled={field.disabled}
                                                            type="currency"
                                                            value={currency(String(field.value).replace(/\./g, ''))}
                                                            onChange={(value) => {
                                                                _updateQuery({
                                                                    [key]: {
                                                                        ...field,
                                                                        value: parseFloat(String(value).replace(/\./g, '')) || 0
                                                                    }
                                                                });
                                                            }}
                                                            placeholder={`Rp`}
                                                        />
                                                    </Col>
                                                </Row>
                                            );
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
                                        _setoranData.data.biaya && _setoranData.data.biaya.length > 0 && _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "PER KARCIS UNTUK KRU")
                                            .map((item, index) => {

                                                let pnp = item?.count || (_editablePnp[item.id] !== undefined ? _editablePnp[item.id] : _findCrewKarcis(item.traject_id))

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
                                                                type="currency"
                                                                value={currency(String(pnp).replace(/\./g, ''))}
                                                                onChange={(value) => {
                                                                    _setEditablePnp(prev => ({
                                                                        ...prev,
                                                                        [item.id]: parseFloat(String(value).replace(/\./g, '')) || 0
                                                                    }))
                                                                }}
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>
                                                        <Col
                                                            withPadding
                                                            column={1}
                                                        >
                                                            <Input
                                                                type="number"
                                                                value={currency(item.amount)}
                                                                placeholder={`Rp`}
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                            />
                                                        </Col>
                                                        <Col
                                                            withPadding
                                                            column={1}
                                                        >
                                                            <Input
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                type="number"
                                                                value={currency(pnp * item.amount)}
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
                                        _setoranData.data.biaya && _setoranData.data.biaya.length > 0 && _setoranData.data.biaya[0].details
                                            ?.filter(item => item.name === "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)")
                                            .map((item, index) => {

                                                let pnp = item?.count || (_editablePnp[item.id] !== undefined ? _editablePnp[item.id] : _findMandoran(item.traject_id))

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
                                                                onChange={(value) => {
                                                                    _setEditablePnp(prev => ({
                                                                        ...prev,
                                                                        [item.id]: parseFloat(value) || 0
                                                                    }))
                                                                }}
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>
                                                        <Col
                                                            withPadding
                                                            column={1}
                                                        >
                                                            <Input
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
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
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                type="number"
                                                                value={currency(pnp * item.amount)}
                                                                placeholder={`Rp`}
                                                            />
                                                        </Col>
                                                    </Row>
                                                )
                                            })
                                    }



                                    <Row>
                                        <Col
                                            column={4}
                                            withPadding
                                            justifyCenter
                                            alignEnd
                                        >
                                            <span>Lainnya</span>
                                        </Col>
                                        <Col column={1} withPadding>
                                            <Input
                                                type="number"
                                                value={currency(String(_othersForm).replace(/\./g, ''))}
                                                onChange={(value) => _setOthersForm(parseFloat(String(value).replace(/\./g, '')))}
                                                placeholder={`Masukkan nilai lainnya`}
                                                style={{
                                                    textAlign: "right"
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                    {/* {
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
                                                            style={{
                                                                textAlign: "right"
                                                            }}
                                                            type="number"
                                                            value={currency(item.amount)}
                                                            placeholder={`Rp`}
                                                        />
                                                    </Col>

                                                </Row>

                                            ))
                                    } */}

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
                                                value={currency(_totalExpenses)}
                                                placeholder={`Rp`}
                                                style={{
                                                    textAlign: "right"
                                                }}
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
                                                value={currency(_form['grossAmount'].value - _totalExpenses)}
                                                placeholder={`Rp`}
                                                style={{
                                                    textAlign: "right"
                                                }}
                                            />
                                        </Col>

                                    </Row>


                                    {
                                        _setoranData.data.biaya && _setoranData.data.biaya.length > 0 && _setoranData.data.biaya[0].details
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
                                                            value={currency(item?.percentageAmount)}
                                                            placeholder={`Rp`}
                                                            style={{
                                                                textAlign: "right"
                                                            }}
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
                                                value={currency(_form['grossAmount'].value - _totalExpenses - _totalIncomeByPercentage)}
                                                placeholder={`Rp`}
                                                style={{
                                                    textAlign: "right"
                                                }}
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
                                            ?.filter(item => (item.name === "Catatan Saku" || item.name == "SOLAR" || item.name == "Tol"))
                                            .map((item, index) => {

                                                let amountDefault = item?.amount

                                                if (_setoranData.data.setoran.status == "CREATED") {
                                                    _setoranData.data.images.forEach(function (val, key) {
                                                        if (val.title.toUpperCase() == item.name) {
                                                            amountDefault = val.amount
                                                        }
                                                    })
                                                }

                                                let amount = _editablePnp[item.id] !== undefined ? _editablePnp[item.id] : amountDefault


                                                return (
                                                    <Row
                                                        key={item.id}
                                                    >

                                                        <Col column={2} withPadding justifyCenter>
                                                            <span>{item.desc}</span>
                                                        </Col>
                                                        <Col column={1} withPadding>
                                                            <Input
                                                                type="currency"
                                                                value={currency(String(amount).replace(/\./g, ''))}
                                                                placeholder={`Masukkan ${item.desc}`}
                                                                style={{
                                                                    textAlign: "right"
                                                                }}
                                                                onChange={(value) => {
                                                                    _setEditablePnp(prev => ({
                                                                        ...prev,
                                                                        [item.id]: parseFloat(String(value).replace(/\./g, '')) || 0
                                                                    }))
                                                                }}
                                                            />
                                                        </Col>
                                                    </Row>
                                                )

                                            })
                                    }

                                    {
                                        _setoranData?.data?.setoran?.status == "CREATED" && (
                                            <>
                                                <Row>
                                                    <Col column={2} withPadding justifyCenter>
                                                        <span>Tol</span>
                                                    </Col>
                                                    <Col column={1} withPadding>
                                                        <Input
                                                            type="number"
                                                            value={currency(_manifestCost.tol)}
                                                            onChange={(value) => {
                                                                const stringValue = String(value).trim();
                                                                if (stringValue === '') {
                                                                    _setManifestCost(prev => ({
                                                                        ...prev,
                                                                        tol: 0
                                                                    }));
                                                                } else {
                                                                    _setManifestCost(prev => ({
                                                                        ...prev,
                                                                        tol: parseFloat(stringValue.replace(/[.,]/g, '')) || 0
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder={`Masukkan nilai lainnya`}
                                                            style={{
                                                                textAlign: "right"
                                                            }}
                                                        />
                                                    </Col>
                                                </Row>


                                            </>
                                        )
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
                                            value={currency(_manifestCost.notesDeposit - _manifestCost.tol - _manifestCost.others)}
                                            placeholder={`Rp`}
                                            style={{
                                                textAlign: "right"
                                            }}
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
                                            value={currency(_getAmountNetIncome())}
                                            placeholder={`Rp`}
                                            style={{
                                                textAlign: "right"
                                            }}
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
                                        <span>TOTAL NON TUNAI</span>
                                    </Col>


                                    <Col
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            type="number"
                                            value={currency(_typePaymentAmount.nonCash)}
                                            placeholder={`Rp`}
                                            style={{
                                                textAlign: "right"
                                            }}
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
                                        <span>SETOR TUNAI</span>
                                    </Col>


                                    <Col
                                        withPadding
                                        column={1}
                                    >
                                        <Input
                                            type="number"
                                            value={currency(_getFinalAmount())}
                                            placeholder={`Rp`}
                                            style={{
                                                textAlign: "right"
                                            }}
                                        />
                                    </Col>

                                </Row>

                                <div
                                    style={{
                                        margin: "3rem 0rem"
                                    }}
                                >
                                    <Input
                                        title={"Catatan"}
                                        multiline={2}
                                        type="text"
                                        value={_formSubmit.desc}
                                        onChange={(value) => {
                                            _updateFormSubmit({
                                                "desc": value
                                            })
                                        }}
                                        placeholder={`Masukkan catatan`}
                                    />
                                </div>

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
                                                parseInt(image.amount) > 0 && (
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
                                                                image.full_url && (
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
                                                                )
                                                            }

                                                            <h5 style={{ margin: '8px 0 4px 0' }}>{image.title}</h5>
                                                            <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{image.desc}</p>

                                                            <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '14px' }}>
                                                                {currency(image.amount, image.title === "Odometer Awal" || image.title === "Odometer Akhir" ? "KM " : "Rp ")}
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

                                                    <div style={{ margin: '4px 0', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: ".5rem" }}>
                                                        <AiOutlineUser />
                                                        <span>{image.pnp_count + " Penumpang"}</span>
                                                    </div>
                                                    <div style={{ margin: '4px 0', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: ".5rem" }}>
                                                        <AiFillPushpin />
                                                        <span>{image.location}</span>
                                                    </div>
                                                    <div style={{ margin: '4px 0', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: ".5rem" }}>
                                                        Rp
                                                        <span>{currency(image.cash_amount)}</span>
                                                    </div>

                                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                                                        {dateFilter.getMonthDate(new Date(image.date))} {image.time}
                                                    </p>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>

                                {
                                    _setoranData?.data.setoran.status == "CREATED" && (
                                        <Row>
                                            <Col>
                                                <Button
                                                    title={'Terima Setoran'}
                                                    styles={Button.primary}
                                                    onClick={() => _setShowConfirmModal(true)}
                                                    onProcess={_isProcessing}
                                                />

                                            </Col>
                                        </Row>
                                    )
                                }


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

                <Modal
                    visible={_showConfirmModal}
                    centeredContent
                >
                    <ModalContent
                        header={{
                            title: "Konfirmasi Terima Setoran",
                            closeModal: () => _setShowConfirmModal(false)
                        }}
                    >
                        <div style={{ padding: '20px 0' }}>
                            <p style={{ marginBottom: '20px', fontSize: '14px' }}>
                                Apakah Anda yakin ingin menerima setoran ini?
                            </p>
                            <div style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>Total Setoran:</strong> {currency(_getFinalAmount() - _typePaymentAmount.nonCash)}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>Nopol:</strong> {_assignedData?.bus_name}
                                </div>
                                <div>
                                    <strong>Kondektur:</strong> {_assignedData?.bus_crew1_name}
                                </div>
                            </div>
                        </div>
                        <Row
                            spaceBetween
                        >
                            <Col>
                                <Button
                                    title="Batal"
                                    styles={Button.secondary}
                                    onClick={() => _setShowConfirmModal(false)}
                                    disabled={_isProcessing}
                                />
                            </Col>
                            <Col
                                alignEnd
                            >
                                <Button
                                    title="Ya, Terima"
                                    styles={Button.primary}
                                    onClick={_confirmReceiveDeposit}
                                    onProcess={_isProcessing}
                                />
                            </Col>
                        </Row>
                    </ModalContent>
                </Modal>
            </AdminLayout>
        </Main>
    )
}
