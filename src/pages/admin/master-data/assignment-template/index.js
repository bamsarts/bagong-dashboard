import { useEffect, useState } from 'react'
import AdminLayout from '../../../../components/AdminLayout'
import Main, { popAlert } from '../../../../components/Main'
import AssignmentTemplateModal from '../../../../components/AssignmenTemplateModal'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import { get, postJSON } from '../../../../api/utils'
import SelectFloating from '../../../../components/SelectFloating'
import { Col, Row } from '../../../../components/Layout'
import Input from '../../../../components/Input'

/* ================= HELPER ================= */

function buildGroupedRecords(source) {
    const result = []
    if (!source?.data?.length) return result

    source.data.forEach(group => {
        result.push({
            __type: 'GROUP',
            title: group.group_key_display || group.group_key
        })

        const map = {}

        group.templates.forEach(item => {
            const key = `${item.bus_id}|${item.group_ritase}`

            if (!map[key]) {
                map[key] = {
                    bus_id: item.bus_id,      // 🔑 ID
                    bus_name: item.bus_name,  // 👀 display
                    group_ritase: item.group_ritase,
                    jam: new Set()
                }
            }

            if (item.departure_time) {
                map[key].jam.add(item.departure_time.slice(0, 5))
            }
        })

        Object.values(map).forEach(row => {
            result.push({
                __type: 'ROW',
                bus_id: row.bus_id,          // 🔑
                bus: row.bus_name,           // 👀 render
                group_ritase: row.group_ritase,
                departure_time: Array.from(row.jam).join(' & ')
            })
        })
    })

    return result
}

function rowKey(row) {
    if (row.__type !== 'ROW') return null
    return `${row.bus}|${row['group_ritase']}`
}

/* ================= PAGE ================= */

export default function AssignmentTemplate(props) {
    const [_modalVisible, _setModalVisible] = useState(false)
    const [_records, _setRecords] = useState([])
    const [_loading, _setLoading] = useState(false)

    const [_driverRanges, _setDriverRanges] = useState([])
    const [_kondekturRanges, _setKondekturRanges] = useState([])
    const [_kernetRanges, _setKernetRanges] = useState([])

    const [_trajectRange, _setTrajectRange] = useState([])
    const [_trajectFilterValue, _setTrajectFilterValue] = useState('')
    const [_selectedTraject, _setSelectedTraject] = useState(null)

    const [_crewInput, _setCrewInput] = useState({})

    /* ================= HANDLE SELECT ================= */

    function updateCrew(row, role, data) {
        const key = rowKey(row)
        if (!key) return

        _setCrewInput(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [role]: {
                    id: data.value,
                    name: data.title
                }
            }
        }))
    }

    /* ================= COLUMNS ================= */

    const COLUMNS = [
        {
            title: 'BUS / NOPOL',
            field: 'bus',
            customCell: (value, row) =>
                row.__type === 'GROUP'
                    ? <strong>Bus Inap {row.title}</strong>
                    : value
        },
        {
            title: 'DRIVER',
            customCell: (_, row) => 
                row.__type === 'GROUP'
                    ? ''
                    : '-'
        },
        {
            title: 'KONDEKTUR',
            customCell: (_, row) => 
                row.__type === 'GROUP'
                    ? ''
                    : '-'
        },
        {
            title: 'KERNET',
            customCell: (_, row) => 
                row.__type === 'GROUP'
                    ? ''
                    : '-'
        },
        {
            title: 'GRUP RITASE',
            field: 'group_ritase',
            customCell: (value, row) => row.__type === 'GROUP' ? null : value 
        },
        {
            title: 'JAM KEBERANGKATAN',
            field: 'departure_time',
            customCell: (value, row) => row.__type === 'GROUP' ? null : value 
        },

    ]

    /* ================= EFFECT ================= */

    useEffect(() => {
        _getTraject()
        _getCrewList(17) // driver
        _getCrewList(19) // kondektur
        _getCrewList(18) // kernet
    }, [])

    /* ================= API ================= */

    async function fetchTemplates() {
        if (!_selectedTraject) {
            popAlert({ message: 'Trayek harus dipilih' })
            return
        }

        const params = {
            traject_master_id: _selectedTraject.id,
            group_by: 'bus_inap',
            sort_by: 'id',
            sort_mode: 'ASC'
        }

        try {
            _setLoading(true)

            const res = await get(
                `/penugasan/templates/list?${new URLSearchParams(params)}`,
                props.authData.token
            )

            if (res?.data?.length) {
                _setRecords(buildGroupedRecords(res))
            } else {
                _setRecords([])
                popAlert({ message: 'Data tidak ditemukan' })
            }
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setLoading(false)
        }
    }

    async function _getCrewList(roleId) {
        try {
            const res = await postJSON(
                '/masterData/userRoleAkses/user/list',
                {
                    startFrom: 0,
                    length: 300,
                    role_id: roleId
                },
                props.authData.token
            )

            const ranges = (res.data || []).map(v => ({
                title: v.name,
                value: v.idUser
            }))

            if (roleId === 17) _setDriverRanges(ranges)
            else if (roleId === 19) _setKondekturRanges(ranges)
            else _setKernetRanges(ranges)
        } catch (e) {
            popAlert({ message: e.message })
        }
    }

    async function _getTraject() {
        try {
            const res = await postJSON(
                '/masterData/trayekMaster/list',
                { startFrom: 0, length: 360 },
                props.authData.token
            )
            _setTrajectRange(res.data || [])
        } catch (e) {
            popAlert({ message: e.message })
        }
    }



    /* ================= RENDER ================= */

    return (
        <Main>
            <AssignmentTemplateModal
                visible={_modalVisible}
                closeModal={() => _setModalVisible(false)}
            />

            <AdminLayout>
                <Button
                    title="Tambah Penugasan Template"
                    styles={Button.secondary}
                    onClick={() => _setModalVisible(true)}
                />

                <Card noPadding>
                    <Table
                        headerContent={
                            <Row verticalEnd>
                                <Col column={2} withPadding>
                                    <Input
                                        title="Trayek"
                                        value={_trajectFilterValue}
                                        onChange={_setTrajectFilterValue}
                                        suggestions={_trajectRange}
                                        suggestionField="name"
                                        onSuggestionSelect={t => {
                                            _setSelectedTraject(t)
                                            _setTrajectFilterValue(t.name)
                                        }}
                                    />
                                </Col>

                                <Col column={2} withPadding>
                                    <Button
                                        title="Terapkan"
                                        onClick={fetchTemplates}
                                        styles={Button.secondary}
                                        small
                                        disabled={_loading}
                                    />
                                </Col>
                            </Row>
                        }
                        records={_records}
                        columns={COLUMNS}
                    />
                </Card>
            </AdminLayout>
        </Main>
    )
}
