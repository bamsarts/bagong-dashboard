import { useEffect, useState, useContext, forwardRef } from 'react'
import { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AssignmentModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { dateFilter } from '../../utils/filters'
import { Col, Row } from '../Layout'
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker'
import Table from '../Table'
import SelectFloating from '../SelectFloating'

const defaultProps = {
  visible: false,
  closeModal: null,
  onSuccess: null
}

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

export default function AssignmentModal(props = defaultProps) {
  const appContext = useContext(AppContext)

  const [_modalVisible, _setModalVisible] = useState(false)

  const [_driverRanges, _setDriverRanges] = useState([])
  const [_kondekturRanges, _setKondekturRanges] = useState([])
  const [_kernetRanges, _setKernetRanges] = useState([])

  // hasil input user
  const [_crewInput, _setCrewInput] = useState({})

  // event dari SelectFloating
  const [_dropdown, _setDropdown] = useState(null)
  const [_selectedDate, _setSelectedDate] = useState(new Date())

   const CustomDatePicker = forwardRef(({ onClick }, ref) => (
        <Input
            title="Tanggal"
            onClick={onClick}
            ref={ref}
            value={dateFilter.getMonthDate(_selectedDate)}
            readOnly
        />
    ))

  /* ================= DUMMY DATA ================= */

  const penugasanTemplateList = {
      trayek: 'Malang – Blitar (Patas)',
      data: [
          {
              inap: 'Malang',
              'data-bus': [
                  {busId: 2, bus: 'N 7106 UD', 'grup-ritase': '1 & 2', jamberangkat: '07:00', ritase: 1, schedule_id: 50 },
                  {busId: 2, bus: 'N 7106 UD', 'grup-ritase': '1 & 2', jamberangkat: '10:00', ritase: 2, schedule_id: 51 },
                  {busId: 2, bus: 'N 7106 UD', 'grup-ritase': '3 & 4', jamberangkat: '13:00', ritase: 3, schedule_id: 50 },
                  {busId: 2, bus: 'N 7106 UD', 'grup-ritase': '3 & 4', jamberangkat: '17:00', ritase: 4, schedule_id: 51 }
              ]
          },
          {
              inap: 'Blitar',
              'data-bus': [
                  {busId: 4, bus: 'N 7109 UF', 'grup-ritase': '2 & 3', jamberangkat: '08:00', ritase: 2, schedule_id: 51 },
                  {busId: 4, bus: 'N 7109 UF', 'grup-ritase': '2 & 3', jamberangkat: '12:00', ritase: 3, schedule_id: 50 },
                  {busId: 4, bus: 'N 7109 UF', 'grup-ritase': '4 & 1', jamberangkat: '16:00', ritase: 4, schedule_id: 51 },
                  {busId: 4, bus: 'N 7109 UF', 'grup-ritase': '4 & 1', jamberangkat: '03:00', ritase: 1, schedule_id: 50 },
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

  const defaultProps = {
    onSelect: () => {}
  }
  function _clearForm() {
    _setCrewInput({})
    _setSelectedDate(new Date())
  }

  function _handleCloseModal() {
    _clearForm()
    props.closeModal()
  }

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
      title: 'DRIVER',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') return null

        return (
          <SelectFloating
            row={row}
            role="driver"
            ranges={_driverRanges}
            placeholder="Pilih Driver"
            value={_crewInput[rowKey(row)]?.driver?.name || ''}
            onSelect={item => updateCrew(row, 'driver', item)}
          />
        )
      }
    },
    {
      title: 'KONDEKTUR',
      customCell: (_, row) => {
        if (row.__type === 'GROUP') return null

        return (
          <SelectFloating
            row={row}
            role="kondektur"
            ranges={_kondekturRanges}
            placeholder="Pilih Kondektur"
            value={_crewInput[rowKey(row)]?.kondektur?.name || ''}
            onSelect={item => updateCrew(row, 'kondektur', item)}
          />
        )
      }
    },
    {
        title: 'KERNET',
        customCell: (_, row) => {
            if (row.__type === 'GROUP') return null

            return (
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
  ]

    /* ================= API ================= */

  useEffect(() => {
      _getCrewList(17) // driver
      _getCrewList(19) // kondektur
      _getCrewList(18) // kernet
  }, [])

  async function _getCrewList(roleId) {
        const params = {
            "startFrom": 0,
            "length": 9999,
            "orderBy": "idUser",
            "sortMode": "desc",
            "role_id": roleId
        }

        try {
            const result = await postJSON(`/masterData/userRoleAkses/user/list`, params, appContext.authData.token)
            let crewRange = []
            result.data.forEach(function (val) {
                crewRange.push({
                    "title": val.name,
                    "value": val.idUser,
                })
            })

            if (roleId == 18) {
                _setKernetRanges(crewRange)
            } else if (roleId == 19) {
                _setKondekturRanges(crewRange)
            } else {
                _setDriverRanges(crewRange)
            }

        } catch (e) {
            console.log(e)
        }
    }

  /* ================= SUBMIT ================= */

  async function _submitData() {
  if (!_selectedTraject) {
    popAlert({ message: "Trayek wajib dipilih" })
    return
  }


  const payload = _form.items.map(item => ({
      bus_id: item.busId,
      traject_id: _selectedTraject.id,
      schedule_id: item.scheduleAssignId,
      ritase: Number(item.ritase),
      departure_time: item.jamBerangkat + ":00"
      }))

    console.log("PAYLOAD TO API:", payload)

    _setIsProcessing(true)

    try {
      await postJSON(
        '/penugasan/templates/add',
        payload,
        appContext.authData.token
      )

      popAlert({ message: "Berhasil disimpan", type: "success" })
      props.closeModal()
      _clearForm()
      props.onSuccess && props.onSuccess()

    } catch (e) {
      popAlert({ message: e.message })
    } finally {
      _setIsProcessing(false)
    }
  }

    /* ================= SUBMIT ================= */

  function handleSubmit() {
    if (isSubmitDisabled()) {
      popAlert(
        'warning',
        'Minimal satu baris harus diisi dengan driver & kondektur. Kernet bersifat opsional.'
      )
      return
    }

    const date = dateFilter.basicDate(_selectedDate).normal
    const payload = []

    penugasanTemplateList.data.forEach(group => {
      group['data-bus'].forEach(item => {
        const key = `${item.bus}|${item['grup-ritase']}`
        const crew = _crewInput[key] || {}

        if (!crew.driver || !crew.kondektur) return

        payload.push({
          date,
          bus_id: item.busId,
          schedule_id: item.schedule_id,
          ritase: item.ritase,
          departure_time: item.jamberangkat,
          driver_id: crew.driver.id,
          kondektur_id: crew.kondektur.id,
          kernet_id: crew.kernet?.id ?? null
        })
      })
    })

    console.log('PAYLOAD:', payload)
  }


  const isSubmitDisabled = () => {
    let hasValidRow = false
    let hasInvalidRow = false

    penugasanTemplateList.data.forEach(group => {
      group['data-bus'].forEach(item => {
        const key = `${item.bus}|${item['grup-ritase']}`
        const crew = _crewInput[key] || {}

        const hasDriver = !!crew.driver
        const hasKondektur = !!crew.kondektur
        const hasKernet = !!crew.kernet

        // row kosong semua → di-skip (belum valid)
        if (!hasDriver && !hasKondektur && !hasKernet) {
          return
        }

        // driver & kondektur harus sepasang
        if (hasDriver !== hasKondektur) {
          hasInvalidRow = true
          return
        }

        // kernet boleh, tapi driver & kondektur harus ada
        if (hasKernet && (!hasDriver || !hasKondektur)) {
          hasInvalidRow = true
          return
        }

        // lolos semua rule → valid row
        hasValidRow = true
      })
    })

    // disabled jika:
    // - tidak ada satupun row valid
    // - ATAU ada row invalid
    return !hasValidRow || hasInvalidRow
  }





  /* ================= RENDER ================= */

  


  return (
    <div className={styles.modal_wrapper}>
      <div
        className={`${styles.backdrop} ${props.visible ? styles.visible : ''}`}
        onClick={_handleCloseModal}
      />

      <div className={`${styles.modal_container} ${props.visible ? styles.visible : ''}`} style={{ minWidth: "80%" }}>
        <ModalContent
          header={{
            title: 'Tambah Penugasan',
            closeModal: _handleCloseModal
          }}
        >
          <Row 
            verticalEnd 
            style={
              {
                marginBottom: '12px'
              }
            }
          >
              <Col column={2} withPadding>
                  <DatePicker
                      selected={_selectedDate}
                      onChange={_setSelectedDate}
                      customInput={<CustomDatePicker />}
                  />
              </Col>
          </Row>
          <Table
              records={buildGroupedRecords(penugasanTemplateList)}
              columns={COLUMNS}
              exportToXls={false}
          />
          <Button
              title="Simpan Penugasan"
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
          />

        </ModalContent>
      </div>
    </div>
  )
}
