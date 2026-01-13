import { useEffect, useState, useContext } from 'react'
import AdminLayout from '../../../../components/AdminLayout'
import Main from '../../../../components/Main'
import AssignmentTemplateModal from '../../../../components/AssignmenTemplateModal'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Table from '../../../../components/Table'
import AppContext from '../../../../context/app'
import { postJSON } from '../../../../api/utils'
import SelectFloating from '../../../../components/SelectFloating'

/* ================= HELPER ================= */

function buildGroupedRecords(source) {
    const result = []
    if (!source?.data?.length) return result

    source.data.forEach(group => {
        // header group
        result.push({
            __type: 'GROUP',
            title: group.inap
        })

        const map = {}

        group['data-bus'].forEach(item => {
            const key = `${item.bus}|${item['grup-ritase']}`

            if (!map[key]) {
                map[key] = {
                    bus: item.bus,
                    grupRitase: item['grup-ritase'],
                    jam: new Set()
                }
            }

            map[key].jam.add(item.jamberangkat)
        })

        Object.values(map).forEach(row => {
            result.push({
                __type: 'ROW',
                bus: row.bus,
                'grup-ritase': row.grupRitase,
                jamberangkat: Array.from(row.jam).join(' & ')
            })
        })
    })

    return result
}

function rowKey(row) {
    return `${row.bus}|${row['grup-ritase']}`
}

/* ================= PAGE ================= */

export default function AssignmentTemplate() {
    const appContext = useContext(AppContext)

    const [_modalVisible, _setModalVisible] = useState(false)

    const [_driverRanges, _setDriverRanges] = useState([])
    const [_kondekturRanges, _setKondekturRanges] = useState([])
    const [_kernetRanges, _setKernetRanges] = useState([])

    // hasil input user
    const [_crewInput, _setCrewInput] = useState({})

    // event dari SelectFloating
    const [_dropdown, _setDropdown] = useState(null)

    /* ================= DUMMY DATA ================= */

    const penugasanTemplateList = {
        trayek: 'Malang – Blitar (Patas)',
        data: [
            {
                inap: 'Malang',
                'data-bus': [
                    { bus: 'N 7106 UD', 'grup-ritase': '1 & 2', jamberangkat: '07:00' },
                    { bus: 'N 7106 UD', 'grup-ritase': '1 & 2', jamberangkat: '10:00' },
                    { bus: 'N 7106 UD', 'grup-ritase': '3 & 4', jamberangkat: '13:00' },
                    { bus: 'N 7106 UD', 'grup-ritase': '3 & 4', jamberangkat: '17:00' }
                ]
            },
            {
                inap: 'Blitar',
                'data-bus': [
                    { bus: 'N 7109 UF', 'grup-ritase': '2 & 3', jamberangkat: '08:00' },
                    { bus: 'N 7109 UF', 'grup-ritase': '2 & 3', jamberangkat: '11:00' }
                ]
            }
        ]
    }

    /* ================= HANDLE SELECT ================= */

    function updateCrew(row, role, data) {
        const key = rowKey(row)

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

    // terima event dari SelectFloating
    useEffect(() => {
        if (!_dropdown?.select) return

        const { row, role, data } = _dropdown.select
        updateCrew(row, role, data)

    }, [_dropdown])

    /* ================= COLUMNS ================= */

    const COLUMNS = [
        {
            title: 'NOPOL',
            field: 'bus',
            customCell: (value, row) => {
                if (row.__type === 'GROUP') {
                    return <strong>Bus Inap {row.title}</strong>
                }
                return value
            }
        },
        {
            title: 'RIT',
            field: 'grup-ritase',
            customCell: (value, row) =>
                row.__type === 'GROUP' ? null : value
        },
        {
            title: 'JAM KEBERANGKATAN',
            field: 'jamberangkat',
            customCell: (value, row) =>
                row.__type === 'GROUP' ? null : value
        },
        {
            title: 'DRIVER',
            customCell: (_, row) => (
                <SelectFloating
                    row={row}
                    role="driver"
                    ranges={_driverRanges}
                    placeholder="Pilih Driver"
                    value={_crewInput[rowKey(row)]?.driver?.name || ''}
                    onSelect={item =>
                        updateCrew(row, 'driver', item)
                    }
                />
            )
        },
        {
            title: 'KONDEKTUR',
            customCell: (_, row) => (
                <SelectFloating
                    row={row}
                    role="kondektur"
                    ranges={_kondekturRanges}
                    placeholder="Pilih Kondektur"
                    value={_crewInput[rowKey(row)]?.kondektur?.name || ''}
                    onSelect={item => updateCrew(row, 'kondektur', item)}
                />
            )
        },
        {
            title: 'KERNET',
            customCell: (_, row) => (
                <SelectFloating
                    row={row}
                    role="kernet"
                    ranges={_kernetRanges}
                    placeholder="Pilih Kernet"
                    value={_crewInput[rowKey(row)]?.kernet?.name || ''}
                    onSelect={item => updateCrew(row, 'kernet', item)}
                />
            )
        }
    ]

    /* ================= API ================= */

    useEffect(() => {
        getCrewList(17) // driver
        getCrewList(19) // kondektur
        getCrewList(18) // kernet
    }, [])

    async function getCrewList(roleId) {
        const result = await postJSON(
            '/masterData/userRoleAkses/user/list',
            {
                startFrom: 0,
                length: 300,
                role_id: roleId
            },
            appContext.authData.token
        )

        const ranges = result.data.map(v => ({
            title: v.name,
            value: v.idUser
        }))

        if (roleId === 17) _setDriverRanges(ranges)
        else if (roleId === 19) _setKondekturRanges(ranges)
        else _setKernetRanges(ranges)
    }

    /* ================= SUBMIT ================= */

    function handleSubmit() {
        const payload = Object.entries(_crewInput).map(([key, val]) => {
            const [bus, grupRitase] = key.split('|')

            return {
                bus,
                grupRitase,
                driver_id: val.driver?.id,
                kondektur_id: val.kondektur?.id,
                kernet_id: val.kernet?.id
            }
        })

        console.log('PAYLOAD:', payload)
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
                        records={buildGroupedRecords(penugasanTemplateList)}
                        columns={COLUMNS}
                    />
                </Card>

                <Button
                    title="Submit Penugasan"
                    onClick={handleSubmit}
                />
            </AdminLayout>
        </Main>
    )
}
