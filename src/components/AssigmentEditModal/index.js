import { useEffect, useState, useContext } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignmentModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Table from '../Table'
import SelectFloating from '../SelectFloating'

export default function AssignmentEditModal({
  visible,
  closeModal,
  records,
  authToken,
  onSuccess
}) {

  const { authData } = useContext(AppContext)

  const [_records, _setRecords] = useState([])
  const [_crewInput, _setCrewInput] = useState({})

  const [_driverRanges, _setDriverRanges] = useState([])
  const [_kondekturRanges, _setKondekturRanges] = useState([])
  const [_kernetRanges, _setKernetRanges] = useState([])

  function rowKey(row) {
    return `${row.bus_id}|${row.group_ritase}`
  }

  /* ================= INIT DATA ================= */

  useEffect(() => {

    if (!visible || !records) return

    const rows = Object.values(records)

    const grouped = {}

    rows.forEach(item => {

      const key = item.bus_id

      if (!grouped[key]) {

        grouped[key] = {
          __type: 'ROW',
          bus_id: item.bus_id,
          bus: item.bus_name,
          group_ritase: item.group_ritase,
          departure_times: [],
          items: []
        }

        // SET CREW DEFAULT
        const crewKey = `${item.bus_id}|${item.group_ritase}`

        _setCrewInput(prev => ({
          ...prev,
          [crewKey]: {
            driver: {
              id: item.bus_crew2_id,
              name: item.bus_crew2_name
            },
            kondektur: {
              id: item.bus_crew1_id,
              name: item.bus_crew1_name
            },
            kernet: {
              id: item.bus_crew3_id,
              name: item.bus_crew3_name
            },
            note: item.notes || ''
          }
        }))

      }

      grouped[key].departure_times.push(
        item.departure_time?.slice(0,5)
      )

      grouped[key].items.push(item)

    })

    const tableRows = [{
      __type: 'GROUP',
      title: rows[0]?.bus_inap || ''
    }]

    Object.values(grouped).forEach(row => {

      row.departure_time = row.departure_times.join(' & ')

      tableRows.push(row)

    })

    _setRecords(tableRows)

  }, [visible, records])

  /* ================= CREW LIST ================= */

  useEffect(() => {
    getCrewList(17)
    getCrewList(19)
    getCrewList(18)
  }, [])

  async function getCrewList(roleId) {

    try {

      const res = await postJSON(
        '/masterData/userRoleAkses/user/list',
        {
          startFrom: 0,
          length: 9999,
          orderBy: 'idUser',
          sortMode: 'desc',
          role_id: roleId
        },
        authData.token
      )

      const list = res.data.map(v => ({
        title: v.name,
        value: v.idUser
      }))

      if (roleId === 18) _setKernetRanges(list)
      else if (roleId === 19) _setKondekturRanges(list)
      else _setDriverRanges(list)

    } catch (e) {
      console.error(e)
    }

  }

  /* ================= UPDATE CREW ================= */

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

  /* ================= COLUMNS ================= */

  const crewColumn = (role, ranges, placeholder) => ({
    title: placeholder.toUpperCase(),
    customCell: (_, row) => {

      if (row.__type === 'GROUP') return null

      return (
        <SelectFloating
          row={row}
          role={role}
          ranges={ranges}
          placeholder={placeholder}
          value={_crewInput[rowKey(row)]?.[role]?.name || ''}
          onSelect={item => updateCrew(row, role, item)}
        />
      )

    }
  })

  const COLUMNS = [

    {
      title: 'BUS / NOPOL',
      field: 'bus',
      customCell: (value, row) =>
        row.__type === 'GROUP'
          ? <strong>Bus Inap {row.title}</strong>
          : value
    },

    crewColumn('driver', _driverRanges, 'Pilih Driver'),
    crewColumn('kondektur', _kondekturRanges, 'Pilih Kondektur'),
    crewColumn('kernet', _kernetRanges, 'Pilih Kernet'),

    {
      title: 'RITASE',
      field: 'group_ritase',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : row.group_ritase
    },

    {
      title: 'JAM KEBERANGKATAN',
      field: 'departure_time',
      customCell: (_, row) =>
        row.__type === 'GROUP' ? null : row.departure_time
    },

    {
      title: 'Keterangan',
      customCell: (_, row) => {

        if (row.__type === 'GROUP') return null

        return (
          <Input
            placeholder="Keterangan"
            value={_crewInput[rowKey(row)]?.note || ''}
            onChange={val => {

              const key = rowKey(row)

              _setCrewInput(prev => ({
                ...prev,
                [key]: {
                  ...prev[key],
                  note: val
                }
              }))

            }}
          />
        )

      }
    }
  ]

  /* ================= SUBMIT ================= */

  async function submitEdit() {

    const payload = []

    _records
      .filter(row => row.__type === 'ROW')
      .forEach(row => {

        const crew = _crewInput[rowKey(row)]
        if (!crew) return

        row.items.forEach(item => {

          payload.push({
            id: Number(item.id),
            ritase: Number(item.ritase),

            busCrew1Id: crew.kondektur?.id || null,
            busCrew1Name: crew.kondektur?.name || null,
            busCrew2Id: crew.driver?.id || null,
            busCrew2Name: crew.driver?.name || null,
            busCrew3Id: crew.kernet?.id || null,
            busCrew3Name: crew.kernet?.name || null,

            notes: crew.note || ""
          })

        })

      })

    try {

      for (const data of payload) {

        await postJSON(
          '/data/penugasan/update',
          data,
          authToken
        )

      }

      popAlert({
        message: 'Data berhasil diperbarui',
        type: 'success'
      })

      closeModal()
      onSuccess?.()

    } catch (e) {

      popAlert({ message: e.message })

    }

  }

  if (!visible) return null

  /* ================= RENDER ================= */

  return (
    <div className={styles.modal_wrapper}>

      <div
        className={`${styles.backdrop} ${visible ? styles.visible : ''}`}
        onClick={closeModal}
      />

      <div
        className={`${styles.modal_container} ${visible ? styles.visible : ''}`}
        style={{ minWidth: '80%' }}
      >

        <ModalContent
          header={{
            title: 'Edit Penugasan',
            closeModal
          }}
        >

          <Table
            records={_records}
            columns={COLUMNS}
            exportToXls={false}
          />

          <Row flexEnd>
            <Button
              title="Simpan Perubahan"
              onClick={submitEdit}
            />
          </Row>

        </ModalContent>

      </div>

    </div>
  )
}