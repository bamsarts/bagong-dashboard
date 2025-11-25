import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import { Row, Col } from '../Layout'
import styles from './SetoranModal.module.scss'
import Button from '../Button'
import { postJSON, get } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    refresh: () => { }
}

SetoranModal.defaultProps = defaultProps

export default function SetoranModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const MODEL_FORM = {
        name: "",
        desc: "",
        amount: 0,
        trajectId: "",
        companyId: appContext.authData.companyId,
        isActive: true
    }
    const CONFIG_FORM = {
        ...MODEL_FORM,
        trajectName: ""
    }

    const [_form, _setForm] = useState(CONFIG_FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_trajectList, _setTrajectList] = useState([])
    const [_pointList, _setPointList] = useState([])
    const [_crewTraject, _setCrewTraject] = useState([
        {
            desc: "",
            name: "PER KARCIS UNTUK KRU",
            amount: 1000,
        }
    ])

    const [_brokerPoint, _setBrokerPoint] = useState([
        {
            desc: "",
            name: "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)",
            amount: 1000,
        }
    ])

    const [_rewardCrew, _setRewardCrew] = useState([
        {
            desc: "(Pendapatan Rp2.100.000 s.d Rp2.400.000) selisihnya dikalikan",
            name: "Bonus Kru",
            amount: 25
        },
        {
            desc: "(Pendapatan Rp2.400.000 ke atas) selisihnya dikalikan",
            name: "Bonus Kru",
            amount: 30
        }
    ])

    const [_depositNotes, _setDepositNotes] = useState([
        {
            desc: "Gaji Sopir",
            name: "Catatan Saku",
            amount: 70000
        },
        {
            desc: "Gaji Kondektur",
            name: "Catatan Saku",
            amount: 100000
        },
        {
            desc: "Gaji Kernet",
            name: "Catatan Saku",
            amount: 50000
        },
        {
            desc: "UM KRU (3 Orang)",
            name: "Catatan Saku",
            amount: 75000
        },
        {
            desc: "Tol Waru Gunung - Kertosono 2 Rit",
            name: "Catatan Saku",
            amount: 195000
        },
    ])

    const [_gas, _setGas] = useState([
        {
            desc: "SOLAR",
            name: "SOLAR",
            amount: 1
        },
    ])

    const [_others, _setOthers] = useState([
        {
            desc: "Lain-lain",
            name: "Lain-lain",
            amount: 1
        },
    ])

    useEffect(() => {
        // Update _depositNotes when _brokerPoint changes
        if (_brokerPoint && _brokerPoint.length > 0 && !props.data?.id) {
            const updatedDepositNotes = [..._depositNotes];

            // Add or update deposit notes based on broker points
            _brokerPoint.forEach((brokerPoint, index) => {
                if (brokerPoint.desc && brokerPoint.amount > 0) {
                    const existingNoteIndex = updatedDepositNotes.findIndex(
                        note => note.desc === `Mandoran ${brokerPoint.desc}`
                    );

                    const newNote = {
                        desc: `Mandoran ${brokerPoint.desc}`,
                        name: "Catatan Saku",
                        amount: 10000
                    };

                    if (existingNoteIndex >= 0) {
                        // Update existing note
                        updatedDepositNotes[existingNoteIndex] = newNote;
                    } else {
                        // Add new note
                        updatedDepositNotes.push(newNote);
                    }
                }
            });

            _setDepositNotes(updatedDepositNotes);
        }
    }, [_brokerPoint])

    useEffect(() => {
        if (props.data?.id) {
            _setForm({
                name: props.data.name || "",
                desc: props.data.desc || "",
                amount: props.data.amount || "",
                trajectId: props.data['traject.id'],
                trajectName: props.data['traject.name'],
                companyId: props.data.company_id
            })

            _getDepositByTraject()
        } else {
            _clearForm()
        }

        if (props.visible) {
            _getTraject()
            _getLocation()
        }
    }, [props.data, props.visible])

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm() {
        _setForm(CONFIG_FORM)
    }

    async function _submitData() {
        _setIsProcessing(true)
        try {
            // Only include keys that exist in MODEL_FORM
            const query = Object.keys(MODEL_FORM).reduce((acc, key) => {
                if (_form.hasOwnProperty(key)) {
                    acc[key] = _form[key]
                }
                return acc
            }, {})
            const typeUrl = props.data?.id ? 'update' : 'add'

            if (props.data?.id) {
                query.id = props.data.id
            }

            const result = await postJSON('/masterData/setoranDefault/' + typeUrl, query, appContext.authData.token)

            if (result) {
                props.closeModal()
                _clearForm()
                popAlert({ message: "Berhasil disimpan", type: "success" })
                props.refresh()
            }
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _getLocation() {
        const params = {
            length: 360,
            startFrom: 0
        }


        try {
            const pointLists = await postJSON(`/masterData/point/lokasi/list`, params, appContext.authData.token)

            pointLists.data.forEach(function (val, key) {
                val.title = val.name
            })
            _setPointList(pointLists.data)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTraject() {
        try {
            const query = {
                startFrom: 0,
                length: 360,
                companyId: appContext.authData.companyId
            }

            const result = await postJSON('/masterData/trayek/list', query, appContext.authData.token)

            if (result) {
                // Convert object to array for easier mapping
                let data = []

                result.data.forEach(element => {
                    element.title = "(" + element.code + ") " + element.name
                    element.idTraject = element.id

                    delete element.id
                    data.push(element)
                });

                _setTrajectList(data)
            }
        } catch (e) {
            console.error('Error fetching traject data:', e)
            popAlert({ message: 'Gagal memuat data trayek' })
        }
    }

    async function _deleteFormat(idDelete) {
        try {
            const query = {
                id: idDelete
            }

            const result = await postJSON('/masterData/setoranDefaultDetail/delete', query, appContext.authData.token)

            if (result) {

            }
        } catch (e) {
            popAlert({ message: 'Gagal hapus format' })
        }
    }

    async function _getDepositByTraject() {
        try {

            const result = await get('/masterData/setoranDefaultByTraject/' + props.data?.traject_id, appContext.authData.token)

            if (result) {
                // Group data by name to match state variables
                const groupedData = {
                    crewTraject: [],
                    brokerPoint: [],
                    rewardCrew: [],
                    depositNotes: [],
                    gas: [],
                    others: []
                }

                result.data.detail.forEach(function (val, key) {
                    const item = {
                        id: val.id,
                        desc: val.desc || "",
                        name: val.name || "",
                        amount: val.amount || 0,
                        originalDesc: val.desc || "",
                        originalAmount: val.amount || 0
                    }

                    // Match by name and group accordingly
                    if (val.name === "PER KARCIS UNTUK KRU") {
                        groupedData.crewTraject.push(item)
                    } else if (val.name === "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)") {
                        groupedData.brokerPoint.push(item)
                    } else if (val.name === "Bonus Kru") {
                        groupedData.rewardCrew.push(item)
                    } else if (val.name === "Catatan Saku") {
                        groupedData.depositNotes.push(item)
                    } else if (val.name === "SOLAR") {
                        groupedData.gas.push(item)
                    } else if (val.name === "Lain-lain") {
                        groupedData.others.push(item)
                    }
                })

                // Set state only if data exists for each category
                if (groupedData.crewTraject.length > 0) _setCrewTraject(groupedData.crewTraject)
                if (groupedData.brokerPoint.length > 0) _setBrokerPoint(groupedData.brokerPoint)
                if (groupedData.rewardCrew.length > 0) _setRewardCrew(groupedData.rewardCrew)
                if (groupedData.depositNotes.length > 0) _setDepositNotes(groupedData.depositNotes)
                if (groupedData.gas.length > 0) _setGas(groupedData.gas)
                if (groupedData.others.length > 0) _setOthers(groupedData.others)
            }
        } catch (e) {
            popAlert({ message: 'Gagal memuat detail form setoran' })
        }
    }

    async function _submitFormat() {
        _setIsProcessing(true)
        try {
            // First, ensure we have a setoranDefaultId (from the main form submission)
            if (!props.data?.id) {
                popAlert({ message: "Silahkan simpan form setoran terlebih dahulu", type: "error" })
                return
            }

            const setoranDefaultId = props.data.id

            // Prepare all detail items to submit
            const allDetails = [
                ..._crewTraject.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "PER KARCIS UNTUK KRU",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                })),
                ..._brokerPoint.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "PER KEPALA UNTUK MANDORAN (HANYA DALAM TERMINAL)",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                })),
                ..._others.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "Lain-lain",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                })),
                ..._rewardCrew.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "Bonus Kru",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                })),
                ..._depositNotes.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "Catatan Saku",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                })),
                ..._gas.map(item => ({
                    ...(item.id && { id: item.id }),
                    setoranDefaultId: setoranDefaultId,
                    name: item.name || "SOLAR",
                    desc: item.desc || "",
                    amount: Number(item.amount) || 0,
                    originalAmount: item.originalAmount,
                    originalDesc: item.originalDesc
                }))
            ]

            // Separate items for add and update
            const itemsToAdd = allDetails.filter(detail => !detail.id)
            const itemsToUpdate = allDetails.filter(detail => {
                if (!detail.id) return false
                // Only update if there are changes
                const hasChanges = detail.amount !== detail.originalAmount || detail.desc !== detail.originalDesc
                return hasChanges
            })

            
            // Add new items (without id)
            if (itemsToAdd.length > 0) {
                const promisesAdd = itemsToAdd.map(detail => {
                    const { originalAmount, originalDesc, ...detailToAdd } = detail
                    return postJSON('/masterData/setoranDefaultDetail/add', detailToAdd, appContext.authData.token)
                })
                await Promise.all(promisesAdd)
            }

            // Update existing items (with id and changes)
            if (itemsToUpdate.length > 0) {
                const promisesUpdate = itemsToUpdate.map(detail => {
                    const { originalAmount, originalDesc, ...detailToUpdate } = detail
                    return postJSON('/masterData/setoranDefaultDetail/update', detailToUpdate, appContext.authData.token)
                })
                await Promise.all(promisesUpdate)
            }

            popAlert({ message: "Format setoran berhasil disimpan", type: "success" })
            props.closeModal()
            props.refresh()
        } catch (e) {
            popAlert({ message: e.message || "Gagal menyimpan format setoran" })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <div className={styles.modal_wrapper}>
            <div
                className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`}
                onClick={props.closeModal}
            />
            <div style={{ minWidth: "50%" }} className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`}>
                <ModalContent
                    header={{
                        title: (props.data?.id ? 'Ubah' : 'Tambah') + ' Form Setoran',
                        closeModal: props.closeModal
                    }}
                >
                    <Input
                        withMargin
                        title={"Trayek"}
                        placeholder={'Pilih trayek'}
                        suggestions={_trajectList}
                        suggestionsField={"title"}
                        value={_form.trajectName}
                        onSuggestionSelect={(value) => {
                            _updateQuery({
                                trajectId: value.idTraject,
                                trajectName: value.title,
                                name: "FORM SETORAN " + value.name
                            })
                        }}
                    />

                    <Input
                        withMargin
                        title={"Nama Form Setoran"}
                        placeholder={"Masukkan nama form setoran"}
                        value={_form.name}
                        onChange={(value) => {
                            _updateQuery({ name: value })
                        }}
                    />

                    <Input
                        withMargin
                        title={"Uraian"}
                        placeholder={'Masukan uraian'}
                        multiline={3}
                        value={_form.desc}
                        onChange={(value) => {
                            _updateQuery({ desc: value })
                        }}
                    />

                    <Input
                        withMargin
                        title={"Nominal"}
                        placeholder={'Masukan nominal'}
                        type={"number"}
                        value={_form.amount}
                        onChange={(value) => {
                            _updateQuery({ amount: value })
                        }}
                    />

                    <div className={styles.buttonContainer}>
                        <Button
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                        />
                    </div>

                    {
                        props.data?.id && (
                            <>
                                

                                <div className={styles.perKarcisSection}>
                                    <h4>{_crewTraject[0].name}</h4>

                                    {
                                        _crewTraject.map(function (val, key) {
                                            return (
                                                <Row>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input
                                                            title={key < 1 ? 'Rute' : ""}
                                                            placeholder={'Pilih rute'}
                                                            suggestions={_trajectList}
                                                            suggestionsField={"title"}
                                                            value={val.desc || ""}
                                                            onSuggestionSelect={(value) => {
                                                                const updatedList = [..._crewTraject];
                                                                updatedList[key].desc = value.name
                                                                _setCrewTraject(updatedList);
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input
                                                            type={"currency"}
                                                            title={key < 1 ? 'Nominal' : ""}
                                                            placeholder={'Rp'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._crewTraject];
                                                                updatedList[key].amount = value
                                                                _setCrewTraject(updatedList);
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        column={1}
                                                        withPadding
                                                        style={{
                                                            flexDirection: "row"
                                                        }}
                                                        alignEnd
                                                    >
                                                        <Button
                                                            title={"-"}
                                                            styles={Button.error}
                                                            disabled={_crewTraject.length <= 1}
                                                            onClick={async () => {
                                                                if (_crewTraject.length > 1) {

                                                                    // If the item has an id, delete it from the API
                                                                    if (val?.id) {
                                                                        await _deleteFormat(val.id);
                                                                    }

                                                                    // Remove the last split
                                                                    const updatedList = _crewTraject.slice(0, -1);
                                                                    _setCrewTraject(updatedList);
                                                                }
                                                            }}
                                                            className={styles.incrementBtn}
                                                        />
                                                        {key === _crewTraject.length - 1 && (
                                                            <Button
                                                                title={"+"}
                                                                styles={Button.primary}
                                                                onClick={() => {
                                                                    // Add a new split with default values
                                                                    if (_crewTraject.length > 0) {
                                                                        // Clone the last split as a template, but clear payment info and id
                                                                        let last = _crewTraject[_crewTraject.length - 1];
                                                                        let newSplit = {
                                                                            ...last,
                                                                            desc: "",
                                                                            amount: 1000,
                                                                        };

                                                                        delete newSplit.id

                                                                        const updatedList = [..._crewTraject, newSplit];
                                                                        _setCrewTraject(updatedList);
                                                                    }
                                                                }}
                                                                className={styles.incrementBtn}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            )
                                        })

                                    }

                                </div>

                                <div className={styles.perKarcisSection}>
                                    <h4>{_brokerPoint[0].name}</h4>

                                    {
                                        _brokerPoint.map(function (val, key) {
                                            return (
                                                <Row>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input
                                                            title={key < 1 ? 'Point' : ""}
                                                            placeholder={'Pilih point'}
                                                            suggestions={_pointList}
                                                            suggestionsField={"title"}
                                                            value={val.desc || ""}
                                                            onSuggestionSelect={(value) => {

                                                                const updatedList = [..._brokerPoint];
                                                                updatedList[key].desc = value.name
                                                                _setBrokerPoint(updatedList);


                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input
                                                            type={"currency"}
                                                            title={key < 1 ? 'Nominal' : ""}
                                                            placeholder={'Rp'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {

                                                                const updatedList = [..._brokerPoint];
                                                                updatedList[key].amount = value
                                                                _setBrokerPoint(updatedList);


                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        column={1}
                                                        withPadding
                                                        style={{
                                                            flexDirection: "row"
                                                        }}
                                                        alignEnd
                                                    >
                                                        <Button
                                                            title={"-"}
                                                            styles={Button.error}
                                                            disabled={_brokerPoint.length <= 1}
                                                            onClick={() => {
                                                                if (_brokerPoint.length > 1) {
                                                                    // Remove the last split
                                                                    const updatedList = _brokerPoint.slice(0, -1);
                                                                    _setBrokerPoint(updatedList);
                                                                }
                                                            }}
                                                            className={styles.incrementBtn}
                                                        />
                                                        {key === _brokerPoint.length - 1 && (
                                                            <Button
                                                                title={"+"}
                                                                styles={Button.primary}
                                                                onClick={() => {
                                                                    // Add a new split with default values
                                                                    if (_brokerPoint.length > 0) {
                                                                        // Clone the last split as a template, but clear payment info and id
                                                                        const last = _brokerPoint[_brokerPoint.length - 1];
                                                                        const newSplit = {
                                                                            ...last,
                                                                            name: "",
                                                                            amount: 1000,
                                                                        };

                                                                        const updatedList = [..._brokerPoint, newSplit];
                                                                        _setBrokerPoint(updatedList);
                                                                    }
                                                                }}
                                                                className={styles.incrementBtn}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            )
                                        })

                                    }

                                    {
                                        _others.map(function (val, key) {
                                            return (
                                                <Row key={key}>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input

                                                            placeholder={'Masukkan lain-lain'}
                                                            value={val.desc || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._others];
                                                                updatedList[key].desc = value
                                                                _setOthers(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input

                                                            type={"currency"}
                                                            placeholder={'Rp'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._others];
                                                                updatedList[key].amount = value
                                                                _setOthers(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                </Row>
                                            )
                                        })

                                    }

                                </div>

                                <div className={styles.perKarcisSection}>
                                    <h4>{_rewardCrew[0].name}</h4>

                                    {
                                        _rewardCrew.map(function (val, key) {
                                            return (
                                                <Row key={key}>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input
                                                            placeholder={'Masukkan uraian'}
                                                            value={val.desc || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._rewardCrew];
                                                                updatedList[key].desc = value
                                                                _setRewardCrew(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input
                                                            icon={"%"}
                                                            type={"number"}
                                                            placeholder={'Masukkan persentase'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._rewardCrew];
                                                                updatedList[key].amount = value
                                                                _setRewardCrew(updatedList);
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        column={1}
                                                        withPadding
                                                        style={{
                                                            flexDirection: "row"
                                                        }}
                                                        alignEnd
                                                    >
                                                        <Button
                                                            title={"-"}
                                                            styles={Button.error}
                                                            disabled={_rewardCrew.length <= 1}
                                                            onClick={() => {
                                                                if (_rewardCrew.length > 1) {
                                                                    // Remove the last split
                                                                    const updatedList = _rewardCrew.slice(0, -1);
                                                                    _setRewardCrew(updatedList);
                                                                }
                                                            }}
                                                            className={styles.incrementBtn}
                                                        />
                                                        {key === _rewardCrew.length - 1 && (
                                                            <Button
                                                                title={"+"}
                                                                styles={Button.primary}
                                                                onClick={() => {
                                                                    // Add a new split with default values
                                                                    if (_rewardCrew.length > 0) {
                                                                        // Clone the last split as a template, but clear payment info and id
                                                                        const last = _rewardCrew[_rewardCrew.length - 1];
                                                                        const newSplit = {
                                                                            ...last,
                                                                            fromAmount: "",
                                                                            toAmount: "",
                                                                            amount: 0,
                                                                        };

                                                                        const updatedList = [..._rewardCrew, newSplit];
                                                                        _setRewardCrew(updatedList);
                                                                    }
                                                                }}
                                                                className={styles.incrementBtn}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            )
                                        })

                                    }

                                </div>

                                <div className={styles.perKarcisSection}>
                                    <h4>{_depositNotes[0].name}</h4>

                                    {
                                        _depositNotes.map(function (val, key) {
                                            return (
                                                <Row key={key}>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input

                                                            placeholder={'Masukkan catatan'}
                                                            value={val.desc || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._depositNotes];
                                                                updatedList[key].desc = value
                                                                _setDepositNotes(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input

                                                            type={"number"}
                                                            placeholder={'Rp'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._depositNotes];
                                                                updatedList[key].amount = value
                                                                _setDepositNotes(updatedList);
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col
                                                        column={1}
                                                        withPadding
                                                        style={{
                                                            flexDirection: "row"
                                                        }}
                                                        alignEnd
                                                    >
                                                        <Button
                                                            title={"-"}
                                                            styles={Button.error}
                                                            disabled={_depositNotes.length <= 1}
                                                            onClick={async () => {
                                                                if (_depositNotes.length > 1) {
                                                                    // Remove the last split

                                                                    // If the item has an id, delete it from the API
                                                                    if (val?.id) {
                                                                        await _deleteFormat(val.id);
                                                                    }

                                                                    const updatedList = _depositNotes.slice(0, -1);
                                                                    _setDepositNotes(updatedList);
                                                                }
                                                            }}
                                                            className={styles.incrementBtn}
                                                        />
                                                        {key === _depositNotes.length - 1 && (
                                                            <Button
                                                                title={"+"}
                                                                styles={Button.primary}
                                                                onClick={() => {
                                                                    // Add a new split with default values
                                                                    if (_depositNotes.length > 0) {
                                                                        // Clone the last split as a template, but clear payment info and id
                                                                        const last = _depositNotes[_depositNotes.length - 1];
                                                                        const newSplit = {
                                                                            ...last,
                                                                            fromAmount: "",
                                                                            toAmount: "",
                                                                            amount: 0,
                                                                        };

                                                                        const updatedList = [..._depositNotes, newSplit];
                                                                        _setDepositNotes(updatedList);
                                                                    }
                                                                }}
                                                                className={styles.incrementBtn}
                                                            />
                                                        )}
                                                    </Col>
                                                </Row>
                                            )
                                        })

                                    }

                                </div>

                                <div className={styles.perKarcisSection}>
                                    <h4>Bahan Bakar</h4>

                                    {
                                        _gas.map(function (val, key) {
                                            return (
                                                <Row key={key}>
                                                    <Col
                                                        withPadding
                                                        column={3}
                                                    >
                                                        <Input

                                                            placeholder={'Masukkan catatan'}
                                                            value={val.desc || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._gas];
                                                                updatedList[key].desc = value
                                                                _setGas(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                    <Col
                                                        withPadding
                                                        column={1}
                                                    >
                                                        <Input

                                                            type={"currency"}
                                                            placeholder={'Rp'}
                                                            value={val.amount || ""}
                                                            onChange={(value) => {
                                                                const updatedList = [..._gas];
                                                                updatedList[key].amount = value
                                                                _setGas(updatedList);
                                                            }}
                                                        />
                                                    </Col>

                                                </Row>
                                            )
                                        })

                                    }

                                </div>

                                <div style={{ gap: "1rem" }} className={styles.buttonContainer}>

                                    <spa>Informasi yang terisi sudah sesuai?</spa>

                                    <Button
                                        title={'Ya, Konfirmasi'}
                                        styles={Button.success}
                                        onClick={_submitFormat}
                                        onProcess={_isProcessing}
                                    />
                                </div>
                            </>
                        )
                    }
                    

                </ModalContent>
            </div>
        </div>
    )
}
